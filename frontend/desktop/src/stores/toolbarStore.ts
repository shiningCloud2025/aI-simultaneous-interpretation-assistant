import { create } from 'zustand';

export interface ToolbarState {
  // 设备状态
  micOn: boolean;
  micRecording: boolean;
  speakerOn: boolean;

  // 模型选择
  asrModel: string;
  translationModel: string;
  correctionModel: string;

  // 翻译状态
  isTranslating: boolean;
  sourceLang: string;
  targetLang: string;

  // 动作
  toggleMic: () => void;
  toggleSpeaker: () => void;
  setAsrModel: (model: string) => void;
  setTranslationModel: (model: string) => void;
  setCorrectionModel: (model: string) => void;
  setModels: (models: Record<string, string>) => void;
  swapLang: () => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  micOn: true,
  micRecording: false,
  speakerOn: true,

  asrModel: 'Whisper Large v3',
  translationModel: 'GPT-4o',
  correctionModel: 'Claude 3.5 Sonnet',

  isTranslating: true,
  sourceLang: '中文',
  targetLang: 'English',

  toggleMic: () =>
    set((state) => {
      if (state.micRecording) return { micRecording: false, micOn: true, isTranslating: false };
      if (state.micOn) return { micRecording: true, isTranslating: true };
      return { micOn: true };
    }),

  toggleSpeaker: () => set((state) => ({ speakerOn: !state.speakerOn })),

  setAsrModel: (model) => set({ asrModel: model }),
  setTranslationModel: (model) => set({ translationModel: model }),
  setCorrectionModel: (model) => set({ correctionModel: model }),

  setModels: (models) =>
    set({
      asrModel: models.asr || 'Whisper Large v3',
      translationModel: models.translation || 'GPT-4o',
      correctionModel: models.correction || 'Claude 3.5 Sonnet',
    }),

  swapLang: () =>
    set((state) => ({
      sourceLang: state.targetLang,
      targetLang: state.sourceLang,
    })),

  setSourceLang: (lang) => set({ sourceLang: lang }),
  setTargetLang: (lang) => set({ targetLang: lang }),
}));
