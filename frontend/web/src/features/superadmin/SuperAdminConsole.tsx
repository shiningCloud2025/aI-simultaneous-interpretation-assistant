import { useEffect, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
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
  | 'system';

type UserManageTabKey = 'all-users' | 'online-users' | 'disabled-users' | 'operation-records';

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
  navGroups.flatMap((group) => group.children.map((item) => [item.key, item]))
) as Record<AdminPanelKey, { key: AdminPanelKey; icon: string; name: string; desc: string }>;

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
    superadmin: '超管',
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
      nav('/admin', { replace: true });
    } catch (e: any) {
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
  const [mode, setMode] = useState<'classic' | 'star'>('classic');
  const logout = useAppStore((s) => s.logout);
  const nav = useNavigate();
  const meta = panelMeta[panel];

  const changePanel = (key: AdminPanelKey) => {
    setPanel(key);
    const group = navGroups.find((item) => item.children.some((child) => child.key === key));
    if (group) setActiveMenu(group.key);
  };

  return (
    <div className="admin-shell" data-mode={mode}>
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
        <div className="admin-sidebar-foot">一级导航展开二级，具体页面内按业务需要继续用 Tab。</div>
      </aside>}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{mode === 'star' ? '✦ 星空模式' : `${meta.icon} ${meta.name}`}</h1>
            <p>{mode === 'star' ? '一级星球展开二级星球，点击二级进入对应业务页面。' : meta.desc}</p>
          </div>
          <div className="admin-top-actions">
            <button className={`admin-btn ${mode === 'star' ? 'primary' : ''}`} onClick={() => setMode(mode === 'star' ? 'classic' : 'star')}>
              {mode === 'star' ? '☰ 经典' : '✨ 星空'}
            </button>
            <button className="admin-btn" onClick={() => nav('/dashboard')}>返回工作台</button>
            <button className="admin-btn danger" onClick={() => { logout(); nav('/admin/login'); }}>退出</button>
          </div>
        </header>
        <section className="admin-content">
          {mode === 'star' ? (
            <StarModePanel
              activePanel={panel}
              onClassic={() => setMode('classic')}
              onSelect={(key) => {
                changePanel(key);
                setMode('classic');
              }}
            />
          ) : (
            <>
              {panel === 'user-dashboard' && <UserDashboardPanel />}
              {panel === 'ai-dashboard' && <PlaceholderPanel title="AI 看板" text="当前原型先展示静态结构；后续接 AI 调用统计接口后可替换为真实数据。" />}
              {panel === 'ops-dashboard' && <PlaceholderPanel title="运营看板" text="运营功能目前较少，等公告、推荐、活动等业务落地后再接数据。" />}
              {panel === 'log-dashboard' && <LogDashboardPanel />}
              {panel === 'user-management' && <UserManagementPanel />}
              {panel === 'feedback' && <FeedbackPanel />}
              {panel === 'skills' && <SkillPanel />}
              {panel === 'system' && <PlaceholderPanel title="系统配置" text="系统配置本期暂未接后端，适合后续放模型默认值、功能开关和公告配置。" />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StarModePanel({
  activePanel,
  onClassic,
  onSelect,
}: {
  activePanel: AdminPanelKey;
  onClassic: () => void;
  onSelect: (key: AdminPanelKey) => void;
}) {
  const [activeGroupKey, setActiveGroupKey] = useState(() => {
    return navGroups.find((group) => group.children.some((child) => child.key === activePanel))?.key || navGroups[0].key;
  });
  const activeGroup = navGroups.find((group) => group.key === activeGroupKey) || navGroups[0];
  const primaryGroups = navGroups.filter((group) => group.key !== 'boards');

  return (
    <div className="admin-star-panel">
      <div className="admin-star-nebula one" />
      <div className="admin-star-nebula two" />
      <div className="admin-star-milkyway" />
      <div className="admin-star-dots" />
      <div className="admin-star-top">
        <div>
          <b>智语同航 · 控制台</b>
          <span>{activeGroup ? `${activeGroup.name} · 点击二级星球进入页面` : '选择一颗星球进入'}</span>
        </div>
        <button className="admin-star-switch" onClick={onClassic}>☰ 经典模式</button>
      </div>

      <div className="admin-galaxy">
        <button
          className={`admin-star-sun ${activeGroupKey === 'boards' ? 'active' : ''}`}
          onClick={() => setActiveGroupKey('boards')}
        >
          <span>📊</span>
          <b>看板</b>
          <em>Dashboard</em>
        </button>
        <div className="admin-star-orbit-ring ring-one" />
        <div className="admin-star-orbit-ring ring-two" />
        {primaryGroups.map((group, index) => (
          <button
            key={group.key}
            className={`admin-star-planet admin-star-planet-${index + 1} ${activeGroupKey === group.key ? 'active' : ''}`}
            onClick={() => setActiveGroupKey(group.key)}
          >
            <span>{group.icon}</span>
            <b>{group.name}</b>
            <em>{group.children.length} 个入口</em>
          </button>
        ))}
      </div>

      <div className="admin-satellite-layer">
        <div className="admin-satellite-core">
          <span>{activeGroup.icon}</span>
          <b>{activeGroup.name}</b>
        </div>
        <div className="admin-satellite-ring" />
        <div className="admin-satellite-grid">
          {activeGroup.children.map((item, index) => (
            <button
              className={`admin-satellite admin-satellite-${index + 1} ${activePanel === item.key ? 'active' : ''}`}
              key={item.key}
              onClick={() => onSelect(item.key)}
            >
              <span>{item.icon}</span>
              <b>{item.name}</b>
              <em>{item.desc}</em>
            </button>
          ))}
        </div>
        <div className="admin-star-path">
          <button onClick={() => setActiveGroupKey('boards')}>一级星球</button>
          <span>/</span>
          <b>{activeGroup.name}</b>
        </div>
      </div>
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

function UserDashboardPanel() {
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
  const typeItems = structure.userTypes || structure.typeItems || [];
  const statusItems = structure.statuses || structure.statusItems || [];

  return (
    <div className="admin-panel">
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
          columns={['用户', '账号', '类型', '状态', '注册时间']}
          rows={recent.map((user) => [
            user.username || '-',
            user.account || '-',
            enumText(user.userTypeText || user.userType),
            enumText(user.statusText),
            formatDate(user.createTime),
          ])}
        />
      </div>
    </div>
  );
}

function StructureCard({ title, items }: { title: string; items: StructureItemLike[] }) {
  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.name || item.type || item.status}-${index}`}>
                  <td>{item.name || enumText(item.type || item.status)}</td>
                  <td>{formatNumber(item.value)}</td>
                  <td><span className="admin-pill">{item.percent ?? '-'}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyBlock />}
    </div>
  );
}

type StructureItemLike = { name?: string; type?: string; status?: string; value: number; percent?: number };

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

function AllUsersPanel({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<PageResult<ManagedUser>>({ records: [], total: 0, size: 20, current: 1 });
  const [keyword, setKeyword] = useState('');
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');
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

  const batch = async (kind: 'status' | 'type', value: string | number) => {
    if (!selected.length) return setError('请先选择用户');
    try {
      if (kind === 'status') await adminApi.batchUpdateStatus(selected, Number(value));
      else await adminApi.batchUpdateType(selected, String(value));
      await load();
    } catch (e: any) {
      setError(e.message || '操作失败');
    }
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
          <button className="admin-btn" onClick={() => batch('status', 1)}>启用</button>
          <button className="admin-btn danger" onClick={() => batch('status', 0)}>禁用</button>
          <button className="admin-btn" onClick={() => batch('type', 'student')}>设为学生</button>
          <button className="admin-btn" onClick={() => batch('type', 'teacher')}>设为老师</button>
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
                  <td><button className="admin-btn" onClick={() => resetPassword(user.id)}>重置密码</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.records.length && <EmptyBlock />}
        </div>
      </div>
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
    const reply = item.status === 'PROCESSING' ? window.prompt('请输入回复内容，可以为空') || '' : undefined;
    try {
      await adminApi.processFeedback(item.id, reply);
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
    </div>
  );
}

function SkillPanel() {
  const [data, setData] = useState<PageResult<SkillItem>>({ records: [], total: 0, size: 20, current: 1 });
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<SkillDetail | null>(null);
  const [form, setForm] = useState({ name: '', description: '', skillContent: '', overwrite: false });
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setData(await adminApi.skills({ pageNum: 1, pageSize: 50, name }));
    } catch (e: any) {
      setError(e.message || 'Skill 加载失败');
    }
  };
  useEffect(() => { load(); }, []);

  const edit = async (item: SkillItem) => {
    try {
      const detail = await adminApi.skillDetail(item.name);
      setEditing(detail);
      setForm({ name: detail.name, description: detail.description || '', skillContent: detail.skillContent || '', overwrite: true });
    } catch (e: any) {
      setError(e.message || '详情加载失败');
    }
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Skill 名称不能为空');
    try {
      if (editing) await adminApi.updateSkill(editing.name, { description: form.description, skillContent: form.skillContent });
      else await adminApi.createSkill(form);
      setEditing(null);
      setForm({ name: '', description: '', skillContent: '', overwrite: false });
      await load();
    } catch (e: any) {
      setError(e.message || '保存失败');
    }
  };

  const remove = async (item: SkillItem) => {
    if (!window.confirm(`确定删除 ${item.name} 吗？`)) return;
    try {
      await adminApi.deleteSkill(item.name);
      await load();
    } catch (e: any) {
      setError(e.message || '删除失败');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-skill-editor">
        <div className="admin-card">
          <h2>{editing ? '修改 Skill' : '新增 Skill'}</h2>
          <div className="admin-form-grid">
            <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Skill 名称" disabled={!!editing} />
            <textarea className="admin-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Skill 描述" />
            <textarea className="admin-textarea" style={{ minHeight: 220 }} value={form.skillContent} onChange={(e) => setForm({ ...form, skillContent: e.target.value })} placeholder="Skill 内容" />
            {!editing && <label className="admin-muted"><input type="checkbox" checked={form.overwrite} onChange={(e) => setForm({ ...form, overwrite: e.target.checked })} /> 覆盖同名 Skill</label>}
            <button className="admin-btn primary" onClick={save}>{editing ? '保存修改' : '新增 Skill'}</button>
            {editing && <button className="admin-btn" onClick={() => { setEditing(null); setForm({ name: '', description: '', skillContent: '', overwrite: false }); }}>取消编辑</button>}
          </div>
        </div>
        <div className="admin-card">
          <h2>Skill 列表</h2>
          <div className="admin-toolbar">
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill 名称" />
            <button className="admin-btn primary" onClick={load}>查询</button>
          </div>
          <ErrorBlock error={error} />
          <DataTable
            columns={['名称', '描述', '来源', '更新时间', '操作']}
            rows={data.records.map((item) => [
              item.name,
              <span key="description" title={item.description}>{(item.description || '').slice(0, 52)}</span>,
              item.source || '-',
              formatDate(item.updatedAt),
              <span key="action"><button className="admin-btn" onClick={() => edit(item)}>编辑</button> <button className="admin-btn danger" onClick={() => remove(item)}>删除</button></span>,
            ])}
          />
        </div>
      </div>
    </div>
  );
}
