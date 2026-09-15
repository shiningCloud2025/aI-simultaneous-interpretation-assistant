import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';
import { Dashboard } from '../components/Dashboard';
import { RealTimeTrans } from '../components/RealTimeTrans';
import { AudioSettings } from '../components/AudioSettings';
import { ShortcutSettings } from '../components/ShortcutSettings';
import { ApiKeyConfig } from '../components/ApiKeyConfig';
import { EduPPT } from '../components/EduPPT';
import { EduWord } from '../components/EduWord';
import { EduExcel } from '../components/EduExcel';
import { EduVocab } from '../components/EduVocab';
import { EduSpeakingGenerate, EduSpeakingPractice } from '../components/EduSpeaking';
import { EduWriting } from '../components/EduWriting';
import { EduWritingReview } from '../components/EduWritingReview';
import { EduWritingTutor } from '../components/EduWritingTutor';
import { AccountPage } from '../components/AccountPage';
import { HelpPage } from '../components/HelpPage';
import { AboutPage } from '../components/AboutPage';
import { TermLibraryPage } from '../components/TermLibraryPage';
import { useState, useEffect } from 'react';
import { isTeacherUser } from '../lib/authRole';
import { apiCall } from '../lib/api';

const navItems = [
  { group: '通用', items: [
    { id: 'dashboard', icon: '🏠', label: '仪表盘' },
    { id: 'edu-ppt', icon: '📊', label: 'PPT 集成' },
    { id: 'edu-word', icon: '📝', label: 'Word 集成' },
    { id: 'edu-excel', icon: '📈', label: 'Excel 集成' },
  ]},
  { group: '智语同航-听力', items: [
    { id: 'translate', icon: '🎧', label: '实时转译' },
  ]},
  { group: '智语同航-口语', items: [
    { id: 'speaking-generate', icon: '🎙️', label: '生成口语素材' },
    { id: 'speaking-practice', icon: '🗣️', label: '口语练习' },
  ]},
  { group: '智语同航-阅读', items: [
    { id: 'vocab', icon: '📖', label: '单词记忆' },
  ]},
  { group: '智语同航-写作', items: [
    { id: 'writing', icon: '✍️', label: '生成写作题目' },
    { id: 'writing-review', icon: '📝', label: '批阅作文' },
    { id: 'writing-tutor', icon: '💬', label: '已批阅作文答疑' },
  ]},
  { group: '设置与个人', items: [
    { id: 'account', icon: '👤', label: '个人中心' },
    { id: 'audio', icon: '🎧', label: '音频设备' },
    { id: 'shortcuts', icon: '⌨️', label: '快捷键' },
    { id: 'api-key', icon: '🔑', label: 'API Key 配置' },
    { id: 'term-library', icon: '📚', label: '术语库' },
    { id: 'help', icon: '❓', label: '帮助反馈' },
    { id: 'about', icon: 'ℹ️', label: '关于' },
  ]},
];

const panelComponents: Record<string, React.FC> = {
  'dashboard': Dashboard, 'translate': RealTimeTrans,
  'audio': AudioSettings, 'shortcuts': ShortcutSettings, 'api-key': ApiKeyConfig,
  'edu-ppt': EduPPT, 'edu-word': EduWord, 'edu-excel': EduExcel,
  'vocab': EduVocab, 'speaking-generate': EduSpeakingGenerate, 'speaking-practice': EduSpeakingPractice, 'writing': EduWriting, 'writing-review': EduWritingReview, 'writing-tutor': EduWritingTutor,
  'account': AccountPage, 'help': HelpPage, 'about': AboutPage, 'term-library': TermLibraryPage,
};

const panelTitles: Record<string, string> = {
  'dashboard': '仪表盘', 'translate': '实时转译',
  'audio': '音频设备', 'shortcuts': '快捷键', 'api-key': 'API Key 配置',
  'edu-ppt': 'PPT 集成', 'edu-word': 'Word 集成', 'edu-excel': 'Excel 集成',
  'vocab': '单词记忆', 'speaking-generate': '生成口语素材', 'speaking-practice': '口语练习', 'writing': '写作题目生成', 'writing-review': '作文智能批阅', 'writing-tutor': '已批阅作文答疑',
  'account': '个人中心', 'help': '帮助反馈', 'about': '关于', 'term-library': '术语库',
};

