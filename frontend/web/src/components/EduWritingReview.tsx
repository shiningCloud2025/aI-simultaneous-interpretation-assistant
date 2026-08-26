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
  { code: 'en_senior', desc: '高中英语', language: 'english' },
  { code: 'en_cet4', desc: '大学英语四级', language: 'english' },
  { code: 'en_cet6', desc: '大学英语六级', language: 'english' },
  { code: 'en_postgraduate', desc: '考研英语', language: 'english' },
];
const GENRES = [
  { code: 'en_senior_application', desc: '高中应用文', stage: 'en_senior' },
  { code: 'en_cet4_short_essay', desc: '四级短文写作', stage: 'en_cet4' },
  { code: 'en_cet6_short_essay', desc: '六级短文写作', stage: 'en_cet6' },
  { code: 'en_postgraduate_part_a', desc: '考研小作文', stage: 'en_postgraduate' },
  { code: 'en_postgraduate_part_b', desc: '考研大作文', stage: 'en_postgraduate' },
];

interface SentenceFeedback {
  index?: number;
  original?: string;
  feedback?: string;
  suggestion?: string;
}
interface Review {
  score: number;
  feedback?: string;
  suggestion?: string;
  highlights: string[];
  improvementPoints: string[];
  sentenceFeedback: SentenceFeedback[];
  improvedVersion?: string;
}

interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

interface EvaluationRecord extends Omit<Review, 'score'> {
  id: number;
  success: boolean;
  generationId?: number;
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
  provider?: string;
  modelName?: string;
  failureStage?: string;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}

