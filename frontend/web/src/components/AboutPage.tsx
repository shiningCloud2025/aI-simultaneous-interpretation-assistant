export function AboutPage() {
  return (
    <div style={{ width: '100%' }}>
      {/* Logo + 品牌 */}
      <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700, boxShadow: '0 6px 24px rgba(102,126,234,.3)' }}>E</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>智慧英语课堂</div>
        <div style={{ fontSize: 14, color: '#999' }}>AI 驱动的英语听力学习平台</div>
      </div>

      {/* 帮你解决 - 3 列特性卡片 */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 14, paddingLeft: 4 }}>帮你解决</div>
      <div className="about-grid">
        {[
          {
            icon: '🎧', title: '真实场景',
            desc: '实时语音转译，模拟真实英语对话',
          },
          {
            icon: '📝', title: '高效复习',
            desc: '音频自动生成文字稿，支持翻译与纠错',
          },
          {
            icon: '🤖', title: 'AI 辅导',
            desc: '自选模型 + 自由配置 API Key，定制专属助手',
          },
        ].map((item, i) => (
          <div key={i} className="about-card">
            <div className="about-icon">{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 版本信息 */}
      <div style={{ marginTop: 32, padding: '20px', textAlign: 'center', fontSize: 12, color: '#ccc' }}>
        版本 1.0.0 · © 2026 智慧英语课堂 · 保留所有权利
      </div>

      <style>{`
        .about-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .about-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fff;
          border: 1px solid #f0efec;
          border-radius: 14px;
          padding: 20px 24px;
          transition: all .2s ease;
        }
        .about-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,.06);
        }
        .about-icon {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(102,126,234,.12), rgba(118,75,162,.12));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        /* 暗色主题 */
        [data-theme="dark"] .about-card {
          background: #2a2a3e !important;
          border-color: #3a3a4e !important;
        }
        [data-theme="dark"] .about-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,.4);
        }
        [data-theme="dark"] .about-icon {
          background: linear-gradient(135deg, rgba(139,154,255,.18), rgba(118,75,162,.18));
        }
      `}</style>
    </div>
  );
}