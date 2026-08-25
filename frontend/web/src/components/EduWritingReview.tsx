import { useState } from 'react';
import { Card, PageBanner } from './ui';
import { apiCall } from '../lib/api';

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

export function EduWritingReview() {
  const [stage, setStage] = useState(STAGES[0].code);
  const [genre, setGenre] = useState(GENRES[0].code);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [err, setErr] = useState('');

  const handleReview = async () => {
    setErr('');
    if (!prompt.trim() || !scoringCriteria.trim() || !content.trim()) {
      setErr('作文题干、评分标准与作文正文均为必填项');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall<Review>('/writing/composition/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          submitType: 'text',
          languageCode: 'english',
          stageCode: stage,
          genreCode: genre,
          title: title.trim() || undefined,
          prompt: prompt.trim(),
          scoringCriteria: scoringCriteria.trim(),
          content: content.trim(),
        }),
      });
      setReview(data);
    } catch (e: any) {
      setErr(e?.message || '批阅失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBanner icon="📝" title="作文智能批阅" desc="填写题目信息与作文正文，一键获取多维评分、逐句反馈与润色建议" />
      <Card title="题目信息">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>学段</div>
            <PlainSelect options={STAGES} value={stage} onChange={setStage} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>题型</div>
            <PlainSelect options={GENRES} value={genre} onChange={setGenre} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>作文题目（可选）</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="如：My Hometown" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </div>
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
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="在此粘贴你的英文作文..."
          style={{ width: '100%', minHeight: 200, padding: 12, border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        {err && <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 8 }}>⚠ {err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button onClick={handleReview} disabled={loading || !content.trim()} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            {loading ? '批阅中...' : '🔍 开始批阅'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>{content.trim() ? `${content.trim().split(/\s+/).length} 词` : '尚未输入'}</span>
        </div>
      </Card>

      {review && (
        <Card title={`批阅报告 · 总分 ${review.score ?? '—'}`}>
          {review.score != null && (
            <div style={{ height: 10, background: '#f0efec', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${Math.max(0, Math.min(100, review.score))}%`, height: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)' }} />
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
                    {s.suggestion && <div style={{ fontSize: 13, color: '#764ba2', marginTop: 4 }}>✏️ {s.suggestion}</div>}
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
    </>
  );
}

function PlainSelect({ options, value, onChange }: { options: { code: string; desc: string }[]; value: string; onChange: (c: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 150 }}>
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
  if ((!itemsA || itemsA.length === 0) && (!itemsB || itemsB.length === 0)) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
      {itemsA?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32', marginBottom: 8 }}>✅ {titleA}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 2 }}>{itemsA.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
      {itemsB?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#c62828', marginBottom: 8 }}>⚠️ {titleB}</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 13, lineHeight: 2 }}>{itemsB.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
