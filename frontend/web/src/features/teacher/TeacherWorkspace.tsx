import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, BookOpen, Check, ChevronRight, CirclePause, Copy, GraduationCap, History, Languages, LayoutGrid, Link2, LogOut, Menu, Moon, Pencil, Play, RefreshCw, Search, Sparkles, Square, Sun, UserRound, Users, X } from 'lucide-react';
import { api, useAppStore } from '../../stores/appStore';
import { isTeacherUser } from '../../lib/authRole';
import { AccountPage } from '../../components/AccountPage';
import { HelpPage } from '../../components/HelpPage';
import { AudioSettings } from '../../components/AudioSettings';
import { ShortcutSettings } from '../../components/ShortcutSettings';
import { ApiKeyConfig } from '../../components/ApiKeyConfig';
import { TermLibraryPage } from '../../components/TermLibraryPage';
import { AboutPage } from '../../components/AboutPage';
import { TeacherLearningArea } from './TeacherLearning';
import { TeacherClassroomList } from './TeacherClassroomList';
import { learningGroups, utilityGroups } from './teacherLearningCatalog';
import { teachingApi, type ClassroomDetail, type ClassroomInput, type ClassroomList, type MemberDetail, type MemberList, type PageResult, type SessionDetail, type SessionList, type SessionStudentDetail, type SessionStudentList } from './teachingApi';
import './teacher-console.css';
import './teacher-workspace.css';

