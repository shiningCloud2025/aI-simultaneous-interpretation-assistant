import { create } from 'zustand';
import type { ReviewResult, WritingTopic } from '../lib/api';
import type { AudioSource } from '../lib/asr';

export interface SegItem {
  id: number;
  time: string;
  source: string;
  target: string;
  corrected?: boolean;
}

/** 桌面端（悬浮条）与桌面平台（面板）共享的业务结果，保证双向可见 */
export interface WordResult {
  word: string;
  sentence?: string;
  translation?: string;
  imageUrl?: string;
}

interface DesktopState {
  // ---- 实时转译（悬浮条与听力面板共用同一份）----
  segments: SegItem[];
  recording: boolean;
  transcribeStatus: string;
  transcribeError: string;
  latency: number | null;

  setSegments: (segments: SegItem[]) => void;
  setRecording: (recording: boolean) => void;
  setTranscribeStatus: (status: string) => void;
  setTranscribeError: (error: string) => void;
  setLatency: (latency: number | null) => void;
  resetTranscript: () => void;

  // ---- 音频/语言配置（两端共用）----
  audioSource: AudioSource;
  sourceLang: string;
  targetLang: string;
  asrModel: string;
  llmModel: string;
  setConfig: (patch: Partial<Pick<DesktopState,
    'audioSource' | 'sourceLang' | 'targetLang' | 'asrModel' | 'llmModel'>>) => void;

  // ---- 业务结果：桌面平台生成后，桌面端悬浮条也能看到 ----
  wordResult: WordResult | null;
  writingTopic: WritingTopic | null;
  reviewResult: ReviewResult | null;
  setWordResult: (result: WordResult | null) => void;
  setWritingTopic: (topic: WritingTopic | null) => void;
  setReviewResult: (result: ReviewResult | null) => void;

  // 记录各业务最近一次更新时间，供悬浮条判断展示顺序
  lastUpdatedAt: Record<string, number>;

  // ---- 转译会话控制：由 App 持有唯一 session 后注入，悬浮条与听力面板共用 ----
  startTranscribe: () => void;
  stopTranscribe: () => void;
  setTranscribeControls: (start: () => void, stop: () => void) => void;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  segments: [],
  recording: false,
  transcribeStatus: '空闲',
  transcribeError: '',
  latency: null,

  setSegments: (segments) => set({ segments }),
  setRecording: (recording) => set({ recording }),
  setTranscribeStatus: (transcribeStatus) => set({ transcribeStatus }),
  setTranscribeError: (transcribeError) => set({ transcribeError }),
  setLatency: (latency) => set({ latency }),
  resetTranscript: () => set({ segments: [], latency: null, transcribeStatus: '空闲' }),

  audioSource: 'mic',
  sourceLang: 'en',
  targetLang: 'zh',
  asrModel: '',
  llmModel: '',
  setConfig: (patch) => set(patch),

  wordResult: null,
  writingTopic: null,
  reviewResult: null,
  setWordResult: (wordResult) =>
    set({ wordResult, lastUpdatedAt: { ...useDesktopStore.getState().lastUpdatedAt, word: Date.now() } }),
  setWritingTopic: (writingTopic) =>
    set({ writingTopic, lastUpdatedAt: { ...useDesktopStore.getState().lastUpdatedAt, writing: Date.now() } }),
  setReviewResult: (reviewResult) =>
    set({ reviewResult, lastUpdatedAt: { ...useDesktopStore.getState().lastUpdatedAt, review: Date.now() } }),

  lastUpdatedAt: {},

  startTranscribe: () => {},
  stopTranscribe: () => {},
  setTranscribeControls: (start, stop) => set({ startTranscribe: start, stopTranscribe: stop }),
}));
