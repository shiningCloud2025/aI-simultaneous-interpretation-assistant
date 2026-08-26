import { type CSSProperties, useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { apiCall } from '../lib/api';

interface PageResult {
  total?: number;
}

interface TermLibrary {
  entryCount?: number;
}

interface ApiKeyRecord {
  keyType?: string;
  status?: number;
}

interface DashboardStats {
  termLibraries: number;
  termEntries: number;
  apiKeys: number;
  asrKeys: number;
  llmKeys: number;
  keyAvailable: number;
  feedbacks: number;
  writingGenerations: number;
  writingEvaluations: number;
  wordMaterials: number;
}

const initialStats: DashboardStats = {
  termLibraries: 0,
  termEntries: 0,
  apiKeys: 0,
  asrKeys: 0,
  llmKeys: 0,
  keyAvailable: 0,
  feedbacks: 0,
  writingGenerations: 0,
  writingEvaluations: 0,
  wordMaterials: 0,
};

export function Dashboard() {
  const user = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);

  const go = (panel: string) => setActivePanel(panel);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      apiCall<TermLibrary[]>('/sys/user/term/library'),
      apiCall<ApiKeyRecord[]>('/sys/user/api-key'),
      apiCall<PageResult>('/sys/user/feedback/page', { method: 'POST', body: JSON.stringify({ page: 1, size: 1 }) }),
      apiCall<PageResult>('/writing/composition/generation/history/page', { method: 'POST', body: JSON.stringify({ page: 1, size: 1, filter: { success: true } }) }),
      apiCall<PageResult>('/writing/composition/evaluation/history/page', { method: 'POST', body: JSON.stringify({ page: 1, size: 1, filter: { success: true } }) }),
      apiCall<PageResult>('/reading/word/material/history/page', { method: 'POST', body: JSON.stringify({ page: 1, size: 1, filter: { success: true } }) }),
    ]).then(([termResult, keyResult, feedbackResult, writingGenerateResult, writingEvaluateResult, wordResult]) => {
      if (!mounted) return;

      const libraries = termResult.status === 'fulfilled' && Array.isArray(termResult.value) ? termResult.value : [];
      const keys = keyResult.status === 'fulfilled' && Array.isArray(keyResult.value) ? keyResult.value : [];

      setStats({
        termLibraries: libraries.length,
        termEntries: libraries.reduce((sum, lib) => sum + (lib.entryCount || 0), 0),
        apiKeys: keys.length,
        asrKeys: keys.filter(k => k.keyType === 'ASR').length,
        llmKeys: keys.filter(k => k.keyType === 'LLM').length,
        keyAvailable: keys.filter(k => k.status === 1).length,
        feedbacks: feedbackResult.status === 'fulfilled' ? feedbackResult.value.total || 0 : 0,
        writingGenerations: writingGenerateResult.status === 'fulfilled' ? writingGenerateResult.value.total || 0 : 0,
        writingEvaluations: writingEvaluateResult.status === 'fulfilled' ? writingEvaluateResult.value.total || 0 : 0,
        wordMaterials: wordResult.status === 'fulfilled' ? wordResult.value.total || 0 : 0,
      });
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [token]);

  const learningStats = [
    { label: '生成作文题目', value: stats.writingGenerations, sub: '写作训练题库', tone: '#0f6b68', icon: '✍️', panel: 'writing' },
    { label: '作文批阅报告', value: stats.writingEvaluations, sub: '评分与逐句反馈', tone: '#8f4b2e', icon: '📝', panel: 'writing-review' },
    { label: '单词学习素材', value: stats.wordMaterials, sub: '例句与图像材料', tone: '#1f5f8b', icon: '📖', panel: 'vocab' },
    { label: '术语库条目', value: stats.termEntries, sub: `${stats.termLibraries} 个术语库`, tone: '#a97900', icon: '📚', panel: 'term-library' },
  ];

  const features = [
    { id: 'translate', label: 'Listening', title: '实时转译', desc: '课堂音频实时识别、翻译与纠错辅助', icon: '🎧', accent: '#0f6b68' },
    { id: 'writing', label: 'Writing', title: '写作训练', desc: '生成作文题目，支持作文评分和逐句反馈', icon: '✍️', accent: '#8f4b2e' },
    { id: 'vocab', label: 'Reading', title: '单词记忆', desc: '按语言和学习阶段生成例句与图像素材', icon: '📖', accent: '#1f5f8b' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <section className="dashboard-hero">
        <div>
          <div className="dashboard-date">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="dashboard-title">欢迎回来，{user?.username || '同学'}</div>
          <div className="dashboard-subtitle">
            {user?.lastLoginTime ? `上次登录：${new Date(user.lastLoginTime).toLocaleString('zh-CN')}` : '听、写、读三条学习链路已就绪'}
          </div>
        </div>
        <div className="dashboard-hero-right">
          <div className="dashboard-chip">Listening</div>
          <div className="dashboard-chip">Writing</div>
          <div className="dashboard-chip">Reading</div>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        {learningStats.map(item => (
          <button key={item.label} onClick={() => go(item.panel)} className="dashboard-stat-card" style={{ '--tone': item.tone } as CSSProperties}>
            <div className="dashboard-stat-head">
              <span className="dashboard-stat-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <div className="dashboard-stat-value">{loading ? '...' : item.value}</div>
            <div className="dashboard-stat-sub">{item.sub}</div>
          </button>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-title">核心功能</div>
          <div className="dashboard-feature-grid">
            {features.map(feature => (
              <button key={feature.id} onClick={() => go(feature.id)} className="dashboard-feature" style={{ '--accent': feature.accent } as CSSProperties}>
                <div className="dashboard-feature-top">
                  <span className="dashboard-feature-icon">{feature.icon}</span>
                  <span className="dashboard-feature-label">{feature.label}</span>
                </div>
                <div className="dashboard-feature-title">{feature.title}</div>
                <div className="dashboard-feature-desc">{feature.desc}</div>
                <span className="dashboard-feature-arrow">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-title">配置与管理</div>
          <div className="dashboard-manage-list">
            {[
              { id: 'api-key', label: 'API Key 配置', hint: `${stats.keyAvailable}/${stats.apiKeys} 可用 · ASR ${stats.asrKeys} · LLM ${stats.llmKeys}` },
              { id: 'term-library', label: '术语库', hint: `${stats.termLibraries} 个库 · ${stats.termEntries} 条术语` },
              { id: 'writing-review', label: '作文批阅历史', hint: `${stats.writingEvaluations} 条报告` },
              { id: 'writing', label: '作文题目历史', hint: `${stats.writingGenerations} 条记录` },
              { id: 'vocab', label: '单词素材历史', hint: `${stats.wordMaterials} 条记录` },
              { id: 'help', label: '帮助反馈', hint: `${stats.feedbacks} 条记录` },
            ].map(item => (
              <button key={item.id} onClick={() => go(item.id)} className="dashboard-manage-item">
                <span>{item.label}</span>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .dashboard-hero {
          min-height: 150px;
          margin-bottom: 18px;
          padding: 28px 32px;
          border-radius: 18px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: #234b49;
          box-shadow: 0 12px 30px rgba(35,75,73,.16);
        }
        .dashboard-date {
          font-size: 13px;
          opacity: .78;
          margin-bottom: 10px;
        }
        .dashboard-title {
          font-size: 28px;
          line-height: 1.25;
          font-weight: 800;
        }
        .dashboard-subtitle {
          margin-top: 12px;
          font-size: 13px;
          opacity: .82;
        }
        .dashboard-hero-right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          max-width: 310px;
        }
        .dashboard-chip {
          padding: 8px 14px;
          border: 1px solid rgba(255,255,255,.26);
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }
        .dashboard-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .dashboard-stat-card {
          text-align: left;
          border: 1px solid #f0efec;
          border-radius: 14px;
          background: #fff;
          padding: 18px 20px;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(0,0,0,.03);
          transition: transform .16s, border-color .16s, box-shadow .16s;
        }
        .dashboard-stat-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--tone) 35%, #f0efec);
          box-shadow: 0 14px 28px rgba(0,0,0,.07);
        }
        .dashboard-stat-head {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #777;
          font-size: 13px;
          font-weight: 700;
        }
        .dashboard-stat-icon {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: color-mix(in srgb, var(--tone) 12%, #fff);
          font-size: 17px;
        }
        .dashboard-stat-value {
          margin-top: 16px;
          font-size: 34px;
          line-height: 1;
          color: #1f1f1f;
          font-weight: 800;
        }
        .dashboard-stat-sub {
          margin-top: 8px;
          font-size: 12px;
          color: #aaa;
        }
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, .8fr);
          gap: 14px;
        }
        .dashboard-panel {
          background: #fff;
          border: 1px solid #f0efec;
          border-radius: 14px;
          padding: 20px;
          min-height: 280px;
          box-shadow: 0 6px 18px rgba(0,0,0,.025);
        }
        .dashboard-panel-title {
          font-size: 15px;
          font-weight: 800;
          color: #333;
          margin-bottom: 16px;
        }
        .dashboard-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .dashboard-feature {
          position: relative;
          min-height: 210px;
          text-align: left;
          border: 1px solid #f0efec;
          border-radius: 12px;
          background: #fff;
          padding: 18px;
          cursor: pointer;
          overflow: hidden;
          transition: transform .16s, border-color .16s;
        }
        .dashboard-feature:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--accent) 34%, #f0efec);
        }
        .dashboard-feature::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--accent);
        }
        .dashboard-feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .dashboard-feature-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #f0efec;
          font-size: 21px;
        }
        .dashboard-feature-label {
          color: var(--accent);
          font-size: 12px;
          font-weight: 800;
        }
        .dashboard-feature-title {
          margin-top: 28px;
          font-size: 18px;
          color: #222;
          font-weight: 800;
        }
        .dashboard-feature-desc {
          margin-top: 10px;
          font-size: 13px;
          line-height: 1.7;
          color: #777;
        }
        .dashboard-feature-arrow {
          position: absolute;
          right: 18px;
          bottom: 16px;
          color: #bbb;
          font-size: 18px;
          transition: transform .16s, color .16s;
        }
        .dashboard-feature:hover .dashboard-feature-arrow {
          transform: translateX(3px);
          color: var(--accent);
        }
        .dashboard-manage-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dashboard-manage-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: none;
          border-radius: 10px;
          background: transparent;
          padding: 12px 10px;
          color: #234b49;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: background .15s;
        }
        .dashboard-manage-item:hover {
          background: #f2f6f5;
        }
        .dashboard-manage-item span:last-child {
          color: #aaa;
          font-size: 12px;
          white-space: nowrap;
        }
        [data-theme="dark"] .dashboard-stat-card,
        [data-theme="dark"] .dashboard-panel,
        [data-theme="dark"] .dashboard-feature {
          background: #2a2f2b;
          border-color: #394139;
          box-shadow: none;
        }
        [data-theme="dark"] .dashboard-feature {
          background: #2a2f2b;
        }
        [data-theme="dark"] .dashboard-stat-value,
        [data-theme="dark"] .dashboard-feature-title,
        [data-theme="dark"] .dashboard-panel-title {
          color: #f5f5f5;
        }
        [data-theme="dark"] .dashboard-feature-desc,
        [data-theme="dark"] .dashboard-stat-head {
          color: #c9c5bb;
        }
        [data-theme="dark"] .dashboard-feature-icon {
          background: #242824;
          border-color: #3d453e;
        }
        [data-theme="dark"] .dashboard-manage-item:hover {
          background: rgba(138,185,180,.14);
        }
        @media (max-width: 1100px) {
          .dashboard-stat-grid,
          .dashboard-feature-grid,
          .dashboard-main-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .dashboard-hero {
            align-items: flex-start;
            flex-direction: column;
          }
          .dashboard-stat-grid,
          .dashboard-feature-grid,
          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
