import { useEffect, useRef, useState } from 'react';
import { Card, PageBanner } from './ui';
import { apiCall, uploadFile } from '../lib/api';
import { LlmModelPreference } from './LlmModelPreference';

const LANGUAGES = [
  { code: 'english', desc: '英语' },
  { code: 'japanese', desc: '日语' },
  { code: 'korean', desc: '韩语' },
];
const STAGES = [
  { code: 'en_senior', desc: '高中英语' },
  { code: 'en_cet4', desc: '大学英语四级' },
  { code: 'en_cet6', desc: '大学英语六级' },
  { code: 'en_postgraduate', desc: '考研英语' },
];
const GENRES = [
  { code: 'en_senior_application', desc: '高中应用文' },
  { code: 'en_cet4_short_essay', desc: '四级短文写作' },
  { code: 'en_cet6_short_essay', desc: '六级短文写作' },
  { code: 'en_postgraduate_part_a', desc: '考研小作文' },
  { code: 'en_postgraduate_part_b', desc: '考研大作文' },
];

interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

interface EvaluationRecord {
  id: number;
  success: boolean;
  submitType: 'text' | 'image';
  languageCode: string;
  stageCode: string;
  genreCode: string;
  title?: string;
  prompt?: string;
  scoringCriteria?: string;
  content?: string;
  imageUrls?: string[];
  ocrText?: string;
  score?: number;
  feedback?: string;
  suggestion?: string;
  createTime?: string;
}

interface TutorAnswer {
  evaluationId: number;
  question: string;
  imageUrls?: string[];
  answer: string;
}

interface TutorMessage {
  role: 'user' | 'assistant';
  text: string;
  imageUrls?: string[];
}

interface TutorHistoryMessage {
  id: number;
  evaluationId: number;
  role: 'user' | 'assistant' | string;
  roleName?: string;
  content: string;
  imageUrls?: string[];
  createTime?: string;
}

