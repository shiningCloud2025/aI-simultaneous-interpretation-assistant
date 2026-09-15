import { useEffect, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAppStore } from '../../stores/appStore';
import { uploadFile } from '../../lib/api';
import {
  adminApi,
  type DashboardOnline,
  type FeedbackItem,
  type LogContent,
  type LogFile,
  type ManagedUser,
  type PageResult,
  type RecentRegisterUser,
  type SkillDetail,
  type SkillItem,
  type UserDashboardStructure,
  type UserDashboardSummary,
  type UserTrendItem,
} from './adminApi';
import './SuperAdminConsole.css';

type AdminPanelKey =
  | 'user-dashboard'
  | 'ai-dashboard'
  | 'ops-dashboard'
  | 'log-dashboard'
  | 'user-management'
  | 'feedback'
  | 'skills'
  | 'system'
  | 'admin-account';

type UserManageTabKey = 'all-users' | 'online-users' | 'disabled-users' | 'operation-records';
type AdminAccountModalType = 'profile' | 'password' | 'phone' | 'email' | null;
type AllUsersBatchModalType = 'status' | 'type' | null;
type AdminMode = 'classic' | 'star' | 'star-content';
type StarNavigationLevel = 'primary' | 'secondary';

const navGroups: Array<{
  key: string;
  icon: string;
  name: string;
  children: Array<{ key: AdminPanelKey; icon: string; name: string; desc: string }>;
}> = [
  {
    key: 'boards',
    icon: '✦',
    name: '看板中心',
    children: [
      { key: 'user-dashboard', icon: '👥', name: '用户看板', desc: '用户增长、结构与在线状态' },
      { key: 'ai-dashboard', icon: '⚡', name: 'AI 看板', desc: '调用量与模型质量' },
      { key: 'ops-dashboard', icon: '📣', name: '运营看板', desc: '运营业务后续扩展' },
      { key: 'log-dashboard', icon: '📄', name: '日志看板', desc: '日志文件检索与过滤' },
    ],
  },
  {
    key: 'console',
    icon: '▣',
    name: '管理控制台',
    children: [
      { key: 'user-management', icon: '👤', name: '用户管理', desc: '全部用户、在线用户、禁用用户与操作记录' },
    ],
  },
  {
    key: 'operation',
    icon: '◈',
    name: '运营',
    children: [
      { key: 'feedback', icon: '💬', name: '反馈管理', desc: '处理用户反馈工单' },
      { key: 'skills', icon: '🧩', name: 'Skill 管理', desc: '配置 AgentScope Skill' },
    ],
  },
  {
    key: 'system',
    icon: '⚙',
    name: '系统',
    children: [
      { key: 'system', icon: '⚙', name: '系统配置', desc: '固定配置后续扩展' },
    ],
  },
];

const panelMeta = Object.fromEntries(
  [
    ...navGroups.flatMap((group) => group.children.map((item) => [item.key, item])),
    ['admin-account', { key: 'admin-account', icon: '👤', name: '账号中心', desc: '管理员基础信息、资料维护与安全设置' }],
  ]
) as Record<AdminPanelKey, { key: AdminPanelKey; icon: string; name: string; desc: string }>;

function findPanelGroup(key: AdminPanelKey) {
  return navGroups.find((group) => group.children.some((child) => child.key === key));
}

function formatNumber(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString() : '-';
}

