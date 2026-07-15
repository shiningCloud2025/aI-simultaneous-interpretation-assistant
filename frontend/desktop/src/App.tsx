import { useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import './App.css';

function App() {
  const handleResize = useCallback((edge: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.electronAPI?.startResize?.(edge);
  }, []);

  return (
    <div className="app-container">
      <Toolbar />
      {/* 四周 resize 手柄 */}
      <div className="resize-edge top" onMouseDown={handleResize('top')} />
      <div className="resize-edge bottom" onMouseDown={handleResize('bottom')} />
      <div className="resize-edge left" onMouseDown={handleResize('left')} />
      <div className="resize-edge right" onMouseDown={handleResize('right')} />
      <div className="resize-edge top-left" onMouseDown={handleResize('top-left')} />
      <div className="resize-edge top-right" onMouseDown={handleResize('top-right')} />
      <div className="resize-edge bottom-left" onMouseDown={handleResize('bottom-left')} />
      <div className="resize-edge bottom-right" onMouseDown={handleResize('bottom-right')} />
    </div>
  );
}

export default App;
