/// <reference types="vite/client" />

interface ElectronAPI {
  getModels: () => Promise<Record<string, string>>;
  setModel: (type: string, model: string) => Promise<Record<string, string>>;
  onModelChanged: (callback: (data: {
    type: string;
    model: string;
    all: Record<string, string>;
  }) => void) => void;
  hideToolbar: () => void;
  showToolbar: () => void;
  startResize?: (edge: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
