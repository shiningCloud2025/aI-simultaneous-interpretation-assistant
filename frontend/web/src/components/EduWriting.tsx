import { useEffect, useState } from 'react';
import { Card, PageBanner, Select } from './ui';
import { apiCall } from '../lib/api';

// 与后端枚举保持一致（code 值）
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
const DIFFICULTIES = [
  { code: 'easy', desc: '简单' },
  { code: 'medium', desc: '中等' },
  { code: 'hard', desc: '困难' },
];
const SCENES = [
  { code: 'campus', desc: '校园生活' },
  { code: 'technology', desc: '科技发展' },
  { code: 'environment', desc: '环境保护' },
  { code: 'culture', desc: '文化交流' },
  { code: 'career', desc: '职业规划' },
  { code: 'travel', desc: '旅行见闻' },
  { code: 'social', desc: '社会热点' },
  { code: 'custom', desc: '自定义' },
];

interface Topic {
  title: string;
  prompt: string;
  requirement: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  keyPoints: string[];
  vocabularyHints: string[];
  structureHints: string[];
  scoringCriteria: string[];
}

interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

interface GenerationRecord extends Topic {
  id: number;
  success: boolean;
  languageCode: string;
  stageCode: string;
  genreCode: string;
  difficultyCode: string;
  sceneCode: string;
  customScene?: string;
  provider?: string;
  modelName?: string;
  failureStage?: string;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}

