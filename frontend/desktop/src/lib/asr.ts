/**
 * 实时同传链路（与平台端 RealTimeTrans 同协议）：
 * 音频采集 → 16k 重采样 → Int16 PCM → WebSocket 二进制帧 → 后端 ASR+LLM → 推回 source/target/correction
 *
 * 悬浮条和听力页面板共用这一份实现，保证行为一致。
 */

import { APP_ORIGIN, getToken } from './api';

export interface SegItem {
  id: number;
  time: string;
  source: string; // 原文（完整）
  target: string; // 译文（流式追加中）
  corrected?: boolean;
}

export interface TranscribeCallbacks {
  /** 每次段落列表变化时回调 */
  onSegments: (segments: SegItem[]) => void;
  /** 状态变化：空闲/连接中/翻译中/失败 */
  onStatus: (status: string) => void;
  /** 首字延迟（毫秒） */
  onLatency?: (ms: number) => void;
  /** 后端错误消息 */
  onError?: (msg: string) => void;
}

export type AudioSource = 'mic' | 'speaker';

const fmtTime = (d = new Date()) => d.toTimeString().slice(0, 8);

/** 把任意采样率的 Float32 PCM 重采样到 16kHz（后端 ASR 固定按 16k 解析） */
function downsampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  const targetRate = 16000;
  const ratio = fromRate / targetRate;
  if (ratio <= 1) return input;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  const windowSize = Math.round(ratio);
  for (let i = 0; i < outLen; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }
  return buffer;
}

/**
 * 一次同传会话。start() 后持续回调，stop() 释放全部资源。
 * 用法：const session = new TranscribeSession(callbacks); await session.start(...); session.stop();
 */
export class TranscribeSession {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mute: GainNode | null = null;
  private stream: MediaStream | null = null;
  private displayStream: MediaStream | null = null;
  private hiddenVideo: HTMLVideoElement | null = null;

  private segs: SegItem[] = [];
  private segId = 0;
  private currentId: number | null = null;
  private currentStartedAt = 0;
  private lastSourceText = '';
  private stopped = false;
  private callbacks: TranscribeCallbacks;

  constructor(callbacks: TranscribeCallbacks) {
    this.callbacks = callbacks;
  }

  private emit() {
    this.callbacks.onSegments(this.segs.slice());
  }

  /** 确保存在"当前句"，返回其 id */
  private ensureSeg(source = ''): number {
    if (this.currentId !== null) return this.currentId;
    const id = ++this.segId;
    this.segs = [{ id, time: fmtTime(), source, target: '' }];
    this.currentId = id;
    this.currentStartedAt = Date.now();
    return id;
  }

  /**
   * 更新最新一句的原文。
   * 后端流式会把整句反复重推（Did → Didn't → Didn't you），
   * 只有"新文本不再以旧文本为前缀"时才算进入下一句。
   */
  private updateSource(text: string) {
    const prev = this.lastSourceText;
    if (text === prev) return;
    const isSameSentence = !!prev && text.startsWith(prev);
    this.lastSourceText = text;

    const id = this.ensureSeg(text);
    this.segs = this.segs.map((s) =>
      s.id === id
        ? {
            ...s,
            time: isSameSentence ? s.time : fmtTime(),
            source: text,
            target: isSameSentence ? s.target : '',
          }
        : s
    );
    this.emit();
  }

  /** 追加一个译文 token 到最新一句 */
  private appendTarget(token: string) {
    const id = this.ensureSeg();
    this.segs = this.segs.map((s) => (s.id === id ? { ...s, target: s.target + token } : s));
    this.emit();
    if (this.currentStartedAt) {
      this.callbacks.onLatency?.(Date.now() - this.currentStartedAt);
    }
  }