export function EduWritingTutor() {
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [selected, setSelected] = useState<EvaluationRecord | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [question, setQuestion] = useState('');
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    loadRecords(1);
  }, []);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading, selected?.id]);

  useEffect(() => {
    if (selected) {
      loadTutorMessages(selected.id);
    }
  }, [selected?.id]);

  const loadRecords = async (nextPage = page) => {
    setLoadingRecords(true);
    try {
      const data = await apiCall<PageResult<EvaluationRecord>>('/writing/composition/evaluation/history/page', {
        method: 'POST',
        body: JSON.stringify({
          page: nextPage,
          size: 8,
          filter: { success: true },
        }),
      });
      setRecords(data.records || []);
      setPage(data.current || nextPage);
      setPages(data.pages || 0);
    } catch (e: any) {
      setRecords([]);
      setPages(0);
      showToast(e?.message || '已批阅作文加载失败');
    } finally {
      setLoadingRecords(false);
    }
  };

  const selectRecord = (record: EvaluationRecord) => {
    setSelected(record);
    setQuestion('');
    setQuestionImages([]);
    setMessages([]);
  };

  const loadTutorMessages = async (evaluationId: number) => {
    setLoadingMessages(true);
    try {
      const data = await apiCall<TutorHistoryMessage[]>(`/writing/composition/tutor/messages?evaluationId=${encodeURIComponent(evaluationId)}`);
      setMessages((data || []).map(toTutorMessage));
    } catch (e: any) {
      setMessages([]);
      showToast(e?.message || '答疑历史加载失败');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (questionImages.length + files.length > 5) {
      showToast('提问图片最多上传5张');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(file => uploadFile<{ url: string }>(file)));
      setQuestionImages(prev => [...prev, ...uploaded.map(file => file.url).filter(Boolean)].slice(0, 5));
    } catch (e: any) {
      showToast(e?.message || '提问图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const sendQuestion = async () => {
    if (!selected) {
      showToast('请先选择一条已批阅作文');
      return;
    }
    const text = question.trim();
    if (!text) {
      showToast('请输入要咨询的问题');
      return;
    }

    const images = questionImages.slice();
    setMessages(prev => [...prev, { role: 'user', text, imageUrls: images }]);
    setQuestion('');
    setQuestionImages([]);
    setChatLoading(true);
    try {
      const result = await apiCall<TutorAnswer>('/writing/composition/tutor/chat', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: selected.id,
          question: text,
          imageUrls: images.length > 0 ? images : undefined,
        }),
      });
      setMessages(prev => [...prev, { role: 'assistant', text: result.answer || '这条问题暂时没有返回内容' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: e?.message || 'AI答疑失败，请稍后再试' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {!selected ? (
        <>
          <PageBanner icon="💬" title="已批阅作文答疑" desc="选择一条已批阅作文，进入围绕本次评阅的连续答疑空间" />

          <Card title="答疑模型">
            <LlmModelPreference label="作文答疑模型" />
          </Card>

          <Card title="选择一篇已批阅作文">
            <div style={recordPickerHead}>
              <div>
                <div style={{ fontSize: 13, color: '#777' }}>仅显示成功批阅记录</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>进入后可以继续追问扣分原因、句子修改和表达建议。</div>
              </div>
              <button onClick={() => loadRecords(1)} disabled={loadingRecords} style={ghostBtn}>{loadingRecords ? '刷新中...' : '刷新'}</button>
            </div>

            {records.length === 0 ? (
              <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 48 }}>{loadingRecords ? '加载中...' : '暂无成功批阅记录'}</div>
            ) : (
              <div style={recordGrid}>
                {records.map(record => (
                  <button key={record.id} onClick={() => selectRecord(record)} style={recordCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#26312d' }}>{record.title || '作文批阅'}</div>
                        <div style={{ fontSize: 12, color: '#8b918d', marginTop: 7 }}>
                          {submitTypeLabel(record.submitType)} · {labelOf(LANGUAGES, record.languageCode)} · {labelOf(STAGES, record.stageCode)}
                        </div>
                      </div>
                      <span style={scoreBadge}>{record.score ?? '—'} 分</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#a4a9a5', marginTop: 14 }}>{formatTime(record.createTime)}</div>
                    <div style={{ fontSize: 12, color: '#65706b', marginTop: 10, lineHeight: 1.7, minHeight: 42 }}>{record.suggestion || record.feedback || '进入后围绕这次评阅继续提问。'}</div>
                  </button>
                ))}
              </div>
            )}

            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <button onClick={() => loadRecords(page - 1)} disabled={page <= 1 || loadingRecords} style={{ ...ghostBtn, opacity: page <= 1 ? .45 : 1 }}>上一页</button>
                <span style={{ fontSize: 12, color: '#999' }}>{page} / {pages}</span>
                <button onClick={() => loadRecords(page + 1)} disabled={page >= pages || loadingRecords} style={{ ...ghostBtn, opacity: page >= pages ? .45 : 1 }}>下一页</button>
              </div>
            )}
          </Card>
        </>
      ) : (
        <div style={chatShell}>
          <aside style={chatSidebar}>
            <button onClick={() => setSelected(null)} style={backBtn}>← 返回评阅列表</button>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, color: '#9ca39f', marginBottom: 8 }}>当前评阅</div>
              <div style={activeRecordCard}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#22312d' }}>{selected.title || '作文批阅'}</div>
                <div style={{ fontSize: 12, color: '#8a928d', marginTop: 7 }}>{submitTypeLabel(selected.submitType)} · {labelOf(GENRES, selected.genreCode)}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={scoreBadge}>{selected.score ?? '—'} 分</span>
                  <span style={softBadge}>{formatTime(selected.createTime)}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <LlmModelPreference label="答疑模型" />
            </div>
            <SelectedSummary record={selected} onPreview={setPreviewUrl} compact />
          </aside>

          <main style={chatMain}>
            <div style={chatTopbar}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2b27' }}>作文答疑</div>
                <div style={{ fontSize: 12, color: '#8d948f', marginTop: 4 }}>围绕当前评阅连续追问，后端会按这篇作文维度保留上下文。</div>
              </div>
              <button onClick={() => setMessages([])} disabled={messages.length === 0 || chatLoading} style={{ ...ghostBtn, opacity: messages.length === 0 || chatLoading ? .45 : 1 }}>清空本页对话</button>
            </div>

            <div ref={chatBodyRef} style={chatBody}>
              {loadingMessages ? (
                <div style={emptyChat}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#283430' }}>正在载入这次评阅的答疑记录...</div>
                  <div style={{ fontSize: 12, color: '#9a9f9b', marginTop: 8 }}>历史消息会按时间顺序回显在这里。</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={emptyChat}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#283430' }}>可以从这些问题开始</div>
                  <div style={quickGrid}>
                    {['这篇作文主要为什么扣分？', '帮我把修改建议拆成三步。', '第二段怎么写会更自然？', '老师这次评分合理吗？'].map(text => (
                      <button key={text} onClick={() => setQuestion(text)} style={quickBtn}>{text}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.map((message, index) => (
                    <ChatBubble key={index} message={message} onPreview={setPreviewUrl} />
                  ))}
                  {chatLoading && (
                    <div style={thinkingBubble}>
                      <div style={{ fontWeight: 800, color: '#65706b', marginBottom: 6 }}>AI 正在整理回答</div>
                      <div>读取本次评阅记录 → 分析你的问题 → 组织可执行建议</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={composerWrap}>
              {questionImages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {questionImages.map((url, index) => (
                    <div key={url} style={{ position: 'relative', width: 72, height: 72 }}>
                      <img src={url} alt={`提问图片${index + 1}`} onClick={() => setPreviewUrl(url)} style={thumbStyle} />
                      <button onClick={() => setQuestionImages(prev => prev.filter((_, i) => i !== index))} style={removeImgBtn}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={composer}>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  disabled={chatLoading}
                  placeholder="继续追问这次批阅，例如：这句为什么不自然？有没有更高分写法？"
                  style={composerInput}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ ...ghostBtn, opacity: uploading || questionImages.length >= 5 ? .5 : 1, cursor: uploading || questionImages.length >= 5 ? 'not-allowed' : 'pointer' }}>
                    {uploading ? '上传中' : '+ 图片'}
                    <input ref={fileRef} type="file" accept="image/*" multiple disabled={uploading || questionImages.length >= 5} onChange={handleUpload} style={{ display: 'none' }} />
                  </label>
                  <button onClick={sendQuestion} disabled={chatLoading || !question.trim()} style={{ ...primaryBtn, opacity: chatLoading || !question.trim() ? .5 : 1, cursor: chatLoading || !question.trim() ? 'not-allowed' : 'pointer' }}>发送</button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>会先实时展示本次问答；重新进入该评阅时，会从历史消息接口回显已保存记录。</div>
            </div>
          </main>
        </div>
      )}

      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={previewOverlay}>
          <img src={previewUrl} alt="图片预览" style={previewImage} />
          <span onClick={() => setPreviewUrl(null)} style={previewClose}>×</span>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 1200 }}>{toast}</div>}
    </>
  );
}

function SelectedSummary({ record, onPreview, compact = false }: { record: EvaluationRecord; onPreview: (url: string) => void; compact?: boolean }) {
  return (
    <div style={{ ...summaryStyle, ...(compact ? { marginTop: 14, maxHeight: '44vh', overflowY: 'auto' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: '#333' }}>{compact ? '评阅摘要' : record.title || '作文批阅'}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
            {record.score ?? '—'} 分 · {submitTypeLabel(record.submitType)} · {formatTime(record.createTime)}
          </div>
        </div>
      </div>
      {record.feedback && <div style={summaryLine}><b>整体反馈：</b>{record.feedback}</div>}
      {record.suggestion && <div style={summaryLine}><b>修改建议：</b>{record.suggestion}</div>}
      {record.content && <div style={summaryLine}><b>作文正文：</b>{record.content}</div>}
      {record.imageUrls && record.imageUrls.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {record.imageUrls.map(url => <img key={url} src={url} alt="作文图片" onClick={() => onPreview(url)} style={thumbStyle} />)}
        </div>
      )}
    </div>
  );
}

function ChatBubble({ message, onPreview }: { message: TutorMessage; onPreview: (url: string) => void }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
      <div style={{
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '12px 14px',
        background: isUser ? '#234b49' : '#fff',
        color: isUser ? '#fff' : '#444',
        border: isUser ? 'none' : '1px solid #ebe8e1',
        boxShadow: isUser ? '0 10px 24px rgba(35,75,73,.16)' : '0 12px 28px rgba(24,31,28,.06)',
        fontSize: 13,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {message.text}
      </div>
      {message.imageUrls && message.imageUrls.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: isUser ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
          {message.imageUrls.map(url => <img key={url} src={url} alt="提问图片" onClick={() => onPreview(url)} style={thumbStyle} />)}
        </div>
      )}
    </div>
  );
}

function labelOf(options: { code: string; desc: string }[], code?: string) {
  return options.find(o => o.code === code)?.desc || code || '—';
}

function toTutorMessage(message: TutorHistoryMessage): TutorMessage {
  return {
    role: String(message.role).toLowerCase() === 'assistant' ? 'assistant' : 'user',
    text: message.content || '',
    imageUrls: message.imageUrls || [],
  };
}

function submitTypeLabel(type?: string) {
  if (type === 'image') return '图片作文';
  if (type === 'text') return '文本作文';
  return type || '—';
}

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '';
}

const ghostBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid #e8e6e1',
  background: '#fff',
  color: '#666',
  fontSize: 12,
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#2c2c2c',
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
};

const recordPickerHead: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 18,
};

const recordGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 14,
};

const recordCard: React.CSSProperties = {
  minHeight: 148,
  padding: 16,
  borderRadius: 14,
  border: '1px solid #eee9df',
  background: '#fff',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 12px 30px rgba(31,42,37,.04)',
};

const activeRecordCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: '1px solid #e8e2d8',
  background: '#fff',
  boxShadow: '0 12px 30px rgba(31,42,37,.05)',
};

const scoreBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 28,
  padding: '0 10px',
  borderRadius: 999,
  background: '#edf5f1',
  color: '#234b49',
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const softBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: 999,
  background: '#f6f4ef',
  color: '#878d88',
  fontSize: 11,
  lineHeight: 1.4,
};

const chatShell: React.CSSProperties = {
  height: 'calc(100vh - 124px)',
  minHeight: 660,
  display: 'grid',
  gridTemplateColumns: '330px minmax(0, 1fr)',
  gap: 16,
};

const chatSidebar: React.CSSProperties = {
  minHeight: 0,
  padding: 16,
  borderRadius: 18,
  border: '1px solid #eee9df',
  background: '#fbfaf7',
  overflowY: 'auto',
};

const chatMain: React.CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  borderRadius: 18,
  border: '1px solid #eee9df',
  background: '#fff',
  boxShadow: '0 18px 50px rgba(31,42,37,.06)',
  overflow: 'hidden',
};

