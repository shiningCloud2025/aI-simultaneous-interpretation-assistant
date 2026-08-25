import { useState } from 'react';
import { Card, PageBanner } from './ui';

interface Review {
  score: number;
  dimensions: { name: string; score: number; comment: string }[];
  suggestions: string[];
  polished: string;
}

// 本地 mock：根据作文字数/内容给出评分与建议。后续可替换为后端 Controller 返回。
function mockReview(essay: string): Review {
  const len = essay.trim().length;
  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const base = Math.min(95, 60 + Math.floor(words / 5));
  return {
    score: base,
    dimensions: [
      { name: '内容切题', score: Math.min(25, 15 + Math.floor(words / 8)), comment: words > 30 ? '内容充实，紧扣主题。' : '建议补充更多具体事例。' },
      { name: '结构逻辑', score: Math.min(25, 16 + Math.floor(words / 10)), comment: '段落衔接较自然，注意过渡词使用。' },
      { name: '语言表达', score: Math.min(25, 15 + Math.floor(words / 12)), comment: '句式有变化，可多用复合句提升层次。' },
      { name: '词汇丰富', score: Math.min(25, 14 + Math.floor(words / 14)), comment: '词汇基本准确，建议替换重复词。' },
    ],
    suggestions: [
      '开头可更直接点明观点，避免铺垫过长。',
      '第二段建议增加一个具体例子支撑论点。',
      '结尾可适度升华，呼应开头主题。',
      `当前约 ${words} 词，达到要求篇幅${words >= 80 ? '✓' : '（建议增加到 80+ 词）'}。`,
    ],
    polished: essay.trim()
      ? essay.trim().replace(/\s+/g, ' ').replace(/[。.]+$/, '') + '（示例润色：可在此给出优化后的通顺版本）'
      : '',
  };
}

export function EduWritingReview() {
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const handleReview = () => {
    if (!essay.trim()) return;
    setLoading(true);
    // 模拟异步（后续替换为 fetch('/api/.../writing/review')）
    setTimeout(() => {
      setReview(mockReview(essay));
      setLoading(false);
    }, 700);
  };

  return (
    <>
      <PageBanner icon="📝" title="作文智能批阅" desc="粘贴你的英文作文，一键获取多维评分、修改建议与润色参考，快速提升写作水平" />
      <Card title="作文输入">
        <textarea
          value={essay}
          onChange={e => setEssay(e.target.value)}
          placeholder="在此粘贴你的英文作文..."
          style={{ width: '100%', minHeight: 200, padding: 12, border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleReview}
            disabled={loading || !essay.trim()}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '批阅中...' : '🔍 开始批阅'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>{essay.trim() ? `${essay.trim().split(/\s+/).length} 词` : '尚未输入'}</span>
        </div>
      </Card>

      {review && (
        <Card title={`批阅报告 · 总分 ${review.score}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {review.dimensions.map((d, i) => (
              <div key={i} style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, color: '#555' }}>{d.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>{d.score}</span>
                </div>
                <div style={{ height: 6, background: '#f0efec', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(d.score / 25) * 100}%`, height: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)' }} />
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{d.comment}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>修改建议</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: 2 }}>
            {review.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>

          {review.polished && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>润色参考</div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8, background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 10, padding: 14 }}>{review.polished}</div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
