import { Link } from 'react-router-dom';

const officialGames: Array<{
  name: string;
  intro: string;
  src: string;
  tag: string;
  action: string;
  visual: 'runner' | 'starship';
}> = [
  {
    name: '语境跑酷',
    intro: '三条赛道里选择自然英文表达，连击会加速，错误表达会扣体力。',
    src: '/games/context-runner.html',
    tag: '表达 · 反应 · 连击',
    action: '开始跑酷',
    visual: 'runner',
  },
  {
    name: '单词星舰',
    intro: '操控飞船接住同义词，目标会不断切换，护盾归零就结束。',
    src: '/games/word-starship.html',
    tag: '词汇 · 同义 · 排行',
    action: '驾驶星舰',
    visual: 'starship',
  },
];

export function OfficialGamesPage() {
  return (
    <div className="official-games-page">
      <header className="official-games-header">
        <Link className="official-games-brand" to="/">
          <span>语</span>
          <strong>智语同航</strong>
        </Link>
        <nav>
          <Link to="/">返回官网首页</Link>
        </nav>
      </header>

      <main className="official-games-shell">
        <section className="official-games-copy">
          <div className="official-games-kicker">Language Arcade</div>
          <h1>课后放松一下，也能顺手练外语</h1>
          <p>
            两个小游戏都直接全屏打开，分数记录保存在当前设备。想练表达就选语境跑酷，想练词义反应就选单词星舰。
          </p>
          <div className="official-games-note">
            <span>本地排行</span>
            <span>全屏游玩</span>
            <span>离线存档</span>
          </div>
        </section>

        <section className="official-games-list" aria-label="小游戏列表">
          {officialGames.map((game) => (
            <article className="official-games-card" key={game.name}>
              <div className={`official-games-visual ${game.visual}`} aria-hidden="true">
                <i />
                <i />
                <i />
                <b />
                <em />
              </div>
              <div>
                <span>{game.tag}</span>
                <h2>{game.name}</h2>
                <p>{game.intro}</p>
              </div>
              <a href={game.src}>{game.action}</a>
            </article>
          ))}
        </section>
      </main>

      <style>{`
        .official-games-page {
          min-height: 100vh;
          color: #172726;
          background:
            radial-gradient(circle at 12% 18%, rgba(63, 214, 154, .16), transparent 28%),
            radial-gradient(circle at 88% 8%, rgba(111, 125, 255, .13), transparent 30%),
            linear-gradient(180deg, #fbfaf6 0%, #f6f2ea 54%, #eef5ef 100%);
        }
        .official-games-header {
          height: 72px;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .official-games-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #172726;
          text-decoration: none;
          font-weight: 850;
        }
        .official-games-brand span {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: #234b49;
        }
        .official-games-header nav {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .official-games-header nav a {
          padding: 10px 13px;
          border-radius: 999px;
          color: #5f6763;
          text-decoration: none;
          font-size: 14px;
          font-weight: 750;
        }
        .official-games-header nav a:hover {
          color: #234b49;
          background: rgba(35, 75, 73, .08);
        }
        .official-games-shell {
          max-width: 1240px;
          margin: 0 auto;
          padding: 58px 28px 76px;
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 26px;
          align-items: stretch;
        }
        .official-games-copy {
          align-self: start;
          position: sticky;
          top: 96px;
        }
        .official-games-kicker {
          color: #8a6b35;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .official-games-copy h1 {
          margin: 16px 0 0;
          font-size: 42px;
          line-height: 1.12;
          letter-spacing: 0;
          color: #172726;
        }
        .official-games-copy p {
          margin: 18px 0 0;
          color: #5f6763;
          font-size: 15px;
          line-height: 1.85;
        }
        .official-games-note {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }
        .official-games-note span {
          border: 1px solid #e4d9c8;
          border-radius: 999px;
          padding: 9px 12px;
          color: #5f6763;
          background: rgba(255,255,255,.78);
          font-weight: 850;
        }
        .official-games-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .official-games-card {
          min-height: 460px;
          border: 1px solid #ded5c7;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background:
            radial-gradient(circle at 76% 18%, rgba(111,125,255,.16), transparent 28%),
            linear-gradient(145deg, rgba(255,255,255,.94), rgba(255,255,255,.76)),
            #fffdf8;
          box-shadow: 0 24px 70px rgba(45,54,49,.14);
        }
        .official-games-visual {
          position: relative;
          height: 190px;
          margin: -4px -4px 28px;
          border-radius: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at 48% 50%, rgba(255,211,110,.32), transparent 24%),
            radial-gradient(circle, rgba(255,255,255,.86) 0 1px, transparent 1.8px) 0 0 / 82px 82px,
            linear-gradient(135deg, #07111f, #121b31 55%, #25183d);
        }
        .official-games-visual.runner::before {
          content: '';
          position: absolute;
          left: 36px;
          right: 36px;
          bottom: 34px;
          height: 82px;
          transform: skewX(-10deg);
          border-top: 1px solid rgba(255,255,255,.2);
          border-bottom: 1px solid rgba(255,255,255,.18);
          background:
            linear-gradient(90deg, transparent 0 31%, rgba(255,255,255,.18) 31% 32%, transparent 32% 65%, rgba(255,255,255,.18) 65% 66%, transparent 66%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
        }
        .official-games-visual.runner i {
          position: absolute;
          right: 42px;
          width: 92px;
          height: 30px;
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          box-shadow: 0 12px 26px rgba(0,0,0,.18);
        }
        .official-games-visual.runner i:nth-child(1) { top: 50px; }
        .official-games-visual.runner i:nth-child(2) { top: 88px; right: 78px; }
        .official-games-visual.runner i:nth-child(3) { top: 126px; }
        .official-games-visual.runner b {
          position: absolute;
          left: 72px;
          bottom: 58px;
          width: 48px;
          height: 58px;
          border-radius: 16px;
          background: #d7f7ea;
          box-shadow: 0 0 30px rgba(63,214,154,.3);
        }
        .official-games-visual.runner b::after {
          content: '语';
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #234b49;
          font-weight: 900;
          font-size: 22px;
        }
        .official-games-visual.runner em {
          position: absolute;
          left: 112px;
          bottom: 48px;
          width: 36px;
          height: 14px;
          border-radius: 999px;
          background: #ffd36e;
          transform: rotate(-12deg);
        }
        .official-games-visual.starship::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 112px;
          height: 112px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at 34% 30%, #ffe7a3, #c99b4c 62%, #806023);
          box-shadow: 0 0 54px rgba(255,211,110,.42);
        }
        .official-games-visual.starship i {
          position: absolute;
          min-width: 74px;
          height: 30px;
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          box-shadow: 0 12px 26px rgba(0,0,0,.18);
        }
        .official-games-visual.starship i:nth-child(1) { left: 34px; top: 48px; }
        .official-games-visual.starship i:nth-child(2) { right: 42px; top: 70px; }
        .official-games-visual.starship i:nth-child(3) { left: 88px; bottom: 34px; }
        .official-games-visual.starship b {
          position: absolute;
          right: 76px;
          bottom: 44px;
          width: 68px;
          height: 40px;
          clip-path: polygon(0 50%, 74% 0, 100% 50%, 74% 100%);
          background: #d7f7ea;
          box-shadow: 0 0 30px rgba(63,214,154,.3);
        }
        .official-games-visual.starship em {
          position: absolute;
          right: 142px;
          bottom: 56px;
          width: 44px;
          height: 14px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,211,110,0), #ffd36e);
        }
        .official-games-card span {
          color: #8a6b35;
          font-size: 12px;
          font-weight: 900;
        }
        .official-games-card h2 {
          margin: 8px 0 10px;
          color: #172726;
          font-size: 26px;
        }
        .official-games-card p {
          margin: 0;
          color: #6a716d;
          line-height: 1.75;
          font-size: 14px;
        }
        .official-games-card a {
          align-self: flex-start;
          margin-top: 24px;
          border-radius: 999px;
          padding: 12px 18px;
          color: #fff;
          background: #234b49;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
        }
        @media (max-width: 980px) {
          .official-games-header {
            padding: 0 18px;
          }
          .official-games-header nav {
            display: none;
          }
          .official-games-shell {
            grid-template-columns: 1fr;
            padding: 22px 16px 36px;
          }
          .official-games-copy {
            position: static;
          }
          .official-games-copy h1 {
            font-size: 34px;
          }
          .official-games-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
