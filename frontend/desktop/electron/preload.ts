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
  startResize: (edge: string) => {
    ipcRenderer.send('start-resize', edge);
    // 监听鼠标移动直到松开
    const onMouseMove = (e: MouseEvent) => {
      ipcRenderer.send('resize-move', { x: e.screenX, y: e.screenY });
    };
    const onMouseUp = () => {
      ipcRenderer.send('resize-end');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  },
});
