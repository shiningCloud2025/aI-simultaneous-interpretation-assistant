import { Link, useNavigate } from 'react-router-dom';

const flagshipProvider = {
  name: '智语同航',
  badge: '平台模型池',
  officialUrl: '/',
  groups: [
    { title: '聚合模型', models: ['GLM-5.1', 'GLM-5.2', 'GLM-5.3', 'GLM-5.3-Flash', 'Kimi-K2.6', 'Kimi-K2.7-Code', 'Kimi-K3', 'LongCat-2.0', 'MiMo-V2.5', 'HY3'] },
  ],
};

const providers = [
  {
    name: '阿里云',
    badge: '通义千问',
    officialUrl: 'https://ai.aliyun.com/',
    groups: [
      { title: 'LLM 模型', models: ['通义千问-Plus', '千问 3.8-Max', '千问 3.7-Max', '千问 3.7-Plus', '千问 3.7-Flash', '千问 3.6-Plus', '千问 3.6-Flash'] },
    ],
  },
  {
    name: '腾讯云',
    badge: '混元',
    officialUrl: 'https://cloud.tencent.com/product/tclm',
    groups: [
      { title: 'LLM 模型', models: ['腾讯混元 3', '腾讯混元 4 预览版'] },
    ],
  },
  {
    name: 'MiniMax',
    badge: '大模型',
    officialUrl: 'https://www.minimax.cn/',
    groups: [
      { title: '文本模型', models: ['MiniMax-M3', 'MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed'] },
    ],
  },
  {
    name: 'DeepSeek',
    badge: '推理模型',
    officialUrl: 'https://www.deepseek.com/',
    groups: [
      { title: '文本与视觉模型', models: ['DeepSeek-V4-Flash', 'DeepSeek-V4-Pro', 'DeepSeek-V4-Flash-Vision-Exp'] },
    ],
  },
];

const capabilities = [
  { code: 'LLM', label: '文本生成' },
  { code: 'Reasoning', label: '推理分析' },
  { code: 'Vision', label: '多模态理解' },
  { code: 'Long Context', label: '长上下文处理' },
  { code: 'Agent', label: '智能体编排' },
];

