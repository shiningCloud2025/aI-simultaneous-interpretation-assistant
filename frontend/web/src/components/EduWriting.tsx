import { useState } from 'react';
import { Card, PageBanner, Select } from './ui';
import { apiCall } from '../lib/api';

// 与后端枚举保持一致（code 值）
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

export function EduWriting() {
  const [stage, setStage] = useState(STAGES[0].code);
  const [genre, setGenre] = useState(GENRES[0].code);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].code);
  const [scene, setScene] = useState(SCENES[0].code);
  const [customScene, setCustomScene] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Topic>('/writing/composition/generate', {
        method: 'POST',
        body: JSON.stringify({
          languageCode: 'english',
          stageCode: stage,
          genreCode: genre,
          difficultyCode: difficulty,
          sceneCode: scene,
          customScene: scene === 'custom' ? customScene : undefined,
        }),
      });
      setTopic(data);
    } catch (e: any) {
      alert(e?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBanner icon="✍️" title="写作题目生成" desc="选择学段、题型与场景，一键生成贴合考纲的写作题目、要点与高级表达提示" />
      <Card title="题目设置">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="学段">
            <Select options={STAGES.map(s => s.desc)} value={STAGES.find(s => s.code === stage)!.desc} onChange={d => setStage(STAGES.find(s => s.desc === d)!.code)} />
          </Field>
          <Field label="题型">
            <Select options={GENRES.map(s => s.desc)} value={GENRES.find(s => s.code === genre)!.desc} onChange={d => setGenre(GENRES.find(s => s.desc === d)!.code)} />
          </Field>
          <Field label="难度">
            <Select options={DIFFICULTIES.map(s => s.desc)} value={DIFFICULTIES.find(s => s.code === difficulty)!.desc} onChange={d => setDifficulty(DIFFICULTIES.find(s => s.desc === d)!.code)} />
          </Field>
          <Field label="场景">
            <Select options={SCENES.map(s => s.desc)} value={SCENES.find(s => s.code === scene)!.desc} onChange={d => setScene(SCENES.find(s => s.desc === d)!.code)} />
          </Field>
          {scene === 'custom' && (
            <Field label="自定义场景">
              <input value={customScene} onChange={e => setCustomScene(e.target.value)} placeholder="如：人工智能与人类未来" style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={handleGenerate} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
              {loading ? '生成中...' : '✨ 生成题目'}
            </button>
          </div>
        </div>
      </Card>

      {topic && (
        <Card title="生成结果">
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
        </Card>
      )}
    </>
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
