import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import './App.css';

function App() {
  // 处理 resize 拖拽 —— 通过 IPC 告诉主进程调整窗口大小
  useEffect(() => {
    const handleResizeStart = (edge: string) => (e: MouseEvent) => {
      e.preventDefault();
      if (!window.electronAPI) return;
      // 通知主进程开始 resize
      window.electronAPI.startResize?.(edge);
    };

    const bottom = document.querySelector('.resize-handle-bottom');
    const right = document.querySelector('.resize-handle-right');
    const corner = document.querySelector('.resize-handle-corner');

    bottom?.addEventListener('mousedown', handleResizeStart('bottom'));
    right?.addEventListener('mousedown', handleResizeStart('right'));
    corner?.addEventListener('mousedown', handleResizeStart('bottom-right'));

    return () => {
      bottom?.removeEventListener('mousedown', handleResizeStart('bottom'));
      right?.removeEventListener('mousedown', handleResizeStart('right'));
      corner?.removeEventListener('mousedown', handleResizeStart('bottom-right'));
    };
  }, []);

  return (
    <div className="app-container">
      <Toolbar />
      {/* Resize 手柄 */}
      <div className="resize-handle-bottom" />
      <div className="resize-handle-right" />
      <div className="resize-handle-corner" />
    </div>
  );
}

export default App;
