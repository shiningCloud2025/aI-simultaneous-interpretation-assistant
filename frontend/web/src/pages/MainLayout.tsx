import { useNavigate } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';
import { Dashboard } from '../components/Dashboard';
import { StaticTrans } from '../components/StaticTrans';
import { RealTimeTrans } from '../components/RealTimeTrans';
import { AudioSettings } from '../components/AudioSettings';
import { ShortcutSettings } from '../components/ShortcutSettings';
import { ModelConfig } from '../components/ModelConfig';
import { EduPPT } from '../components/EduPPT';
import { EduWord } from '../components/EduWord';
import { EduExcel } from '../components/EduExcel';
import { AccountPage } from '../components/AccountPage';
import { HelpPage } from '../components/HelpPage';
import { AboutPage } from '../components/AboutPage';
import { useState, useEffect } from 'react';

const navItems = [
  { group: '通用', items: [
    { id: 'dashboard', icon: '🏠', label: '仪表盘' },
    { id: 'edu-ppt', icon: '📊', label: 'PPT 集成' },
    { id: 'edu-word', icon: '📝', label: 'Word 集成' },
    { id: 'edu-excel', icon: '📈', label: 'Excel 集成' },
  ]},
  { group: '智慧英语课堂-听力', items: [
    { id: 'translate', icon: '🎧', label: '实时转译' },
    { id: 'static-trans', icon: '📁', label: '静态转译' },
  ]},
  { group: '设置与个人', items: [
    { id: 'account', icon: '👤', label: '个人中心' },
    { id: 'audio', icon: '🎧', label: '音频设备' },
    { id: 'shortcuts', icon: '⌨️', label: '快捷键' },
    { id: 'model-config', icon: '🧠', label: '模型配置' },
    { id: 'help', icon: '❓', label: '帮助反馈' },
    { id: 'about', icon: 'ℹ️', label: '关于' },
  ]},
];

const panelComponents: Record<string, React.FC> = {
  'dashboard': Dashboard, 'static-trans': StaticTrans, 'translate': RealTimeTrans,
  'audio': AudioSettings, 'shortcuts': ShortcutSettings, 'model-config': ModelConfig,
  'edu-ppt': EduPPT, 'edu-word': EduWord, 'edu-excel': EduExcel,
  'account': AccountPage, 'help': HelpPage, 'about': AboutPage,
};

const panelTitles: Record<string, string> = {
  'dashboard': '仪表盘', 'static-trans': '静态转译', 'translate': '实时转译',
  'audio': '音频设备', 'shortcuts': '快捷键', 'model-config': '模型配置',
  'edu-ppt': 'PPT 集成', 'edu-word': 'Word 集成', 'edu-excel': 'Excel 集成',
  'account': '个人中心', 'help': '帮助反馈', 'about': '关于',
};

export function MainLayout() {
  const { user, activePanel, setActivePanel, logout, setUser, token } = useAppStore();
  const nav = useNavigate();
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(!user);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1500); };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (token && !user) {
      setLoading(true);
      api.getUserInfo().then(u => { setUser(u); setLoading(false); }).catch(() => { logout(); nav('/login'); });
    }
  }, []);

  const handleLogout = () => { logout(); nav('/login'); };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#999' }}>加载中...</div>;

  const PanelComponent = panelComponents[activePanel] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>E</div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>智慧英语课堂</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map((group) => (
            <div key={group.group} style={{ padding: '12px 12px 0' }}>
              <div className="sidebar-group-title">{group.group}</div>
              {group.items.map((item) => (
                <div key={item.id} onClick={() => setActivePanel(item.id)} className={`sidebar-item ${activePanel === item.id ? 'active' : ''}`}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{ position: 'relative' }}>
          <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 600 }}>{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div style={{ fontSize: 12 }}>{user?.username || '未登录'}</div>
          </div>
          {showUserMenu && (
            <>
              <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: '100%', left: 8, right: 8, background: '#fff', border: '1px solid #f0efec', borderRadius: 12, padding: 6, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,.1)', marginBottom: 8 }}>
                {[
                  { id: 'account', icon: '👤', label: '个人中心' },
                  { id: 'shortcuts', icon: '⌨️', label: '快捷键' },
                  { id: 'model-config', icon: '🧠', label: '模型配置' },
                  { id: 'audio', icon: '🎧', label: '音频设备' },
                  { id: 'help', icon: '❓', label: '帮助反馈' },
                ].map(item => (
                  <div key={item.id} onClick={() => { setActivePanel(item.id); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = '#f5f3f0'}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}
                  >{item.icon} {item.label}</div>
                ))}
                <div style={{ height: 1, background: '#f0efec', margin: '4px 0' }} />
                <div onClick={() => { handleLogout(); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#e55c5c' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = '#fdf2f2'}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = 'transparent'}
                >🚪 退出登录</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="topbar">
          <span style={{ fontSize: 14, fontWeight: 600 }}>{panelTitles[activePanel] || '仪表盘'}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={theme} onChange={e => { const t = e.target.value; setTheme(t); localStorage.setItem('theme', t); document.documentElement.setAttribute('data-theme', t); }} className="theme-select">
              <option value="light">☀️ 浅色</option>
              <option value="dark">🌙 深色</option>
            </select>
            <button onClick={() => showToast('桌面工具栏已就绪')} className="btn">🪟 工具栏</button>
            <button onClick={handleLogout} className="btn">退出</button>
          </div>
        </div>
        <div className="content">
          <PanelComponent />
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

const btn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
