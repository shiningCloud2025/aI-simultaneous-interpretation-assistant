import { Link, useNavigate } from 'react-router-dom';
import { AppWindow, AudioLines, Cloud, MonitorUp, Settings2, Sparkles } from 'lucide-react';

const desktopFeatures = [
  { icon: AudioLines, title: '轻量悬浮工具栏', text: '悬浮在桌面上方，随时开始或停止课堂音频采集，不必频繁切换浏览器窗口。' },
  { icon: Sparkles, title: '实时转译与纠错', text: '连接语音识别与翻译模型，在听课、会议和语言练习时持续呈现转写与翻译结果。' },
  { icon: AppWindow, title: '桌面平台模式', text: '从悬浮模式切换到完整工作区，继续使用听力、阅读、写作与作文批阅能力。' },
  { icon: Cloud, title: '同一账号与数据', text: '桌面端复用平台账号和后端服务，让模型配置与业务结果在不同使用方式间保持一致。' },
];

export function DesktopAppPage() {
  const navigate = useNavigate();

  return (
    <div className="desktop-site-page">
      <header className="desktop-site-header">
        <button className="desktop-site-brand" onClick={() => navigate('/')}>
          <span>语</span><strong>智语同航</strong>
        </button>
        <nav className="desktop-site-nav">
          <Link to="/">首页</Link>
        </nav>
      </header>

      <main className="desktop-site-main">
        <section className="desktop-site-hero">
          <div className="desktop-site-copy">
            <div className="desktop-site-kicker">DESKTOP COMPANION</div>
            <h1>把语言辅助，放在桌面最顺手的位置</h1>
            <p>智语同航桌面端面向课堂、会议与自主学习场景，将实时转译和常用语言能力收进一条轻量悬浮工具栏，并可随时展开完整工作区。</p>
            <div className="desktop-site-actions">
              <span><i />安装包正在研发与测试</span>
              <small>计划支持 macOS 与 Windows</small>
            </div>
          </div>

          <DesktopPreview />
        </section>

        <section className="desktop-site-section">
          <div className="desktop-site-section-title"><span>DESKTOP EXPERIENCE</span><h2>专注当前任务，减少窗口切换</h2><p>桌面端与网页平台形成互补，让实时能力更贴近正在进行的课堂与工作。</p></div>
          <div className="desktop-site-feature-grid">
            {desktopFeatures.map(({ icon: Icon, title, text }) => (
              <article key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section className="desktop-site-modes">
          <div className="desktop-site-mode-copy">
            <span>两种形态，自然切换</span>
            <h2>需要时展开，使用后收起</h2>
            <p>悬浮模式承载高频的开始、停止、语言与模型选择；平台模式提供更完整的内容查看和学习功能。系统托盘可快速显示、隐藏或切换工作模式。</p>
            <div><em>01</em><strong>悬浮模式</strong><small>始终置顶，快速控制实时转译</small></div>
            <div><em>02</em><strong>平台模式</strong><small>完整工作区，承载更多语言任务</small></div>
            <div><em>03</em><strong>系统托盘</strong><small>快捷切换模型、窗口与运行状态</small></div>
          </div>
          <div className="desktop-site-toolbar-demo">
            <div className="desktop-site-screen-line" />
            <div className="desktop-site-floating-bar">
              <span className="desktop-site-mini-brand">语</span>
              <span><small>源语言</small><strong>英语</strong></span>
              <b>→</b>
              <span><small>目标语言</small><strong>中文</strong></span>
              <span><Settings2 size={16} />模型设置</span>
              <button><AudioLines size={17} />开始转译</button>
            </div>
            <div className="desktop-site-caption"><i />悬浮工具栏示意</div>
          </div>
        </section>

        <section className="desktop-site-release">
          <div><span>EARLY ACCESS</span><h2>桌面端安装包正在研发</h2><p>我们正在完善跨平台打包、安装体验、权限提示和稳定性测试。正式版本准备完成后，将在这里提供 macOS 与 Windows 安装包。</p></div>
          <div className="desktop-site-release-status"><MonitorUp size={26} /><strong>研发与测试中</strong><small>下载入口即将开放</small><button disabled>敬请期待</button></div>
        </section>
      </main>

      <footer className="desktop-site-footer"><Link to="/">智语同航</Link><span>桌面端 · 让语言能力随时在场</span></footer>

      <style>{`
        .desktop-site-page { min-height: 100vh; background: #f7f5f0; color: #202827; }
        .desktop-site-header { height: 72px; max-width: 1180px; margin: 0 auto; padding: 0 28px; display: grid; grid-template-columns: 1fr auto; align-items: center; position: sticky; top: 0; z-index: 50; background: rgba(247,245,240,.9); backdrop-filter: blur(16px); }
        .desktop-site-brand { display: inline-flex; align-items: center; gap: 10px; justify-self: start; border: 0; background: transparent; color: #1f2a2a; font-size: 17px; cursor: pointer; }
        .desktop-site-brand > span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: #234b49; color: #fff; font-weight: 800; }
        .desktop-site-nav { display: flex; align-items: center; }
        .desktop-site-nav a { padding: 10px; color: #606864; text-decoration: none; font-size: 13px; font-weight: 700; white-space: nowrap; }
        .desktop-site-nav a:hover { color: #234b49; }
        .desktop-site-main { max-width: 1180px; margin: 0 auto; padding: 54px 28px 76px; }
        .desktop-site-hero { min-height: 570px; display: grid; grid-template-columns: minmax(0, .9fr) minmax(440px, 1.1fr); align-items: center; gap: 64px; }
        .desktop-site-kicker, .desktop-site-section-title > span, .desktop-site-release > div:first-child > span { margin-bottom: 16px; color: #8a6b35; font-size: 12px; font-weight: 900; letter-spacing: .11em; }
        .desktop-site-copy h1 { max-width: 580px; margin: 0; color: #172726; font-size: 49px; line-height: 1.16; }
        .desktop-site-copy > p { max-width: 610px; margin: 23px 0 0; color: #606a66; font-size: 17px; line-height: 1.85; }
        .desktop-site-actions { margin-top: 31px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .desktop-site-actions > span { padding: 11px 15px; display: flex; align-items: center; gap: 8px; border: 1px solid #d7c7ac; border-radius: 999px; background: #fffaf1; color: #765c2f; font-size: 12px; font-weight: 800; }
        .desktop-site-actions i { width: 7px; height: 7px; border-radius: 50%; background: #b58a48; box-shadow: 0 0 0 4px rgba(181,138,72,.12); }
        .desktop-site-actions small { color: #8c928e; font-size: 11px; }
        .desktop-site-preview { padding: 23px; position: relative; border: 1px solid #ded7cb; border-radius: 27px; background: linear-gradient(145deg,#fff,#eeeae1); box-shadow: 0 24px 55px rgba(44,53,49,.15); }
        .desktop-site-window { height: 390px; overflow: hidden; border: 1px solid #d8d7d2; border-radius: 16px; background: #f5f3ef; }
        .desktop-site-window-bar { height: 38px; padding: 0 13px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #e4e1da; background: #fff; }
        .desktop-site-window-bar i { width: 8px; height: 8px; border-radius: 50%; background: #d9d5cc; }.desktop-site-window-bar i:first-child { background: #b88b56; }.desktop-site-window-bar span { margin-left: auto; margin-right: auto; color: #909590; font-size: 9px; }
        .desktop-site-window-body { height: calc(100% - 38px); display: grid; grid-template-columns: 76px 1fr; }
        .desktop-site-preview-nav { padding: 14px 9px; background: #234b49; }.desktop-site-preview-nav b { width: 28px; height: 28px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 8px; background: #fff; color: #234b49; }.desktop-site-preview-nav span { width: 42px; height: 7px; margin: 14px auto; display: block; border-radius: 6px; background: rgba(255,255,255,.22); }.desktop-site-preview-nav span.active { height: 25px; background: rgba(255,255,255,.92); }
        .desktop-site-preview-content { padding: 21px; }.desktop-site-preview-title { display: flex; justify-content: space-between; align-items: center; }.desktop-site-preview-title span { height: 9px; width: 116px; border-radius: 6px; background: #455d58; }.desktop-site-preview-title i { width: 28px; height: 28px; border-radius: 50%; background: #d8e5df; }.desktop-site-preview-models { margin: 17px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }.desktop-site-preview-models span { height: 48px; border: 1px solid #e1ddd5; border-radius: 10px; background: #fff; }.desktop-site-preview-result { height: 207px; padding: 18px; border: 1px solid #dedbd3; border-radius: 12px; background: #fff; }.desktop-site-preview-result > span { width: 64px; height: 20px; display: block; border-radius: 10px; background: #e3eee8; }.desktop-site-preview-result p { height: 8px; margin: 17px 0 0; border-radius: 6px; background: #d8d9d5; }.desktop-site-preview-result p:nth-of-type(2) { width: 84%; }.desktop-site-preview-result p:nth-of-type(3) { width: 62%; }.desktop-site-preview-result div { margin-top: 24px; padding: 14px; border-radius: 9px; background: #f2f5f2; color: #5a6d66; font-size: 10px; line-height: 1.7; }
        .desktop-site-preview-toolbar { position: absolute; left: 50%; bottom: 4px; width: 88%; height: 50px; padding: 0 12px; display: flex; align-items: center; gap: 11px; border: 1px solid rgba(210,208,201,.9); border-radius: 13px; background: rgba(255,255,255,.94); box-shadow: 0 14px 30px rgba(34,43,39,.2); transform: translate(-50%,50%); backdrop-filter: blur(12px); }.desktop-site-preview-toolbar b { width: 25px; height: 25px; display: grid; place-items: center; border-radius: 7px; background: #234b49; color: #fff; font-size: 10px; }.desktop-site-preview-toolbar span { height: 7px; flex: 1; border-radius: 5px; background: #dddcd7; }.desktop-site-preview-toolbar button { height: 29px; padding: 0 11px; border: 0; border-radius: 8px; background: #234b49; color: #fff; font-size: 9px; }
        .desktop-site-section { padding: 76px 0 65px; }.desktop-site-section-title { max-width: 650px; margin-bottom: 27px; }.desktop-site-section-title h2, .desktop-site-modes h2, .desktop-site-release h2 { margin: 0; color: #1b2b29; font-size: 35px; }.desktop-site-section-title p { margin-top: 13px; color: #737c78; font-size: 14px; line-height: 1.8; }
        .desktop-site-feature-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }.desktop-site-feature-grid article { min-height: 220px; padding: 24px; border: 1px solid #e5dfd5; border-radius: 17px; background: #fff; }.desktop-site-feature-grid article > span { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: #eaf1ed; color: #234b49; }.desktop-site-feature-grid h3 { margin: 26px 0 10px; font-size: 16px; }.desktop-site-feature-grid p { margin: 0; color: #747d79; font-size: 12px; line-height: 1.8; }
        .desktop-site-modes { margin: 34px 0 82px; padding: 42px; display: grid; grid-template-columns: minmax(0,.8fr) minmax(460px,1.2fr); align-items: center; gap: 54px; overflow: hidden; border: 1px solid #dfd5c5; border-radius: 24px; background: linear-gradient(130deg,#fffdf8,#ece8df); }.desktop-site-mode-copy > span { color: #8a6b35; font-size: 11px; font-weight: 800; }.desktop-site-mode-copy > p { margin: 16px 0 25px; color: #68716d; font-size: 13px; line-height: 1.8; }.desktop-site-mode-copy > div { min-height: 51px; display: grid; grid-template-columns: 30px 105px 1fr; align-items: center; border-top: 1px solid #e7e1d7; }.desktop-site-mode-copy em { color: #b58a48; font-size: 10px; font-style: normal; }.desktop-site-mode-copy strong { font-size: 12px; }.desktop-site-mode-copy small { color: #888e8a; font-size: 10px; }
        .desktop-site-toolbar-demo { min-height: 280px; display: flex; align-items: center; position: relative; border-radius: 18px; background: #d7d4cc; box-shadow: inset 0 0 0 1px rgba(49,54,51,.08); }.desktop-site-screen-line { position: absolute; inset: 20px; border-radius: 11px; background: repeating-linear-gradient(0deg,#e4e2dc,#e4e2dc 26px,#dedbd4 27px); }.desktop-site-floating-bar { width: calc(100% - 36px); min-height: 61px; margin: auto 18px; padding: 9px; display: flex; align-items: center; gap: 11px; position: relative; z-index: 1; border: 1px solid #d6d2ca; border-radius: 13px; background: rgba(255,255,255,.96); box-shadow: 0 16px 36px rgba(38,43,40,.18); }.desktop-site-mini-brand { width: 32px; height: 32px; display: grid; place-items: center; flex-shrink: 0; border-radius: 9px; background: #234b49; color: #fff; font-weight: 800; }.desktop-site-floating-bar > span:not(.desktop-site-mini-brand) { display: flex; flex-direction: column; min-width: 57px; }.desktop-site-floating-bar small { color: #a0a39f; font-size: 7px; }.desktop-site-floating-bar strong { margin-top: 3px; font-size: 10px; }.desktop-site-floating-bar > span:nth-last-child(2) { padding-left: 10px; flex-direction: row; align-items: center; gap: 5px; border-left: 1px solid #e6e3dc; color: #65706b; font-size: 8px; }.desktop-site-floating-bar button { height: 34px; margin-left: auto; padding: 0 11px; display: flex; align-items: center; gap: 5px; border: 0; border-radius: 8px; background: #234b49; color: #fff; font-size: 8px; }.desktop-site-caption { position: absolute; right: 16px; bottom: 12px; display: flex; align-items: center; gap: 6px; color: #747a76; font-size: 8px; }.desktop-site-caption i { width: 6px; height: 6px; border-radius: 50%; background: #3aa074; }
        .desktop-site-release { padding: 42px; display: grid; grid-template-columns: 1fr 280px; align-items: center; gap: 50px; border-radius: 24px; background: #234b49; color: #fff; }.desktop-site-release h2 { color: #fff; }.desktop-site-release p { max-width: 670px; margin: 17px 0 0; color: rgba(255,255,255,.7); font-size: 13px; line-height: 1.9; }.desktop-site-release-status { padding: 24px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,.15); border-radius: 17px; background: rgba(255,255,255,.08); text-align: center; }.desktop-site-release-status svg { color: #d3b579; }.desktop-site-release-status strong { margin-top: 11px; font-size: 13px; }.desktop-site-release-status small { margin: 5px 0 15px; color: rgba(255,255,255,.55); font-size: 9px; }.desktop-site-release-status button { width: 100%; height: 37px; border: 1px solid rgba(255,255,255,.15); border-radius: 9px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); font-size: 10px; }
        .desktop-site-footer { max-width: 1124px; margin: 0 auto; padding: 22px 0 35px; display: flex; justify-content: space-between; border-top: 1px solid #e3ded5; color: #8b918d; font-size: 11px; }.desktop-site-footer a { color: #234b49; text-decoration: none; font-weight: 800; }
        @media(max-width:1020px) { .desktop-site-hero, .desktop-site-modes { grid-template-columns: 1fr; }.desktop-site-hero { gap: 42px; }.desktop-site-feature-grid { grid-template-columns: repeat(2,1fr); }.desktop-site-release { grid-template-columns: 1fr; }.desktop-site-release-status { max-width: 320px; }.desktop-site-footer { margin: 0 28px; }.desktop-site-modes { padding: 32px; } }
        @media(max-width:620px) { .desktop-site-main { padding: 34px 18px 55px; }.desktop-site-header { padding: 0 18px; }.desktop-site-copy h1 { font-size: 36px; }.desktop-site-hero { min-height: auto; grid-template-columns: minmax(0,1fr); }.desktop-site-preview { padding: 12px; }.desktop-site-window { height: 320px; }.desktop-site-window-body { grid-template-columns: 55px 1fr; }.desktop-site-preview-content { padding: 13px; }.desktop-site-feature-grid { grid-template-columns: 1fr; }.desktop-site-section { padding: 60px 0 45px; }.desktop-site-section-title h2, .desktop-site-modes h2, .desktop-site-release h2 { font-size: 28px; }.desktop-site-modes, .desktop-site-release { padding: 25px 20px; }.desktop-site-modes { grid-template-columns: minmax(0,1fr); }.desktop-site-toolbar-demo { min-height: 220px; }.desktop-site-floating-bar > span:nth-of-type(3), .desktop-site-floating-bar > b { display: none; }.desktop-site-mode-copy > div { grid-template-columns: 27px 90px 1fr; }.desktop-site-footer { margin: 0 18px; flex-direction: column; gap: 7px; } }
      `}</style>
    </div>
  );
}

function DesktopPreview() {
  return <div className="desktop-site-preview" aria-hidden="true"><div className="desktop-site-window"><div className="desktop-site-window-bar"><i /><i /><i /><span>智语同航桌面平台</span></div><div className="desktop-site-window-body"><div className="desktop-site-preview-nav"><b>语</b><span className="active" /><span /><span /><span /></div><div className="desktop-site-preview-content"><div className="desktop-site-preview-title"><span /><i /></div><div className="desktop-site-preview-models"><span /><span /></div><div className="desktop-site-preview-result"><span /><p /><p /><p /><div>Good morning, everyone.<br />大家早上好。</div></div></div></div></div><div className="desktop-site-preview-toolbar"><b>语</b><span /><span /><button>开始转译</button></div></div>;
}
