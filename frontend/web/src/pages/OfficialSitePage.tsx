import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export function OfficialSitePage() {
  const token = useAppStore((s) => s.token);
  const nav = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="official-page">
      <header className="official-header">
        <button className="official-brand" onClick={() => nav('/')}>
          <span className="official-brand-mark">语</span>
          <span>智语同航</span>
        </button>
        <nav className={`official-nav${navOpen ? ' open' : ''}`}>
          <a href="#features" onClick={() => setNavOpen(false)}>核心场景</a>
          <a href="#workflow" onClick={() => setNavOpen(false)}>课堂流程</a>
          <a href="#api-key-guide" onClick={() => setNavOpen(false)}>API Key 指南</a>
          <Link to="/admin/login" onClick={() => setNavOpen(false)}>管理平台</Link>
        </nav>
        <button
          type="button"
          className="official-menu-button"
          aria-label="展开导航"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? '×' : '☰'}
        </button>
      </header>

      <main>
        <section className="official-hero">
          <div className="official-hero-copy">
            <div className="official-kicker">Multi-Harness Agent Language Classroom</div>
            <h1>智语同航</h1>
            <p>
              基于多 Harness 智能体协作与编排的智慧外语课堂，围绕听、说、写、读四类核心学习任务，提供实时转译、口语跟读评测、作文训练与词汇语境化学习支持。
            </p>
            <div className="official-actions">
              <Link to={token ? '/dashboard' : '/login'} className="official-action-main">{token ? '进入平台' : '登录平台'}</Link>
              <Link to="/register" className="official-action-sub">注册账号</Link>
            </div>
          </div>

          <div className="official-visual" aria-hidden="true">
            <div className="official-board">
              <span>Listening</span>
              <span>Speaking</span>
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
              { title: '口语跟读评测', text: '按语言、学段、难度和场景生成跟读句子、译文与标准音频，并从准确度、流利度和完整度反馈口语表现。' },
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
            {['音频进入课堂', '生成听说读写材料', '完成跟读与写作反馈', '沉淀学习记录'].map((item, index) => (
              <div key={item} className="official-flow-item">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </section>

        <section id="api-key-guide" className="official-section official-api-guide">
          <div className="official-section-title">API Key 指南</div>
          <div className="official-api-layout">
            <div className="official-api-intro">
              <div className="official-kicker">Bring your own API key</div>
              <h2>接入 AI 能力前，先准备对应厂商的密钥</h2>
              <p>
                平台支持用户在后台配置自己的 API Key，用于作文生成与批阅、口语素材生成、实时听力识别、语音合成、图片生成和口语评测等能力。
                不同能力会读取对应厂商与模型配置，配置完成后即可在学习模块中选择使用。
              </p>
              <div className="official-api-actions">
                <Link to={token ? '/dashboard?panel=api-key' : '/login'} className="official-action-main">
                  {token ? '进入 API Key 配置' : '登录后配置'}
                </Link>
                <a
                  href="https://help.aliyun.com/zh/model-studio/get-api-key"
                  target="_blank"
                  rel="noreferrer"
                  className="official-action-sub"
                >
                  查看百炼申请文档
                </a>
              </div>
            </div>

            <div className="official-provider-list">
              {[
                {
                  name: '阿里云百炼',
                  badge: 'LLM / ASR / TTS / 图像',
                  text: '主要用于通义千问文本与多模态模型、实时语音识别、语音合成和阅读配图生成。',
                  models: ['qwen-plus', 'qwen-max / flash 系列', 'paraformer-realtime', 'qwen-audio-tts', 'wan 文生图'],
                  href: 'https://bailian.console.aliyun.com/?apiKey=1&tab=model',
                },
                {
                  name: '腾讯云',
                  badge: '口语评测',
                  text: '主要用于口语跟读评测，需要在腾讯云访问管理中创建 SecretId 和 SecretKey。',
                  models: ['SOE 口语评测', '英文跟读评测', '单词 / 句子维度评分'],
                  href: 'https://console.cloud.tencent.com/cam/capi',
                },
              ].map(provider => (
                <article key={provider.name} className="official-provider-card">
                  <div className="official-provider-head">
                    <h3>{provider.name}</h3>
                    <span>{provider.badge}</span>
                  </div>
                  <p>{provider.text}</p>
                  <div className="official-model-tags">
                    {provider.models.map(model => <em key={model}>{model}</em>)}
                  </div>
                  <a href={provider.href} target="_blank" rel="noreferrer">前往控制台</a>
                </article>
              ))}
            </div>
          </div>

          <div className="official-api-steps">
            {[
              { title: '注册并开通服务', text: '进入厂商控制台，完成账号认证，并开通需要使用的模型或语音服务。' },
              { title: '创建访问密钥', text: '在 API Key、AccessKey 或访问管理页面创建密钥，妥善保存 Secret。' },
              { title: '回到平台配置', text: '在后台的 API Key 配置中填写厂商、Key、Secret 和可用模型。' },
              { title: '选择模型使用', text: '在听说读写模块中选择已配置模型，开始生成、评测或识别。' },
            ].map((step, index) => (
              <div key={step.title} className="official-api-step">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="official-footer">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">
          辽ICP备2026007778号-1
        </a>
      </footer>

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
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(247,245,240,.88);
          backdrop-filter: blur(16px);
        }
        .official-brand {
          justify-self: start;
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
          grid-column: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .official-nav a {
          position: relative;
          padding: 10px 13px;
          color: #5f6763;
          text-decoration: none;
          font-weight: 650;
          transition: color .18s ease;
        }
        .official-nav a:hover {
          color: #223f3d;
        }
        .official-nav a::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 4px;
          width: 0;
          height: 2px;
          border-radius: 2px;
          background: #b58a48;
          transform: translateX(-50%);
          transition: width .18s ease;
        }
        .official-nav a:hover::after {
          width: 17px;
        }
        .official-menu-button {
          display: none;
          justify-self: end;
          width: 42px;
          height: 42px;
          padding: 0;
          border: 1px solid #e6dfd2;
          border-radius: 11px;
          color: #223f3d;
          background: #fffefb;
          font-size: 20px;
          line-height: 1;
        }
        .official-action-main,
        .official-action-sub {
          border-radius: 999px;
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-weight: 700;
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
          grid-template-columns: repeat(4, minmax(0, 1fr));
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
          padding-bottom: 54px;
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
        .official-api-guide {
          padding-bottom: 64px;
        }
        .official-api-layout {
          display: grid;
          grid-template-columns: minmax(0, .88fr) minmax(360px, 1fr);
          gap: 18px;
          align-items: stretch;
        }
        .official-api-intro,
        .official-provider-card,
        .official-api-step {
          background: #fff;
          border: 1px solid #e8e2d8;
          border-radius: 16px;
        }
        .official-api-intro {
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .official-api-intro h2 {
          margin: 0;
          color: #1f2a2a;
          font-size: 30px;
          line-height: 1.35;
          letter-spacing: 0;
        }
        .official-api-intro p {
          margin: 16px 0 0;
          color: #66706d;
          font-size: 15px;
          line-height: 1.9;
        }
        .official-api-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }
        .official-provider-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .official-provider-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          min-height: 272px;
        }
        .official-provider-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }
        .official-provider-head h3 {
          margin: 0;
          color: #1f2a2a;
          font-size: 18px;
        }
        .official-provider-head span {
          flex: 0 0 auto;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eef4f2;
          color: #285957;
          font-size: 12px;
          font-weight: 750;
        }
        .official-provider-card p {
          margin: 14px 0 0;
          color: #66706d;
          font-size: 14px;
          line-height: 1.8;
        }
        .official-model-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .official-model-tags em {
          padding: 6px 9px;
          border-radius: 9px;
          background: #f5f1e9;
          color: #5c5548;
          font-size: 12px;
          font-style: normal;
          font-weight: 650;
        }
        .official-provider-card > a {
          width: fit-content;
          margin-top: auto;
          padding-top: 18px;
          color: #234b49;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }
        .official-provider-card > a:hover {
          text-decoration: underline;
        }
        .official-api-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        .official-api-step {
          padding: 20px;
        }
        .official-api-step span {
          display: block;
          color: #b28a48;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .official-api-step strong {
          color: #283634;
          font-size: 15px;
        }
        .official-api-step p {
          margin: 10px 0 0;
          color: #66706d;
          font-size: 13px;
          line-height: 1.75;
        }
        .official-footer {
          padding: 18px 28px 30px;
          text-align: center;
          font-size: 13px;
          color: #777;
        }
        .official-footer a {
          color: #666;
          text-decoration: none;
        }
        .official-footer a:hover {
          color: #234b49;
          text-decoration: underline;
        }
        @media (max-width: 920px) {
          .official-header {
            grid-template-columns: 1fr auto;
          }
          .official-nav {
            position: absolute;
            top: 68px;
            left: 20px;
            right: 20px;
            display: none;
            padding: 10px;
            border: 1px solid #e6dfd2;
            border-radius: 14px;
            background: rgba(255,254,251,.98);
            box-shadow: 0 18px 45px rgba(45,54,49,.12);
          }
          .official-nav.open {
            display: grid;
          }
          .official-menu-button {
            display: grid;
            place-items: center;
          }
          .official-hero,
          .official-feature-grid,
          .official-flow,
          .official-api-layout,
          .official-provider-list,
          .official-api-steps {
            grid-template-columns: 1fr;
          }
          .official-hero h1 {
            font-size: 38px;
          }
          .official-visual {
            height: 340px;
          }
          .official-board {
            gap: 12px;
            font-size: 15px;
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
