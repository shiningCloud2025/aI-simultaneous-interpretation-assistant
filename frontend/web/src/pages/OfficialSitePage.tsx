import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';

export function OfficialSitePage() {
  const token = useAppStore((s) => s.token);
  const nav = useNavigate();

  return (
    <div className="official-page">
      <header className="official-header">
        <button className="official-brand" onClick={() => nav('/')}>
          <span className="official-brand-mark">语</span>
          <span>智语同航</span>
        </button>
        <nav className="official-nav">
          <a href="#features">核心场景</a>
          <a href="#workflow">课堂流程</a>
          {token ? <button onClick={() => nav('/dashboard')} className="official-primary">进入平台</button> : <Link to="/login" className="official-primary">登录</Link>}
        </nav>
      </header>

      <main>
        <section className="official-hero">
          <div className="official-hero-copy">
            <div className="official-kicker">Multi-Harness Agent Language Classroom</div>
            <h1>智语同航</h1>
            <p>
              基于多 Harness 智能体协作与编排的智慧外语课堂，围绕听、写、读三类核心学习任务，提供实时转译、作文训练与词汇语境化学习支持。
            </p>
            <div className="official-actions">
              <Link to={token ? '/dashboard' : '/login'} className="official-action-main">{token ? '进入平台' : '登录平台'}</Link>
              <Link to="/register" className="official-action-sub">注册账号</Link>
            </div>
          </div>

          <div className="official-visual" aria-hidden="true">
            <div className="official-board">
              <span>Listening</span>
              <span>Writing</span>
              <span>Reading</span>
            </div>
            <div className="official-desk-row">
              <div className="official-book" />
              <div className="official-note" />
              <div className="official-card-stack">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="official-section">
          <div className="official-section-title">核心场景</div>
          <div className="official-feature-grid">
            {[
              { title: '课堂听力辅助', text: '将课堂音频实时转写、翻译并进行纠错辅助，降低听力基础薄弱学生的课堂负担。' },
              { title: '写作训练闭环', text: '支持作文出题、文本批阅、图片批阅、逐句反馈和修改建议，帮助学生复盘表达问题。' },
              { title: '阅读词汇积累', text: '根据语言和学习阶段生成固定例句与图像素材，让单词学习从释义走向语境理解。' },
            ].map(item => (
              <div key={item.title} className="official-feature">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="official-section official-workflow">
          <div className="official-section-title">课堂流程</div>
          <div className="official-flow">
            {['音频进入课堂', '生成学习材料', '完成训练反馈', '沉淀学习记录'].map((item, index) => (
              <div key={item} className="official-flow-item">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .official-page {
          min-height: 100vh;
          background: #f7f5f0;
          color: #202020;
        }
        .official-header {
          height: 72px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .official-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          font-size: 17px;
          font-weight: 800;
          color: #1f2a2a;
          cursor: pointer;
        }
        .official-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #234b49;
          color: #fff;
          font-weight: 800;
        }
        .official-nav {
          display: flex;
          align-items: center;
          gap: 22px;
          font-size: 14px;
        }
        .official-nav a {
          color: #555;
          text-decoration: none;
        }
        .official-primary,
        .official-action-main,
        .official-action-sub {
          border-radius: 999px;
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-weight: 700;
        }
        .official-primary {
          padding: 10px 18px;
          background: #223f3d;
          color: #fff !important;
        }
        .official-hero {
          max-width: 1180px;
          min-height: calc(100vh - 160px);
          margin: 0 auto;
          padding: 66px 28px 56px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 460px);
          align-items: center;
          gap: 58px;
        }
        .official-kicker {
          color: #8a6b35;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .official-hero h1 {
          font-size: 56px;
          line-height: 1.12;
          letter-spacing: 0;
          margin: 0;
          color: #172726;
        }
        .official-hero p {
          max-width: 620px;
          margin: 22px 0 0;
          font-size: 18px;
          line-height: 1.8;
          color: #5e6662;
        }
        .official-actions {
          display: flex;
          gap: 14px;
          margin-top: 34px;
        }
        .official-action-main,
        .official-action-sub {
          padding: 13px 24px;
          font-size: 14px;
        }
        .official-action-main {
          background: #223f3d;
          color: #fff;
        }
        .official-action-sub {
          background: #fff;
          color: #223f3d;
          border: 1px solid #ded8cc;
        }
        .official-visual {
          position: relative;
          height: 420px;
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.58)),
            repeating-linear-gradient(0deg, transparent, transparent 21px, rgba(36,75,73,.07) 22px);
          border: 1px solid #e6dfd2;
          box-shadow: 0 18px 40px rgba(45,54,49,.12);
          overflow: hidden;
        }
        .official-board {
          position: absolute;
          left: 44px;
          right: 44px;
          top: 54px;
          height: 158px;
          border-radius: 12px;
          background: #244b49;
          border: 10px solid #caa66a;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.16);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          color: rgba(255,255,255,.9);
          font-family: Georgia, serif;
          font-size: 18px;
        }
        .official-desk-row {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 170px;
          background: linear-gradient(180deg, #d9bd8b, #b88a54);
          border-top: 1px solid rgba(90,58,31,.22);
        }
        .official-book,
        .official-note,
        .official-card-stack {
          position: absolute;
          bottom: 54px;
          border-radius: 10px;
          background: #fffaf0;
          border: 1px solid rgba(84,66,42,.16);
          box-shadow: 0 10px 22px rgba(66,49,30,.14);
        }
        .official-book {
          left: 58px;
          width: 124px;
          height: 72px;
          transform: rotate(-5deg);
        }
        .official-note {
          left: 198px;
          width: 92px;
          height: 116px;
          transform: rotate(4deg);
        }
        .official-card-stack {
          right: 66px;
          width: 118px;
          height: 90px;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .official-card-stack span {
          position: absolute;
          width: 92px;
          height: 48px;
          border-radius: 8px;
          background: #fffaf0;
          border: 1px solid rgba(84,66,42,.16);
          box-shadow: 0 8px 18px rgba(66,49,30,.12);
        }
        .official-card-stack span:nth-child(1) { left: 0; top: 0; transform: rotate(-8deg); }
        .official-card-stack span:nth-child(2) { left: 18px; top: 22px; transform: rotate(4deg); }
        .official-card-stack span:nth-child(3) { left: 8px; top: 52px; transform: rotate(-2deg); }
        .official-section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 18px 28px 54px;
        }
        .official-section-title {
          font-size: 20px;
          font-weight: 800;
          color: #233331;
          margin-bottom: 18px;
        }
        .official-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .official-feature {
          background: #fff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          padding: 24px;
          min-height: 170px;
        }
        .official-feature h2 {
          font-size: 18px;
          margin: 0 0 12px;
          color: #1f2a2a;
        }
        .official-feature p {
          margin: 0;
          color: #66706d;
          font-size: 14px;
          line-height: 1.8;
        }
        .official-workflow {
          padding-bottom: 80px;
        }
        .official-flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid #e8e2d8;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
        }
        .official-flow-item {
          padding: 22px;
          border-right: 1px solid #eee8dd;
        }
        .official-flow-item:last-child {
          border-right: none;
        }
        .official-flow-item span {
          display: block;
          color: #b28a48;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .official-flow-item strong {
          color: #283634;
          font-size: 15px;
        }
        @media (max-width: 920px) {
          .official-hero,
          .official-feature-grid,
          .official-flow {
            grid-template-columns: 1fr;
          }
          .official-hero h1 {
            font-size: 38px;
          }
          .official-visual {
            height: 340px;
          }
          .official-flow-item {
            border-right: none;
            border-bottom: 1px solid #eee8dd;
          }
          .official-flow-item:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}