export function ApiKeyGuidePage() {
  const nav = useNavigate();

  return (
    <div className="model-guide-page">
      <header className="model-guide-header">
        <button className="model-guide-brand" onClick={() => nav('/')}>
          <span className="model-guide-brand-mark">语</span>
          <span>智语同航</span>
        </button>
        <nav className="model-guide-nav">
          <Link to="/">首页</Link>
        </nav>
      </header>

      <main className="model-guide-main">
        <section className="model-guide-hero">
          <div>
            <div className="model-guide-kicker">Supported Providers & Models</div>
            <h1>API Key 与模型支持</h1>
            <p>平台当前支持主流 AI 厂商与常用模型，用户可按自己的账号与密钥配置后使用。</p>
          </div>
          <Link to="/" className="model-guide-action">返回首页</Link>
        </section>

        <section className="model-guide-flagship">
          <div className="model-guide-flagship-copy">
            <span className="model-guide-provider-badge">{flagshipProvider.badge}</span>
            <h2>{flagshipProvider.name}</h2>
            <p>平台优先提供的聚合模型池，覆盖主流中文写作、阅读理解、推理分析和多轮辅导场景。</p>
          </div>
          <div className="model-guide-flagship-models">
            {flagshipProvider.groups[0].models.map(model => <em key={model}>{model}</em>)}
          </div>
          <Link to={flagshipProvider.officialUrl} className="model-guide-official-link model-guide-flagship-link">官网</Link>
        </section>

        <section className="model-guide-grid">
          {providers.map(provider => (
            <article key={provider.name} className="model-guide-card">
              <div className="model-guide-card-head">
                <div>
                  <span className="model-guide-provider-badge">{provider.badge}</span>
                  <h2>{provider.name}</h2>
                </div>
                {provider.officialUrl.startsWith('/') ? (
                  <Link to={provider.officialUrl} className="model-guide-official-link">官网</Link>
                ) : (
                  <a href={provider.officialUrl} target="_blank" rel="noreferrer" className="model-guide-official-link">官网</a>
                )}
              </div>
              {provider.groups.map(group => (
                <div key={group.title} className="model-guide-group">
                  <h3>{group.title}</h3>
                  <div className="model-guide-tags">
                    {group.models.map(model => <em key={model}>{model}</em>)}
                  </div>
                </div>
              ))}
            </article>
          ))}
        </section>

        <section className="model-guide-panel">
          {capabilities.map(item => (
            <div key={item.code}>
              <span>{item.code}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </section>
      </main>

      <style>{`
        .model-guide-page {
          min-height: 100vh;
          background: #f7f5f0;
          color: #1f2a2a;
        }
        .model-guide-header {
          height: 72px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(247,245,240,.88);
          backdrop-filter: blur(16px);
        }
        .model-guide-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          color: #1f2a2a;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
        }
        .model-guide-brand-mark {
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
        .model-guide-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .model-guide-nav a {
          color: #5f6763;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
        }
        .model-guide-nav a:hover {
          color: #223f3d;
        }
        .model-guide-main {
          max-width: 1180px;
          margin: 0 auto;
          padding: 38px 28px 78px;
        }
        .model-guide-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 28px;
          margin-bottom: 28px;
        }
        .model-guide-kicker {
          color: #8a6b35;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .model-guide-hero h1 {
          margin: 0;
          color: #172726;
          font-size: 54px;
          line-height: 1.1;
          letter-spacing: 0;
        }
        .model-guide-hero p {
          max-width: 740px;
          margin: 22px 0 0;
          color: #66706d;
          font-size: 17px;
          line-height: 1.8;
        }
        .model-guide-action {
          border-radius: 999px;
          padding: 15px 28px;
          background: #223f3d;
          color: #fff;
          text-decoration: none;
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }
        .model-guide-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .model-guide-flagship {
          position: relative;
          display: grid;
          grid-template-columns: minmax(280px, .72fr) minmax(0, 1fr);
          gap: 34px;
          align-items: center;
          min-height: 320px;
          margin-bottom: 16px;
          padding: 38px;
          overflow: hidden;
          border: 1px solid #d8c7ad;
          border-radius: 22px;
          background:
            linear-gradient(135deg, rgba(35,75,73,.08), rgba(181,138,72,.08)),
            #fff;
          box-shadow: 0 22px 48px rgba(45,54,49,.1);
        }
        .model-guide-flagship::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 5px;
          background: linear-gradient(90deg, #234b49, #b58a48);
        }
        .model-guide-flagship-copy h2 {
          margin: 14px 0 0;
          color: #172726;
          font-size: 44px;
          line-height: 1.12;
          letter-spacing: 0;
        }
        .model-guide-flagship-copy p {
          max-width: 430px;
          margin: 18px 0 0;
          color: #66706d;
          font-size: 16px;
          line-height: 1.8;
        }
        .model-guide-flagship-models {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding-right: 92px;
        }
        .model-guide-flagship-models em {
          padding: 10px 14px;
          border-radius: 12px;
          background: #f3eee5;
          color: #4f493e;
          font-size: 15px;
          font-style: normal;
          font-weight: 900;
        }
        .model-guide-flagship-link {
          position: absolute;
          right: 36px;
          top: 36px;
        }
        .model-guide-card,
        .model-guide-panel {
          background: #fff;
          border: 1px solid #e8e2d8;
          border-radius: 18px;
        }
        .model-guide-card {
          position: relative;
          min-height: 300px;
          padding: 30px;
          overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .model-guide-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 4px;
          background: linear-gradient(90deg, #234b49, #b58a48);
          opacity: .86;
        }
        .model-guide-card:hover {
          transform: translateY(-3px);
          border-color: #ded4c4;
          box-shadow: 0 18px 38px rgba(45,54,49,.1);
        }
        .model-guide-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }
        .model-guide-card-head h2 {
          margin: 8px 0 0;
          color: #1f2a2a;
          font-size: 30px;
          line-height: 1.2;
          letter-spacing: 0;
        }
        .model-guide-provider-badge {
          display: inline-flex;
          padding: 8px 13px;
          border-radius: 999px;
          background: #eef4f2;
          color: #285957;
          font-size: 13px;
          font-weight: 900;
        }
        .model-guide-official-link {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 58px;
          height: 38px;
          padding: 0 15px;
          border-radius: 999px;
          border: 1px solid #e7dfd2;
          background: #fffdf8;
          color: #244b49;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          transition: background .18s ease, border-color .18s ease, color .18s ease;
        }
        .model-guide-official-link:hover {
          border-color: #244b49;
          background: #244b49;
          color: #fff;
        }
        .model-guide-group + .model-guide-group {
          margin-top: 24px;
        }
        .model-guide-group h3 {
          margin: 0 0 14px;
          color: #66706d;
          font-size: 15px;
          font-weight: 900;
        }
        .model-guide-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .model-guide-tags em {
          padding: 8px 12px;
          border-radius: 10px;
          background: #f5f1e9;
          color: #5c5548;
          font-size: 13px;
          font-style: normal;
          font-weight: 800;
        }
        .model-guide-panel {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0;
          overflow: hidden;
          margin-top: 16px;
        }
        .model-guide-panel div {
          min-height: 90px;
          padding: 22px;
          border-right: 1px solid #eee8dd;
        }
        .model-guide-panel div:last-child {
          border-right: none;
        }
        .model-guide-panel span {
          display: block;
          margin-bottom: 8px;
          color: #b28a48;
          font-size: 13px;
          font-weight: 900;
        }
        .model-guide-panel strong {
          color: #283634;
          font-size: 15px;
        }
        @media (max-width: 860px) {
          .model-guide-header {
            padding: 0 20px;
          }
          .model-guide-main {
            padding: 46px 20px 56px;
          }
          .model-guide-hero,
          .model-guide-flagship,
          .model-guide-grid,
          .model-guide-panel {
            grid-template-columns: 1fr;
          }
          .model-guide-flagship {
            padding: 30px;
          }
          .model-guide-flagship-copy h2 {
            font-size: 36px;
          }
          .model-guide-flagship-models {
            padding-right: 0;
          }
          .model-guide-flagship-link {
            position: static;
            width: fit-content;
          }
          .model-guide-hero h1 {
            font-size: 38px;
          }
          .model-guide-panel div {
            border-right: none;
            border-bottom: 1px solid #eee8dd;
          }
          .model-guide-panel div:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}