type Dialog = 'create' | 'edit' | 'invite' | 'start' | 'rename' | 'member' | 'student' | null;
type DetailTab = 'overview' | 'members' | 'sessions';
const languages: Record<string, string> = { english: '英语', japanese: '日语', korean: '韩语' };
const grades: Record<string, string> = Object.fromEntries([
  ...Array.from({ length: 6 }, (_, i) => [`primary_${i + 1}`, `小学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`junior_${i + 1}`, `初中${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`senior_${i + 1}`, `高中${i + 1}年级`]),
  ...Array.from({ length: 4 }, (_, i) => [`university_${i + 1}`, `大学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`postgraduate_${i + 1}`, `研究生${i + 1}年级`]),
]);
const semesters: Record<string, string> = { FIRST: '第一学期', SECOND: '第二学期' };
const sessionNames: Record<number, string> = { 1: '进行中', 2: '已暂停', 3: '已结束' };
const joinNames: Record<string, string> = { INVITE_CODE: '课堂码', INVITE_LINK: '邀请链接', TEACHER_ADD: '老师添加' };
const emptyForm: ClassroomInput = { name: '', languageCode: 'english', stageCode: null, academicYear: null, semesterCode: null, description: '' };
const SIZE = 12;

function dateText(value: string | null | undefined) {
  if (!value) return '—';
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}
function descriptionText(value: string | null) {
  if (!value) return '暂未填写课堂说明';
  return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() || '暂未填写课堂说明';
}
function message(error: unknown) { return error instanceof Error ? error.message : '操作失败，请稍后重试'; }

export function TeacherWorkspace() {
  const user = useAppStore(state => state.user);
  const token = useAppStore(state => state.token);
  const setUser = useAppStore(state => state.setUser);
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [, , page = 'classrooms', rawId] = location.pathname.split('/');
  const entityId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const isUtilityTool = page === 'tools' && utilityGroups.some(group => group.items.some(item => item.id === rawId));
  const [classrooms, setClassrooms] = useState<PageResult<ClassroomList> | null>(null);
  const [classroomPage, setClassroomPage] = useState(1);
  const [classroomKeyword, setClassroomKeyword] = useState('');
  const [classroomStatus, setClassroomStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [room, setRoom] = useState<ClassroomDetail | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [members, setMembers] = useState<PageResult<MemberList> | null>(null);
  const [memberPage, setMemberPage] = useState(1);
  const [memberKeyword, setMemberKeyword] = useState('');
  const [sessions, setSessions] = useState<PageResult<SessionList> | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionKeyword, setSessionKeyword] = useState('');
  const [sessionStatus, setSessionStatus] = useState<'all' | 'running' | 'paused' | 'ended'>('all');
  const [historyRoom, setHistoryRoom] = useState<number | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [students, setStudents] = useState<PageResult<SessionStudentList> | null>(null);
  const [studentPage, setStudentPage] = useState(1);
  const [studentKeyword, setStudentKeyword] = useState('');
  const [attendance, setAttendance] = useState<'all' | 'present' | 'absent'>('all');
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [studentDetail, setStudentDetail] = useState<SessionStudentDetail | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<ClassroomInput>(emptyForm);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [memberName, setMemberName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [inviteMode, setInviteMode] = useState<'code' | 'link'>('code');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [accountMenu, setAccountMenu] = useState<'top' | 'bottom' | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user || !token) return;
    api.getUserInfo().then(setUser).catch(() => { logout(); navigate('/login'); });
  }, [user, token, setUser, logout, navigate]);
  useEffect(() => { if (user && !isTeacherUser(user)) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  const reload = () => setRevision(value => value + 1);
  const go = (path: string) => { navigate(path); setMobileNav(false); setAccountMenu(null); setError(''); };
  const toast = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200); };
  const act = async (action: () => Promise<unknown>, success: string, after?: () => void) => {
    setBusy(true);
    try { await action(); setError(''); setDialog(null); toast(success); reload(); after?.(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  };

  // 列表页使用后端分页；其它视图只加载导航所需的最近 100 个课堂。
  useEffect(() => {
    if (!user || !isTeacherUser(user)) return;
    let cancelled = false;
    const list = page === 'classrooms' && !entityId;
    setLoading(true);
    teachingApi.pageClassrooms(list ? classroomPage : 1, list ? SIZE : 100, list ? {
      keyword: classroomKeyword.trim() || null,
      status: classroomStatus === 'all' ? null : classroomStatus === 'active' ? 1 : 0,
    } : {}).then(data => { if (!cancelled) { setClassrooms(data); setError(''); } })
      .catch(cause => { if (!cancelled) setError(message(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, page, entityId, classroomPage, classroomKeyword, classroomStatus, revision]);

  useEffect(() => {
    if (!user || page !== 'classrooms' || !entityId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      teachingApi.classroom(entityId),
      teachingApi.pageMembers(entityId, memberPage, SIZE, memberKeyword.trim()),
      teachingApi.pageSessions(entityId, sessionPage, SIZE, {
        keyword: sessionKeyword.trim() || null,
        status: sessionStatus === 'all' ? null : { running: 1, paused: 2, ended: 3 }[sessionStatus],
      }),
    ]).then(([detail, memberData, sessionData]) => {
      if (!cancelled) { setRoom(detail); setMembers(memberData); setSessions(sessionData); setError(''); }
    }).catch(cause => { if (!cancelled) setError(message(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, page, entityId, memberPage, memberKeyword, sessionPage, sessionKeyword, sessionStatus, revision]);

  useEffect(() => {
    if (!user || page !== 'sessions' || !entityId) return;
    let cancelled = false;
    const load = () => Promise.all([
      teachingApi.session(entityId),
      teachingApi.pageSessionStudents(entityId, studentPage, SIZE, {
        studentName: studentKeyword.trim() || null,
        checkInStatus: attendance === 'all' ? null : attendance === 'present' ? 1 : 0,
      }),
    ]).then(([detail, studentData]) => {
      if (!cancelled) { setSession(detail); setStudents(studentData); setError(''); }
    }).catch(cause => { if (!cancelled) setError(message(cause)); });
    setLoading(true);
    void load().finally(() => { if (!cancelled) setLoading(false); });
    const timer = window.setInterval(() => { void load(); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [user, page, entityId, studentPage, studentKeyword, attendance, revision]);

  useEffect(() => {
    if (!user || page !== 'sessions' || entityId || !historyRoom) return;
    let cancelled = false;
    setLoading(true);
    teachingApi.pageSessions(historyRoom, sessionPage, SIZE, {
      keyword: sessionKeyword.trim() || null,
      status: sessionStatus === 'all' ? null : { running: 1, paused: 2, ended: 3 }[sessionStatus],
    }).then(data => { if (!cancelled) { setSessions(data); setError(''); } })
      .catch(cause => { if (!cancelled) setError(message(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, page, entityId, historyRoom, sessionPage, sessionKeyword, sessionStatus, revision]);

  const openInvite = (mode: 'code' | 'link') => { setInviteMode(mode); setDialog('invite'); setError(''); };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast('已复制到剪贴板'); }
    catch { setError('复制失败，请手动复制'); }
  };

  return <div className="teacher-shell">
    {mobileNav && <button className="teacher-nav-mask" aria-label="关闭导航" onClick={() => setMobileNav(false)} />}
    <aside className={`teacher-sidebar ${mobileNav ? 'open' : ''}`}>
      <button className="teacher-brand" onClick={() => go('/teacher/classrooms')}><span className="teacher-brand-mark"><Languages size={20} /></span><span><strong>智语同航</strong><small>教师空间</small></span></button>
      <nav className="teacher-nav">
        <NavGroup label="教学空间">
          <NavItem icon={<LayoutGrid />} label="我的课堂" active={page === 'classrooms'} onClick={() => go('/teacher/classrooms')} />
          <NavItem icon={<History />} label="上课记录" active={page === 'sessions'} onClick={() => go('/teacher/sessions')} />
          <NavItem icon={<Sparkles />} label="学生视角" active={page === 'preview' || page === 'tools' && !isUtilityTool} onClick={() => go('/teacher/preview')} />
          <NavItem icon={<BookOpen />} label="通用工具" active={page === 'utilities' || isUtilityTool} onClick={() => go('/teacher/utilities')} />
        </NavGroup>
      </nav>
      <div className="teacher-profile"><button className="teacher-profile-trigger" aria-expanded={accountMenu === 'bottom'} onClick={() => setAccountMenu(value => value === 'bottom' ? null : 'bottom')}><span className="teacher-avatar">{user?.avatar ? <img src={user.avatar} alt="教师头像" /> : user?.username?.slice(0, 1) || '师'}</span><strong>{user?.username || '老师'}</strong><ChevronRight size={15} /></button>{accountMenu === 'bottom' && <><button className="teacher-account-dismiss" aria-label="关闭个人菜单" onClick={() => setAccountMenu(null)} /><TeacherAccountMenu onGo={go} onLogout={() => { logout(); navigate('/login'); }} /></>}</div>
    </aside>
    <main className="teacher-main">
      <header className="teacher-topbar"><button className="teacher-menu" aria-label="打开导航" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div><strong>{page === 'classrooms' ? room?.name || '我的课堂' : page === 'sessions' ? session?.sessionName || '上课记录' : page === 'preview' ? '学生视角' : page === 'utilities' || isUtilityTool ? utilityGroups.flatMap(group => group.items).find(item => item.id === rawId)?.label || '通用工具' : page === 'tools' ? learningGroups.flatMap(group => group.items).find(item => item.id === rawId)?.label || '学生侧功能' : page === 'profile' ? '个人中心' : '我的课堂'}</strong><span>{page === 'classrooms' ? '课堂与成员管理' : page === 'sessions' ? '课次与学生出勤' : page === 'utilities' || isUtilityTool ? 'PPT、Word 与 Excel' : page === 'preview' || page === 'tools' ? '看看学生使用的功能' : '教学空间'}</span></div><div className="teacher-top-actions"><button className="teacher-icon-button" title="刷新数据" aria-label="刷新数据" onClick={reload}><RefreshCw size={17} /></button><label className="teacher-theme-control">{theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}<select aria-label="选择背景" value={theme} onChange={event => setTheme(event.target.value)}><option value="light">浅色背景</option><option value="dark">深色背景</option></select></label><button className="teacher-exit-button" onClick={() => { logout(); navigate('/login'); }}><LogOut size={15} />退出</button><div className="teacher-account-anchor">{accountMenu === 'top' && <button className="teacher-account-dismiss" aria-label="关闭个人菜单" onClick={() => setAccountMenu(null)} />}<button className="teacher-user-button" aria-label="打开个人菜单" aria-expanded={accountMenu === 'top'} onClick={() => setAccountMenu(value => value === 'top' ? null : 'top')}>{user?.avatar ? <img src={user.avatar} alt="教师头像" /> : user?.username?.slice(0, 1) || '师'}</button>{accountMenu === 'top' && <TeacherAccountMenu onGo={go} onLogout={() => { logout(); navigate('/login'); }} />}</div></div></header>
      <div className="teacher-content">
        {error && <div className="teacher-alert" role="alert"><span>{error}</span><button onClick={() => { setError(''); reload(); }}>重试</button></div>}
        {page === 'classrooms' && !entityId && <TeacherClassroomList
          data={classrooms}
          loading={loading}
          error={error}
          keyword={classroomKeyword}
          status={classroomStatus}
          page={classroomPage}
          onKeywordChange={value => { setClassroomKeyword(value); setClassroomPage(1); }}
          onStatusChange={value => { setClassroomStatus(value); setClassroomPage(1); }}
          onPageChange={setClassroomPage}
          onCreate={() => { setForm(emptyForm); setDialog('create'); }}
          onOpen={id => go(`/teacher/classrooms/${id}`)}
        />}
        {page === 'classrooms' && entityId && room?.id === entityId && <div className="teacher-page"><button className="teacher-back" onClick={() => go('/teacher/classrooms')}><ArrowLeft size={16} />返回课堂列表</button><section className="teacher-class-hero"><div className="teacher-class-hero-top"><div><span className="teacher-state">{room.status === 1 ? '正常课堂' : '已归档'}</span><h1>{room.name}</h1><p>{languages[room.languageCode]} · {grades[room.stageCode || ''] || '未设置年级'} · {room.academicYear || '未设置学年'} {semesters[room.semesterCode || ''] || ''}</p></div><div>{room.status === 1 && <><button className="teacher-secondary" onClick={() => openInvite('code')}><Copy size={16} />邀请学生</button><button className="teacher-primary" onClick={() => { setSessionName(''); setDialog('start'); }}><Play size={16} />开始上课</button></>}</div></div><div className="teacher-class-hero-stats"><span><strong>{members?.total ?? '—'}</strong>{memberKeyword ? '筛选成员' : '课堂成员'}</span>{room.status === 1 ? <button onClick={() => openInvite('code')}><strong>{room.inviteCode}</strong>课堂码</button> : <span><strong>已停用</strong>课堂码</span>}<span><strong>{sessions?.total ?? '—'}</strong>{sessionKeyword || sessionStatus !== 'all' ? '筛选课次' : '累计课次'}</span></div></section><div className="teacher-detail-tabs">{(['overview', 'members', 'sessions'] as const).map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value === 'overview' ? '课堂概览' : value === 'members' ? `成员管理 ${members?.total ?? ''}` : `上课记录 ${sessions?.total ?? ''}`}</button>)}</div>
          {tab === 'overview' && <div className="teacher-detail-columns"><section className="teacher-card"><CardHead title="课堂信息" subtitle="教学安排与课堂说明" action={room.status === 1 ? '编辑资料' : undefined} onAction={() => { setEditName(room.name); setEditDescription(room.description || ''); setDialog('edit'); }} /><div className="teacher-info-grid"><Info label="语言" value={languages[room.languageCode]} /><Info label="学习阶段" value={grades[room.stageCode || ''] || '未设置'} /><Info label="学年" value={room.academicYear || '未设置'} /><Info label="学期" value={semesters[room.semesterCode || ''] || '未设置'} /></div><div className="teacher-description"><span>课堂说明</span><p>{descriptionText(room.description)}</p></div><div className="teacher-inline-actions">{room.status === 1 && <button className="teacher-secondary" onClick={() => { if (window.confirm(`归档“${room.name}”后不能继续开课或修改资料，确定归档吗？`)) void act(() => teachingApi.archiveClassroom(room.id), '课堂已归档'); }}><Archive size={15} />归档课堂</button>}</div></section>{room.status === 1 && <aside className="teacher-card teacher-invite-card"><CardHead title="邀请学生" subtitle="学生通过课堂码自行加入" /><strong>{room.inviteCode}</strong><span>当前有效课堂码</span><button className="teacher-primary" onClick={() => void copy(room.inviteCode)}><Copy size={16} />复制课堂码</button><button className="teacher-secondary" onClick={() => openInvite('link')}><Link2 size={16} />邀请链接</button></aside>}</div>}
          {tab === 'members' && <section className="teacher-card"><CardHead title="课堂成员" subtitle="老师可修改成员姓名或移除成员" action={room.status === 1 ? '邀请学生' : undefined} onAction={() => openInvite('code')} /><div className="teacher-list-toolbar"><label><Search size={16} /><input value={memberKeyword} onChange={event => { setMemberKeyword(event.target.value); setMemberPage(1); }} placeholder="搜索学生姓名" /></label></div>{members?.records.length ? <div className="teacher-table"><div className="teacher-table-row head"><span>学生</span><span>学生用户 ID</span><span>加入方式</span><span>加入时间</span><span>操作</span></div>{members.records.map(item => <div className="teacher-table-row" key={item.id}><span className="teacher-person"><i>{item.studentName.slice(0, 1)}</i><b>{item.studentName}</b></span><span>{item.studentId}</span><span>{joinNames[item.joinType] || item.joinType}</span><span>{dateText(item.joinedTime)}</span><span className="teacher-cell-actions"><button onClick={() => { void teachingApi.member(item.id).then(value => { setMemberDetail(value); setDialog('member'); }).catch(cause => setError(message(cause))); }}>详情</button><button onClick={() => { setMemberName(item.studentName); setMemberDetail({ ...item, classroomId: room.id, updateTime: '' }); setDialog('rename'); }}><Pencil size={14} />修改</button><button onClick={() => { if (window.confirm(`确定移除 ${item.studentName} 吗？`)) void act(() => teachingApi.removeMember(item.id), '成员已移除'); }}>移除</button></span></div>)}</div> : room.status === 1 ? <Empty text={loading ? '正在加载成员…' : '还没有学生加入'} action="邀请学生" onClick={() => openInvite('code')} /> : <p className="teacher-archived-empty">{loading ? '正在加载成员…' : '没有符合条件的课堂成员'}</p>}<Pager data={members} page={memberPage} setPage={setMemberPage} /></section>}
          {tab === 'sessions' && <section className="teacher-card"><CardHead title="上课记录" subtitle="每次开课都会生成学生名单与签到记录" action={room.status === 1 ? '开始上课' : undefined} onAction={() => { setSessionName(''); setDialog('start'); }} /><SessionFilters keyword={sessionKeyword} setKeyword={value => { setSessionKeyword(value); setSessionPage(1); }} status={sessionStatus} setStatus={value => { setSessionStatus(value); setSessionPage(1); }} /><SessionRows data={sessions} onOpen={id => go(`/teacher/sessions/${id}`)} /><Pager data={sessions} page={sessionPage} setPage={setSessionPage} /></section>}
        </div>}
        {page === 'classrooms' && entityId && room?.id !== entityId && !loading && !error && <Empty text="未找到课堂" action="返回列表" onClick={() => go('/teacher/classrooms')} />}
        {page === 'sessions' && !entityId && <div className="teacher-page"><PageHead eyebrow="SESSIONS" title="上课记录" subtitle="先选择课堂，再查看课次与签到名单。" /><div className="teacher-picker"><label>选择课堂 <select value={historyRoom || ''} onChange={event => { setHistoryRoom(Number(event.target.value) || null); setSessionPage(1); setSessions(null); }}><option value="">请选择课堂</option>{classrooms?.records.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{(classrooms?.total || 0) > 100 && <button onClick={() => go('/teacher/classrooms')}>从课堂列表选择更多课堂</button>}</div>{historyRoom ? <section className="teacher-card"><CardHead title={classrooms?.records.find(item => item.id === historyRoom)?.name || '课堂课次'} subtitle="课次状态和开始时间" /><SessionFilters keyword={sessionKeyword} setKeyword={value => { setSessionKeyword(value); setSessionPage(1); }} status={sessionStatus} setStatus={value => { setSessionStatus(value); setSessionPage(1); }} /><SessionRows data={sessions} onOpen={id => go(`/teacher/sessions/${id}`)} /><Pager data={sessions} page={sessionPage} setPage={setSessionPage} /></section> : <Empty text="选择一个课堂查看上课记录" action="前往课堂" onClick={() => go('/teacher/classrooms')} />}</div>}
        {page === 'sessions' && entityId && session?.id === entityId && <div className="teacher-page"><button className="teacher-back" onClick={() => go(`/teacher/classrooms/${session.classroomId}`)}><ArrowLeft size={16} />返回课堂</button><section className="teacher-session-hero"><div><span>{sessionNames[session.status]}</span><h1>{session.sessionName}</h1><p>{classrooms?.records.find(item => item.id === session.classroomId)?.name || '课堂'} · {dateText(session.startTime)}</p></div><div className="teacher-session-controls">{session.status === 1 && <button disabled={busy} onClick={() => void act(() => teachingApi.pauseSession(session.id), '课次已暂停')}><CirclePause size={17} />暂停</button>}{session.status === 2 && <button disabled={busy} onClick={() => void act(() => teachingApi.resumeSession(session.id), '课次已继续')}><Play size={17} />继续</button>}{session.status !== 3 && <button className="end" disabled={busy} onClick={() => { if (window.confirm('确定结束本次课次吗？结束后不能继续签到。')) void act(() => teachingApi.endSession(session.id), '课次已结束'); }}><Square size={15} />结束课次</button>}</div></section><div className="teacher-session-stats"><span><small>{studentKeyword || attendance !== 'all' ? '筛选学生' : '学生人数'}</small><strong>{students?.total ?? '—'}</strong></span><span><small>课次状态</small><strong>{sessionNames[session.status]}</strong></span><span><small>首次开课</small><strong>{dateText(session.startTime)}</strong></span><span><small>结束时间</small><strong>{dateText(session.endTime)}</strong></span></div><section className="teacher-card"><CardHead title="学生签到" subtitle="学生自行签到；每 15 秒刷新记录" action="立即刷新" onAction={reload} /><div className="teacher-list-toolbar"><label><Search size={16} /><input value={studentKeyword} onChange={event => { setStudentKeyword(event.target.value); setStudentPage(1); }} placeholder="搜索学生姓名" /></label><div className="teacher-filter">{(['all', 'present', 'absent'] as const).map(value => <button key={value} className={attendance === value ? 'active' : ''} onClick={() => { setAttendance(value); setStudentPage(1); }}>{value === 'all' ? '全部' : value === 'present' ? '已到课' : '未签到'}</button>)}</div></div>{students?.records.length ? <div className="teacher-table"><div className="teacher-table-row head"><span>学生</span><span>学生用户 ID</span><span>签到状态</span><span>签到时间</span><span>操作</span></div>{students.records.map(item => <div className="teacher-table-row" key={item.id}><span className="teacher-person"><i>{item.studentName.slice(0, 1)}</i><b>{item.studentName}</b></span><span>{item.studentId}</span><span className={item.checkInStatus === 1 ? 'teacher-present' : 'teacher-absent'}>{item.checkInStatus === 1 ? '已到课' : '未签到'}</span><span>{dateText(item.checkInTime)}</span><span className="teacher-cell-actions"><button onClick={() => { void teachingApi.sessionStudent(item.id).then(value => { setStudentDetail(value); setDialog('student'); }).catch(cause => setError(message(cause))); }}>详情</button></span></div>)}</div> : <Empty text={loading ? '正在加载签到记录…' : '没有符合条件的学生记录'} action="刷新" onClick={reload} />}<Pager data={students} page={studentPage} setPage={setStudentPage} /></section></div>}
        {page === 'sessions' && entityId && session?.id !== entityId && !loading && !error && <Empty text="未找到课次" action="返回上课记录" onClick={() => go('/teacher/sessions')} />}
        {page === 'profile' && <div className="teacher-account-page"><AccountPage /></div>}
        {page === 'help' && <Embedded title="帮助与反馈"><HelpPage /></Embedded>}
        {(page === 'preview' || page === 'tools' && !isUtilityTool) && <TeacherLearningArea kind="student" activeId={page === 'tools' ? rawId === 'materials' ? 'vocab' : rawId : undefined} onOpen={id => go(`/teacher/tools/${id}`)} onHome={() => go('/teacher/preview')} />}
        {(page === 'utilities' || isUtilityTool) && <TeacherLearningArea kind="utility" activeId={rawId} onOpen={id => go(`/teacher/utilities/${id}`)} onHome={() => go('/teacher/utilities')} />}
        {page === 'settings' && rawId === 'audio' && <Embedded title="音频设备"><AudioSettings /></Embedded>}
        {page === 'settings' && rawId === 'shortcuts' && <Embedded title="快捷键"><ShortcutSettings /></Embedded>}
        {page === 'settings' && rawId === 'api-key' && <Embedded title="API Key 配置"><ApiKeyConfig /></Embedded>}
        {page === 'settings' && rawId === 'term-library' && <Embedded title="术语库"><TermLibraryPage /></Embedded>}
        {page === 'settings' && rawId === 'about' && <Embedded title="关于"><AboutPage /></Embedded>}
      </div>
    </main>
    {dialog === 'create' && <Modal title="创建课堂" subtitle="创建后自动生成课堂码" onClose={() => setDialog(null)}><Field label="课堂名称"><input autoFocus maxLength={64} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="例如：高一英语口语 2 班" /></Field><div className="teacher-form-grid"><Field label="教学语言"><select value={form.languageCode} onChange={event => setForm({ ...form, languageCode: event.target.value })}>{Object.entries(languages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field><Field label="学习阶段"><select value={form.stageCode || ''} onChange={event => setForm({ ...form, stageCode: event.target.value || null })}><option value="">暂不设置</option>{Object.entries(grades).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field></div><div className="teacher-form-grid"><Field label="学年"><input value={form.academicYear || ''} onChange={event => setForm({ ...form, academicYear: event.target.value || null })} placeholder="例如 2026-2027" /></Field><Field label="学期"><select value={form.semesterCode || ''} onChange={event => setForm({ ...form, semesterCode: event.target.value || null })}><option value="">暂不设置</option><option value="FIRST">第一学期</option><option value="SECOND">第二学期</option></select></Field></div><Field label="课堂说明"><textarea rows={4} maxLength={10000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="介绍教学目标、课堂安排" /></Field><Actions label="创建课堂" busy={busy} onCancel={() => setDialog(null)} onConfirm={() => { if (!form.name.trim()) return setError('课堂名称不能为空'); if (form.academicYear && !/^\d{4}-\d{4}$/.test(form.academicYear)) return setError('学年格式应为 YYYY-YYYY'); void act(async () => { const created = await teachingApi.createClassroom({ ...form, name: form.name.trim() }); setForm(emptyForm); go(`/teacher/classrooms/${created.id}`); }, '课堂已创建'); }} /></Modal>}
    {dialog === 'edit' && room && <Modal title="编辑课堂资料" subtitle="仅可修改名称和说明" onClose={() => setDialog(null)}><Field label="课堂名称"><input autoFocus maxLength={64} value={editName} onChange={event => setEditName(event.target.value)} /></Field><Field label="课堂说明"><textarea rows={5} maxLength={10000} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></Field><Actions label="保存修改" busy={busy} onCancel={() => setDialog(null)} onConfirm={() => { if (!editName.trim()) return setError('课堂名称不能为空'); void act(() => teachingApi.updateClassroom(room.id, { name: editName.trim(), description: editDescription.trim() }), '课堂资料已更新'); }} /></Modal>}
    {dialog === 'invite' && room?.status === 1 && <Modal title="邀请学生" subtitle={room.name} onClose={() => setDialog(null)}><div className="teacher-segmented"><button className={inviteMode === 'code' ? 'active' : ''} onClick={() => setInviteMode('code')}>课堂码</button><button className={inviteMode === 'link' ? 'active' : ''} onClick={() => setInviteMode('link')}>邀请链接</button></div><div className="teacher-share"><span>{inviteMode === 'code' ? <GraduationCap size={23} /> : <Link2 size={23} />}</span><h3>{inviteMode === 'code' ? '分享课堂码' : '分享邀请链接'}</h3>{inviteMode === 'code' ? <strong>{room.inviteCode}</strong> : <input readOnly value={`${window.location.origin}/join-classroom?code=${room.inviteCode}`} />}<p>学生登录后填写真实姓名并确认加入。</p><div className="teacher-code-buttons"><button className="teacher-primary" onClick={() => void copy(inviteMode === 'code' ? room.inviteCode : `${window.location.origin}/join-classroom?code=${room.inviteCode}`)}><Copy size={15} />复制{inviteMode === 'code' ? '课堂码' : '链接'}</button>{room.status === 1 && <button className="teacher-secondary" disabled={busy} onClick={() => { if (window.confirm('刷新后旧课堂码和邀请链接立即失效，确定刷新吗？')) void act(() => teachingApi.refreshInviteCode(room.id), '课堂码已刷新'); }}><RefreshCw size={15} />刷新课堂码</button>}</div></div></Modal>}
    {dialog === 'start' && room?.status === 1 && <Modal title="开始上课" subtitle={room.name} onClose={() => setDialog(null)}><div className="teacher-dialog-note"><Play size={19} />开课时将当前课堂成员保存为本次学生名单。</div><Field label="课次名称"><input autoFocus maxLength={64} value={sessionName} onChange={event => setSessionName(event.target.value)} placeholder="例如：第 1 课时 · 情境对话" /></Field><Actions label="开始上课" busy={busy} onCancel={() => setDialog(null)} onConfirm={() => { if (!sessionName.trim()) return setError('课次名称不能为空'); void act(async () => { const created = await teachingApi.startSession(room.id, sessionName.trim()); go(`/teacher/sessions/${created.id}`); }, '课次已开始'); }} /></Modal>}
    {dialog === 'rename' && memberDetail && <Modal title="修改成员姓名" subtitle={`学生用户 ID ${memberDetail.studentId}`} onClose={() => setDialog(null)}><Field label="课堂真实姓名"><input autoFocus maxLength={32} value={memberName} onChange={event => setMemberName(event.target.value)} /></Field><Actions label="保存修改" busy={busy} onCancel={() => setDialog(null)} onConfirm={() => { if (!memberName.trim()) return setError('学生真实姓名不能为空'); void act(() => teachingApi.updateMember(memberDetail.id, memberName.trim()), '成员姓名已更新'); }} /></Modal>}
    {dialog === 'member' && memberDetail && <Modal title="成员详情" subtitle={memberDetail.studentName} onClose={() => setDialog(null)}><DetailLines entries={[["学生用户 ID", String(memberDetail.studentId)], ["课堂成员 ID", String(memberDetail.id)], ["加入方式", joinNames[memberDetail.joinType] || memberDetail.joinType], ["加入时间", dateText(memberDetail.joinedTime)], ["更新时间", dateText(memberDetail.updateTime)]]} /></Modal>}
    {dialog === 'student' && studentDetail && <Modal title="课次学生记录" subtitle={studentDetail.studentName} onClose={() => setDialog(null)}><DetailLines entries={[["学生用户 ID", String(studentDetail.studentId)], ["课堂成员 ID", String(studentDetail.classroomMemberId)], ["课次记录 ID", String(studentDetail.id)], ["签到状态", studentDetail.checkInStatus === 1 ? '已到课' : '未签到'], ["签到时间", dateText(studentDetail.checkInTime)]]} /></Modal>}
    {dialog && error && <div className="teacher-toast teacher-error-toast" role="alert">{error}</div>}
    {notice && <div className="teacher-toast"><Check size={16} />{notice}</div>}
  </div>;
}

function TeacherAccountMenu({ onGo, onLogout }: { onGo: (path: string) => void; onLogout: () => void }) {
  return <div className="teacher-account-menu">
    <button onClick={() => onGo('/teacher/profile')}><UserRound size={15} />个人中心</button>
    <button onClick={() => onGo('/teacher/settings/audio')}>🎧 音频设备</button>
    <button onClick={() => onGo('/teacher/settings/shortcuts')}>⌨️ 快捷键</button>
    <button onClick={() => onGo('/teacher/settings/api-key')}>🔑 API Key 配置</button>
    <button onClick={() => onGo('/teacher/settings/term-library')}>📚 术语库</button>
    <button onClick={() => onGo('/teacher/help')}>❓ 帮助反馈</button>
    <button onClick={() => onGo('/teacher/settings/about')}>ℹ️ 关于</button>
    <button onClick={onLogout}><LogOut size={15} />退出登录</button>
  </div>;
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="teacher-nav-group"><span>{label}</span>{children}</div>; }
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button>; }
function PageHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) { return <header className="teacher-page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>; }
function CardHead({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) { return <div className="teacher-card-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ChevronRight size={14} /></button>}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ text, action, onClick }: { text: string; action: string; onClick: () => void }) { return <div className="teacher-empty-inline"><Users size={24} /><strong>{text}</strong><button onClick={onClick}>{action}</button></div>; }
function Pager({ data, page, setPage }: { data: PageResult<unknown> | null; page: number; setPage: (value: number) => void }) { if (!data || data.pages <= 1) return null; return <div className="teacher-pager"><span>共 {data.total} 条 · 第 {page}/{data.pages} 页</span><button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button><button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>下一页</button></div>; }
function SessionFilters({ keyword, setKeyword, status, setStatus }: { keyword: string; setKeyword: (value: string) => void; status: 'all' | 'running' | 'paused' | 'ended'; setStatus: (value: 'all' | 'running' | 'paused' | 'ended') => void }) { return <div className="teacher-list-toolbar"><label><Search size={16} /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索课次名称" /></label><div className="teacher-filter">{(['all', 'running', 'paused', 'ended'] as const).map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value === 'all' ? '全部' : value === 'running' ? '进行中' : value === 'paused' ? '已暂停' : '已结束'}</button>)}</div></div>; }
function SessionRows({ data, onOpen }: { data: PageResult<SessionList> | null; onOpen: (id: number) => void }) { return data?.records.length ? <div className="teacher-history-list">{data.records.map(item => <button key={item.id} onClick={() => onOpen(item.id)}><span className="teacher-session-icon"><BookOpen size={18} /></span><span><strong>{item.sessionName}</strong><small>{dateText(item.startTime)}</small></span><span className="teacher-session-state">{sessionNames[item.status]}</span><ChevronRight size={17} /></button>)}</div> : <div className="teacher-empty-inline"><BookOpen size={24} /><strong>暂无符合条件的课次</strong></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="teacher-field"><span>{label}</span>{children}</label>; }
function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) { return <div className="teacher-modal-mask" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="teacher-modal"><div className="teacher-modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button aria-label="关闭" onClick={onClose}><X size={18} /></button></div><div className="teacher-modal-body">{children}</div></div></div>; }
function Actions({ label, busy, onCancel, onConfirm }: { label: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) { return <div className="teacher-modal-actions"><button className="teacher-secondary" onClick={onCancel}>取消</button><button className="teacher-primary" disabled={busy} onClick={onConfirm}>{busy ? '处理中…' : label}</button></div>; }
function DetailLines({ entries }: { entries: [string, string][] }) { return <div className="teacher-detail-lines">{entries.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>; }
function Embedded({ title, children }: { title: string; children: React.ReactNode }) { return <div className="teacher-page"><PageHead eyebrow="TEACHING" title={title} subtitle="教师教学工具" /><div className="teacher-embedded-content">{children}</div></div>; }
