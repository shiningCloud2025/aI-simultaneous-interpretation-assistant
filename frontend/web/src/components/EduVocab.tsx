import { useState } from 'react';
import { Card, PageBanner } from './ui';

interface VocabCard {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  memory: string;
}

// 本地 mock：根据输入单词生成「记忆卡片」。后续可替换为后端 Controller 返回。
function mockBuildCards(raw: string): VocabCard[] {
  const words = raw
    .split(/[\n,，\s]+/)
    .map(w => w.trim())
    .filter(Boolean)
    .slice(0, 20);
  const pool: Record<string, Partial<VocabCard>> = {
    apple: { phonetic: '/ˈæpəl/', pos: 'n.', meaning: '苹果', example: 'She ate a red apple.', memory: 'a+pple 联想到「一个苹果」' },
    happy: { phonetic: '/ˈhæpi/', pos: 'adj.', meaning: '快乐的', example: 'I am happy today.', memory: 'hap(运气)+py → 有运气的→快乐' },
    book: { phonetic: '/bʊk/', pos: 'n.', meaning: '书', example: 'This is my book.', memory: 'b+ook 谐音「布克」像书名' },
  };
  return words.map((w, i) => ({
    word: w,
    phonetic: pool[w.toLowerCase()]?.phonetic || `/wɜːd${i + 1}/`,
    pos: pool[w.toLowerCase()]?.pos || 'n.',
    meaning: pool[w.toLowerCase()]?.meaning || `「${w}」的释义（待补充）`,
    example: pool[w.toLowerCase()]?.example || `This is an example sentence with "${w}".`,
    memory: pool[w.toLowerCase()]?.memory || `联想记忆：「${w}」→ 关联你熟悉的图像或发音`,
  }));
}

export function EduVocab() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<VocabCard[]>([]);

  const handleGenerate = () => {
    if (!raw.trim()) return;
    setLoading(true);
    // 模拟异步（后续替换为 fetch('/api/.../vocab/cards')）
    setTimeout(() => {
      setCards(mockBuildCards(raw));
      setLoading(false);
    }, 600);
  };

  return (
    <>
      <PageBanner icon="📖" title="单词记忆 · 智能背诵" desc="输入单词或文本，一键生成带音标、释义、例句与记忆法的记忆卡片，助力高效背诵" />
      <Card title="单词输入">
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="每行一个单词，或用空格 / 逗号分隔。例如：&#10;apple&#10;happy&#10;book"
          style={{ width: '100%', minHeight: 120, padding: 12, border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !raw.trim()}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '生成中...' : '✨ 生成记忆卡片'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>支持最多 20 个单词</span>
        </div>
      </Card>

      {cards.length > 0 && (
        <Card title={`记忆卡片（${cards.length}）`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ border: '1px solid #f0efec', borderRadius: 12, padding: 16, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{c.word}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{c.phonetic}</span>
                  <span style={{ fontSize: 11, color: '#667eea', background: 'rgba(102,126,234,.1)', padding: '1px 6px', borderRadius: 4 }}>{c.pos}</span>
                </div>
                <div style={{ fontSize: 14, color: '#333', marginTop: 8 }}>{c.meaning}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>💡 {c.example}</div>
                <div style={{ fontSize: 12, color: '#764ba2', marginTop: 8 }}>🧠 {c.memory}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