export function EduWriting() {
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [stage, setStage] = useState(STAGES[0].code);
  const [genre, setGenre] = useState(GENRES[0].code);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].code);
  const [scene, setScene] = useState(SCENES[0].code);
  const [customScene, setCustomScene] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [historySuccess, setHistorySuccess] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(0);
  const [detail, setDetail] = useState<GenerationRecord | null>(null);

  const currentStages = STAGES.filter(s => s.language === language);
  const currentGenres = GENRES.filter(g => g.stage === stage);

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const firstStage = STAGES.find(s => s.language === nextLanguage);
    if (firstStage) {
      setStage(firstStage.code);
      setGenre(GENRES.find(g => g.stage === firstStage.code)?.code || '');
      if (!difficulty) setDifficulty(DIFFICULTIES[1].code);
      if (!scene) setScene(SCENES[0].code);
    } else {
      setStage('');
      setGenre('');
      setDifficulty('');
      setScene('');
    }
  };

  const changeStage = (nextStage: string) => {
    setStage(nextStage);
    setGenre(GENRES.find(g => g.stage === nextStage)?.code || '');
  };

  useEffect(() => {
    const firstStage = STAGES.find(s => s.language === language);
    if (firstStage && !currentStages.some(s => s.code === stage)) {
      setStage(firstStage.code);
      setGenre(GENRES.find(g => g.stage === firstStage.code)?.code || '');
    }
    if (!firstStage && stage) {
      setStage('');
      setGenre('');
    }
  }, [language]);

  useEffect(() => {
    const firstGenre = GENRES.find(g => g.stage === stage);
    if (firstGenre && !currentGenres.some(g => g.code === genre)) {
      setGenre(firstGenre.code);
    }
  }, [stage]);

  useEffect(() => {
    loadHistory(1, historySuccess);
  }, [historySuccess]);

  const loadHistory = async (page = historyPage, success = historySuccess) => {
    setHistoryLoading(true);
    try {
      const data = await apiCall<PageResult<GenerationRecord>>('/writing/composition/generation/history/page', {
        method: 'POST',
        body: JSON.stringify({
          page,
          size: 5,
          filter: { success },
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
    if (!stage || !genre || !difficulty || !scene || currentStages.length === 0 || currentGenres.length === 0) {
      alert('请选择完整的作文生成条件');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall<Topic>('/writing/composition/generate', {
        method: 'POST',
        body: JSON.stringify({
          languageCode: language,
          stageCode: stage,
          genreCode: genre,
          difficultyCode: difficulty,
          sceneCode: scene,
          customScene: scene === 'custom' ? customScene : undefined,
        }),
      });
      setTopic(data);
      loadHistory(1, true);
    } catch (e: any) {
      alert(e?.message || '生成失败');
      loadHistory(1, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBanner icon="✍️" title="写作题目生成" desc="选择学段、题型与场景，一键生成贴合考纲的写作题目、要点与高级表达提示" />
      <Card title="题目设置">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
          <Field label="语言">
            <Select options={LANGUAGES.map(s => s.desc)} value={LANGUAGES.find(s => s.code === language)!.desc} onChange={d => changeLanguage(LANGUAGES.find(s => s.desc === d)!.code)} />
          </Field>
          <Field label="学段">
            <Select options={currentStages.map(s => s.desc)} value={STAGES.find(s => s.code === stage)?.desc || ''} onChange={d => changeStage(STAGES.find(s => s.desc === d)?.code || '')} />
          </Field>
          <Field label="题型">
            <Select options={currentGenres.map(s => s.desc)} value={GENRES.find(s => s.code === genre)?.desc || ''} onChange={d => setGenre(GENRES.find(s => s.desc === d)?.code || '')} />
          </Field>
          <Field label="难度">
            <Select options={DIFFICULTIES.map(s => s.desc)} value={DIFFICULTIES.find(s => s.code === difficulty)?.desc || ''} onChange={d => setDifficulty(DIFFICULTIES.find(s => s.desc === d)?.code || '')} />
          </Field>
          <Field label="场景">
            <Select options={SCENES.map(s => s.desc)} value={SCENES.find(s => s.code === scene)?.desc || ''} onChange={d => setScene(SCENES.find(s => s.desc === d)?.code || '')} />
          </Field>
          {scene === 'custom' && (
            <Field label="自定义场景">
              <input value={customScene} onChange={e => setCustomScene(e.target.value)} placeholder="如：人工智能与人类未来" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignSelf: 'end' }}>
            <button onClick={handleGenerate} disabled={loading || !stage || !genre || !difficulty || !scene || currentStages.length === 0 || currentGenres.length === 0} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading || !stage || !genre || !difficulty || !scene || currentStages.length === 0 || currentGenres.length === 0 ? 0.6 : 1 }}>
              {loading ? '生成中...' : '✨ 生成题目'}
            </button>
          </div>
        </div>
        {(currentStages.length === 0 || currentGenres.length === 0) && (
          <div style={{ fontSize: 12, color: '#c77', marginTop: 10 }}>当前语言暂未配置写作学习阶段或题型，后续补充后即可使用。</div>
        )}
      </Card>

      {topic && (
        <Card title="生成结果">
          <TopicDetail topic={topic} />
        </Card>
      )}

      <Card title="生成历史">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setHistorySuccess(true)} style={tabBtn(historySuccess)}>成功记录</button>
            <button onClick={() => setHistorySuccess(false)} style={tabBtn(!historySuccess)}>失败记录</button>
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{item.success ? (item.title || '未命名作文题') : '生成失败'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {labelOf(LANGUAGES, item.languageCode)} · {labelOf(STAGES, item.stageCode)} · {labelOf(GENRES, item.genreCode)} · {labelOf(DIFFICULTIES, item.difficultyCode)} · {labelOf(SCENES, item.sceneCode)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{item.createTime ? new Date(item.createTime).toLocaleString() : ''}</div>
                </div>
                {item.success ? (
                  <>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.prompt}</div>
                    <button onClick={() => setDetail(item)} style={{ ...ghostBtn, marginTop: 10 }}>查看题目</button>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>作文题目详情</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  {labelOf(LANGUAGES, detail.languageCode)} · {labelOf(STAGES, detail.stageCode)} · {labelOf(GENRES, detail.genreCode)} · {labelOf(DIFFICULTIES, detail.difficultyCode)} · {labelOf(SCENES, detail.sceneCode)}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={closeBtn}>×</button>
            </div>
            <TopicDetail topic={detail} />
          </div>
        </div>
      )}
    </>
  );
}

function labelOf(options: { code: string; desc: string }[], code?: string) {
  return options.find(o => o.code === code)?.desc || code || '—';
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
  width: 'min(760px, 100%)',
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

function TopicDetail({ topic }: { topic: Topic }) {
  return (
    <div style={{ border: '1px solid #f0efec', borderRadius: 12, padding: 20, background: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{topic.title}</div>
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{topic.prompt}</div>
      {topic.requirement && <div style={{ fontSize: 14, color: '#555', marginTop: 10, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{topic.requirement}</div>}
      {(topic.wordLimitMin || topic.wordLimitMax) && (
        <div style={{ fontSize: 13, color: '#764ba2', marginTop: 10 }}>📏 字数建议：{topic.wordLimitMin ?? '—'} ~ {topic.wordLimitMax ?? '—'} 词</div>
      )}

      <Section title="写作要点" items={topic.keyPoints} />
      <Section title="结构提示" items={topic.structureHints} />
      <Section title="评分标准" items={topic.scoringCriteria} />

      {topic.vocabularyHints?.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>推荐高级表达</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topic.vocabularyHints.map((w, i) => (
              <span key={i} style={{ fontSize: 12, color: '#667eea', background: 'rgba(102,126,234,.1)', padding: '4px 10px', borderRadius: 6 }}>{w}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: 2 }}>
        {items.map((p, i) => <li key={i} style={{ whiteSpace: 'pre-wrap' }}>{p}</li>)}
      </ul>
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
