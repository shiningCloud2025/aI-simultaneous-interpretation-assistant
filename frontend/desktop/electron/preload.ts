import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getModels: () => ipcRenderer.invoke('get-models'),
  setModel: (type: string, model: string) =>
    ipcRenderer.invoke('set-model', { type, model }),
  onModelChanged: (callback: (data: { type: string; model: string; all: Record<string, string> }) => void) => {
    ipcRenderer.on('model-changed', (_event, data) => callback(data));
  },
  hideToolbar: () => ipcRenderer.send('hide-toolbar'),
  showToolbar: () => ipcRenderer.send('show-toolbar'),
  setWindowMode: (mode: 'toolbar' | 'platform') => ipcRenderer.send('set-window-mode', mode),
  onAppModeChanged: (callback: (mode: 'toolbar' | 'platform') => void) => {
    ipcRenderer.on('app-mode-changed', (_event, mode) => callback(mode));
  },
  openPlatformExternal: (url: string) => ipcRenderer.send('open-platform-external', url),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  updateTrayModels: (payload: {
    asr: { current: string; options: string[] };
    llm: { current: string; options: string[] };
  }) => ipcRenderer.send('update-tray-models', payload),
  startResize: (edge: string) => {
    ipcRenderer.send('start-resize', edge);
    const onUp = () => {
      ipcRenderer.send('resize-end');
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mouseup', onUp);
  },
});
