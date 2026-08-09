import { useState, useRef } from 'react';
import { api } from '../stores/appStore';

type FeedbackType = 'BUG' | 'SUGGESTION' | 'OTHER';

const typeLabels: Record<FeedbackType, string> = { BUG: '问题反馈', SUGGESTION: '功能建议', OTHER: '其他' };
const statusLabels: Record<string, string> = { PENDING: '待处理', PROCESSING: '处理中', RESOLVED: '已解决', CLOSED: '已关闭' };
const statusColors: Record<string, string> = { PENDING: '#f0ad4e', PROCESSING: '#5bc0de', RESOLVED: '#5cb85c', CLOSED: '#999' };

export function HelpPage() {
  const [showMy, setShowMy] = useState(false);
  const [type, setType] = useState<FeedbackType>('BUG');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fileIds, setFileIds] = useState<number[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const loadList = async (p = 1) => {
    try {
      const data = await api.getFeedbacks({ page: p, size: 5 });
      setList(data.records || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 5));
      setPage(p);
    } catch (e: any) { showToast(e.message || '加载失败'); }
  };

  const openMyFeedback = () => { setShowMy(true); loadList(); };

  const viewDetail = async (id: number) => {
    try {
      const data = await api.getFeedbackDetail(id);
      setDetail(data);
    } catch (e: any) { showToast(e.message || '加载失败'); }
  };

  const submit = async () => {
    if (!title.trim()) return showToast('请输入标题');
    if (!content.trim()) return showToast('请输入内容');
    setLoading(true);
    try {
      await api.submitFeedback({ type, title: title.trim(), content: content.trim(), fileIds: fileIds.length > 0 ? fileIds : undefined } as any);
      showToast('感谢反馈！');
      setTitle(''); setContent(''); setType('BUG'); setFileIds([]); setFileUrls([]);
    } catch (e: any) { showToast(e.message || '提交失败'); }
    finally { setLoading(false); }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/common/file/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData });
      const json = await res.json();
      if (json.code === 200 && json.data?.id) {
        setFileIds(prev => [...prev, json.data.id]);
        if (json.data.url) setFileUrls(prev => [...prev, json.data.url]);
        showToast('图片已上传');
      } else showToast(json.message || '上传失败');
    } catch { showToast('上传失败'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>意见反馈</div>
        <button onClick={openMyFeedback} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #e0ded8', background: '#fff', fontSize: 13, color: '#555', cursor: 'pointer' }}>📋 我的反馈</button>
      </div>

      {/* 提交表单 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>反馈类型</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(typeLabels) as FeedbackType[]).map(t => (
              <button key={t} onClick={() => setType(t)} style={typeBtn(type === t)}>{typeLabels[t]}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>标题</div>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inp} placeholder="请输入标题" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>详细描述</div>
          <textarea value={content} onChange={e => setContent(e.target.value)} style={{ ...inp, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }} placeholder="请描述你的问题或建议..." />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>上传截图（选填）</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {fileUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid #e0ded8', cursor: 'pointer' }} onClick={() => setPreviewUrl(url)}>
                <img src={url} style={{ width: 72, height: 72, objectFit: 'cover' }} />
                <span onClick={e => { e.stopPropagation(); setFileIds(prev => prev.filter((_, j) => j !== i)); setFileUrls(prev => prev.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>×</span>
              </div>
            ))}
            <label style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed #e0ded8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'default' : 'pointer', color: '#bbb', fontSize: 12 }}>
              {uploading ? '...' : '+'}
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadFile} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>
        <button onClick={submit} disabled={loading} style={{ padding: '12px 40px', background: loading ? '#999' : '#2c2c2c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer' }}>{loading ? '提交中...' : '提 交 反 馈'}</button>
      </div>

      {/* 我的反馈弹窗 */}
      {showMy && (
        <div onClick={() => setShowMy(false)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 540, maxHeight: '75vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 20 }}>我的反馈</div>
            {list.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#bbb', fontSize: 14, padding: 30 }}>暂无反馈记录</div>
            ) : (
              list.map((item: any) => (
                <div key={item.id} style={{ padding: '16px 0', borderBottom: '1px solid #f5f3f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#777', marginTop: 6, lineHeight: 1.6 }}>{item.content}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: '#bbb' }}>{item.feedbackNo}</span>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f5f3f0', color: '#888' }}>{typeLabels[item.type as FeedbackType] || item.type}</span>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: (statusColors[item.status] || '#999') + '18', color: statusColors[item.status] || '#999', fontWeight: 500 }}>{statusLabels[item.status] || item.status}</span>
                        <button onClick={() => viewDetail(item.id)} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: '1px solid #e0ded8', background: '#fff', fontSize: 12, color: '#666', cursor: 'pointer' }}>查看详情</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {totalPages > 1 && (
              <div style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <button onClick={() => loadList(page - 1)} disabled={page <= 1} style={{ ...pageBtn, opacity: page <= 1 ? .3 : 1 }}>上一页</button>
                <span style={{ fontSize: 13, color: '#999' }}>{page} / {totalPages}</span>
                <button onClick={() => loadList(page + 1)} disabled={page >= totalPages} style={{ ...pageBtn, opacity: page >= totalPages ? .3 : 1 }}>下一页</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {detail && (
        <div onClick={() => setDetail(null)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 540, maxHeight: '75vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>反馈详情</div>
              <span onClick={() => setDetail(null)} style={{ cursor: 'pointer', color: '#bbb', fontSize: 20, lineHeight: 1 }}>×</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f5f3f0', color: '#888' }}>{typeLabels[detail.type as FeedbackType] || detail.type}</span>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: (statusColors[detail.status] || '#999') + '18', color: statusColors[detail.status] || '#999', fontWeight: 500 }}>{statusLabels[detail.status] || detail.status}</span>
              <span style={{ fontSize: 12, color: '#bbb' }}>{detail.feedbackNo}</span>
              <span style={{ fontSize: 12, color: '#bbb' }}>{detail.createTime ? new Date(detail.createTime).toLocaleString() : ''}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 8 }}>{detail.title}</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{detail.content}</div>
            </div>
            {detail.attachments?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>附件</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detail.attachments.map((att: any) => (
                    <img key={att.id} src={att.url} onClick={() => setPreviewUrl(att.url)} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #e0ded8', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            )}
            {detail.replyContent && (
              <div style={{ background: '#f8f8f6', borderRadius: 12, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>官方回复</div>
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{detail.replyContent}</div>
                {detail.replyTime && <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>{new Date(detail.replyTime).toLocaleString()}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图片预览弹窗 */}
      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <img src={previewUrl} style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.3)' }} />
          <span onClick={() => setPreviewUrl(null)} style={{ position: 'fixed', top: 24, right: 32, color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>×</span>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#333', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const pageBtn: React.CSSProperties = { padding: '8px 16px', border: '1px solid #e0ded8', borderRadius: 8, background: '#fff', fontSize: 13, color: '#666', cursor: 'pointer' };
function typeBtn(active: boolean): React.CSSProperties {
  return { padding: '8px 16px', borderRadius: 8, border: active ? '1px solid #2c2c2c' : '1px solid #e0ded8', background: active ? '#2c2c2c' : '#fff', color: active ? '#fff' : '#666', fontSize: 13, cursor: 'pointer' };
}