export function EduWritingReview() {
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [stage, setStage] = useState(STAGES[0].code);
  const [genre, setGenre] = useState(GENRES[0].code);
  const [submitType, setSubmitType] = useState<'text' | 'image'>('text');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [err, setErr] = useState('');
  const [historySuccess, setHistorySuccess] = useState(true);
  const [historyUseCurrentFilter, setHistoryUseCurrentFilter] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<EvaluationRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(0);
  const [detail, setDetail] = useState<EvaluationRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentStages = STAGES.filter(s => s.language === language);
  const currentGenres = GENRES.filter(g => g.stage === stage);

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const firstStage = STAGES.find(s => s.language === nextLanguage);
    if (firstStage) {
      changeStage(firstStage.code);
    } else {
      setStage('');
      setGenre('');
    }
  };

  const changeStage = (nextStage: string) => {
    setStage(nextStage);
    const firstGenre = GENRES.find(g => g.stage === nextStage);
    setGenre(firstGenre?.code || '');
  };

  useEffect(() => {
    loadHistory(1, historySuccess);
  }, [historySuccess, historyUseCurrentFilter, submitType, language, stage, genre]);

  const loadHistory = async (page = historyPage, success = historySuccess) => {
    setHistoryLoading(true);
    try {
      const filter: Record<string, unknown> = { success };
      if (historyUseCurrentFilter) {
        filter.submitType = submitType;
        filter.languageCode = language || undefined;
        filter.stageCode = stage || undefined;
        filter.genreCode = genre || undefined;
      }
      const data = await apiCall<PageResult<EvaluationRecord>>('/writing/composition/evaluation/history/page', {
        method: 'POST',
        body: JSON.stringify({
          page,
          size: 5,
          filter,
        }),
      });
      setHistory(data.records || []);
      setHistoryPage(data.current || page);
      setHistoryPages(data.pages || 0);
    } catch {
      setHistory([]);
      setHistoryPages(0);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setErr('');
    try {
      const uploaded = await Promise.all(files.map(file => uploadFile<{ url: string }>(file)));
      setImageUrls(prev => [...prev, ...uploaded.map(file => file.url).filter(Boolean)]);
    } catch (e: any) {
      setErr(e?.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReview = async () => {
    setErr('');
    if (!prompt.trim() || !scoringCriteria.trim()) {
      setErr('作文题干与评分标准均为必填项');
      return;
    }
    if (currentStages.length === 0 || currentGenres.length === 0) {
      setErr('当前语言暂未配置可用学习阶段或题型');
      return;
    }
    if (submitType === 'text' && !content.trim()) {
      setErr('文本提交时作文正文不能为空');
      return;
    }
    if (submitType === 'image' && imageUrls.length === 0) {
      setErr('图片提交时请至少上传一张作文图片');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall<Review>('/writing/composition/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          submitType,
          languageCode: language,
          stageCode: stage,
          genreCode: genre,
          title: submitType === 'text' ? title.trim() || undefined : undefined,
          prompt: prompt.trim(),
          scoringCriteria: scoringCriteria.trim(),
          content: submitType === 'text' ? content.trim() : undefined,
          imageUrls: submitType === 'image' ? imageUrls : undefined,
        }),
      });
      setReview(data);
      loadHistory(1, true);
    } catch (e: any) {
      setErr(e?.message || '批阅失败');
      loadHistory(1, false);
    } finally {
      setLoading(false);
    }
  };

  const applyHistoryReview = (record: EvaluationRecord) => {
    if (!record.success || record.score == null) return;
    setReview({
      score: record.score,
      feedback: record.feedback,
      suggestion: record.suggestion,
      highlights: record.highlights || [],
      improvementPoints: record.improvementPoints || [],
      sentenceFeedback: record.sentenceFeedback || [],
      improvedVersion: record.improvedVersion,
    });
    setDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageBanner icon="📝" title="作文智能批阅" desc="填写题目信息与作文正文，一键获取多维评分、逐句反馈与润色建议" />
      <Card title="题目信息">
        <LlmModelPreference label="批阅模型" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>语言</div>
            <PlainSelect options={LANGUAGES} value={language} onChange={changeLanguage} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>学段</div>
            <PlainSelect options={currentStages} value={stage} onChange={changeStage} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>题型</div>
            <PlainSelect options={currentGenres} value={genre} onChange={setGenre} />
          </div>
          {submitType === 'text' && <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>作文题目（可选）</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="如：My Hometown" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>作文题干 *</div>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="如：请根据以下要点写一篇关于校园生活的短文" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>评分标准 *</div>
            <input value={scoringCriteria} onChange={e => setScoringCriteria(e.target.value)} placeholder="如：内容20分+语言20分+结构10分" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>
        </div>
      </Card>

      <Card title="作文输入">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setSubmitType('text')} style={tabBtn(submitType === 'text')}>文本作文</button>
          <button onClick={() => setSubmitType('image')} style={tabBtn(submitType === 'image')}>图片作文</button>
        </div>

        {submitType === 'text' ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="在此粘贴你的英文作文..."
            style={{ width: '100%', minHeight: 200, padding: 12, border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {imageUrls.map((url, i) => (
                <div key={url} style={{ position: 'relative', width: 116, height: 116, borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e6e1', background: '#fafaf9' }}>
                  <img src={url} alt={`作文图片${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setImageUrls(prev => prev.filter((_, index) => index !== i))} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', lineHeight: '22px' }}>×</button>
                </div>
              ))}
              <label style={{ width: 116, height: 116, borderRadius: 10, border: '1px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13, cursor: uploading ? 'default' : 'pointer', background: '#fff' }}>
                {uploading ? '上传中...' : '+ 上传图片'}
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>图片中可以包含作文题目和作文正文；题干与评分标准仍需要在上方填写。</div>
          </div>
        )}
        {err && <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 8 }}>⚠ {err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button onClick={handleReview} disabled={loading || uploading} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            {loading ? '批阅中...' : '🔍 开始批阅'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>{submitType === 'text' ? (content.trim() ? `${content.trim().split(/\s+/).length} 词` : '尚未输入') : `${imageUrls.length} 张图片`}</span>
        </div>
      </Card>

      {review && (
        <Card title={`批阅报告 · 总分 ${review.score ?? '—'}`}>
          {review.score != null && (
            <div style={{ height: 10, background: '#f0efec', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${Math.max(0, Math.min(100, review.score))}%`, height: '100%', background: '#234b49' }} />
            </div>
          )}

          {review.feedback && <Block title="整体反馈" text={review.feedback} />}
          {review.suggestion && <Block title="修改建议" text={review.suggestion} />}

          <DualList titleA="作文亮点" itemsA={review.highlights} titleB="重点弥补项" itemsB={review.improvementPoints} />

          {review.sentenceFeedback?.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>逐句反馈</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {review.sentenceFeedback.map((s, i) => (
                  <div key={i} style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 12, background: '#fff' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>第 {(s.index ?? i + 1)} 句</div>
                    <div style={{ fontSize: 13, color: '#444', marginTop: 4, fontStyle: 'italic' }}>{s.original}</div>
                    {s.feedback && <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>💬 {s.feedback}</div>}
                    {s.suggestion && <div style={{ fontSize: 13, color: '#8f4b2e', marginTop: 4 }}>✏️ {s.suggestion}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {review.improvedVersion && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>修改后版本</div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8, background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap' }}>{review.improvedVersion}</div>
            </>
          )}
        </Card>
      )}

      <Card title="批阅历史">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setHistorySuccess(true)} style={tabBtn(historySuccess)}>成功记录</button>
            <button onClick={() => setHistorySuccess(false)} style={tabBtn(!historySuccess)}>失败记录</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={historyUseCurrentFilter}
                onChange={e => setHistoryUseCurrentFilter(e.target.checked)}
              />
              按当前条件筛选
            </label>
          </div>
          <button onClick={() => loadHistory(1, historySuccess)} disabled={historyLoading} style={ghostBtn}>{historyLoading ? '刷新中...' : '刷新'}</button>
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 24 }}>{historyLoading ? '加载中...' : '暂无批阅历史'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{item.success ? `${item.score ?? '—'} 分 · ${item.title || '作文批阅'}` : '批阅失败'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {submitTypeLabel(item.submitType)} · {labelOf(LANGUAGES, item.languageCode)} · {labelOf(STAGES, item.stageCode)} · {labelOf(GENRES, item.genreCode)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{item.createTime ? new Date(item.createTime).toLocaleString() : ''}</div>
                </div>
                {item.success ? (
                  <>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.feedback || item.suggestion || item.prompt}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetail(item)} style={ghostBtn}>查看报告</button>
                      <button onClick={() => applyHistoryReview(item)} style={ghostBtn}>载入报告</button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#c62828', lineHeight: 1.6, marginTop: 8 }}>{item.errorMessage || item.failureStage || '批阅失败'}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {historyPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button onClick={() => loadHistory(historyPage - 1, historySuccess)} disabled={historyPage <= 1 || historyLoading} style={{ ...ghostBtn, opacity: historyPage <= 1 ? .4 : 1 }}>上一页</button>
            <span style={{ fontSize: 12, color: '#999' }}>{historyPage} / {historyPages}</span>
            <button onClick={() => loadHistory(historyPage + 1, historySuccess)} disabled={historyPage >= historyPages || historyLoading} style={{ ...ghostBtn, opacity: historyPage >= historyPages ? .4 : 1 }}>下一页</button>
          </div>
        )}
      </Card>

      {detail && (
        <div onClick={() => setDetail(null)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>作文批阅详情</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  {submitTypeLabel(detail.submitType)} · {labelOf(LANGUAGES, detail.languageCode)} · {labelOf(STAGES, detail.stageCode)} · {labelOf(GENRES, detail.genreCode)}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={closeBtn}>×</button>
            </div>

            {detail.success ? (
              <>
                <HistoryBaseInfo record={detail} onPreview={setPreviewUrl} />
                {detail.score != null && <ReviewDetail review={{ score: detail.score, feedback: detail.feedback, suggestion: detail.suggestion, highlights: detail.highlights || [], improvementPoints: detail.improvementPoints || [], sentenceFeedback: detail.sentenceFeedback || [], improvedVersion: detail.improvedVersion }} />}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => applyHistoryReview(detail)} style={primaryBtn}>载入到批阅报告</button>
                </div>
              </>
            ) : (
              <>
                <HistoryBaseInfo record={detail} onPreview={setPreviewUrl} />
                <Block title="失败原因" text={detail.errorMessage || detail.failureStage || '批阅失败'} />
              </>
            )}
          </div>
        </div>
      )}

      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={previewOverlay}>
          <img src={previewUrl} alt="作文图片预览" style={previewImage} />
          <span onClick={() => setPreviewUrl(null)} style={previewClose}>×</span>
        </div>
      )}
    </>
  );
}

function ReviewDetail({ review }: { review: Review }) {
  return (
    <>
      <div style={{ height: 10, background: '#f0efec', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ width: `${Math.max(0, Math.min(100, review.score))}%`, height: '100%', background: '#234b49' }} />
      </div>

      {review.feedback && <Block title="整体反馈" text={review.feedback} />}
      {review.suggestion && <Block title="修改建议" text={review.suggestion} />}
      <DualList titleA="作文亮点" itemsA={review.highlights} titleB="重点弥补项" itemsB={review.improvementPoints} />

      {review.sentenceFeedback?.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>逐句反馈</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {review.sentenceFeedback.map((s, i) => (
              <div key={i} style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 12, background: '#fff' }}>
                <div style={{ fontSize: 12, color: '#999' }}>第 {(s.index ?? i + 1)} 句</div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 4, fontStyle: 'italic' }}>{s.original}</div>
                {s.feedback && <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>💬 {s.feedback}</div>}
                {s.suggestion && <div style={{ fontSize: 13, color: '#8f4b2e', marginTop: 4 }}>✏️ {s.suggestion}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {review.improvedVersion && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>修改后版本</div>
          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8, background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap' }}>{review.improvedVersion}</div>
        </>
      )}
    </>
  );
}

function HistoryBaseInfo({ record, onPreview }: { record: EvaluationRecord; onPreview: (url: string) => void }) {
  return (
    <>
      {record.title && <Block title="作文题目" text={record.title} />}
      {record.prompt && <Block title="作文题干" text={record.prompt} />}
      {record.scoringCriteria && <Block title="评分标准" text={record.scoringCriteria} />}
      {record.content && <Block title="作文正文" text={record.content} />}
      {record.imageUrls && record.imageUrls.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>作文图片</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {record.imageUrls.map((url, i) => (
              <img key={url} src={url} alt={`作文图片${i + 1}`} onClick={() => onPreview(url)} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #f0efec', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
      {record.ocrText && <Block title="OCR识别文本" text={record.ocrText} />}
    </>
  );
}

function PlainSelect({ options, value, onChange }: { options: { code: string; desc: string }[]; value: string; onChange: (c: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 150 }}>
      <option value="">请选择</option>
      {options.map(o => <option key={o.code} value={o.code}>{o.desc}</option>)}
    </select>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{text}</div>
    </>
  );
}

function DualList({ titleA, itemsA, titleB, itemsB }: { titleA: string; itemsA?: string[]; titleB: string; itemsB?: string[] }) {
  const leftItems = itemsA || [];
  const rightItems = itemsB || [];
  if (leftItems.length === 0 && rightItems.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
      {leftItems.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32', marginBottom: 8 }}>✅ {titleA}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 2 }}>{leftItems.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
      {rightItems.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#c62828', marginBottom: 8 }}>⚠️ {titleB}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 2 }}>{rightItems.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function labelOf(options: { code: string; desc: string }[], code?: string) {
  return options.find(o => o.code === code)?.desc || code || '—';
}

function submitTypeLabel(type?: string) {
  if (type === 'image') return '图片作文';
  if (type === 'text') return '文本作文';
  return type || '—';
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    borderRadius: 8,
    border: active ? '1px solid #2c2c2c' : '1px solid #e8e6e1',
    background: active ? '#2c2c2c' : '#fff',
    color: active ? '#fff' : '#666',
    fontSize: 12,
    cursor: 'pointer',
  };
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

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.28)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: 'min(820px, 100%)',
  maxHeight: '82vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 18px 50px rgba(0,0,0,.18)',
};

const closeBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: '1px solid #eee',
  background: '#fafaf9',
  color: '#999',
  fontSize: 20,
  cursor: 'pointer',
  lineHeight: '24px',
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
