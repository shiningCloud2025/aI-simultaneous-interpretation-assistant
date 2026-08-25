import { useState } from 'react';
import { Card, PageBanner } from './ui';
import { apiCall } from '../lib/api';

interface VocabCard {
  word: string;
  sentence?: string;
  translation?: string;
  imageUrl?: string;
  error?: string;
}

export function EduVocab() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<VocabCard[]>([]);

  const handleGenerate = async () => {
    const words = raw.split(/[\n,，\s]+/).map(w => w.trim()).filter(Boolean).slice(0, 20);
    if (words.length === 0) return;
    setLoading(true);
    setCards([]);
    try {
      const results = await Promise.all(
        words.map(async (w) => {
          try {
            const data = await apiCall<{ sentence?: string; translation?: string; imageUrl?: string }>(
              '/reading/word/material/generate',
              { method: 'POST', body: JSON.stringify({ word: w, languageCode: 'english', stageCode: 'en_senior' }) }
            );
            return { word: w, ...data };
          } catch (e: any) {
            return { word: w, error: e?.message || '生成失败' };
          }
        })
      );
      setCards(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBanner icon="📖" title="单词记忆 · 智能背诵" desc="输入单词，一键生成带例句、译文与配图的记忆素材，助力高效背诵" />
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
            {loading ? '生成中...' : '✨ 生成记忆素材'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>支持最多 20 个单词</span>
        </div>
      </Card>

      {cards.length > 0 && (
        <Card title={`记忆素材（${cards.length}）`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ border: '1px solid #f0efec', borderRadius: 12, padding: 16, background: '#fff' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{c.word}</div>
                {c.error ? (
                  <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 8 }}>⚠ {c.error}</div>
                ) : (
                  <>
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt={c.word} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} />
                    )}
                    <div style={{ fontSize: 14, color: '#333', marginTop: 10, fontStyle: 'italic' }}>{c.sentence}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{c.translation}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
