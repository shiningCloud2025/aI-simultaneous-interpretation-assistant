import { useEffect, useState } from 'react';
import { Card, PageBanner } from './ui';
import { apiCall } from '../lib/api';
import { LlmModelPreference } from './LlmModelPreference';

const LANGUAGES = [
  { code: 'english', desc: '英语' },
  { code: 'japanese', desc: '日语' },
  { code: 'korean', desc: '韩语' },
];

const STAGES = [
  { code: 'en_primary', desc: '小学英语', language: 'english' },
  { code: 'en_junior', desc: '初中英语', language: 'english' },
  { code: 'en_senior', desc: '高中英语', language: 'english' },
  { code: 'en_postgraduate', desc: '考研英语', language: 'english' },
  { code: 'en_ielts', desc: '雅思', language: 'english' },
  { code: 'en_toefl', desc: '托福', language: 'english' },
];

interface VocabCard {
  word: string;
  sentence?: string;
  translation?: string;
  imagePrompt?: string;
  imageUrl?: string;
  error?: string;
}

interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

interface MaterialRecord extends VocabCard {
  id: number;
  success: boolean;
  languageCode: string;
  stageCode: string;
  provider?: string;
  modelName?: string;
  imageProvider?: string;
  imageModelName?: string;
  failureStage?: string;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}

export function EduVocab() {
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [stage, setStage] = useState(STAGES[2].code);
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<VocabCard | null>(null);
  const [error, setError] = useState('');
  const [historySuccess, setHistorySuccess] = useState(true);
  const [historyUseCurrentFilter, setHistoryUseCurrentFilter] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<MaterialRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(0);
  const [detail, setDetail] = useState<MaterialRecord | null>(null);

  const currentStages = STAGES.filter(s => s.language === language);

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const firstStage = STAGES.find(s => s.language === nextLanguage);
    setStage(firstStage?.code || '');
    setError('');
  };

  useEffect(() => {
    loadHistory(1, historySuccess);
  }, [historySuccess, historyUseCurrentFilter, word, language, stage]);

  const loadHistory = async (page = historyPage, success = historySuccess) => {
    setHistoryLoading(true);
    try {
      const filter: Record<string, unknown> = { success };
      if (historyUseCurrentFilter) {
        filter.word = word.trim() || undefined;
        filter.languageCode = language || undefined;
        filter.stageCode = stage || undefined;
      }
      const data = await apiCall<PageResult<MaterialRecord>>('/reading/word/material/history/page', {
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

  const handleGenerate = async () => {
    const normalizedWord = word.trim();
    const parts = normalizedWord.split(/[\n,，\s]+/).filter(Boolean);
    if (!normalizedWord) return;
    if (!stage) {
      setError('当前语言暂未配置学习阶段，后续补充后即可使用。');
      return;
    }
    if (parts.length > 1) {
      setError('一次只能输入一个单词。');
      return;
    }

    setLoading(true);
    setError('');
    setCard(null);
    try {
      const data = await apiCall<{ sentence?: string; translation?: string; imageUrl?: string }>(
        '/reading/word/material/generate',
        { method: 'POST', body: JSON.stringify({ word: normalizedWord, languageCode: language, stageCode: stage }) }
      );
      setCard({ word: normalizedWord, ...data });
      loadHistory(1, true);
    } catch (e: any) {
      setCard({ word: normalizedWord, error: e?.message || '生成失败' });
      loadHistory(1, false);
    } finally {
      setLoading(false);
    }
  };

  const useHistoryMaterial = (record: MaterialRecord) => {
    if (!record.success) return;
    setCard({
      word: record.word,
      sentence: record.sentence,
      translation: record.translation,
      imagePrompt: record.imagePrompt,
      imageUrl: record.imageUrl,
    });
    setDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageBanner icon="📖" title="单词记忆 · 智能背诵" desc="输入单词，一键生成带例句、译文与配图的记忆素材，助力高效背诵" />
      <Card title="单词输入">
        <LlmModelPreference label="生成模型" />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <Field label="语言">
            <PlainSelect options={LANGUAGES} value={language} onChange={changeLanguage} />
          </Field>
          <Field label="学习阶段">
            <PlainSelect options={currentStages} value={stage} onChange={setStage} />
          </Field>
        </div>
        <input
          value={word}
          onChange={e => {
            setWord(e.target.value);
            setError('');
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleGenerate();
          }}
          placeholder="请输入一个单词，例如：apple"
          style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !word.trim() || !stage}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '生成中...' : '✨ 生成记忆素材'}
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>一次只能生成一个单词</span>
        </div>
        {error && <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 10 }}>{error}</div>}
      </Card>

      {card && (
        <Card title="记忆素材">
          <MaterialCard card={card} />
        </Card>
      )}

      <Card title="生成历史">
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
          <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 24 }}>{historyLoading ? '加载中...' : '暂无生成历史'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{item.success ? item.word : '生成失败'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {labelOf(LANGUAGES, item.languageCode)} · {labelOf(STAGES, item.stageCode)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{item.createTime ? new Date(item.createTime).toLocaleString() : ''}</div>
                </div>
                {item.success ? (
                  <>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.sentence}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetail(item)} style={ghostBtn}>查看素材</button>
                      <button onClick={() => useHistoryMaterial(item)} style={ghostBtn}>载入素材</button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#c62828', lineHeight: 1.6, marginTop: 8 }}>{item.errorMessage || item.failureStage || '生成失败'}</div>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{detail.success ? '单词素材详情' : '单词生成失败详情'}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  {labelOf(LANGUAGES, detail.languageCode)} · {labelOf(STAGES, detail.stageCode)}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={closeBtn}>×</button>
            </div>

            {detail.success ? (
              <>
                <MaterialCard card={detail} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => useHistoryMaterial(detail)} style={primaryBtn}>载入到记忆素材</button>
                </div>
              </>
            ) : (
              <>
                <Block title="单词" text={detail.word} />
                <Block title="失败原因" text={detail.errorMessage || detail.failureStage || '生成失败'} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function MaterialCard({ card }: { card: VocabCard }) {
  return (
    <div style={{ border: '1px solid #f0efec', borderRadius: 12, padding: 16, background: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{card.word}</div>
      {card.error ? (
        <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 8 }}>⚠ {card.error}</div>
      ) : (
        <>
          {card.imageUrl && (
            <img src={card.imageUrl} alt={card.word} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} />
          )}
          <div style={{ fontSize: 14, color: '#333', marginTop: 10, fontStyle: 'italic' }}>{card.sentence}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{card.translation}</div>
          {card.imagePrompt && <div style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>图片提示词：{card.imagePrompt}</div>}
        </>
      )}
    </div>
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

function labelOf(options: { code: string; desc: string }[], code?: string) {
  return options.find(o => o.code === code)?.desc || code || '—';
}

function PlainSelect({ options, value, onChange }: { options: { code: string; desc: string }[]; value: string; onChange: (c: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 150, background: '#fff' }}>
      <option value="">请选择</option>
      {options.map(o => <option key={o.code} value={o.code}>{o.desc}</option>)}
    </select>
  );
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
  width: 'min(720px, 100%)',
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