function formatDate(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function enumText(value?: string | number) {
  const map: Record<string, string> = {
    student: '学生',
    teacher: '老师',
    STUDENT: '学生',
    TEACHER: '老师',
    superadmin: '超管',
    SUPERADMIN: '超管',
    '0': '禁用',
    '1': '启用',
    NORMAL: '正常',
    DISABLED: '禁用',
    ENABLED: '启用',
    PENDING: '待处理',
    PROCESSING: '处理中',
    REPLIED: '已回复',
    CLOSED: '已关闭',
    BUG: '问题反馈',
    SUGGESTION: '功能建议',
    OTHER: '其他',
  };
  if (value === undefined || value === null || value === '') return '-';
  return map[String(value)] || String(value);
}

function statusIsDisabled(value?: string | number) {
  return String(value) === '0' || value === 'DISABLED';
}

function userTypeIs(user: ManagedUser, type: 'student' | 'teacher') {
  const raw = String(user.userType || '').toLowerCase();
  const text = user.userTypeText || '';
  return raw === type || text === (type === 'student' ? '学生' : '老师');
}

function compareText(metric?: { comparePercent?: number; compareText?: string }) {
  if (!metric || metric.comparePercent === undefined || metric.comparePercent === null) return '暂无对比';
  const sign = metric.comparePercent >= 0 ? '+' : '';
  return `${sign}${metric.comparePercent}% ${metric.compareText || ''}`.trim();
}

function ErrorBlock({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="admin-error">{error}</div>;
}

function EmptyBlock({ text = '暂无数据' }: { text?: string }) {
  return <div className="admin-empty">{text}</div>;
}

export function SuperAdminLoginPage() {
  const [tab, setTab] = useState<'password' | 'sms' | 'email'>('password');
  const [keyword, setKeyword] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setToken = useAppStore((s) => s.setToken);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);
  const nav = useNavigate();

  const sendSms = async () => {
    if (smsCountdown > 0) return;
    if (!phone.trim()) return setError('请先输入手机号');
    try {
      await adminApi.sendSmsCode(phone);
      setError('');
      setSmsCountdown(60);
      const timer = window.setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message || '验证码发送失败');
    }
  };

  const sendEmail = async () => {
    if (emailCountdown > 0) return;
    if (!email.trim()) return setError('请先输入邮箱');
    try {
      await adminApi.sendEmailCode(email);
      setError('');
      setEmailCountdown(60);
      const timer = window.setInterval(() => {
        setEmailCountdown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message || '验证码发送失败');
    }
  };

  const submit = async () => {
    if (tab === 'password') {
      if (!keyword.trim()) return setError('请输入账号、手机号或邮箱');
      if (!password.trim()) return setError('请输入密码');
    }
    if (tab === 'sms') {
      if (!phone.trim()) return setError('请输入手机号');
      if (!captcha.trim()) return setError('请输入短信验证码');
    }
    if (tab === 'email') {
      if (!email.trim()) return setError('请输入邮箱');
      if (!captcha.trim()) return setError('请输入邮箱验证码');
    }
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.login(
        tab === 'password'
          ? { keyword, password }
          : tab === 'sms'
            ? { phone, captcha }
            : { email, captcha }
      );
      const token = data?.token || (data as any)?.data?.token;
      if (!token) {
        throw new Error('登录接口未返回 token');
      }
      setToken(token);
      const user = await api.getUserInfo();
      if (String(user.userType || '').toLowerCase() !== 'superadmin') {
        logout();
        throw new Error('当前账号不是平台管理员');
      }
      setUser(user);
      nav('/admin', { replace: true });
    } catch (e: any) {
      logout();
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <header className="admin-login-header">
        <button className="admin-login-brand" onClick={() => nav('/')}>
          <span>语</span>
          智语同航
        </button>
        <div className="admin-login-nav">
          <button onClick={() => nav('/')}>返回官网</button>
        </div>
      </header>
      <main className="admin-login-main">
        <section className="admin-login-copy">
          <div className="admin-login-kicker">Super Admin Center</div>
          <h1>智语同航超管后台</h1>
          <p>面向平台管理员的管理入口，只处理平台级数据、用户状态、日志排障、反馈工单和 Skill 配置。</p>
        </section>

        <section className="admin-login-card" id="admin-login-form">
          <div className="admin-login-card-head">
            <div className="admin-login-mark">语</div>
            <div>
              <h2>超管登录</h2>
              <p>仅限平台管理员访问</p>
            </div>
          </div>

          <div className="admin-login-tabs">
            <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>密码登录</button>
            <button className={tab === 'sms' ? 'active' : ''} onClick={() => setTab('sms')}>短信登录</button>
            <button className={tab === 'email' ? 'active' : ''} onClick={() => setTab('email')}>邮箱登录</button>
          </div>

          <div className="admin-form-grid">
            {tab === 'password' && (
              <>
                <input className="admin-login-input" name="platform-admin-identity" autoComplete="off" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="账号 / 手机号 / 邮箱" />
                <input className="admin-login-input" name="platform-admin-passcode" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" type="password" onKeyDown={(e) => e.key === 'Enter' && submit()} />
              </>
            )}

            {tab === 'sms' && (
              <>
                <input className="admin-login-input" name="platform-admin-phone" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" />
                <div className="admin-login-code-row">
                  <input className="admin-login-input" name="platform-admin-sms-code" autoComplete="one-time-code" value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="短信验证码" onKeyDown={(e) => e.key === 'Enter' && submit()} />
                  <button onClick={sendSms}>{smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}</button>
                </div>
              </>
            )}

            {tab === 'email' && (
              <>
                <input className="admin-login-input" name="platform-admin-email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" />
                <div className="admin-login-code-row">
                  <input className="admin-login-input" name="platform-admin-email-code" autoComplete="one-time-code" value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="邮箱验证码" onKeyDown={(e) => e.key === 'Enter' && submit()} />
                  <button onClick={sendEmail}>{emailCountdown > 0 ? `${emailCountdown}s` : '获取验证码'}</button>
                </div>
              </>
            )}

            <button className="admin-login-submit" onClick={submit} disabled={loading}>{loading ? '登录中...' : '进入超管后台'}</button>
            {error && <div className="admin-error" style={{ padding: 0 }}>{error}</div>}
          </div>
          <div className="admin-login-note">后台接口会校验管理员权限，仅授权账号可以进入。</div>
        </section>
      </main>
      <footer className="admin-login-footer">智语同航 · 平台管理入口</footer>
      <div className="admin-login-grid" />
    </div>
  );
}

export function SuperAdminConsole() {
  const [panel, setPanel] = useState<AdminPanelKey>('user-dashboard');
  const [activeMenu, setActiveMenu] = useState('boards');
  const [mode, setMode] = useState<AdminMode>('classic');
  const [starGroupKey, setStarGroupKey] = useState('boards');
  const [starLevel, setStarLevel] = useState<StarNavigationLevel>('primary');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);
  const nav = useNavigate();
  const meta = panelMeta[panel];
  const currentGroup = findPanelGroup(panel);

  useEffect(() => {
    if (user) return;
    api.getUserInfo()
      .then(setUser)
      .catch(() => {
        logout();
        nav('/admin/login', { replace: true });
      });
  }, [user, setUser, logout, nav]);

  const changePanel = (key: AdminPanelKey) => {
    setPanel(key);
    const group = findPanelGroup(key);
    if (group) setActiveMenu(group.key);
  };

  const openStarHome = () => {
    setStarLevel('primary');
    setStarGroupKey(currentGroup?.key || 'boards');
    setMode('star');
  };

  const openStarGroup = (groupKey = currentGroup?.key || 'boards') => {
    setStarGroupKey(groupKey);
    setStarLevel('secondary');
    setMode('star');
  };

  return (
    <div className="admin-shell" data-mode={mode} data-star-group={currentGroup?.key || ''}>
      <div className="admin-bg" />
      {mode === 'classic' && <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">语</div>
          <div>
            <b>智语同航</b>
            <span>Super Admin Console</span>
          </div>
        </div>
        <div className="admin-nav">
          {navGroups.map((group) => {
            const activeGroup = group.children.some((item) => item.key === panel);
            const open = activeMenu === group.key;
            return (
              <div className="admin-nav-group" key={group.key}>
                <button
                  className={`admin-nav-primary ${activeGroup ? 'active' : ''} ${open ? 'open' : ''}`}
                  onClick={() => setActiveMenu(group.key)}
                >
                  <span>{group.icon}</span>
                  <span>{group.name}</span>
                  <span className="arrow">⌄</span>
                </button>
                <div className={`admin-nav-children ${open ? 'open' : ''}`}>
                  {group.children.map((item) => (
                    <button
                      key={item.key}
                      className={`admin-nav-secondary ${panel === item.key ? 'active' : ''}`}
                      onClick={() => changePanel(item.key)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="admin-sidebar-foot">
          <button
            className={`admin-profile-card ${panel === 'admin-account' ? 'active' : ''}`}
            onClick={() => setShowProfileMenu((open) => !open)}
          >
            <div className="admin-profile-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.username || '管理员头像'} /> : (user?.username?.[0] || '管')}
            </div>
            <div className="admin-profile-main">
              <b>{user?.username || '平台管理员'}</b>
              <span>平台管理员 · 已登录</span>
            </div>
          </button>
          {showProfileMenu && (
            <>
              <div className="admin-profile-menu-mask" onClick={() => setShowProfileMenu(false)} />
              <div className="admin-profile-menu">
                <button onClick={() => { setPanel('admin-account'); setShowProfileMenu(false); }}>
                  <span>👤</span>
                  <b>个人中心</b>
                </button>
                <button className="danger" onClick={() => { logout(); nav('/admin/login'); }}>
                  <span>🚪</span>
                  <b>退出登录</b>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>
              {mode === 'star'
                ? '✦ 星空模式'
                : mode === 'star-content'
                  ? `${currentGroup?.icon || '✦'} ${currentGroup?.name || '星空'} / ${meta.icon} ${meta.name}`
                  : `${meta.icon} ${meta.name}`}
            </h1>
            <p>
              {mode === 'star'
                ? '一级星球展开二级星球，点击二级进入对应业务页面。'
                : mode === 'star-content'
                  ? '星空内容态：只保留当前一级与二级上下文，具体能力在页面内使用 Tab。'
                  : meta.desc}
            </p>
          </div>
          <div className="admin-top-actions">
            <button
              className={`admin-btn ${mode === 'star' || mode === 'star-content' ? 'primary' : ''}`}
              onClick={() => {
                if (mode === 'star') setMode('classic');
                else if (mode === 'star-content') openStarGroup();
                else openStarHome();
              }}
            >
              {mode === 'star' ? '☰ 经典' : mode === 'star-content' ? '✨ 返回星空' : '✨ 星空'}
            </button>
            {mode === 'star-content' && <button className="admin-btn" onClick={() => setMode('classic')}>经典模式</button>}
            <button className="admin-btn danger" onClick={() => { logout(); nav('/admin/login'); }}>退出</button>
          </div>
        </header>
        <section className="admin-content">
          {mode === 'star' ? (
            <StarModePanel
              activePanel={panel}
              initialGroupKey={starGroupKey}
              initialLevel={starLevel}
              onClassic={() => setMode('classic')}
              onSelect={(key) => {
                changePanel(key);
                setMode('star-content');
              }}
            />
          ) : (
            <>
              {mode === 'star-content' && (
                <div className="admin-star-content-crumb">
                  <button onClick={openStarHome}>星空首页</button>
                  <span>›</span>
                  <button onClick={() => openStarGroup(currentGroup?.key)}>{currentGroup?.icon} {currentGroup?.name}</button>
                  <span>›</span>
                  <strong>{meta.icon} {meta.name}</strong>
                </div>
              )}
              {panel === 'user-dashboard' && <UserDashboardPanel star={mode === 'star-content' && currentGroup?.key === 'boards'} />}
              {panel === 'ai-dashboard' && <PlaceholderPanel title="AI 看板" text="当前原型先展示静态结构；后续接 AI 调用统计接口后可替换为真实数据。" />}
              {panel === 'ops-dashboard' && <PlaceholderPanel title="运营看板" text="运营功能目前较少，等公告、推荐、活动等业务落地后再接数据。" />}
              {panel === 'log-dashboard' && <LogDashboardPanel />}
              {panel === 'user-management' && <UserManagementPanel />}
              {panel === 'feedback' && <FeedbackPanel />}
              {panel === 'skills' && <SkillPanel />}
              {panel === 'system' && <PlaceholderPanel title="系统配置" text="系统配置本期暂未接后端，适合后续放模型默认值、功能开关和公告配置。" />}
              {panel === 'admin-account' && <AdminAccountPanel />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminAccountPanel() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [modal, setModal] = useState<AdminAccountModalType>(null);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsCaptcha, setSmsCaptcha] = useState('');
  const [emailCaptcha, setEmailCaptcha] = useState('');
  const [smsCount, setSmsCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const openModal = (type: AdminAccountModalType) => {
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setEmail('');
    setSmsCaptcha('');
    setEmailCaptcha('');
    setModal(type);
  };

  const save = async () => {
    try {
      const body: Record<string, string> = {};
      if (modal === 'profile') {
        if (username && username !== user?.username) body.username = username;
        if (avatar && avatar !== user?.avatar) body.avatar = avatar;
      }
      if (modal === 'password') {
        if (!password) return showToast('请输入新密码');
        if (password !== confirmPassword) return showToast('两次密码不一致');
        body.password = password;
      }
      if (modal === 'phone') {
        if (!phone) return showToast('请输入新手机号');
        if (!smsCaptcha) return showToast('请输入短信验证码');
        body.phone = phone;
        body.smsCaptcha = smsCaptcha;
      }
      if (modal === 'email') {
        if (!email) return showToast('请输入新邮箱');
        if (!emailCaptcha) return showToast('请输入邮箱验证码');
        body.email = email;
        body.emailCaptcha = emailCaptcha;
      }
      await api.updateProfile(body);
      const latest = await api.getUserInfo();
      setUser(latest);
      setModal(null);
      showToast('保存成功');
    } catch (e: any) {
      showToast(e.message || '保存失败');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      const uploaded = await uploadFile<{ url: string }>(file);
      if (!uploaded.url) return showToast('头像上传失败');
      setAvatar(uploaded.url);
      showToast('头像上传成功');
    } catch (e: any) {
      showToast(e.message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const sendSms = async () => {
    if (smsCount > 0 || !phone) return;
    try {
      await api.sendSmsCode(phone);
      showToast('验证码已发送');
      setSmsCount(60);
      const timer = window.setInterval(() => {
        setSmsCount((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      showToast(e.message || '发送失败');
    }
  };

  const sendEmailCode = async () => {
    if (emailCount > 0 || !email) return;
    try {
      await api.sendEmailCode(email);
      showToast('验证码已发送');
      setEmailCount(60);
      const timer = window.setInterval(() => {
        setEmailCount((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      showToast(e.message || '发送失败');
    }
  };

  return (
    <div className="admin-panel admin-account-page">
      <div className="admin-account-shell">
        <div className="admin-account-hero">
          <div className="admin-account-avatar">
            {user?.avatar ? <img src={user.avatar} alt={user.username || '管理员头像'} /> : (user?.username?.[0] || '管')}
          </div>
          <h2>{user?.username || '超级管理员'}</h2>
          <span>超级管理员</span>
        </div>

        <div className="admin-account-info">
          <AdminAccountRow label="账号" value={user?.account || '-'} />
          <AdminAccountRow label="邮箱" value={user?.email || '未绑定'} />
          <AdminAccountRow label="手机号" value={user?.phone || '未绑定'} />
          <AdminAccountRow label="最后登录" value={formatDate(user?.lastLoginTime)} />
          <AdminAccountRow label="注册时间" value={formatDate(user?.createTime)} />
        </div>

        <div className="admin-account-actions">
          <button onClick={() => openModal('profile')}>✏️ 编辑资料</button>
          <button onClick={() => openModal('password')}>🔒 修改密码</button>
          <button onClick={() => openModal('phone')}>📱 换绑手机</button>
          <button onClick={() => openModal('email')}>📧 换绑邮箱</button>
        </div>
      </div>

      {modal && (
        <div className="admin-account-edit-mask" onClick={() => setModal(null)}>
          <div className="admin-account-edit" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'profile' ? '编辑资料' : modal === 'password' ? '修改密码' : modal === 'phone' ? '换绑手机' : '换绑邮箱'}</h3>
            {modal === 'profile' && (
              <>
                <AdminAccountField label="用户名">
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
                </AdminAccountField>
                <AdminAccountField label="头像">
                  <div className="admin-account-upload-row">
                    <div className="admin-account-upload-avatar">
                      {avatar ? <img src={avatar} alt="头像预览" /> : (username?.[0] || '管')}
                    </div>
                    <label>
                      {uploading ? '上传中...' : '上传头像'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </AdminAccountField>
              </>
            )}
            {modal === 'password' && (
              <>
                <AdminAccountField label="新密码">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6-26 位新密码" />
                </AdminAccountField>
                <AdminAccountField label="确认新密码">
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入新密码" />
                </AdminAccountField>
              </>
            )}
            {modal === 'phone' && (
              <>
                <AdminAccountField label="新手机号">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入新手机号" />
                </AdminAccountField>
                <AdminAccountField label="短信验证码">
                  <div className="admin-account-code-row">
                    <input value={smsCaptcha} onChange={(e) => setSmsCaptcha(e.target.value)} placeholder="请输入验证码" />
                    <button onClick={sendSms}>{smsCount > 0 ? `${smsCount}s` : '获取'}</button>
                  </div>
                </AdminAccountField>
              </>
            )}
            {modal === 'email' && (
              <>
                <AdminAccountField label="新邮箱">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入新邮箱" />
                </AdminAccountField>
                <AdminAccountField label="邮箱验证码">
                  <div className="admin-account-code-row">
                    <input value={emailCaptcha} onChange={(e) => setEmailCaptcha(e.target.value)} placeholder="请输入验证码" />
                    <button onClick={sendEmailCode}>{emailCount > 0 ? `${emailCount}s` : '获取'}</button>
                  </div>
                </AdminAccountField>
              </>
            )}
            <div className="admin-account-edit-actions">
              <button className="primary" onClick={save}>保存</button>
              <button onClick={() => setModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

function AdminAccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-account-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function AdminAccountField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-account-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StarModePanel({
  activePanel,
  initialGroupKey,
  initialLevel,
  onClassic,
  onSelect,
}: {
  activePanel: AdminPanelKey;
  initialGroupKey: string;
  initialLevel: StarNavigationLevel;
  onClassic: () => void;
  onSelect: (key: AdminPanelKey) => void;
}) {
  const [activeGroupKey, setActiveGroupKey] = useState(() => {
    return initialGroupKey || navGroups.find((group) => group.children.some((child) => child.key === activePanel))?.key || navGroups[0].key;
  });
  const [level, setLevel] = useState<StarNavigationLevel>(initialLevel);
  const activeGroup = navGroups.find((group) => group.key === activeGroupKey) || navGroups[0];

  const openGroup = (groupKey: string) => {
    setActiveGroupKey(groupKey);
    setLevel('secondary');
  };

  const openPanel = (key: AdminPanelKey) => {
    onSelect(key);
  };

  return (
    <div className={`admin-star-panel admin-star-${level}`}>
      <div className="admin-star-nebula one" />
      <div className="admin-star-nebula two" />
      <div className="admin-star-milkyway" />
      <div className="admin-star-dots" />
      <div className="admin-star-top">
        <div>
          <b>智语同航 · 控制台</b>
          <span>{level === 'primary' ? '一级星球 · 选择导航分组' : `${activeGroup.name} · 点击二级星球进入页面`}</span>
        </div>
        <button className="admin-star-switch" onClick={onClassic}>☰ 经典模式</button>
      </div>

      {level === 'primary' && (
        <div className="admin-galaxy">
          <div className="admin-star-core">
            <span>语</span>
            <b>智语同航</b>
            <em>Super Admin</em>
          </div>
          <div className="admin-star-orbit-ring ring-one" />
          <div className="admin-star-orbit-ring ring-two" />
          {navGroups.map((group, index) => (
            <button
              key={group.key}
              className={`admin-star-planet admin-star-planet-${index + 1} ${activeGroupKey === group.key ? 'active' : ''}`}
              onClick={() => openGroup(group.key)}
            >
              <span className="admin-orbit-label">
                <span>{group.icon}</span>
                <b>{group.name}</b>
                <em>{group.children.length} 个入口</em>
              </span>
            </button>
          ))}
        </div>
      )}

      {level === 'secondary' && (
        <div className="admin-satellite-layer">
          <div className="admin-satellite-core">
            <span>{activeGroup.icon}</span>
            <b>{activeGroup.name}</b>
            <em>{activeGroup.children.length} 个入口</em>
          </div>
          <div className="admin-satellite-ring ring-main" />
          <div className="admin-satellite-ring ring-far" />
          <div className="admin-star-orbit-ring ring-one" />
          <div className="admin-star-orbit-ring ring-two" />
          <div className="admin-satellite-grid">
            {activeGroup.children.map((item, index) => (
              <button
                className={`admin-satellite admin-satellite-${index + 1} ${activePanel === item.key ? 'active' : ''}`}
                key={item.key}
                onClick={() => openPanel(item.key)}
              >
                <span className="admin-orbit-label">
                  <span>{item.icon}</span>
                  <b>{item.name}</b>
                  <em>{item.desc}</em>
                </span>
              </button>
            ))}
          </div>
          <div className="admin-star-path">
            <button onClick={() => setLevel('primary')}>星空首页</button>
            <span>›</span>
            <b>{activeGroup.icon} {activeGroup.name}</b>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-panel">
      <div className="admin-card">
        <h2>{title}</h2>
        <p className="admin-muted">{text}</p>
      </div>
    </div>
  );
}

function UserDashboardPanel({ star = false }: { star?: boolean }) {
  const [summary, setSummary] = useState<UserDashboardSummary>({});
  const [trend, setTrend] = useState<UserTrendItem[]>([]);
  const [structure, setStructure] = useState<UserDashboardStructure>({});
  const [online, setOnline] = useState<DashboardOnline>({ onlineCount: 0, users: [] });
  const [recent, setRecent] = useState<RecentRegisterUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [userType, setUserType] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [s, t, st, o, r] = await Promise.all([
        adminApi.userSummary(),
        adminApi.userTrend(),
        adminApi.userStructure(),
        adminApi.userDashboardOnline(keyword, userType),
        adminApi.recentRegisters(100),
      ]);
      setSummary(s || {});
      setTrend(t || []);
      setStructure(st || {});
      setOnline(o || { onlineCount: 0, users: [] });
      setRecent(r || []);
    } catch (e: any) {
      setError(e.message || '用户看板加载失败');
    }
  };

  useEffect(() => { load(); }, []);

  const stats = [
    ['总用户数', summary.totalUsers?.value, compareText(summary.totalUsers)],
    ['今日新增', summary.todayNewUsers?.value, compareText(summary.todayNewUsers)],
    ['本月新增', summary.monthNewUsers?.value, compareText(summary.monthNewUsers)],
    ['DAU', summary.dau?.value, `活跃率 ${summary.dau?.activeRate ?? '-'}%`],
    ['WAU', summary.wau?.value, `活跃率 ${summary.wau?.activeRate ?? '-'}%`],
    ['MAU', summary.mau?.value, `活跃率 ${summary.mau?.activeRate ?? '-'}%`],
  ];
  const maxTrend = Math.max(1, ...trend.map((item) => item.newUsers || 0));
  const typeItems = normalizeStructureItems(structure.typeDistribution || structure.userTypes || structure.typeItems || []);
  const statusItems = normalizeStructureItems(structure.statusDistribution || structure.statuses || structure.statusItems || []);

  return (
    <div className={`admin-panel ${star ? 'admin-star-dashboard' : ''}`}>
      <ErrorBlock error={error} />
      <div className="admin-grid-stats">
        {stats.map(([label, value, delta]) => (
          <div className="admin-stat" key={label}>
            <div className="label">{label}</div>
            <div className="value">{formatNumber(value as number)}</div>
            <div className="delta">{delta as string}</div>
          </div>
        ))}
      </div>
      <div className="admin-board-grid">
        <div className="admin-card">
          <h2>用户增长趋势 <span className="admin-muted">默认最近 7 天</span></h2>
          <div className="admin-chart">
            {trend.length ? (
              <div className="admin-bars">
                {trend.map((item) => (
                  <div className="admin-bar" key={item.date} title={`${item.date}: ${item.newUsers || 0}`} style={{ height: `${Math.max(4, ((item.newUsers || 0) / maxTrend) * 100)}%` }} />
                ))}
              </div>
            ) : <EmptyBlock />}
          </div>
        </div>
        <div className="admin-card">
          <h2>当前在线 <span className="admin-muted">auth:user:token</span></h2>
          <div className="admin-toolbar">
            <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="用户名模糊搜索" />
            <select className="admin-select" value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="">全部类型</option>
              <option value="student">学生</option>
              <option value="teacher">老师</option>
            </select>
            <button className="admin-btn primary" onClick={load}>查询</button>
          </div>
          <div className="admin-stat" style={{ marginBottom: 10 }}>
            <div className="label">在线人数</div>
            <div className="value">{online.onlineCount || 0}</div>
          </div>
          <div className="admin-online-list">
            {online.users?.length ? online.users.map((user) => (
              <div className="admin-online-row" key={user.userId}>
                <span className="admin-dot" />
                <span>{user.username || user.account || user.userId} <span className="admin-muted">{user.userTypeName || enumText(user.userType)}</span></span>
                <span className="admin-muted">{formatDate(user.lastLoginTime)}</span>
              </div>
            )) : <EmptyBlock text="暂无在线用户" />}
          </div>
        </div>
      </div>
      <div className="admin-two">
        <StructureCard title="用户类型" items={typeItems} />
        <StructureCard title="账号状态" items={statusItems} />
      </div>
      <div className="admin-card">
        <h2>最近注册</h2>
        <DataTable
          columns={['用户', '账号', '类型', '状态', '最近登录', '注册时间']}
          rows={recent.map((user) => [
            user.username || '-',
            user.account || '-',
            enumText(user.userTypeName || user.userTypeText || user.userType),
            enumText(user.statusName || user.statusText || user.status),
            formatDate(user.lastLoginTime),
            formatDate(user.createTime),
          ])}
        />
      </div>
    </div>
  );
}

function StructureCard({ title, items }: { title: string; items: StructureItemLike[] }) {
  const colors = ['#3ddc97', '#7b8cff', '#ffb454', '#ff6b8a', '#616d8a'];
  const segments = items.length
    ? items.reduce<{ start: number; parts: string[] }>((acc, item, index) => {
      const percent = Math.max(0, Number(item.percent || 0));
      const end = acc.start + percent;
      acc.parts.push(`${colors[index % colors.length]} ${acc.start}% ${end}%`);
      acc.start = end;
      return acc;
    }, { start: 0, parts: [] }).parts
    : [];
  const pieBackground = segments.length ? `conic-gradient(${segments.join(', ')})` : undefined;

  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {items.length ? (
        <div className="admin-structure-chart">
          <div className="admin-pie" style={{ background: pieBackground }} />
          <div className="admin-pie-legend">
            {items.map((item, index) => (
              <div className="admin-pie-row" key={`${item.name || item.type || item.status}-${index}`}>
                <span className="admin-pie-dot" style={{ background: colors[index % colors.length] }} />
                <span className="admin-pie-name">{item.name || item.userTypeName || item.statusName || enumText(item.userType || item.type || item.status)}</span>
                <b>{formatNumber(item.value ?? item.count ?? 0)}</b>
                <em>{item.percent ?? '-'}%</em>
              </div>
            ))}
          </div>
        </div>
      ) : <EmptyBlock />}
    </div>
  );
}

function normalizeStructureItems(items: StructureItemLike[]) {
  return items.map((item) => ({
    ...item,
    name: item.name || item.userTypeName || item.statusName || enumText(item.userType || item.type || item.status),
    value: item.value ?? item.count ?? 0,
  }));
}

type StructureItemLike = {
  name?: string;
  userType?: string;
  userTypeName?: string;
  type?: string;
  status?: string;
  statusName?: string;
  value?: number;
  count?: number;
  percent?: number;
};

const userManageTabs: Array<{ key: UserManageTabKey; icon: string; name: string; desc: string }> = [
  { key: 'all-users', icon: '👥', name: '全部用户', desc: '查询、状态、类型与密码' },
  { key: 'online-users', icon: '🟢', name: '在线用户', desc: '在线查询与踢出' },
  { key: 'disabled-users', icon: '⛔', name: '禁用用户', desc: '禁用理由后续扩展' },
  { key: 'operation-records', icon: '🧾', name: '操作记录', desc: 'AOP 行为日志后续接入' },
];

function UserManagementPanel() {
  const [tab, setTab] = useState<UserManageTabKey>('all-users');
  const active = userManageTabs.find((item) => item.key === tab) || userManageTabs[0];

  return (
    <div className="admin-panel">
      <div className="admin-page-tabs">
        {userManageTabs.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? 'active' : ''}
            onClick={() => setTab(item.key)}
          >
            <span>{item.icon}</span>
            <b>{item.name}</b>
            <em>{item.desc}</em>
          </button>
        ))}
      </div>

      <div className="admin-page-tab-body">
        {tab === 'all-users' && <AllUsersPanel embedded />}
        {tab === 'online-users' && <OnlineUsersPanel embedded />}
        {tab === 'disabled-users' && (
          <PlaceholderPanel
            title={`${active.icon} ${active.name}`}
            text="禁用用户能力已预留，后续补充禁用理由、禁用来源、解禁审批等字段后再接入。"
          />
        )}
        {tab === 'operation-records' && (
          <PlaceholderPanel
            title={`${active.icon} ${active.name}`}
            text="操作记录后续统一走超管行为日志/AOP 注解记录，这里只筛选用户模块相关动作。"
          />
        )}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<React.ReactNode>> }) {
  if (!rows.length) return <EmptyBlock />;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPager({
  current,
  pages,
  total,
  loading,
  onChange,
}: {
  current: number;
  pages: number;
  total: number;
  loading?: boolean;
  onChange: (page: number) => void;
}) {
  const safePages = Math.max(1, pages || 1);
  const safeCurrent = Math.min(Math.max(1, current || 1), safePages);
  const start = Math.max(1, Math.min(safeCurrent - 2, safePages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, safePages) }, (_, index) => start + index)
    .filter((page) => page <= safePages);

  return (
    <div className="admin-pagination">
      <span>共 {total || 0} 条 · 第 {safeCurrent} / {safePages} 页</span>
      <div className="admin-page-buttons">
        <button className="admin-btn" disabled={safeCurrent <= 1 || loading} onClick={() => onChange(safeCurrent - 1)}>上一页</button>
        {start > 1 && (
          <>
            <button className="admin-btn" disabled={loading} onClick={() => onChange(1)}>1</button>
            <span className="admin-page-ellipsis">...</span>
          </>
        )}
        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`admin-btn admin-page-number ${page === safeCurrent ? 'active' : ''}`}
            disabled={page === safeCurrent || loading}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < safePages && (
          <>
            <span className="admin-page-ellipsis">...</span>
            <button className="admin-btn" disabled={loading} onClick={() => onChange(safePages)}>{safePages}</button>
          </>
        )}
        <button className="admin-btn" disabled={safeCurrent >= safePages || loading} onClick={() => onChange(safeCurrent + 1)}>下一页</button>
      </div>
    </div>
  );
}

function AllUsersPanel({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<PageResult<ManagedUser>>({ records: [], total: 0, size: 20, current: 1 });
  const [keyword, setKeyword] = useState('');
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');
  const [batchStatus, setBatchStatus] = useState('1');
  const [batchUserType, setBatchUserType] = useState('student');
  const [batchModal, setBatchModal] = useState<AllUsersBatchModalType>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  const load = async (pageNum = data.current || 1) => {
    setError('');
    try {
      const res = await adminApi.allUsers({ pageNum, pageSize: 20, keyword, userType, status });
      setData(res);
      setSelected([]);
    } catch (e: any) {
      setError(e.message || '用户列表加载失败');
    }
  };

  useEffect(() => { load(1); }, []);

  const updateUsers = async (ids: number[], kind: 'status' | 'type', value: string | number) => {
    if (!ids.length) {
      setError('请先选择用户');
      return false;
    }
    try {
      if (kind === 'status') await adminApi.batchUpdateStatus(ids, Number(value));
      else await adminApi.batchUpdateType(ids, String(value));
      await load();
      return true;
    } catch (e: any) {
      setError(e.message || '操作失败');
      return false;
    }
  };

  const batch = async (kind: 'status' | 'type', value: string | number) => {
    return updateUsers(selected, kind, value);
  };

  const openBatchModal = (kind: Exclude<AllUsersBatchModalType, null>) => {
    if (!selected.length) {
      setError('请先选择用户');
      return;
    }
    setError('');
    setBatchModal(kind);
  };

  const confirmBatch = async () => {
    if (!batchModal) return;
    const value = batchModal === 'status' ? batchStatus : batchUserType;
    const success = await batch(batchModal, value);
    if (success) setBatchModal(null);
  };

  const resetPassword = async (userId: number) => {
    const pwd = window.prompt('请输入新密码，长度 6-26 位');
    if (!pwd) return;
    try {
      await adminApi.resetPassword(userId, pwd);
      await load();
    } catch (e: any) {
      setError(e.message || '重置失败');
    }
  };

  return (
    <div className={embedded ? 'admin-panel-embedded' : 'admin-panel'}>
      <div className="admin-card">
        <h2>全部用户</h2>
        <div className="admin-toolbar">
          <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="用户名 / 账号 / 手机 / 邮箱" />
          <select className="admin-select" value={userType} onChange={(e) => setUserType(e.target.value)}>
            <option value="">全部类型</option><option value="student">学生</option><option value="teacher">老师</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option><option value="1">启用</option><option value="0">禁用</option>
          </select>
          <button className="admin-btn primary" onClick={() => load(1)}>查询</button>
          <button className="admin-btn" onClick={() => openBatchModal('status')}>批量修改账号状态</button>
          <button className="admin-btn" onClick={() => openBatchModal('type')}>批量修改角色</button>
        </div>
        <ErrorBlock error={error} />
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>选择</th><th>用户</th><th>账号</th><th>类型</th><th>状态</th><th>在线</th><th>最后登录</th><th>注册时间</th><th>操作</th></tr></thead>
            <tbody>
              {data.records.map((user) => (
                <tr key={user.id}>
                  <td><input type="checkbox" checked={selected.includes(user.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id))} /></td>
                  <td>{user.username || '-'}</td>
                  <td>{user.account || '-'}</td>
                  <td><span className="admin-pill">{user.userTypeText || enumText(user.userType)}</span></td>
                  <td><span className={`admin-pill ${statusIsDisabled(user.status) ? 'err' : 'ok'}`}>{user.statusText || enumText(user.status)}</span></td>
                  <td>{user.online ? <span className="admin-pill ok">在线</span> : <span className="admin-muted">离线</span>}</td>
                  <td>{formatDate(user.lastLoginTime)}</td>
                  <td>{formatDate(user.createTime)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-btn" onClick={() => resetPassword(user.id)}>重置密码</button>
                      {statusIsDisabled(user.status) ? (
                        <button className="admin-btn" onClick={() => updateUsers([user.id], 'status', 1)}>启用</button>
                      ) : (
                        <button className="admin-btn danger" onClick={() => updateUsers([user.id], 'status', 0)}>禁用</button>
                      )}
                      {userTypeIs(user, 'teacher') ? (
                        <button className="admin-btn" onClick={() => updateUsers([user.id], 'type', 'student')}>设为学生</button>
                      ) : (
                        <button className="admin-btn" onClick={() => updateUsers([user.id], 'type', 'teacher')}>设为老师</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.records.length && <EmptyBlock />}
        </div>
      </div>
      {batchModal && (
        <div className="admin-account-edit-mask">
          <div className="admin-account-edit">
            <h3>{batchModal === 'status' ? '批量修改账号状态' : '批量修改角色'}</h3>
            <AdminAccountField label={`已选择 ${selected.length} 个用户`}>
              {batchModal === 'status' ? (
                <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)}>
                  <option value="1">启用</option>
                  <option value="0">禁用</option>
                </select>
              ) : (
                <select value={batchUserType} onChange={(e) => setBatchUserType(e.target.value)}>
                  <option value="student">学生</option>
                  <option value="teacher">老师</option>
                </select>
              )}
            </AdminAccountField>
            <div className="admin-account-edit-actions">
              <button className="primary" onClick={confirmBatch}>确认修改</button>
              <button onClick={() => setBatchModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineUsersPanel({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState({ pageNum: 1, pageSize: 20, total: 0, totalOnline: 0, studentOnline: 0, teacherOnline: 0, records: [] as ManagedUser[] });
  const [keyword, setKeyword] = useState('');
  const [userType, setUserType] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await adminApi.onlineUsers({ pageNum: 1, pageSize: 50, keyword, userType });
      setData(res);
      setSelected([]);
    } catch (e: any) {
      setError(e.message || '在线用户加载失败');
    }
  };
  useEffect(() => { load(); }, []);

  const kick = async (ids = selected) => {
    if (!ids.length) return setError('请先选择在线用户');
    try {
      await adminApi.kickOnlineUsers(ids);
      await load();
    } catch (e: any) {
      setError(e.message || '踢出失败');
    }
  };

  return (
    <div className={embedded ? 'admin-panel-embedded' : 'admin-panel'}>
      <div className="admin-grid-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="admin-stat"><div className="label">当前在线</div><div className="value">{data.totalOnline}</div></div>
        <div className="admin-stat"><div className="label">在线学生</div><div className="value">{data.studentOnline}</div></div>
        <div className="admin-stat"><div className="label">在线老师</div><div className="value">{data.teacherOnline}</div></div>
      </div>
      <div className="admin-card">
        <h2>在线用户</h2>
        <div className="admin-toolbar">
          <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="用户名模糊搜索" />
          <select className="admin-select" value={userType} onChange={(e) => setUserType(e.target.value)}>
            <option value="">全部类型</option><option value="student">学生</option><option value="teacher">老师</option>
          </select>
          <button className="admin-btn primary" onClick={load}>查询</button>
          <button className="admin-btn danger" onClick={() => kick()}>批量踢出</button>
        </div>
        <ErrorBlock error={error} />
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>选择</th><th>用户</th><th>账号</th><th>类型</th><th>最后登录</th><th>操作</th></tr></thead>
            <tbody>
              {data.records.map((user) => (
                <tr key={user.id}>
                  <td><input type="checkbox" checked={selected.includes(user.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id))} /></td>
                  <td>{user.username || '-'}</td>
                  <td>{user.account || '-'}</td>
                  <td>{user.userTypeText || enumText(user.userType)}</td>
                  <td>{formatDate(user.lastLoginTime)}</td>
                  <td><button className="admin-btn danger" onClick={() => kick([user.id])}>踢出</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.records.length && <EmptyBlock text="暂无在线用户" />}
        </div>
      </div>
    </div>
  );
}

function LogDashboardPanel() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [activeFile, setActiveFile] = useState('');
  const [content, setContent] = useState<LogContent | null>(null);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('ALL');
  const [tail, setTail] = useState(1000);
  const [refreshMinutes, setRefreshMinutes] = useState(5);
  const [error, setError] = useState('');

  const loadFiles = async () => {
    const res = await adminApi.logFiles();
    setFiles(res || []);
    const current = res.find((file) => file.current)?.fileName || res[0]?.fileName || '';
    if (!activeFile && current) setActiveFile(current);
    return current;
  };

  const loadContent = async (fileName = activeFile) => {
    if (!fileName) return;
    setError('');
    try {
      const res = await adminApi.logContent({ fileName, keyword, level, tail, all: tail === 0 });
      setContent(res);
    } catch (e: any) {
      setError(e.message || '日志内容加载失败');
    }
  };

  useEffect(() => {
    loadFiles()
      .then((file) => {
        if (file) {
          return loadContent(file);
        }
      })
      .catch((e) => setError(e.message || '日志文件加载失败'));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => loadContent(), refreshMinutes * 60 * 1000);
    return () => window.clearInterval(id);
  }, [activeFile, keyword, level, tail, refreshMinutes]);

  return (
    <div className="admin-panel">
      <div className="admin-grid-stats" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-stat"><div className="label">日志文件</div><div className="value">{files.length}</div></div>
        <div className="admin-stat"><div className="label">命中日志</div><div className="value">{content?.matchedEntries ?? '-'}</div></div>
        <div className="admin-stat"><div className="label">ERROR</div><div className="value">{content?.errorCount ?? '-'}</div></div>
        <div className="admin-stat"><div className="label">WARN</div><div className="value">{content?.warnCount ?? '-'}</div></div>
      </div>
      <ErrorBlock error={error} />
      <div className="admin-log-layout">
        <div className="admin-card" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <h2>日志内容 <span className="admin-muted">{activeFile}</span></h2>
          <div className="admin-toolbar">
            <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="关键字" />
            <select className="admin-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="admin-select" value={tail} onChange={(e) => setTail(Number(e.target.value))}>
              <option value={500}>Tail 500</option><option value={1000}>Tail 1000</option><option value={5000}>Tail 5000</option><option value={20000}>Tail 20000</option><option value={0}>全量</option>
            </select>
            <select className="admin-select" value={refreshMinutes} onChange={(e) => setRefreshMinutes(Number(e.target.value))}>
              {[5, 15, 25, 35, 45].map((item) => <option key={item} value={item}>{item}分钟</option>)}
            </select>
            <button className="admin-btn primary" onClick={() => loadContent()}>刷新</button>
          </div>
          <div className="admin-log-body">
            {content?.entries?.length ? content.entries.map((entry, index) => (
              <div className="admin-log-line" key={index}>
                <span className="admin-muted">{entry.time}</span> <span className={entry.level === 'ERROR' ? 'admin-pill err' : entry.level === 'WARN' ? 'admin-pill warn' : 'admin-pill'}>{entry.level}</span> {entry.content}
              </div>
            )) : <EmptyBlock />}
          </div>
        </div>
        <div className="admin-card" style={{ overflow: 'auto' }}>
          <h2>日志文件</h2>
          {files.map((file) => (
            <div className={`admin-file-item ${activeFile === file.fileName ? 'active' : ''}`} key={file.fileName} onClick={() => { setActiveFile(file.fileName); loadContent(file.fileName); }}>
              <span>{file.fileName}</span><span>{file.fileSizeText}</span>
              <span className="admin-muted">{formatDate(file.lastModifiedTime)}</span><span>{file.current ? '当前' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackPanel() {
  const [data, setData] = useState<PageResult<FeedbackItem>>({ records: [], total: 0, size: 20, current: 1 });
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [activeFeedback, setActiveFeedback] = useState<FeedbackItem | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setData(await adminApi.feedbacks({ pageNum: 1, pageSize: 50, keyword, status }));
    } catch (e: any) {
      setError(e.message || '反馈加载失败');
    }
  };
  useEffect(() => { load(); }, []);

  const process = async (item: FeedbackItem) => {
    if (item.status === 'PROCESSING') {
      setActiveFeedback(item);
      setReplyContent('');
      return;
    }
    if (item.status !== 'PENDING') {
      setActiveFeedback(item);
      setReplyContent(item.replyContent || '');
      return;
    }
    try {
      await adminApi.processFeedback(item.id);
      await load();
    } catch (e: any) {
      setError(e.message || '处理失败');
    }
  };

  const resolveFeedback = async () => {
    if (!activeFeedback || activeFeedback.status !== 'PROCESSING') return;
    try {
      await adminApi.processFeedback(activeFeedback.id, replyContent);
      setActiveFeedback(null);
      setReplyContent('');
      await load();
    } catch (e: any) {
      setError(e.message || '处理失败');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-card">
        <h2>反馈管理</h2>
        <div className="admin-toolbar">
          <input className="admin-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编号 / 标题 / 内容" />
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option><option value="PENDING">待处理</option><option value="PROCESSING">处理中</option><option value="REPLIED">已回复</option>
          </select>
          <button className="admin-btn primary" onClick={load}>查询</button>
        </div>
        <ErrorBlock error={error} />
        <DataTable
          columns={['编号', '类型', '标题', '用户', '状态', '内容', '时间', '操作']}
          rows={data.records.map((item) => [
            item.feedbackNo || '-',
            item.typeText || enumText(item.type),
            item.title || '-',
            item.username || item.account || '-',
            <span key="status" className="admin-pill">{item.statusText || enumText(item.status)}</span>,
            <span key="content" title={item.content}>{(item.content || '').slice(0, 42)}</span>,
            formatDate(item.createTime),
            <button key="action" className="admin-btn" onClick={() => process(item)}>{item.status === 'PENDING' ? '受理' : item.status === 'PROCESSING' ? '解决' : '查看'}</button>,
          ])}
        />
      </div>
      {activeFeedback && (
        <div className="admin-account-edit-mask">
          <div className="admin-feedback-modal">
            <div className="admin-feedback-modal-head">
              <div>
                <h3>{activeFeedback.status === 'PROCESSING' ? '解决反馈' : '反馈详情'}</h3>
                <span>{activeFeedback.feedbackNo || '-'}</span>
              </div>
              <button onClick={() => setActiveFeedback(null)}>×</button>
            </div>
            <div className="admin-feedback-detail">
              <div><span>标题</span><b>{activeFeedback.title || '-'}</b></div>
              <div><span>用户</span><b>{activeFeedback.username || activeFeedback.account || '-'}</b></div>
              <div><span>类型</span><b>{activeFeedback.typeText || enumText(activeFeedback.type)}</b></div>
              <div><span>状态</span><b>{activeFeedback.statusText || enumText(activeFeedback.status)}</b></div>
              <div><span>时间</span><b>{formatDate(activeFeedback.createTime)}</b></div>
            </div>
            <label className="admin-account-field">
              <span>反馈内容</span>
              <textarea className="admin-textarea" value={activeFeedback.content || ''} readOnly />
            </label>
            {activeFeedback.status === 'PROCESSING' ? (
              <label className="admin-account-field">
                <span>回复内容（可以为空）</span>
                <textarea className="admin-textarea" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="请输入给用户的处理说明" />
              </label>
            ) : (
              <label className="admin-account-field">
                <span>回复内容</span>
                <textarea className="admin-textarea" value={activeFeedback.replyContent || '暂无回复'} readOnly />
              </label>
            )}
            <div className="admin-account-edit-actions">
              {activeFeedback.status === 'PROCESSING' && <button className="primary" onClick={resolveFeedback}>确认解决</button>}
              <button onClick={() => setActiveFeedback(null)}>{activeFeedback.status === 'PROCESSING' ? '取消' : '关闭'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillPanel() {
  const pageSize = 10;
  const [data, setData] = useState<PageResult<SkillItem>>({ records: [], total: 0, size: pageSize, current: 1 });
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<SkillDetail | null>(null);
  const [form, setForm] = useState({ name: '', description: '', skillContent: '', overwrite: false });
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (pageNum = data.current || 1, keyword = name) => {
    setError('');
    setLoading(true);
    try {
      setData(await adminApi.skills({ pageNum, pageSize, name: keyword.trim() || undefined }));
    } catch (e: any) {
      setError(e.message || 'Skill 加载失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(1); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', description: '', skillContent: '', overwrite: false });
  };

  const openCreate = () => {
    setError('');
    resetForm();
    setModal('create');
  };

  const openDetail = async (item: SkillItem, nextModal: 'edit' | 'view') => {
    try {
      const detail = await adminApi.skillDetail(item.name);
      setEditing(detail);
      setForm({ name: detail.name, description: detail.description || '', skillContent: detail.skillContent || '', overwrite: true });
      setModal(nextModal);
    } catch (e: any) {
      setError(e.message || '详情加载失败');
    }
  };

  const closeModal = () => {
    setModal(null);
    resetForm();
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Skill 名称不能为空');
    try {
      if (editing) await adminApi.updateSkill(editing.name, { description: form.description, skillContent: form.skillContent });
      else await adminApi.createSkill(form);
      closeModal();
      await load(editing ? data.current : 1);
    } catch (e: any) {
      setError(e.message || '保存失败');
    }
  };

  const remove = async (item: SkillItem) => {
    if (!window.confirm(`确定删除 ${item.name} 吗？`)) return;
    try {
      await adminApi.deleteSkill(item.name);
      const nextPage = data.records.length === 1 && data.current > 1 ? data.current - 1 : data.current;
      await load(nextPage);
    } catch (e: any) {
      setError(e.message || '删除失败');
    }
  };

  const clearSearch = () => {
    setName('');
    load(1, '');
  };

  const totalPages = data.pages || Math.max(1, Math.ceil((data.total || 0) / (data.size || pageSize)));

  return (
    <div className="admin-panel">
      <section className="admin-card admin-skill-manager">
        <div className="admin-skill-card-head">
          <div>
            <h2>Skill 列表</h2>
            <p>按名称查询、查看、编辑或删除 AgentScope Skill。</p>
          </div>
          <div className="admin-skill-head-actions">
            <span className="admin-skill-count">共 {data.total || 0} 条</span>
            <button className="admin-btn primary" onClick={openCreate}>新增 Skill</button>
          </div>
        </div>

        <div className="admin-toolbar">
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入 Skill 名称查询" onKeyDown={(e) => { if (e.key === 'Enter') load(1); }} />
          <button className="admin-btn primary" onClick={() => load(1)}>{loading ? '查询中' : '查询'}</button>
          {name && <button className="admin-btn" onClick={clearSearch}>清空</button>}
        </div>
        <ErrorBlock error={error} />

        <div className="admin-table-wrap">
          <table className="admin-table admin-skill-table">
            <thead>
              <tr>
                <th>Skill 名称</th>
                <th>描述</th>
                <th>来源</th>
                <th>创建时间</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((item) => (
                <tr key={item.name}>
                  <td><strong className="admin-skill-name">{item.name}</strong></td>
                  <td className="admin-skill-desc">{item.description || '暂无描述'}</td>
                  <td><span className="admin-pill">{item.source || 'native'}</span></td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{formatDate(item.updatedAt)}</td>
                  <td>
                    <div className="admin-row-actions admin-skill-row-actions">
                      <button className="admin-btn" onClick={() => openDetail(item, 'view')}>查看</button>
                      <button className="admin-btn" onClick={() => openDetail(item, 'edit')}>编辑</button>
                      <button className="admin-btn danger" onClick={() => remove(item)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.records.length && <EmptyBlock text={loading ? '正在加载 Skill...' : '暂无 Skill'} />}
        </div>

        <AdminPager
          current={data.current || 1}
          pages={totalPages}
          total={data.total || 0}
          loading={loading}
          onChange={(nextPage) => load(nextPage)}
        />
      </section>

      {modal && (
        <div className="admin-account-edit-mask" onClick={closeModal}>
          <div className="admin-account-edit admin-skill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-skill-modal-head">
              <div>
                <h3>{modal === 'create' ? '新增 Skill' : modal === 'edit' ? '编辑 Skill' : '查看 Skill'}</h3>
                {modal !== 'create' && <strong>{form.name}</strong>}
                <p>{modal === 'view' ? '查看当前 Skill 的描述和完整内容。' : '维护 AgentScope 可调用的 Skill 名称、说明与内容。'}</p>
              </div>
              <button onClick={closeModal}>×</button>
            </div>
            <div className={`admin-skill-modal-form ${modal !== 'create' ? 'without-name' : ''}`}>
              {modal === 'create' && (
                <AdminAccountField label="Skill 名称">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如 english_writing_rubric" />
                </AdminAccountField>
              )}
              <AdminAccountField label="Skill 描述">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="说明这个 Skill 适合什么时候调用、解决什么问题" disabled={modal === 'view'} />
              </AdminAccountField>
              <AdminAccountField label="Skill 内容">
                <textarea className="admin-skill-content-textarea" value={form.skillContent} onChange={(e) => setForm({ ...form, skillContent: e.target.value })} placeholder="写入可被 AgentScope 使用的 Skill 内容" disabled={modal === 'view'} />
              </AdminAccountField>
            </div>
            {modal === 'create' && (
              <label className="admin-skill-checkbox">
                <input type="checkbox" checked={form.overwrite} onChange={(e) => setForm({ ...form, overwrite: e.target.checked })} />
                <span>如果名称已存在，覆盖同名 Skill</span>
              </label>
            )}
            <div className="admin-account-edit-actions">
              {modal !== 'view' && <button className="primary" onClick={save}>{modal === 'create' ? '确认新增' : '保存修改'}</button>}
              <button onClick={closeModal}>{modal === 'view' ? '关闭' : '取消'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
