import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Dashboard } from '../components/Dashboard';
import { StaticTrans } from '../components/StaticTrans';
import { RealTimeTrans } from '../components/RealTimeTrans';
import { AudioSettings } from '../components/AudioSettings';
import { ShortcutSettings } from '../components/ShortcutSettings';
import { ModelConfig } from '../components/ModelConfig';
import { GeneralSettings } from '../components/GeneralSettings';
import { EduPPT } from '../components/EduPPT';
import { EduWord } from '../components/EduWord';
import { EduExcel } from '../components/EduExcel';
import { EduCorrect } from '../components/EduCorrect';
import { AccountPage } from '../components/AccountPage';
import { HelpPage } from '../components/HelpPage';
import { AboutPage } from '../components/AboutPage';
import { useState } from 'react';

const navItems = [
  { group: '通用', items: [
    { id: 'dashboard', icon: '🏠', label: '仪表盘' },
    { id: 'static-trans', icon: '📁', label: '静态转译' },
    { id: 'translate', icon: '🔄', label: '实时转译' },
    { id: 'edu-ppt', icon: '📊', label: 'PPT 集成' },
    { id: 'edu-word', icon: '📝', label: 'Word 集成' },
    { id: 'edu-excel', icon: '📈', label: 'Excel 集成' },
  ]},
  { group: '设置', items: [
    { id: 'audio', icon: '🎧', label: '音频设备' },
    { id: 'shortcuts', icon: '⌨️', label: '快捷键' },
    { id: 'model-config', icon: '🧠', label: '模型配置' },
    { id: 'settings', icon: '⚙️', label: '通用设置' },
  ]},
  { group: 'TransFlow+ 教育解决方案', items: [
    { id: 'edu-correct', icon: '✏️', label: '课堂纠错' },
  ]},
  { group: '其他', items: [
    { id: 'account', icon: '👤', label: '个人中心' },
    { id: 'help', icon: '❓', label: '帮助反馈' },
    { id: 'about', icon: 'ℹ️', label: '关于' },
  ]},
];

const panelComponents: Record<string, React.FC> = {
  'dashboard': Dashboard, 'static-trans': StaticTrans, 'translate': RealTimeTrans,
  'audio': AudioSettings, 'shortcuts': ShortcutSettings, 'model-config': ModelConfig, 'settings': GeneralSettings,
  'edu-ppt': EduPPT, 'edu-word': EduWord, 'edu-excel': EduExcel, 'edu-correct': EduCorrect,
  'account': AccountPage, 'help': HelpPage, 'about': AboutPage,
};

const panelTitles: Record<string, string> = {
  'dashboard': '仪表盘', 'static-trans': '静态转译', 'translate': '实时转译',
  'audio': '音频设备', 'shortcuts': '快捷键', 'model-config': '模型配置', 'settings': '通用设置',
  'edu-ppt': 'PPT 集成', 'edu-word': 'Word 集成', 'edu-excel': 'Excel 集成', 'edu-correct': '课堂纠错',
  'account': '个人中心', 'help': '帮助反馈', 'about': '关于',
};

export function MainLayout() {
  const { user, activePanel, setActivePanel, logout } = useAppStore();
  const nav = useNavigate();
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1500); };

  const handleLogout = () => { logout(); nav('/login'); };

  const PanelComponent = panelComponents[activePanel] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 侧边栏 */}
      <div style={{ width: 210, background: '#fff', borderRight: '1px solid #e8e6e1', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0efec', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#2c2c2c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff' }}>T</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>TransFlow</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map((group) => (
            <div key={group.group} style={{ padding: '12px 12px 0' }}>
              <div style={{ fontSize: 10, color: '#bbb', padding: '0 8px', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{group.group}</div>
              {group.items.map((item) => (
                <div key={item.id} onClick={() => setActivePanel(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: activePanel === item.id ? '#1a1a1a' : '#888', background: activePanel === item.id ? '#f0efec' : 'transparent', fontWeight: activePanel === item.id ? 500 : 400, marginBottom: 1, transition: 'all .1s' }}
                  onMouseEnter={e => { if (activePanel !== item.id) (e.target as HTMLElement).style.background = '#f5f3f0'; }}
                  onMouseLeave={e => { if (activePanel !== item.id) (e.target as HTMLElement).style.background = 'transparent'; }}
                >{item.icon} {item.label}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 12px', borderTop: '1px solid #f0efec' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 600 }}>{user?.avatar || 'U'}</div>
            <div style={{ fontSize: 12, color: '#333' }}>{user?.name || '未登录'}</div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 50, borderBottom: '1px solid #e8e6e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{panelTitles[activePanel] || '仪表盘'}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => showToast('桌面工具栏已就绪')} style={btn}>🪟 工具栏</button>
            <button onClick={handleLogout} style={btn}>退出</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <PanelComponent />
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

const btn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