const chatTopbar: React.CSSProperties = {
  padding: '18px 22px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  borderBottom: '1px solid #eee9df',
  background: '#fff',
};

const chatBody: React.CSSProperties = {
  minHeight: 0,
  overflowY: 'auto',
  padding: '28px 22px',
  background: 'linear-gradient(180deg, #fbfaf7 0%, #fff 54%)',
};

const composerWrap: React.CSSProperties = {
  padding: 16,
  borderTop: '1px solid #eee9df',
  background: '#fff',
};

const composer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 10,
  alignItems: 'end',
  padding: 10,
  borderRadius: 16,
  border: '1px solid #e7e1d8',
  background: '#fbfaf7',
};

const composerInput: React.CSSProperties = {
  width: '100%',
  minHeight: 54,
  maxHeight: 140,
  padding: 8,
  border: 0,
  background: 'transparent',
  resize: 'vertical',
  outline: 'none',
  fontSize: 13,
  lineHeight: 1.7,
  fontFamily: 'inherit',
};

const emptyChat: React.CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  color: '#777',
};

const quickGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))',
  gap: 10,
  marginTop: 20,
  width: 'min(620px, 100%)',
};

const quickBtn: React.CSSProperties = {
  padding: '13px 14px',
  borderRadius: 12,
  border: '1px solid #e8e2d8',
  background: '#fff',
  color: '#41504a',
  fontSize: 13,
  textAlign: 'left',
  cursor: 'pointer',
};

const backBtn: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #e8e2d8',
  background: '#fff',
  color: '#234b49',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};

const thinkingBubble: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 12px',
  borderRadius: 12,
  background: '#fff',
  border: '1px solid #ebe8e1',
  color: '#9a9f9b',
  fontSize: 12,
};

const summaryStyle: React.CSSProperties = {
  border: '1px solid #f0efec',
  borderRadius: 12,
  padding: 14,
  background: '#fff',
};

const summaryLine: React.CSSProperties = {
  fontSize: 13,
  color: '#555',
  lineHeight: 1.7,
  marginTop: 10,
  whiteSpace: 'pre-wrap',
  maxHeight: 110,
  overflowY: 'auto',
};

const thumbStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  objectFit: 'cover',
  borderRadius: 8,
  border: '1px solid #eee',
  cursor: 'pointer',
};

const removeImgBtn: React.CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: 'none',
  background: '#2c2c2c',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};

const previewOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
};

const previewImage: React.CSSProperties = {
  maxWidth: '80vw',
  maxHeight: '80vh',
  borderRadius: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,.3)',
};

const previewClose: React.CSSProperties = {
  position: 'fixed',
  top: 24,
  right: 32,
  color: '#fff',
  fontSize: 28,
  cursor: 'pointer',
  lineHeight: 1,
};