  private handleMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'source':
        this.updateSource(msg.text || '');
        break;
      case 'target':
        this.appendTarget(msg.text || '');
        break;
      case 'correction':
        // 纠错只标记"已纠错"，不覆盖转写稿，避免截断历史
        if (this.currentId !== null) {
          const id = this.currentId;
          this.segs = this.segs.map((s) => (s.id === id ? { ...s, corrected: true } : s));
          this.emit();
        }
        break;
      case 'correction_error':
        this.callbacks.onError?.('纠错失败: ' + (msg.text || ''));
        break;
      case 'error':
        this.callbacks.onError?.('后端错误: ' + (msg.text || ''));
        break;
    }
  }

  async start(opts: {
    audioSource: AudioSource;
    sourceLang: string;
    targetLang: string;
  }) {
    const { audioSource, sourceLang, targetLang } = opts;
    const token = getToken();
    if (!token) {
      this.callbacks.onStatus('请先登录');
      this.callbacks.onError?.('请先登录');
      return;
    }

    this.stopped = false;
    this.segs = [];
    this.segId = 0;
    this.currentId = null;
    this.lastSourceText = '';
    this.callbacks.onStatus('连接中');

    try {
      // 1. 采集音频
      let stream: MediaStream;
      if (audioSource === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
      } else {
        const dm = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const audioTracks = dm.getAudioTracks();
        if (audioTracks.length === 0) {
          dm.getTracks().forEach((t) => t.stop());
          throw new Error('未共享音频，请在共享弹窗里勾选「共享标签页音频」');
        }
        // 不能 stop video track：Chrome 的 tab capture 里 audio 附着在 video 上，
        // stop video 会释放捕获会话导致 audio 静音。用隐藏 video 保持会话存活。
        const video = document.createElement('video');
        video.muted = true;
        video.autoplay = true;
        video.srcObject = dm;
        video.play().catch(() => {});
        this.hiddenVideo = video;
        this.displayStream = dm;
        stream = new MediaStream(audioTracks);
      }
      this.stream = stream;
      if (this.stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // 2. WebSocket
      const origin = new URL(APP_ORIGIN);
      const wsProto = origin.protocol === 'https:' ? 'wss' : 'ws';
      const direction = `${sourceLang}-${targetLang}`;
      const ws = new WebSocket(
        `${wsProto}://${origin.host}/asr/audio?token=${encodeURIComponent(token)}&direction=${direction}`
      );
      ws.binaryType = 'arraybuffer';
      this.ws = ws;

      ws.onopen = () => this.callbacks.onStatus('翻译中');
      ws.onerror = () => {
        this.callbacks.onStatus('连接失败');
        this.callbacks.onError?.('WebSocket 连接失败');
        this.stop();
      };
      ws.onmessage = (ev) => this.handleMessage(ev.data);

      // 3. 音频图：source → processor → mute(0) → destination
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC({ sampleRate: 16000 });
      this.audioCtx = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      const mute = audioCtx.createGain();
      mute.gain.value = 0; // 压成静音，避免回声外放
      this.source = source;
      this.processor = processor;
      this.mute = mute;

      processor.onaudioprocess = (e) => {
        const raw = e.inputBuffer.getChannelData(0);
        const input =
          audioCtx.sampleRate !== 16000 ? downsampleTo16k(raw, audioCtx.sampleRate) : raw;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(floatTo16BitPCM(input));
        }
      };

      source.connect(processor);
      processor.connect(mute);
      mute.connect(audioCtx.destination); // 必须连到 destination 才会驱动 onaudioprocess
    } catch (e: any) {
      this.callbacks.onStatus(e?.message || '启动失败');
      this.callbacks.onError?.(e?.message || '启动失败');
      this.stop();
    }
  }

  stop() {
    this.stopped = true;
    try {
      this.ws?.close();
    } catch {}
    try {
      this.processor?.disconnect();
    } catch {}
    try {
      this.mute?.disconnect();
    } catch {}
    try {
      this.source?.disconnect();
    } catch {}
    try {
      this.stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      this.displayStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      if (this.hiddenVideo) {
        this.hiddenVideo.pause();
        this.hiddenVideo.srcObject = null;
      }
    } catch {}
    try {
      this.audioCtx?.close();
    } catch {}

    this.ws = null;
    this.processor = null;
    this.mute = null;
    this.source = null;
    this.stream = null;
    this.displayStream = null;
    this.hiddenVideo = null;
    this.audioCtx = null;
    this.currentId = null;
    this.callbacks.onStatus('空闲');
  }
}
