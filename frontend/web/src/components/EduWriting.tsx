import { useState } from 'react';
import { Card, PageBanner, Select } from './ui';

interface Topic {
  title: string;
  requirement: string;
  points: string[];
  words: string[];
}

const GRADES = ['小学', '初中', '高中', '四六级', '雅思托福'];
const TYPES = ['议论文', '记叙文', '看图作文', '应用文', '开放性话题'];

// 本地 mock：根据年级/题型/主题生成写作题目。后续可替换为后端 Controller 返回。
function mockBuildTopic(grade: string, type: string, theme: string): Topic {
  const t = theme.trim() || '校园生活';
  return {
    title: `${grade}英语${type}：${t}`,
    requirement: `请根据以下要求，写一篇关于「${t}」的${type}，词数 ${grade === '小学' ? '60' : grade === '初中' ? '80' : '120'} 词左右。要求结构完整、语句通顺、逻辑清晰。`,
    points: [
      `开篇点题，说明你对「${t}」的看法`,
      '中间段落展开 2-3 个具体理由或事例',
      '结尾总结并升华主题',
    ],
    words: ['firstly', 'moreover', 'as a result', 'in my opinion', 'in conclusion'],
  };
}

export function EduWriting() {
  const [grade, setGrade] = useState(GRADES[2]);
  const [type, setType] = useState(TYPES[0]);
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);

  const handleGenerate = () => {
    setLoading(true);
    // 模拟异步（后续替换为 fetch('/api/.../writing/topic')）
    setTimeout(() => {
      setTopic(mockBuildTopic(grade, type, theme));
      setLoading(false);
    }, 600);
  };

  return (
    <>
      <PageBanner icon="✍️" title="写作题目生成" desc="选择学段与题型，输入主题关键词，一键生成贴合考纲的写作题目与写作要点" />
      <Card title="题目设置">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>学段</div>
            <Select options={GRADES} value={grade} onChange={setGrade} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>题型</div>
            <Select options={TYPES} value={type} onChange={setType} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>主题关键词（可选）</div>
            <input
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="如：环保、我的老师、科技发展..."
              style={{ width: '100%', padding: '6px 12px', border: '1px solid #e8e6e1', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#2c2c2c', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '生成中...' : '✨ 生成题目'}
          </button>
        </div>
      </Card>

      {topic && (
        <Card title="生成结果">
          <div style={{ border: '1px solid #f0efec', borderRadius: 12, padding: 20, background: '#fff' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{topic.title}</div>
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8 }}>{topic.requirement}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>写作要点</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 13, lineHeight: 2 }}>
              {topic.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 16, marginBottom: 8 }}>推荐高级表达</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topic.words.map((w, i) => (
                <span key={i} style={{ fontSize: 12, color: '#667eea', background: 'rgba(102,126,234,.1)', padding: '4px 10px', borderRadius: 6 }}>{w}</span>
              ))}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