const PLATFORM_SKILL_PAGE_SIZE = 8;

interface UserSkillItem {
  id: number;
  name: string;
  description?: string;
  source?: string;
  sourceText?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserSkillPage {
  records: UserSkillItem[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export function MainLayout() {
  const { user, activePanel, setActivePanel, logout, setUser, token } = useAppStore();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(!user);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillError, setSkillError] = useState('');
  const [skillPage, setSkillPage] = useState<UserSkillPage>({
    records: [],
    total: 0,
    size: PLATFORM_SKILL_PAGE_SIZE,
    current: 1,
    pages: 1,
  });

  const changePanel = (panel: string) => {
    setActivePanel(panel);
    setSearchParams(panel === 'dashboard' ? {} : { panel });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (token && !user) {
      setLoading(true);
      api.getUserInfo().then(u => { setUser(u); setLoading(false); }).catch(() => { logout(); nav('/login'); });
    } else {
      setLoading(false);
    }
  }, [token, user, theme, setUser, logout, nav]);

  useEffect(() => {
    const panel = searchParams.get('panel');
    if (panel && panelComponents[panel] && panel !== activePanel) {
      setActivePanel(panel);
    }
  }, [searchParams, activePanel, setActivePanel]);

  const handleLogout = () => { logout(); nav('/login'); };

  const loadPlatformSkills = async (pageNum = 1, name = skillName) => {
    setSkillLoading(true);
    setSkillError('');
    try {
      const params = new URLSearchParams({
        pageNum: String(pageNum),
        pageSize: String(PLATFORM_SKILL_PAGE_SIZE),
      });
      const keyword = name.trim();
      if (keyword) params.set('name', keyword);
      const data = await apiCall<UserSkillPage>(`/sys/user/skills/page?${params.toString()}`);
      setSkillPage({
        records: data.records || [],
        total: data.total || 0,
        size: data.size || PLATFORM_SKILL_PAGE_SIZE,
        current: data.current || pageNum,
        pages: data.pages || Math.max(1, Math.ceil((data.total || 0) / (data.size || PLATFORM_SKILL_PAGE_SIZE))),
      });
    } catch (error) {
      setSkillError(error instanceof Error ? error.message : '平台 Skill 加载失败');
      setSkillPage(prev => ({ ...prev, records: [] }));
    } finally {
      setSkillLoading(false);
    }
  };

  const openPlatformSkills = () => {
    setShowSkillModal(true);
    loadPlatformSkills(1);
  };

  const resetPlatformSkillSearch = () => {
    setSkillName('');
    loadPlatformSkills(1, '');
  };

  const formatSkillTime = (value?: string) => {
    if (!value) return '-';
    return value.replace('T', ' ').slice(0, 19);
  };

  const renderSkillPageNumbers = () => {
    const totalPages = Math.max(1, skillPage.pages || Math.ceil((skillPage.total || 0) / (skillPage.size || 8)));
    const current = Math.min(Math.max(skillPage.current || 1, 1), totalPages);
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
      .filter(page => page === 1 || page === totalPages || Math.abs(page - current) <= 1);
    const compactPages = pages.reduce<(number | string)[]>((result, page) => {
      const last = result[result.length - 1];
      if (typeof last === 'number' && page - last > 1) result.push(`ellipsis-${page}`);
      result.push(page);
      return result;
    }, []);

    return (
      <div className="platform-skill-pagination">
        <button className="btn" disabled={current <= 1 || skillLoading} onClick={() => loadPlatformSkills(current - 1)}>上一页</button>
        {compactPages.map(page => typeof page === 'number' ? (
          <button
            key={page}
            className={`platform-skill-page-btn ${page === current ? 'active' : ''}`}
            disabled={skillLoading}
            onClick={() => loadPlatformSkills(page)}
          >
            {page}
          </button>
        ) : (
          <span key={page} className="platform-skill-ellipsis">...</span>
        ))}
        <button className="btn" disabled={current >= totalPages || skillLoading} onClick={() => loadPlatformSkills(current + 1)}>下一页</button>
        <span className="platform-skill-total">共 {skillPage.total || 0} 条</span>
      </div>
    );
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#999' }}>加载中...</div>;
  if (isTeacherUser(user)) return <Navigate to="/teacher" replace />;

  const PanelComponent = panelComponents[activePanel] || Dashboard;
  const availableNavItems = navItems;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ width: 32, height: 32, background: '#234b49', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>语</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>智语同航</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {availableNavItems.map((group) => (
            <div key={group.group} style={{ padding: '12px 12px 0' }}>
              <div className="sidebar-group-title">{group.group}</div>
              {group.items.map((item) => (
                <div key={item.id} onClick={() => changePanel(item.id)} className={`sidebar-item ${activePanel === item.id ? 'active' : ''}`}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{ position: 'relative' }}>
          <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 600, overflow: 'hidden' }}>
              {user?.avatar ? <img src={user.avatar} alt={user.username || '用户头像'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ fontSize: 12 }}>{user?.username || '未登录'}</div>
          </div>
          {showUserMenu && (
            <>
              <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: '100%', left: 8, right: 8, background: '#fff', border: '1px solid #f0efec', borderRadius: 12, padding: 6, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,.1)', marginBottom: 8 }}>
                {[
                  { id: 'account', icon: '👤', label: '个人中心' },
                  { id: 'shortcuts', icon: '⌨️', label: '快捷键' },
                  { id: 'api-key', icon: '🔑', label: 'API Key 配置' },
                  { id: 'audio', icon: '🎧', label: '音频设备' },
                  { id: 'help', icon: '❓', label: '帮助反馈' },
                ].map(item => (
                  <div key={item.id} onClick={() => { changePanel(item.id); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}
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
            <button onClick={openPlatformSkills} className="btn">🧩 平台 Skill</button>
            <select value={theme} onChange={e => { const t = e.target.value; setTheme(t); localStorage.setItem('theme', t); document.documentElement.setAttribute('data-theme', t); }} className="theme-select">
              <option value="light">☀️ 浅色</option>
              <option value="dark">🌙 深色</option>
            </select>
            <button onClick={handleLogout} className="btn">退出</button>
          </div>
        </div>
        <div className="content">
          <PanelComponent />
        </div>
      </div>
      {showSkillModal && (
        <div className="platform-skill-mask" onClick={() => setShowSkillModal(false)}>
          <div className="platform-skill-modal" onClick={event => event.stopPropagation()}>
            <div className="platform-skill-head">
              <div>
                <h3>平台 Skill 配置</h3>
                <p>查看当前平台开放给外语学习智能体调用的 Skill 摘要。</p>
              </div>
              <button className="platform-skill-close" onClick={() => setShowSkillModal(false)}>×</button>
            </div>
            <div className="platform-skill-toolbar">
              <input
                value={skillName}
                onChange={event => setSkillName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') loadPlatformSkills(1);
                }}
                placeholder="按 Skill 名称查询"
              />
              <button className="btn platform-skill-primary" disabled={skillLoading} onClick={() => loadPlatformSkills(1)}>查询</button>
              <button className="btn" disabled={skillLoading} onClick={resetPlatformSkillSearch}>清空</button>
              <button className="btn" disabled={skillLoading} onClick={() => loadPlatformSkills(skillPage.current || 1)}>刷新</button>
              <span className="platform-skill-toolbar-count">共 {skillPage.total || 0} 条配置</span>
            </div>
            {skillError && <div className="platform-skill-error">{skillError}</div>}
            <div className="platform-skill-body">
              {skillLoading ? (
                <div className="platform-skill-empty">正在加载平台 Skill...</div>
              ) : skillPage.records.length > 0 ? (
                <div className="platform-skill-list">
                  {skillPage.records.map(skill => (
                    <div key={skill.id} className="platform-skill-card">
                      <div className="platform-skill-card-title">
                        <div>
                          <strong>{skill.name}</strong>
                          <p>{skill.description || '暂无 Skill 描述'}</p>
                        </div>
                        <span>{skill.sourceText || skill.source || '平台配置'}</span>
                      </div>
                      <div className="platform-skill-card-meta">
                        <span>创建：{formatSkillTime(skill.createdAt)}</span>
                        <span>更新：{formatSkillTime(skill.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="platform-skill-empty">
                  <strong>暂无平台 Skill</strong>
                  <span>可以先让超管在 Skill 管理里配置一条。</span>
                </div>
              )}
            </div>
            {renderSkillPageNumbers()}
          </div>
        </div>
      )}
    </div>
  );
}
