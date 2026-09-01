import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore, api } from '../stores/appStore';
import { Card, Select } from './ui';

interface ModelInfo {
  name: string;
  display: string;
}
interface Provider {
  key: string;
  name: string;
}
interface Preference {
  modelType: string;   // ASR / LLM
  provider: string;
  modelName: string;
}
interface SegItem {
  id: number;
  time: string;
  source: string;      // 原文（完整）
  target: string;      // 译文（流式追加中）
  corrected?: boolean; // 是否被纠错过
}

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

const AUDIO_SOURCES = [
  { code: 'mic', label: '🎤 麦克风', tip: '采集麦克风输入的语音' },
  { code: 'speaker', label: '🔊 扬声器（屏幕共享）', tip: '需要勾选「共享音频」。可采集浏览器内视频/共享标签页/共享屏幕范围的声音；后台独立播放的桌面 app 音频采集不到。系统级采集需安装虚拟声卡（macOS BlackHole / Windows VB-Cable）。' },
];

export function RealTimeTrans() {
  const token = useAppStore((s) => s.token);

  // —— 模型下拉 ——
  const [asrProviders, setAsrProviders] = useState<Provider[]>([]);
  const [llmProviders, setLlmProviders] = useState<Provider[]>([]);
  const [asrModels, setAsrModels] = useState<ModelInfo[]>([]);
  const [llmModels, setLlmModels] = useState<ModelInfo[]>([]);
  const [asrModel, setAsrModel] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [srcLang, setSrcLang] = useState('zh');
  const [tgtLang, setTgtLang] = useState('en');
  // 音频源：mic = 麦克风（getUserMedia），speaker = 扬声器/系统声（getDisplayMedia）
  const [audioSource, setAudioSource] = useState<'mic' | 'speaker'>(
    () => (localStorage.getItem('audioSource') as 'mic' | 'speaker') || 'mic'
  );
  useEffect(() => { localStorage.setItem('audioSource', audioSource); }, [audioSource]);

  // —— 配置其他模型弹窗 ——
  const [pickerOpen, setPickerOpen] = useState<null | 'ASR' | 'LLM'>(null);
  const [pickerProviders, setPickerProviders] = useState<Provider[]>([]);
  const [pickerModels, setPickerModels] = useState<ModelInfo[]>([]);
  const [pickerProvider, setPickerProvider] = useState('');
  const [pickerModel, setPickerModel] = useState('');

  // —— 录音 / 状态 ——
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'running' | 'error'>('idle');
  const [statusText, setStatusText] = useState('● 空闲');
  const [latency, setLatency] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const ensureAudioCaptureAvailable = () => {
    if (!navigator.mediaDevices) {
      throw new Error('当前浏览器环境不支持音频采集。公网部署请使用 HTTPS 访问，HTTP 下浏览器会禁用麦克风和屏幕共享能力。');
    }
    if (audioSource === 'mic' && !navigator.mediaDevices.getUserMedia) {
      throw new Error('当前浏览器不支持麦克风采集，请使用最新版 Chrome/Edge，并确认通过 HTTPS 访问。');
    }
    if (audioSource === 'speaker' && !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('当前浏览器环境不支持扬声器采集。扬声器模式依赖屏幕共享能力，公网部署必须使用 HTTPS 访问。');
    }
  };

  // —— 流式输出（只展示当前最新一句） ——
  const [segs, setSegs] = useState<SegItem[]>([]);
  const segIdRef = useRef(0);
  const currentTargetRef = useRef<{ id: number; startedAt: number } | null>(null);

  // —— 底层资源 ——
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const muteRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastSourceTextRef = useRef('');   // 服务端最近一次推过来的原文（用来判断是否进入新句）
  const finishedSourceIdRef = useRef<number | null>(null); // 上一句结束时的 segId（收到 correction 时定位）

  // ============== 模型加载 ==============
  useEffect(() => {
    // 1. 拉厂商列表
    Promise.all([
      fetch('/api/sys/user/ai/asr/providers').then(r => r.json()),
      fetch('/api/sys/user/ai/llm/providers').then(r => r.json()),
    ]).then(([asrRes, llmRes]) => {
      const aps: Provider[] = asrRes.code === 200 ? asrRes.data : [];
      const lps: Provider[] = llmRes.code === 200 ? llmRes.data : [];
      setAsrProviders(aps);
      setLlmProviders(lps);
    }).catch(() => {});

    // 2. 听力页只加载用户已经保存的模型偏好，不展示没有厂商上下文的推荐模型。
    api.listModelPreferences().then((prefs: Preference[]) => {
      const asrP = prefs.find(p => p.modelType === 'ASR');
      const llmP = prefs.find(p => p.modelType === 'LLM');
      if (asrP) {
        loadAsrModels(asrP.provider).then(() => setAsrModel(asrP.modelName));
      }
      if (llmP) {
        loadLlmModels(llmP.provider).then(() => setLlmModel(llmP.modelName));
      }
    }).catch(() => {});
  }, []);

  // 听力实时链路必须绑定到明确厂商，避免推荐模型缺少 provider 导致保存偏好失败。
  const loadAsrModels = async (provider: string) => {
    if (!provider) {
      setAsrModels([]);
      return [];
    }
    const res = await fetch(`/api/sys/user/ai/asr/models?provider=${provider}`);
    const d = await res.json();
    const data = d.code === 200 ? d.data : [];
    setAsrModels(data);
    return data;
  };
  const loadLlmModels = async (provider: string) => {
    if (!provider) {
      setLlmModels([]);
      return [];
    }
    const res = await fetch(`/api/sys/user/ai/llm/models?provider=${provider}`);
    const d = await res.json();
    const data = d.code === 200 ? d.data : [];
    setLlmModels(data);
    return data;
  };

  const savePreference = async (modelType: string, provider: string, modelName: string) => {
    if (!provider) { showToast(`无法识别模型 ${modelName} 对应的厂商`); return; }
    try {
      await api.saveModelPreference({ modelType, provider, modelName });
    } catch (e: any) { showToast(e.message || '保存失败'); }
  };

  // —— 打开弹窗 ——
  const openPicker = async (type: 'ASR' | 'LLM') => {
    setPickerOpen(type);
    setPickerProvider('');
    setPickerModel('');
    // 弹窗里的厂商列表跟外层一样
    setPickerProviders(type === 'ASR' ? asrProviders : llmProviders);
    setPickerModels([]);
  };
  // 弹窗里切换厂商 → 加载该厂商模型
  const onPickerProviderChange = async (p: string) => {
    setPickerProvider(p);
    setPickerModel('');
    const type = pickerOpen!;
    const url = type === 'ASR'
      ? `/api/sys/user/ai/asr/models?provider=${p}`
      : `/api/sys/user/ai/llm/models?provider=${p}`;
    const res = await fetch(url);
    const d = await res.json();
    if (d.code === 200) setPickerModels(d.data);
  };
  // 弹窗里点确定
  const onPickerConfirm = async () => {
    if (!pickerProvider || !pickerModel) { showToast('请选厂商和模型'); return; }
    if (pickerOpen === 'ASR') {
      setAsrModels(pickerModels);
      setAsrModel(pickerModel);
      await savePreference('ASR', pickerProvider, pickerModel);
      showToast('已配置 ASR 模型');
    } else {
      setLlmModels(pickerModels);
      setLlmModel(pickerModel);
      await savePreference('LLM', pickerProvider, pickerModel);
      showToast('已配置翻译模型');
    }
    setPickerOpen(null);
  };

  // ============== 流式输出辅助 ==============
  const fmtTime = (d = new Date()) =>
    d.toTimeString().slice(0, 8);

  const ensureLatestSeg = (source = '') => {
    if (currentTargetRef.current) {
      return currentTargetRef.current.id;
    }
    const id = ++segIdRef.current;
    setSegs([{
      id, time: fmtTime(), source, target: '',
    }]);
    currentTargetRef.current = { id, startedAt: Date.now() };
    finishedSourceIdRef.current = id;
    return id;
  };

  const setLatestSource = (text: string, resetTarget: boolean) => {
    const id = ensureLatestSeg(text);
    setSegs(prev => {
      const next = prev.slice();
      const idx = next.findIndex(s => s.id === id);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          time: resetTarget ? fmtTime() : next[idx].time,
          source: text,
          target: resetTarget ? '' : next[idx].target,
        };
      }
      return next;
    });
  };

  const updateLatestSource = (text: string) => {
    const prev = lastSourceTextRef.current;
    if (text === prev) return;

    const isSameSentence = !!prev && text.startsWith(prev);
    lastSourceTextRef.current = text;
    setLatestSource(text, !isSameSentence);
  };

  const appendTargetToken = (token: string) => {
    const id = ensureLatestSeg();
    setSegs(prev => {
      const next = prev.slice();
      const idx = next.findIndex(s => s.id === id);
      if (idx >= 0) {
        const cur = next[idx];
        next[idx] = { ...cur, target: cur.target + token };
      }
      return next;
    });
    if (currentTargetRef.current) {
      const ms = Date.now() - currentTargetRef.current.startedAt;
      setLatency(ms);
    }
  };

  // ============== WebSocket ==============
  const stopAll = useCallback(() => {
    try { wsRef.current?.close(); } catch {}
    try { processorRef.current?.disconnect(); } catch {}
    try { muteRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { displayStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try {
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.pause();
        hiddenVideoRef.current.srcObject = null;
      }
    } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    wsRef.current = null;
    processorRef.current = null;
    muteRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    displayStreamRef.current = null;
    hiddenVideoRef.current = null;
    audioCtxRef.current = null;
    setRecording(false);
    setStatus('idle');
    setStatusText('● 空闲');
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const startRecord = async () => {
    if (!asrModel || !llmModel) {
      showToast('请先选择 ASR 和 LLM 模型');
      return;
    }
    if (!token) {
      showToast('请先登录');
      return;
    }
    setStatus('connecting');
    setStatusText('● 连接中...');
    setSegs([]);
    lastSourceTextRef.current = '';
    currentTargetRef.current = null;
    finishedSourceIdRef.current = null;

    try {
      ensureAudioCaptureAvailable();
      // 1. 拿音频流（根据 audioSource 选择）
      let stream: MediaStream;
      if (audioSource === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
      } else {
        // 扬声器：必须共享标签页/窗口/屏幕，并勾选「共享音频」
        // getDisplayMedia 必须带 video 参数，拿到流后丢弃 video track
        const dm = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const audioTracks = dm.getAudioTracks();
        if (audioTracks.length === 0) {
          // 用户没勾「共享音频」
          dm.getTracks().forEach(t => t.stop());
          throw new Error('未共享音频，请在共享弹窗里勾选「共享标签页音频」');
        }
        // 关键：不能 stop video track！Chrome 的 tab capture 里，audio 是「附着」在 video 上的，
        // 一旦 stop video，捕获会话被释放，audio 也会变成静音（这就是「No talking」的根因）。
        // 用隐藏 video 元素消费 video track，保持捕获会话存活，audio 才持续推数据。
        const hiddenVideo = document.createElement('video');
        hiddenVideo.muted = true;
        hiddenVideo.autoplay = true;
        hiddenVideo.srcObject = dm;
        hiddenVideo.play().catch(() => {});
        displayStreamRef.current = dm;
        hiddenVideoRef.current = hiddenVideo;
        stream = new MediaStream(audioTracks);
      }
      streamRef.current = stream;

      // 2. 建 AudioContext（16kHz）
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      // 注意：sampleRate 只是「请求值」，浏览器通常按硬件采样率（44100/48000）跑，需重采样对齐后端 ASR 的 16k
      console.log('[audio] requested sampleRate=16000, actual=', audioCtx.sampleRate);

      // 3. 建 WebSocket
      const direction = `${srcLang}-${tgtLang}`;
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/asr/audio?token=${encodeURIComponent(token)}&direction=${direction}`);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS open]', ws.url);
        setStatus('running');
        setStatusText('● 翻译中');
      };
      ws.onerror = (ev) => {
        console.error('[WS error]', ws.readyState, ws.url, ev);
        setStatus('error');
        setStatusText('● 连接失败');
        showToast('WebSocket 连接失败');
        stopAll();
      };
      ws.onclose = () => {
        if (statusRef.current === 'running') {
          setStatus('idle');
          setStatusText('● 已断开');
        }
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          handleServerMessage(msg);
        } catch (e) {
          console.error('WS 消息解析失败', e, ev.data);
        }
      };

      console.log('[audio] stream got, tracks=', stream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled, muted: t.muted, readyState: t.readyState })));

      // 4. 接麦克风 → ScriptProcessor → 转 PCM Int16 → WS 二进制
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      // bufferSize 必须是 2 的幂；onAudioProcess 拿到的是 Float32Array（-1..1）
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      let frameCount = 0;
      processor.onaudioprocess = (e) => {
        frameCount++;
        if (frameCount === 1 || frameCount % 100 === 0) {
          console.log('[audio] frame', frameCount, 'wsState=', ws.readyState, 'ctxRate=', audioCtx.sampleRate);
        }
        const rawInput = e.inputBuffer.getChannelData(0);
        // RMS/峰值 持续打印（每 25 帧约 3 秒一次），实时看「说话时音量是否真的进来」
        if (frameCount <= 3 || frameCount % 25 === 0) {
          let sum = 0;
          let peak = 0;
          for (let i = 0; i < rawInput.length; i++) {
            const v = rawInput[i];
            sum += v * v;
            const a = Math.abs(v);
            if (a > peak) peak = a;
          }
          const rms = Math.sqrt(sum / rawInput.length);
          console.log('[audio] rms=', rms.toFixed(4), 'peak=', peak.toFixed(4), 'frame=', frameCount);
        }
        // 关键：AudioContext 实际采样率 ≠ 16000 时必须重采样，否则后端 ASR 按 16k 解析会「读一个字就断句」
        const input = audioCtx.sampleRate !== 16000
          ? downsampleTo16k(rawInput, audioCtx.sampleRate)
          : rawInput;
        const pcm = floatTo16BitPCM(input);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(pcm);
        }
      };

      source.connect(processor);
      // 必须连到 destination（即使静音）才能真正驱动 onaudioprocess；
      // MuteNode 把声音压成 0，避免回声外放。这里必须用 ref 持有，避免节点被 GC 后处理链路停摆。
      const mute = audioCtx.createGain();
      mute.gain.value = 0;
      muteRef.current = mute;
      processor.connect(mute);
      mute.connect(audioCtx.destination);
      console.log('[audio] graph connected, ctxState=', audioCtx.state);

      setRecording(true);
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setStatusText('● 启动失败');
      showToast(e?.message || '启动失败（检查麦克风权限）');
      stopAll();
    }
  };

  // 用于 onclose 时拿到当前 status（避免闭包旧值）
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  const handleServerMessage = (msg: any) => {
    console.log('[WS-RX]', JSON.stringify(msg));
    switch (msg.type) {
      case 'source': {
        const text: string = msg.text || '';
        updateLatestSource(text);
        break;
      }
      case 'target': {
        appendTargetToken(msg.text || '');
        break;
      }
      case 'correction': {
        // 合并展示模式下，纠错结果通常只覆盖后端的一批句子。
        // 这里不再用它替换整段转写稿，避免把当前会话的完整记录截断。
        setSegs(prev => {
          if (prev.length === 0) return prev;
          const next = prev.slice();
          const idx = finishedSourceIdRef.current
            ? next.findIndex(s => s.id === finishedSourceIdRef.current)
            : next.length - 1;
          if (idx >= 0) {
            next[idx] = { ...next[idx], corrected: true };
          }
          return next;
        });
        break;
      }
      case 'correction_error':
        showToast('纠错失败: ' + (msg.text || ''));
        break;
      case 'error':
        showToast('后端错误: ' + (msg.text || ''));
        break;
    }
  };

  const onToggle = () => {
    if (recording) stopAll();
    else startRecord();
  };

  // ============== UI ==============
  const asrLabel = asrModels.find(m => m.name === asrModel)?.display || asrModel || '未选择';
  const llmLabel = llmModels.find(m => m.name === llmModel)?.display || llmModel || '未选择';

  return (
    <div>
      {/* 双栏流式展示 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 360px)' }}>
        <TransBox label={`源语言 · ${LANGS.find(l => l.code === srcLang)?.label}`} dotColor="#999" empty={segs.length === 0}>
          {segs.map(s => (
            <Seg key={s.id} time={s.time} text={s.source} corrected={s.corrected} />
          ))}
        </TransBox>
        <TransBox label={`译文 · ${LANGS.find(l => l.code === tgtLang)?.label}`} dotColor="#4caf50" empty={segs.length === 0}>
          {segs.map(s => (
            <Seg key={s.id} time={s.time} text={s.target || (recording ? '…' : '')} corrected={s.corrected} />
          ))}
        </TransBox>
      </div>

      {/* 模型快速切换栏 */}
      <Card title="">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#999' }}>快速切换:</span>

          {/* —— 音频源 —— */}
          <span style={{ fontSize: 11, color: '#bbb' }}>音频源</span>
          <Select
            options={AUDIO_SOURCES.map(s => s.code)}
            labels={Object.fromEntries(AUDIO_SOURCES.map(s => [s.code, s.label]))}
            titles={Object.fromEntries(AUDIO_SOURCES.map(s => [s.code, s.tip]))}
            value={audioSource}
            onChange={(v: string) => setAudioSource(v as 'mic' | 'speaker')}
          />

          <div style={{ width: 1, height: 18, background: '#f0efec' }} />

          {/* —— ASR —— */}
          <span style={{ fontSize: 11, color: '#bbb' }}>ASR</span>
          <ModelBadge value={asrLabel} empty={!asrModel} />
          <button
            onClick={() => openPicker('ASR')}
            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#f5f3f0', border: 'none', color: '#888', cursor: 'pointer' }}
            title="按厂商选择其他 ASR 模型"
          >+ 配置模型</button>

          <div style={{ width: 1, height: 18, background: '#f0efec' }} />

          {/* —— 翻译 —— */}
          <span style={{ fontSize: 11, color: '#bbb' }}>翻译</span>
          <ModelBadge value={llmLabel} empty={!llmModel} />
          <button
            onClick={() => openPicker('LLM')}
            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#f5f3f0', border: 'none', color: '#888', cursor: 'pointer' }}
            title="按厂商选择其他翻译模型"
          >+ 配置模型</button>

          <div style={{ width: 1, height: 18, background: '#f0efec' }} />

          {/* —— 纠错（锁定 = 翻译）—— */}
          <span style={{ fontSize: 11, color: '#bbb' }}>纠错</span>
          <span style={{
            padding: '6px 12px', border: '1px dashed #e8e6e1', borderRadius: 8, fontSize: 12,
            color: '#aaa', background: '#fafaf9', cursor: 'not-allowed',
          }} title="纠错模型与翻译保持一致">
            {llmModels.find(m => m.name === llmModel)?.display || llmModel || '（随翻译）'}
          </span>
          <span style={{ fontSize: 10, color: '#bbb' }}>与翻译保持一致</span>

          <div style={{ width: 1, height: 18, background: '#f0efec' }} />

          {/* —— 方向 —— */}
          <Select
            options={LANGS.map(l => l.code)}
            labels={Object.fromEntries(LANGS.map(l => [l.code, l.label]))}
            value={srcLang}
            onChange={setSrcLang}
          />
          <span style={{ fontSize: 12, color: '#bbb' }}>→</span>
          <Select
            options={LANGS.map(l => l.code)}
            labels={Object.fromEntries(LANGS.map(l => [l.code, l.label]))}
            value={tgtLang}
            onChange={setTgtLang}
          />
        </div>
      </Card>

      {/* 控制栏 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
        <CtrlBtn>🎧</CtrlBtn>
        <CtrlInfo label="ASR" value={asrLabel} />
        <Div />
        <button
          onClick={onToggle}
          style={{ width: 50, height: 50, borderRadius: '50%', background: status === 'error' ? '#999' : (recording ? '#e55c5c' : '#2c2c2c'), border: 'none', cursor: 'pointer', fontSize: 18, color: '#fff', animation: recording ? 'pulse2 1.5s infinite' : 'none' }}
        >{recording ? '⏹' : '▶'}</button>
        <Div />
        <CtrlInfo label="翻译/纠错" value={llmLabel} />
        <Div />
        <CtrlInfo label="状态" value={statusText} on={status === 'running'} />
        <Div />
        <CtrlInfo label="延迟" value={latency != null ? `~${latency}ms` : '—'} />
        <CtrlBtn style={{ marginLeft: 'auto' }}>⚙</CtrlBtn>
      </div>

      <style>{`@keyframes pulse2{0%,100%{box-shadow:0 0 0 0 rgba(229,92,92,.3)}50%{box-shadow:0 0 0 10px rgba(229,92,92,0)}}`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>
      )}

      {/* 配置其他模型弹窗 */}
      {pickerOpen && (
        <ModelPicker
          type={pickerOpen}
          providers={pickerProviders}
          models={pickerModels}
          provider={pickerProvider}
          model={pickerModel}
          onProviderChange={onPickerProviderChange}
          onModelChange={setPickerModel}
          onConfirm={onPickerConfirm}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </div>
  );
}

// ============== 子组件 ==============
function TransBox({ label, dotColor, children, empty }: { label: string; dotColor: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0efec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />{label}
        </div>
        <button style={btn}>复制</button>
      </div>
      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto', fontSize: 13, lineHeight: 1.8 }}>
        {empty ? <div style={{ color: '#ccc', fontSize: 12, textAlign: 'center', marginTop: 60 }}>点击下方麦克风按钮开始录音</div> : children}
      </div>
    </div>
  );
}

function Seg({ time, text, corrected }: { time: string; text: string; corrected?: boolean }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #fafaf9' }}>
      <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>{time}</span>
        {corrected && <span style={{ background: '#fff8e1', color: '#f59e0b', padding: '0 6px', borderRadius: 4, fontSize: 9 }}>已纠错</span>}
      </div>
      <div style={{ color: '#555', whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  );
}

function CtrlBtn({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <button style={{ width: 38, height: 38, borderRadius: 10, background: '#f5f3f0', border: 'none', cursor: 'pointer', fontSize: 16, ...style }}>{children}</button>;
}

function CtrlInfo({ label, value, on }: { label: string; value: string; on?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#bbb' }}>{label}</span>
      <span style={{ fontSize: 12, color: on ? '#4caf50' : '#555', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ModelBadge({ value, empty }: { value: string; empty?: boolean }) {
  return (
    <span style={{
      padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 12,
      color: empty ? '#aaa' : '#555', background: empty ? '#fafaf9' : '#fff', minWidth: 96,
      display: 'inline-flex', justifyContent: 'center',
    }}>
      {empty ? '请先配置' : value}
    </span>
  );
}

function Div() { return <div style={{ width: 1, height: 28, background: '#f0efec' }} />; }

const btn: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#f5f3f0', border: 'none', color: '#888', cursor: 'pointer' };

// ============== 工具 ==============
/**
 * 把任意采样率的 Float32 PCM 重采样到 16kHz（后端 ASR 固定按 16k 解析）。
 * 用「滑窗平均 + 抽取」做抗混叠，比纯抽取更稳；只处理降采样场景（实际采样率 > 16k）。
 */
function downsampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  const targetRate = 16000;
  const ratio = fromRate / targetRate;
  if (ratio <= 1) return input;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  const windowSize = Math.round(ratio);
  for (let i = 0; i < outLen; i++) {
    const start = i * windowSize;
    let sum = 0;
    const end = Math.min(start + windowSize, input.length);
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / (end - start);
  }
  return out;
}

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const len = float32Array.length;
  const buffer = new ArrayBuffer(len * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < len; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
  }
  return buffer;
}

// ============== 配置其他模型 弹窗 ==============
function ModelPicker({
  type, providers, models, provider, model,
  onProviderChange, onModelChange, onConfirm, onClose,
}: {
  type: 'ASR' | 'LLM';
  providers: Provider[];
  models: ModelInfo[];
  provider: string;
  model: string;
  onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 999 }}
      />
      {/* 弹窗 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 440, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,.18)', zIndex: 1000, overflow: 'hidden',
      }}>
        {/* 标题栏 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0efec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>配置其他{type === 'ASR' ? 'ASR' : '翻译'}模型</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>先选择厂商，再选择具体模型</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        {/* 表单 */}
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>厂商</label>
            <Select
              options={providers.map(p => p.key)}
              labels={Object.fromEntries(providers.map(p => [p.key, p.name]))}
              value={provider}
              onChange={onProviderChange}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>模型</label>
            {provider ? (
              <Select
                options={models.map(m => m.name)}
                labels={Object.fromEntries(models.map(m => [m.name, m.display]))}
                value={model}
                onChange={onModelChange}
              />
            ) : (
              <div style={{ padding: '8px 12px', color: '#bbb', fontSize: 12, background: '#fafaf9', borderRadius: 8, border: '1px dashed #e8e6e1' }}>
                请先选择厂商
              </div>
            )}
          </div>
        </div>

        {/* 按钮区 */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0efec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' }}
          >取消</button>
          <button
            onClick={onConfirm}
            disabled={!provider || !model}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13,
              background: (!provider || !model) ? '#ccc' : '#2c2c2c',
              border: 'none', color: '#fff',
              cursor: (!provider || !model) ? 'not-allowed' : 'pointer',
            }}
          >确定</button>
        </div>
      </div>
    </>
  );
}
