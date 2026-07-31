import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { Card, PageBanner } from './ui';
import SlideCanvas from './SlideCanvas';
import { EditableSlideCanvas, EMPTY_SELECTION } from './editing-src';
import type { EditIntent, Selection } from './editing-src/types';
import type { Slide as CanvasSlide } from '@openmaic/dsl';
import { buildPptxBlob } from './export-utils/buildPptxBlob';

type Mode = 'preview' | 'edit';

export function EduPPT() {
  const [mode, setMode] = useState<Mode>('preview');
  const [slides, setSlides] = useState<CanvasSlide[]>([]);
  const [editingSlides, setEditingSlides] = useState<CanvasSlide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pptFileName, setPptFileName] = useState('');
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [fullscreen, setFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [renderScale, setRenderScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = mode === 'edit';
  const effectiveSlides = isEditing ? editingSlides : slides;
  const currentSlide = effectiveSlides[currentSlideIdx] ?? null;

  const slideW = currentSlide?.viewportSize || 1000;
  const slideH = slideW * (currentSlide?.viewportRatio || 0.5625);

  // 主画布容器自适应缩放
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    if (!canvasContainerRef.current) return;
    const el = canvasContainerRef.current;
    const updateFit = () => {
      const pw = el.clientWidth - 40;
      const ph = el.clientHeight - 40;
      const fit = Math.min(Math.max(pw / slideW, 0.1), Math.max(ph / slideH, 0.1), 1);
      setFitScale(fit);
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slideW, slideH, currentSlideIdx, fullscreen]);

  const handleUpload = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const { importPptx } = await import('@openmaic/importer');
      const result = await importPptx(file);
      if (!result || result.length === 0) {
        alert('PPT 文件解析后没有幻灯片');
      } else {
        setSlides(result);
        setEditingSlides(structuredClone(result));
        setCurrentSlideIdx(0);
        setPptFileName(file.name);
        setMode('preview');
      }
    } catch (e: any) {
      console.error(e);
      alert('PPTX 导入失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }, [handleUpload]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIdx(p => Math.max(0, p - 1));
    setSelection(EMPTY_SELECTION);
  }, []);
  const nextSlide = useCallback(() => {
    setCurrentSlideIdx(p => Math.min(effectiveSlides.length - 1, p + 1));
    setSelection(EMPTY_SELECTION);
  }, [effectiveSlides.length]);
  const goToSlide = useCallback((idx: number) => {
    setCurrentSlideIdx(idx);
    setSelection(EMPTY_SELECTION);
  }, []);

  // 自动播放
  useEffect(() => {
    if (!playing) return;
    if (currentSlideIdx >= effectiveSlides.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => nextSlide(), 5000);
    return () => clearTimeout(timer);
  }, [playing, currentSlideIdx, effectiveSlides.length, nextSlide]);

  // 键盘左右键
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isEditing) prevSlide();
      if (e.key === 'ArrowRight' && !isEditing) nextSlide();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [prevSlide, nextSlide, isEditing]);

  // 切换编辑模式
  const toggleEdit = useCallback(() => {
    if (isEditing) {
      if (confirm('保存修改？\n确定 = 保存\n取消 = 放弃修改')) {
        setSlides(editingSlides);
        setMode('preview');
        alert('已保存');
      } else {
        setEditingSlides(structuredClone(slides));
        setMode('preview');
      }
    } else {
      setEditingSlides(structuredClone(slides));
      setMode('edit');
      setSelection(EMPTY_SELECTION);
    }
  }, [isEditing, editingSlides, slides]);

  // 编辑元素变化
  const handleElementsChange = useCallback((intents: EditIntent[]) => {
    setEditingSlides(prev => {
      const next = structuredClone(prev);
      for (const intent of intents) {
        if (intent.type === 'element.update') {
          next.forEach((s) => {
            if (!s.elements) return;
            const idx = s.elements.findIndex((e: any) => (e.id || e._id) === intent.id);
            if (idx !== -1) s.elements[idx] = { ...s.elements[idx], ...intent.props } as any;
          });
        } else if (intent.type === 'element.delete') {
          const ids = new Set(intent.ids);
          next.forEach((s) => {
            if (s.elements) s.elements = s.elements.filter((e: any) => !ids.has(e.id || e._id));
          });
        } else if (intent.type === 'text.updateContent') {
          next.forEach((s) => {
            if (!s.elements) return;
            const el = s.elements.find((e: any) => (e.id || e._id) === intent.id);
            if (el) (el as any).content = intent.content;
          });
        } else if (intent.type === 'element.updateMany') {
          for (const update of intent.updates) {
            next.forEach((s) => {
              if (!s.elements) return;
              const idx = s.elements.findIndex((e: any) => (e.id || e._id) === update.id);
              if (idx !== -1) s.elements[idx] = { ...s.elements[idx], ...update.props } as any;
            });
          }
        }
      }
      return next;
    });
    setSelection(EMPTY_SELECTION);
  }, []);

  // 导出 PPTX
  const handleExportPptx = useCallback(async () => {
    if (effectiveSlides.length === 0) return;
    try {
      const sourceSlides = isEditing ? editingSlides : slides;
      const vpSize = sourceSlides[0]?.viewportSize || 1000;
      const vpRatio = sourceSlides[0]?.viewportRatio ?? 0.5625;
      const blob = await buildPptxBlob(sourceSlides, vpSize, vpRatio);
      const name = pptFileName.replace(/\.pptx?$/i, '') || 'slides';
      // 触发下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      alert('导出成功');
    } catch (e: any) {
      console.error(e);
      alert('导出失败: ' + (e?.message || '未知错误'));
    }
  }, [effectiveSlides, editingSlides, isEditing, slides, pptFileName]);

  // 关闭
  const closeViewer = () => {
    setSlides([]);
    setEditingSlides([]);
    setCurrentSlideIdx(0);
    setPptFileName('');
    setMode('preview');
    setFullscreen(false);
    setPlaying(false);
  };

  // 已加载 PPT
  if (effectiveSlides.length > 0) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f5f3f0', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {/* 顶栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#fff', borderBottom: '1px solid #f0efec' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span onClick={closeViewer} style={{ color: '#2c2c2c', cursor: 'pointer', fontSize: 13 }}>← 返回</span>
            <span style={{ color: '#ccc' }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{pptFileName}</span>
            <span style={{ fontSize: 12, color: '#999' }}>{(currentSlide as any)?.title || `第 ${currentSlideIdx + 1} 页`} · {effectiveSlides.length} 页</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportPptx} style={toolbarBtn}>📥 导出</button>
            <button onClick={toggleEdit} style={toolbarBtn}>{isEditing ? '✓ 退出编辑' : '✏️ 工具栏'}</button>
            <button onClick={() => fileInputRef.current?.click()} style={toolbarBtn}>📤 重新上传</button>
          </div>
        </div>

        {/* 工作区 */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* 左侧缩略图 */}
          <div style={{ width: 200, background: '#fff', borderRight: '1px solid #f0efec', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0efec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#666' }}>课程介绍</span>
              <span style={{ fontSize: 11, color: '#4caf50' }}>{effectiveSlides.length} 页</span>
            </div>
            {effectiveSlides.map((slide, idx) => {
              const thumbW = 168;
              const sW = slide.viewportSize || 1000;
              const sH = sW * (slide.viewportRatio || 0.5625);
              const thumbScale = thumbW / sW;
              return (
                <div key={idx} onClick={() => goToSlide(idx)} style={{ padding: 12, borderBottom: '1px solid #fafaf9', cursor: 'pointer', background: idx === currentSlideIdx ? '#f0efec' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: idx === currentSlideIdx ? '#2c2c2c' : '#f0efec', color: idx === currentSlideIdx ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{idx + 1}</div>
                    <span style={{ fontSize: 11, color: idx === currentSlideIdx ? '#1a1a1a' : '#666', fontWeight: idx === currentSlideIdx ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(slide as any).title || `第 ${idx + 1} 页`}</span>
                  </div>
                  <div style={{ width: thumbW, height: thumbW * 0.5625, background: '#fff', border: '1px solid #f0efec', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: sW, height: sH, transform: `scale(${thumbScale})`, transformOrigin: 'top left' }}>
                      <SlideCanvas slide={slide} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 中央画布 */}
          <div ref={canvasContainerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fullscreen ? '#000' : '#f0efec', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: slideW, height: slideH, transform: `scale(${fitScale * (fullscreen ? 1 : renderScale)})`, transformOrigin: 'center', transition: 'transform .2s', flexShrink: 0 }}>
              {isEditing && currentSlide ? (
                <EditableSlideCanvas
                  slide={currentSlide}
                  scale={1}
                  selection={selection}
                  onSelectionChange={setSelection}
                  onElementsChange={handleElementsChange}
                />
              ) : (
                <SlideCanvas slide={currentSlide} scale={1} />
              )}
            </div>
            {fullscreen && (
              <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.7)', color: '#fff', padding: '8px 20px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <button onClick={prevSlide} style={circleBtn}>◀</button>
                <span>{currentSlideIdx + 1} / {effectiveSlides.length}</span>
                <button onClick={nextSlide} style={circleBtn}>▶</button>
                <span style={{ margin: '0 4px', color: '#888' }}>|</span>
                <button onClick={() => setFullscreen(false)} style={circleBtn}>⛶</button>
              </div>
            )}
          </div>
        </div>

        {/* 底部工具栏 */}
        {!fullscreen && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderTop: '1px solid #f0efec' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={prevSlide} disabled={currentSlideIdx === 0} style={{ ...toolbarBtn, opacity: currentSlideIdx === 0 ? 0.4 : 1 }}>◀ 上一页</button>
              <span style={{ fontSize: 12, color: '#999', margin: '0 8px' }}>{currentSlideIdx + 1} / {effectiveSlides.length}</span>
              <button onClick={nextSlide} disabled={currentSlideIdx >= effectiveSlides.length - 1} style={{ ...toolbarBtn, opacity: currentSlideIdx >= effectiveSlides.length - 1 ? 0.4 : 1 }}>下一页 ▶</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setRenderScale(s => Math.max(0.3, s - 0.1))} style={toolbarBtn}>🔍-</button>
              <span style={{ fontSize: 12, color: '#999', minWidth: 40, textAlign: 'center' }}>{Math.round(renderScale * 100)}%</span>
              <button onClick={() => setRenderScale(s => Math.min(2, s + 0.1))} style={toolbarBtn}>🔍+</button>
              <button onClick={() => setPlaying(p => !p)} style={toolbarBtn}>{playing ? '⏸ 暂停' : '▶ 播放'}</button>
            </div>
            <button onClick={() => { setFullscreen(true); setPlaying(true); }} style={{ ...toolbarBtn, background: '#2c2c2c', color: '#fff' }}>▶ 播放</button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".pptx" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    );
  }

  // 未加载 PPT
  return (
    <>
      <PageBanner icon="📊" title="PPT 集成" desc="即用即传：上传 .pptx 文件，OpenMAIC 引擎渲染，关闭后不留存" />
      <input ref={fileInputRef} type="file" accept=".pptx" style={{ display: 'none' }} onChange={handleFileChange} />

      <Card title="快速开始">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>即用即传 · OpenMAIC 引擎</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 24, lineHeight: 1.8 }}>
            支持查看、编辑、播放、导出<br />文件仅在本地处理，关闭后不留存
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 32px', borderRadius: 10, fontSize: 14, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            {loading ? '导入中...' : '📤 选择 PPTX 文件'}
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: '#bbb' }}>支持 .pptx 格式 · 最大 50MB</div>
        </div>
      </Card>
    </>
  );
}

const toolbarBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
const circleBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 };
