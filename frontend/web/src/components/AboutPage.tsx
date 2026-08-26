export function AboutPage() {
  return (
    <div style={{ width: '100%' }}>
      {/* Logo + 品牌 */}
      <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: '#234b49', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 800, boxShadow: '0 6px 24px rgba(35,75,73,.18)' }}>语</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2d2b', marginBottom: 6 }}>智语同航</div>
        <div style={{ fontSize: 14, color: '#8b918e' }}>多智能体外语课堂</div>
      </div>

      {/* 帮你解决 - 3 列特性卡片 */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 14, paddingLeft: 4 }}>帮你解决</div>
      <div className="about-grid">
        {[
          {
            icon: '🎧', title: '真实场景',
            desc: '课堂音频实时转译，帮助学生跟上听力材料',
          },
          {
            icon: '📝', title: '高效复习',
            desc: '作文出题、批阅与逐句反馈形成训练闭环',
          },
          {
            icon: '📖', title: '阅读积累',
            desc: '围绕单词生成例句与图像素材，沉淀学习资源',
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
        版本 1.0.0 · © 2026 智语同航 · 保留所有权利
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
          background: #f4efe4;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        /* 暗色主题 */
        [data-theme="dark"] .about-card {
          background: #2a2f2b !important;
          border-color: #394139 !important;
        }
        [data-theme="dark"] .about-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,.4);
        }
        [data-theme="dark"] .about-icon {
          background: rgba(180,145,84,.16);
        }
      `}</style>
    </div>
  );
}
