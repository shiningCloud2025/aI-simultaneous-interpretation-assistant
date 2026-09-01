import { create } from 'zustand';

export interface ToolbarState {
  // 设备状态
  micOn: boolean;
  micRecording: boolean;
  speakerOn: boolean;

  // 模型选择（真实数据由后端偏好填充，不再写死示例模型）
  asrModel: string;
  llmModel: string;

  // 翻译状态
  isTranslating: boolean;
  sourceLang: string; // 语言 code：zh / en / ja / ko
  targetLang: string;

  // 动作
  toggleMic: () => void;
  toggleSpeaker: () => void;
  setAsrModel: (model: string) => void;
  setLlmModel: (model: string) => void;
  setModels: (models: Record<string, string>) => void;
  swapLang: () => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  micOn: true,
  micRecording: false,
  speakerOn: true,

  asrModel: '',
  llmModel: '',

  isTranslating: false,
  sourceLang: 'en',
  targetLang: 'zh',

  toggleMic: () =>
    set((state) => {
      if (state.micRecording) return { micRecording: false, micOn: true, isTranslating: false };
      if (state.micOn) return { micRecording: true, isTranslating: true };
      return { micOn: true };
    }),

  toggleSpeaker: () => set((state) => ({ speakerOn: !state.speakerOn })),

  setAsrModel: (model) => set({ asrModel: model }),
  setLlmModel: (model) => set({ llmModel: model }),

  setModels: (models) =>
    set({
      asrModel: models.asr || '',
      llmModel: models.llm || models.translation || '',
    }),

  swapLang: () =>
    set((state) => ({
      sourceLang: state.targetLang,
      targetLang: state.sourceLang,
    })),

  setSourceLang: (lang) => set({ sourceLang: lang }),
  setTargetLang: (lang) => set({ targetLang: lang }),
}));
