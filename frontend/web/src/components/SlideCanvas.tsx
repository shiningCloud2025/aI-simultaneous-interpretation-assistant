import React, { useMemo } from 'react';
import type { Slide as CanvasSlide } from '@openmaic/dsl';

interface SlideCanvasProps {
  slide: CanvasSlide | null;
  selectedElementId?: string | null;
  onElementClick?: (id: string) => void;
  onElementDoubleClick?: (id: string) => void;
  editable?: boolean;
  scale?: number;
}

const VIEWPORT_SIZE = 1000;
const VIEWPORT_RATIO = 0.5625; // 16:9

function htmlToPlainText(html: string): string {
  if (!html) return '';
  let result = html;
  // 先解码所有 HTML 实体（&lt; → <, &gt; → >, &nbsp; → 空格 等）
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = result;
    result = textarea.value;
  }
  // 去除所有 HTML 标签，保留纯文本
  result = result.replace(/<[^>]*>/g, '');
  // 把多余空白压缩（避免 &nbsp; 残留）
  result = result.replace(/\xa0/g, ' ').replace(/\s+/g, ' ').trim();
  return result;
}

function renderTextContent(content: string): React.ReactNode {
  const text = htmlToPlainText(content);
  // 把换行符转成 <br/>
  const lines = text.split('\n');
  if (lines.length <= 1) return text;
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </React.Fragment>
  ));
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  selectedElementId,
  onElementClick,
  onElementDoubleClick,
  editable = false,
  scale = 1,
}) => {
  const canvasStyle = useMemo(() => {
    const vpSize = slide?.viewportSize || VIEWPORT_SIZE;
    const vpRatio = slide?.viewportRatio ?? VIEWPORT_RATIO;
    return {
      width: vpSize,
      height: vpSize * vpRatio,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      backgroundColor: '#fff',
      transformOrigin: 'top left',
      transform: `scale(${scale})`,
    };
  }, [slide, scale]);

  const bgStyle = useMemo(() => {
    if (!slide?.background) return {};
    const bg = slide.background;
    if (bg.type === 'solid' && bg.color) {
      return { backgroundColor: bg.color };
    }
    if (bg.type === 'image' && bg.image) {
      return {
        backgroundImage: `url(${bg.image.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (bg.type === 'gradient' && bg.gradient) {
      const colors = bg.gradient.colors;
      const stops = colors.map((c: any) => `${c.color} ${c.pos * 100}%`).join(', ');
      const type = bg.gradient.type === 'radial' ? 'radial-gradient' : 'linear-gradient';
      const angle = bg.gradient.rotate ? `${bg.gradient.rotate}deg` : '180deg';
      return { background: `${type}(${angle}, ${stops})` };
    }
    return {};
  }, [slide]);

  const renderElement = (el: any) => {
    const id = el.id || '';
    const selected = selectedElementId === id;
    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.left || 0,
      top: el.top || 0,
      width: el.width || 100,
      height: el.height || 100,
      opacity: el.opacity ?? 1,
      transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
      cursor: editable ? 'pointer' : 'default',
      outline: selected ? '2px solid #1677ff' : undefined,
      outlineOffset: selected ? 1 : undefined,
      boxSizing: 'border-box',
      overflow: 'hidden',
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementClick?.(id);
    };
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementDoubleClick?.(id);
    };

    switch (el.type) {
      case 'text': {
        const textStyle: React.CSSProperties = {
          ...commonStyle,
          fontSize: el.defaultFontSize || 20,
          fontFamily: el.defaultFontName || 'Microsoft YaHei, sans-serif',
          color: el.defaultColor || '#333',
          padding: '8px 12px',
          lineHeight: el.lineHeight ?? 1.5,
          textAlign: (el.align || 'left') as any,
          backgroundColor: el.fill ? el.fill : undefined,
          wordBreak: 'break-word',
          display: 'flex',
          alignItems: el.vertical ? 'center' : 'flex-start',
          writingMode: el.vertical ? 'vertical-rl' : undefined,
        };
        return (
          <div key={id} style={textStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
            <div>{renderTextContent(el.content || '')}</div>
          </div>
        );
      }

      case 'image': {
        const imgSrc = el.src || '';
        return (
          <div key={id} style={commonStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
            <img
              src={imgSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
          </div>
        );
      }

      case 'shape': {
        const shapeStyle: React.CSSProperties = {
          ...commonStyle,
          backgroundColor: el.fill || '#4472C4',
          borderRadius: el.radius || 0,
          border: el.outline?.width
            ? `${el.outline.width}px ${el.outline.style || 'solid'} ${el.outline.color || '#333'}`
            : undefined,
          boxShadow: el.shadow
            ? `${el.shadow.h}px ${el.shadow.v}px ${el.shadow.blur}px ${el.shadow.color}`
            : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };
        return (
          <div key={id} style={shapeStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
            {el.text && (
              <span
                style={{
                  fontSize: el.text.defaultFontSize || 16,
                  fontFamily: el.text.defaultFontName || 'Microsoft YaHei, sans-serif',
                  color: el.text.defaultColor || '#fff',
                  textAlign: (el.text.align || 'center') as any,
                  padding: '4px 8px',
                }}
              >
                {renderTextContent(el.text.content || '')}
              </span>
            )}
          </div>
        );
      }

      case 'line': {
        const lineStyle: React.CSSProperties = {
          ...commonStyle,
          backgroundColor: 'transparent',
          borderTop: `${el.width || 2}px ${el.style || 'solid'} ${el.color || '#333'}`,
          height: 0,
          top: el.top + (el.height || 0) / 2,
        };
        return <div key={id} style={lineStyle} onClick={handleClick} />;
      }

      case 'chart': {
        return (
          <div
            key={id}
            style={{
              ...commonStyle,
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
            }}
            onClick={handleClick}
          >
            <span style={{ color: '#999', fontSize: 14 }}>📊 图表</span>
          </div>
        );
      }

      case 'table': {
        const rows = el.data || [];
        const colWidths = el.colWidths || [];
        return (
          <div key={id} style={{ ...commonStyle, overflow: 'auto' }} onClick={handleClick}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {rows.map((row: any[], ri: number) => (
                  <tr key={ri}>
                    {row.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        style={{
                          border: '1px solid #e0e0e0',
                          padding: '4px 8px',
                          backgroundColor: cell.style?.backcolor || undefined,
                          color: cell.style?.color || '#333',
                          fontWeight: cell.style?.bold ? 'bold' : 'normal',
                          fontStyle: cell.style?.em ? 'italic' : 'normal',
                          textAlign: cell.style?.align || 'left',
                          width: colWidths[ci] ? `${(el.width || 0) * colWidths[ci]}px` : undefined,
                        }}
                      >
                        {renderTextContent(cell.text || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'latex': {
        return (
          <div
            key={id}
            style={{
              ...commonStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: el.color || '#333',
              fontStyle: 'italic',
            }}
            onClick={handleClick}
          >
            {el.latex || 'LaTeX'}
          </div>
        );
      }

      case 'video': {
        return (
          <div
            key={id}
            style={{
              ...commonStyle,
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
            onClick={handleClick}
          >
            <span style={{ fontSize: 14 }}>🎬 视频</span>
          </div>
        );
      }

      case 'audio': {
        return (
          <div
            key={id}
            style={{ ...commonStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleClick}
          >
            <span style={{ fontSize: 14 }}>🔊 音频</span>
          </div>
        );
      }

      case 'code': {
        return (
          <div
            key={id}
            style={{
              ...commonStyle,
              backgroundColor: '#282c34',
              color: '#abb2bf',
              padding: 12,
              fontFamily: 'monospace',
              fontSize: 13,
              overflow: 'auto',
            }}
            onClick={handleClick}
          >
            <pre style={{ margin: 0 }}>{renderTextContent((el as any).code || el.content || '// code')}</pre>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!slide) {
    return (
      <div
        style={{
          width: VIEWPORT_SIZE,
          height: VIEWPORT_SIZE * VIEWPORT_RATIO,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e0e0e0',
        }}
      >
        <span style={{ color: '#999' }}>无幻灯片</span>
      </div>
    );
  }

  return (
    <div style={{ ...canvasStyle, ...bgStyle }} onClick={() => onElementClick?.('')}>
      {slide.elements?.map(renderElement)}
    </div>
  );
};

export default React.memo(SlideCanvas);
