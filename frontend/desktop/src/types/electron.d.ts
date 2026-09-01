export interface ElectronAPI {
  getModels: () => Promise<Record<string, string>>;
  setModel: (type: string, model: string) => Promise<Record<string, string>>;
  onModelChanged: (
    callback: (data: { type: string; model: string; all: Record<string, string> }) => void
  ) => void;
  hideToolbar: () => void;
  showToolbar: () => void;
  setWindowMode: (mode: 'toolbar' | 'platform') => void;
  onAppModeChanged: (callback: (mode: 'toolbar' | 'platform') => void) => void;
  openPlatformExternal: (url: string) => void;
  toggleFullscreen: () => void;
  startResize: (edge: string) => void;
  updateTrayModels: (payload: TrayModelsPayload) => void;
  openSettings: () => void;
}

/** 推送给主进程用于构建托盘菜单的真实模型数据 */
export interface TrayModelsPayload {
  asr: { current: string; options: string[] };
  llm: { current: string; options: string[] };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
