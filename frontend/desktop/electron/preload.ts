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
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  startResize: (edge: string) => {
    ipcRenderer.send('start-resize', edge);
    const onUp = () => {
      ipcRenderer.send('resize-end');
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mouseup', onUp);
  },
});
