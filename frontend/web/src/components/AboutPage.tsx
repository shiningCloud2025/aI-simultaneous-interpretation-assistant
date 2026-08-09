export function AboutPage() {
  return (
    <div style={{ width: '100%' }}>
      {/* Logo + 品牌 */}
      <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700, boxShadow: '0 6px 24px rgba(102,126,234,.3)' }}>E</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>智慧英语课堂</div>
        <div style={{ fontSize: 14, color: '#999' }}>AI 驱动的英语听力学习平台</div>
      </div>

      {/* 解决问题 - 响应式网格 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16 }}>帮你解决</div>
        <div className="about-grid">
          {[
            { icon: '🎧', title: '听力训练缺乏真实场景', desc: '提供实时语音转译，模拟真实英语对话环境，随时随地练习听力' },
            { icon: '📝', title: '学习资料整理耗时', desc: '上传音频即可自动生成文字稿，支持翻译和纠错，高效复习' },
            { icon: '🤖', title: '缺少个性化 AI 辅导', desc: '可自选 AI 模型，自由配置 API Key，打造专属学习助手' },
          ].map((item, i) => (
            <div key={i} className="about-card-item">
              <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 版本信息 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#bbb' }}>版本 1.0.0</div>
        <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>© 2026 智慧英语课堂 · 保留所有权利</div>
      </div>

      {/* 自适应网格：>= 720px 两列，小屏单列 */}
      <style>{`
        .about-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .about-card-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 14px 0;
          border-bottom: 1px solid #f5f3f0;
        }
        .about-card-item:last-child { border-bottom: none; }
        @media (min-width: 720px) {
          .about-grid {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .about-card-item {
            border-bottom: none;
            padding: 14px;
            background: #fafaf9;
            border-radius: 10px;
          }
        }
        [data-theme="dark"] .about-card-item { border-color: #3a3a4e; }
        [data-theme="dark"] @media (min-width: 720px) {
          .about-card-item { background: #32324a; }
        }
      `}</style>
    </div>
  );
}