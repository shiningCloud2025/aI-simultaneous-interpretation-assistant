import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, PageBanner } from './ui';
import '@wangeditor/editor/dist/css/style.css';

// 懒加载编辑器
let Editor: any, Toolbar: any;
let loaded = false;

export function EduWord() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 动态加载编辑器
  useEffect(() => {
    if (!loaded) {
      import('@wangeditor/editor-for-react').then(m => {
        Editor = m.Editor;
        Toolbar = m.Toolbar;
        loaded = true;
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  // 编辑器配置
  const editorConfig = {
    placeholder: '开始编辑...',
    autoFocus: false,
    MENU_CONF: {
      uploadImage: { async customUpload() { return Promise.reject('暂不支持'); } },
    },
  };

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.docx') && !f.name.toLowerCase().endsWith('.doc')) {
      alert('请上传 .docx 格式的文件');
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      let html = result.value;
      if (!html.trim()) {
        const raw = await mammoth.extractRawText({ arrayBuffer });
        html = raw.value.split(/\n+/).filter(p => p.trim()).map(p => `<p>${p}</p>`).join('\n');
      }
      setHtmlContent(html);
    } catch (e: any) {
      console.error(e);
      alert('Word 解析失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  }, []);

  const closeFile = () => {
    setFile(null);
    setHtmlContent('');
    setScale(1);
  };

  // 导出
  const getPlainText = () => {
    if (editor) return editor.getText();
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div.textContent || '';
  };

  const handleExportTxt = () => {
    const text = getPlainText();
    downloadText(text, file?.name?.replace(/\.docx?$/i, '') + '.txt' || 'document.txt', 'text/plain');
    alert('已导出 TXT');
  };

  const handleExportMd = () => {
    const text = getPlainText();
    const md = text.split(/\n+/).filter(l => l.trim()).map(l => l.trim() + '\n').join('\n');
    downloadText(md, file?.name?.replace(/\.docx?$/i, '') + '.md' || 'document.md', 'text/markdown');
    alert('已导出 Markdown');
  };

  const handleExportDocx = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const text = getPlainText();
      const lines = text.split(/\n+/).filter(l => l.trim());
      const children = lines.map(line => new Paragraph({ children: [new TextRun(line.trim())], spacing: { after: 120 } }));
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, file?.name?.replace(/\.docx?$/i, '') + '_export.docx' || 'document.docx');
      alert('已导出 Word');
    } catch (e: any) {
      console.error(e);
      alert('导出失败');
    }
  };

  if (file && (htmlContent || editor)) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f5f3f0', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {/* 顶栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', background: '#fff', borderBottom: '1px solid #f0efec' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span onClick={closeFile} style={{ color: '#2c2c2c', cursor: 'pointer', fontSize: 13 }}>← 返回</span>
            <span style={{ color: '#ccc' }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={toolbarBtn}>🔍−</button>
            <span style={{ fontSize: 12, color: '#999', minWidth: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} style={toolbarBtn}>🔍+</button>
            <span style={{ width: 1, height: 20, background: '#e8e6e1', margin: '0 6px' }} />
            <button onClick={handleExportTxt} style={toolbarBtn}>📄 TXT</button>
            <button onClick={handleExportMd} style={toolbarBtn}>📝 MD</button>
            <button onClick={handleExportDocx} style={toolbarBtn}>📥 Word</button>
            <button onClick={() => fileInputRef.current?.click()} style={toolbarBtn}>📤 重新上传</button>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0efec' }}>
          {ready && Editor && Toolbar ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,.08)', overflow: 'hidden' }}>
              <Toolbar
                editor={editor}
                defaultConfig={{}}
                mode="default"
                style={{ borderBottom: '1px solid #f0efec', background: '#fafaf9' }}
              />
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: `${100 / scale}%`, height: `${100 / scale}%`, padding: '40px 60px', transition: 'transform .15s' }}>
                  <Editor
                    defaultConfig={editorConfig}
                    value={htmlContent}
                    onCreated={setEditor}
                    onChange={ed => setHtmlContent(ed.getHtml())}
                    mode="default"
                    style={{ height: '100%', overflowY: 'hidden' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>加载编辑器中...</div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept=".docx,.doc" style={{ display: 'none' }} onChange={handleFileImport} />
      </div>
    );
  }

  return (
    <>
      <PageBanner icon="📝" title="Word 集成" desc="即用即传：上传 .docx，在线编辑器查看和编辑，支持缩放，导出 TXT/Markdown/Word" />
      <input ref={fileInputRef} type="file" accept=".docx,.doc" style={{ display: 'none' }} onChange={handleFileImport} />

      <Card title="快速开始">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>即用即传 · 富文本编辑器</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 24, lineHeight: 1.8 }}>
            上传 .docx，保留格式，支持加粗/斜体/标题/字号等编辑<br />
            可缩放视图，导出 TXT / Markdown / Word
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 32px', borderRadius: 10, fontSize: 14, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            {loading ? '解析中...' : '📤 选择 Word 文件'}
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: '#bbb' }}>支持 .docx / .doc 格式</div>
        </div>
      </Card>
    </>
  );
}

const toolbarBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  downloadBlob(blob, filename);
}
