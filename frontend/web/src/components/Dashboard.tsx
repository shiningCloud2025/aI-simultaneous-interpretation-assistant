import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function Dashboard() {
  const user = useAppStore((s) => s.user);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const token = useAppStore((s) => s.token);

  const go = (panel: string) => setActivePanel(panel);

  // 统计数据
  const [stats, setStats] = useState({ termLibraries: 0, termEntries: 0, apiKeys: 0, asrKeys: 0, llmKeys: 0, keyAvailable: 0, feedbacks: 0 });

  const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (!token) return;
    // 并行拉取所有统计数据
    Promise.all([
      // 术语库统计
      fetch('/api/sys/user/term/library', { headers: h() }).then(r => r.json()).then(d => {
        if (d.code === 200 && Array.isArray(d.data)) {
          const libs = d.data as any[];
          const totalEntries = libs.reduce((sum: number, lib: any) => sum + (lib.entryCount || 0), 0);
          setStats(s => ({ ...s, termLibraries: libs.length, termEntries: totalEntries }));
        }
      }).catch(() => {}),
      // API Key 统计
      fetch('/api/sys/user/api-key', { headers: h() }).then(r => r.json()).then(d => {
        if (d.code === 200 && Array.isArray(d.data)) {
          const keys = d.data as any[];
          setStats(s => ({
            ...s,
            apiKeys: keys.length,
            asrKeys: keys.filter(k => k.keyType === 'ASR').length,
            llmKeys: keys.filter(k => k.keyType === 'LLM').length,
            keyAvailable: keys.filter(k => k.status === 1).length,
          }));
        }
      }).catch(() => {}),
      // 反馈统计
      fetch('/api/sys/user/feedback/page', { method: 'POST', headers: h(), body: JSON.stringify({ page: 1, size: 1 }) }).then(r => r.json()).then(d => {
        if (d.code === 200 && d.data) {
          setStats(s => ({ ...s, feedbacks: d.data.total || 0 }));
        }
      }).catch(() => {}),
    ]);
  }, [token]);

  return (
    <div style={{ width: '100%' }}>
      {/* 欢迎横幅 */}
      <div style={{ marginBottom: 24, padding: '28px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, color: '#fff' }}>
        <div style={{ fontSize: 12, opacity: .75, marginBottom: 4 }}>
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          欢迎回来，{user?.username || '同学'}
        </div>
        <div style={{ fontSize: 13, opacity: .8, marginTop: 6 }}>
          {user?.lastLoginTime ? `上次登录：${new Date(user.lastLoginTime).toLocaleString('zh-CN')}` : '智慧英语课堂 — AI 驱动的英语听力学习平台'}
        </div>
      </div>

      {/* 数据卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '术语库', value: stats.termLibraries, sub: `${stats.termEntries} 个条目`, icon: '📚' },
          { label: 'API Key', value: stats.apiKeys, sub: `ASR ${stats.asrKeys} · LLM ${stats.llmKeys}`, icon: '🔑' },
          { label: '可用 Key', value: stats.keyAvailable, sub: `共 ${stats.apiKeys} 个`, icon: '✅' },
          { label: '反馈记录', value: stats.feedbacks, sub: '我的反馈', icon: '💬' },
        ].map(s => (
          <div key={s.label} className="card" style={{ marginBottom: 0, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 功能入口 + 设置 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {/* 核心功能入口 */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 14 }}>核心功能</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'translate', icon: '🎤', label: '实时转译', desc: '开始录音，AI 实时语音识别与翻译' },
              { id: 'static-trans', icon: '📁', label: '静态转译', desc: '上传音频文件，生成翻译文稿' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => go(item.id)}
                className="dash-fn-card"
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.desc}</div>
                </div>
                <span className="dash-arrow">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* 设置与快捷入口 */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 14 }}>设置与管理</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'api-key', label: 'API Key 配置', hint: stats.apiKeys > 0 ? `已配置 ${stats.apiKeys} 个` : '未配置' },
              { id: 'term-library', label: '术语库', hint: stats.termLibraries > 0 ? `${stats.termLibraries} 个库 · ${stats.termEntries} 条术语` : '未创建' },
              { id: 'shortcuts', label: '快捷键设置', hint: '' },
              { id: 'audio', label: '音频设备', hint: '' },
              { id: 'account', label: '个人中心', hint: '' },
              { id: 'help', label: '帮助反馈', hint: stats.feedbacks > 0 ? `${stats.feedbacks} 条记录` : '' },
            ].map(s => (
              <div
                key={s.id}
                onClick={() => go(s.id)}
                className="dash-link"
              >
                <span>{s.label}</span>
                {s.hint && <span className="dash-link-hint">{s.hint}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .dash-fn-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all .15s;
          border: 1px solid transparent;
        }
        .dash-fn-card:hover {
          background: #fafaf9;
          border-color: #f0efec;
        }
        .dash-arrow {
          font-size: 14px;
          color: #ccc;
          transition: all .15s;
        }
        .dash-fn-card:hover .dash-arrow {
          color: #888;
          transform: translateX(2px);
        }
        .dash-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #667eea;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 6px;
          transition: all .15s;
        }
        .dash-link:hover {
          background: rgba(102,126,234,.06);
        }
        .dash-link-hint {
          font-size: 11px;
          color: #bbb;
        }
        [data-theme="dark"] .dash-fn-card:hover { background: #32324a; border-color: #3a3a4e; }
        [data-theme="dark"] .dash-link { color: #8b9aff; }
        [data-theme="dark"] .dash-link:hover { background: rgba(139,154,255,.1); }
        [data-theme="dark"] .dash-arrow { color: #666; }
        [data-theme="dark"] .dash-fn-card:hover .dash-arrow { color: #aaa; }
      `}</style>
    </div>
  );
}