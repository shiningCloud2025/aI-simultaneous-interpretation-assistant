import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive, ArrowLeft, BookOpen, CalendarDays, Check, ChevronRight, CirclePause,
  ClipboardCheck, Clock3, Copy, GraduationCap, HelpCircle, History, Home,
  Languages, LayoutGrid, Link2, LogOut, Menu, MessageSquareText, MoreHorizontal,
  Play, Plus, RefreshCw, Search, Square, UserPlus, Users, X,
} from 'lucide-react';
import { api, useAppStore } from '../../stores/appStore';
import { AccountPage } from '../../components/AccountPage';
import { RealTimeTrans } from '../../components/RealTimeTrans';
import { EduWritingReview } from '../../components/EduWritingReview';
import { EduVocab } from '../../components/EduVocab';
import { HelpPage } from '../../components/HelpPage';
import { isTeacherUser } from '../../lib/authRole';
import {
  teacherRepository,
  type ClassroomSession,
  type CreateClassroomInput,
  type TeacherClassroom,
} from './teacherRepository';
import './teacher-console.css';

type Dialog = 'create' | 'invite' | 'member' | 'session' | null;
type DetailTab = 'overview' | 'members' | 'sessions';

const languageNames: Record<string, string> = { en: '英语', ja: '日语', ko: '韩语', fr: '法语', de: '德语', es: '西班牙语' };
const stageNames: Record<string, string> = { primary: '小学', junior: '初中', senior: '高中', university: '大学' };
const semesterNames: Record<string, string> = { FIRST: '上学期', SECOND: '下学期' };
const joinNames = { INVITE_CODE: '课堂码加入', INVITE_LINK: '邀请链接', TEACHER_ADD: '老师添加' };

const emptyClassroom: CreateClassroomInput = {
  name: '', languageCode: 'en', stageCode: 'senior', academicYear: '2026-2027', semesterCode: 'FIRST', description: '',
};

export function TeacherConsole() {
  const user = useAppStore(state => state.user);
  const token = useAppStore(state => state.token);
  const setUser = useAppStore(state => state.setUser);
  const logout = useAppStore(state => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const ownerKey = String(user?.id || user?.account || 'teacher');
  const [classrooms, setClassrooms] = useState(() => teacherRepository.list(ownerKey));
  const [dialog, setDialog] = useState<Dialog>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [accountMenu, setAccountMenu] = useState<'top' | 'side' | null>(null);
  const [toast, setToast] = useState('');
  const [classroomForm, setClassroomForm] = useState(emptyClassroom);
  const [memberForm, setMemberForm] = useState({ studentId: '', studentName: '' });
  const [sessionName, setSessionName] = useState('');
  const [inviteMode, setInviteMode] = useState<'link' | 'code' | 'direct'>('link');

  useEffect(() => {
    if (!user && token) {
      api.getUserInfo().then(setUser).catch(() => {
        logout();
        navigate('/login');
      });
    }
  }, [user, token, setUser, logout, navigate]);

  useEffect(() => {
    if (user && !isTeacherUser(user)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const segments = location.pathname.split('/').filter(Boolean);
  const page = segments[1] || 'dashboard';
  const entityId = segments[2];
  const selectedClassroom = page === 'classrooms' && entityId ? classrooms.find(item => item.id === entityId) : undefined;
  const sessionContext = page === 'sessions' && entityId
    ? classrooms.flatMap(classroom => classroom.sessions.map(session => ({ classroom, session }))).find(item => item.session.id === entityId)
    : undefined;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const go = (path: string) => {
    navigate(path);
    setMobileNav(false);
    setAccountMenu(null);
  };

  const refresh = (next: TeacherClassroom[]) => setClassrooms([...next]);
  const activeSessions = classrooms.flatMap(classroom => classroom.sessions.map(session => ({ classroom, session }))).filter(item => item.session.status !== 'ENDED');

  const createClassroom = () => {
    if (!classroomForm.name.trim()) return showToast('请填写课堂名称');
    const next = teacherRepository.create(ownerKey, classroomForm);
    refresh(next);
    setClassroomForm(emptyClassroom);
    setDialog(null);
    showToast('课堂创建成功，邀请码已生成');
    go(`/teacher/classrooms/${next[0].id}`);
  };

  const addMember = (classroom: TeacherClassroom) => {
    if (!/^\d{5,18}$/.test(memberForm.studentId.trim())) return showToast('请输入 5–18 位学生账号');
    if (!memberForm.studentName.trim()) return showToast('请输入学生真实姓名');
    try {
      refresh(teacherRepository.addMember(ownerKey, classroom.id, memberForm.studentId.trim(), memberForm.studentName.trim()));
      setMemberForm({ studentId: '', studentName: '' });
      setDialog(null);
      showToast('学生已添加到课堂');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '添加失败');
    }
  };

  const startSession = (classroom: TeacherClassroom) => {
    const result = teacherRepository.startSession(ownerKey, classroom.id, sessionName);
    refresh(result.classrooms);
    setSessionName('');
    setDialog(null);
    go(`/teacher/sessions/${result.sessionId}`);
    showToast('课堂已开始');
  };

  const openInvite = (classroom: TeacherClassroom, mode: 'link' | 'code' | 'direct' = 'link') => {
    go(`/teacher/classrooms/${classroom.id}`);
    setInviteMode(mode);
    setDialog(mode === 'direct' ? 'member' : 'invite');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="teacher-shell">
      {mobileNav && <button className="teacher-nav-mask" aria-label="关闭导航" onClick={() => setMobileNav(false)} />}
      <aside className={`teacher-sidebar ${mobileNav ? 'open' : ''}`}>
        <button className="teacher-brand" onClick={() => go('/teacher')}>
          <span className="teacher-brand-mark"><Languages size={20} /></span>
          <span><strong>智语同航</strong><small>教师工作台</small></span>
        </button>
        <nav className="teacher-nav">
          <NavGroup label="教学工作">
            <NavItem icon={<Home />} label="工作台" active={page === 'dashboard'} onClick={() => go('/teacher')} />
            <NavItem icon={<LayoutGrid />} label="我的课堂" active={page === 'classrooms'} onClick={() => go('/teacher/classrooms')} badge={classrooms.filter(item => item.status === 'ACTIVE').length} />
            <NavItem icon={<History />} label="上课记录" active={page === 'sessions'} onClick={() => go('/teacher/sessions')} />
          </NavGroup>
          <NavGroup label="智能教学">
            <NavItem icon={<MessageSquareText />} label="实时转译" active={page === 'tools' && entityId === 'translate'} onClick={() => go('/teacher/tools/translate')} />
            <NavItem icon={<ClipboardCheck />} label="作文批阅" active={page === 'tools' && entityId === 'writing-review'} onClick={() => go('/teacher/tools/writing-review')} />
            <NavItem icon={<BookOpen />} label="教学素材" active={page === 'tools' && entityId === 'materials'} onClick={() => go('/teacher/tools/materials')} />
          </NavGroup>
          <NavGroup label="支持">
            <NavItem icon={<HelpCircle />} label="帮助反馈" active={page === 'help'} onClick={() => go('/teacher/help')} />
          </NavGroup>
        </nav>
        <div className="teacher-profile">
          <button className="teacher-profile-trigger" onClick={() => setAccountMenu(accountMenu === 'side' ? null : 'side')}>
            <span className="teacher-avatar">{user?.avatar ? <img src={user.avatar} alt="教师头像" /> : (user?.username || '老').slice(0, 1)}</span>
            <strong>{user?.username || '老师'}</strong>
          </button>
          {accountMenu === 'side' && <AccountMenu onProfile={() => go('/teacher/profile')} onLogout={handleLogout} />}
        </div>
      </aside>

      <main className="teacher-main">
        <header className="teacher-topbar">
          <button className="teacher-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div><strong>{pageTitle(page, selectedClassroom, sessionContext?.session)}</strong><span>{pageSubtitle(page)}</span></div>
          <div className="teacher-top-actions">
            {activeSessions.length > 0 && <button className="teacher-live-chip" onClick={() => go(`/teacher/sessions/${activeSessions[0].session.id}`)}><i />正在授课</button>}
            <button className="teacher-icon-button" onClick={() => showToast('今天没有新的系统通知')}><CalendarDays size={18} /></button>
            <div className="teacher-account-anchor">
              <button className="teacher-user-button" onClick={() => setAccountMenu(accountMenu === 'top' ? null : 'top')}>{user?.avatar ? <img src={user.avatar} alt="教师头像" /> : (user?.username || '老师').slice(0, 1)}</button>
              {accountMenu === 'top' && <AccountMenu onProfile={() => go('/teacher/profile')} onLogout={handleLogout} />}
            </div>
          </div>
        </header>
        <div className="teacher-content">
          {page === 'dashboard' && <DashboardView classrooms={classrooms} userName={user?.username || '老师'} go={go} onCreate={() => setDialog('create')} onStart={classroom => { go(`/teacher/classrooms/${classroom.id}`); setDialog('session'); }} />}
          {page === 'classrooms' && !entityId && <ClassroomList classrooms={classrooms} go={go} onCreate={() => setDialog('create')} onInvite={openInvite} />}
          {page === 'classrooms' && entityId && selectedClassroom && <ClassroomDetail classroom={selectedClassroom} tab={detailTab} setTab={setDetailTab} go={go} onInvite={mode => openInvite(selectedClassroom, mode)} onStart={() => setDialog('session')} onRemove={memberId => { refresh(teacherRepository.removeMember(ownerKey, selectedClassroom.id, memberId)); showToast('学生已移出课堂'); }} onArchive={() => { refresh(teacherRepository.archive(ownerKey, selectedClassroom.id, selectedClassroom.status === 'ACTIVE')); showToast(selectedClassroom.status === 'ACTIVE' ? '课堂已归档' : '课堂已恢复'); }} />}
          {page === 'classrooms' && entityId && !selectedClassroom && <NotFound onBack={() => go('/teacher/classrooms')} />}
          {page === 'sessions' && !entityId && <SessionHistory classrooms={classrooms} go={go} />}
          {page === 'sessions' && entityId && sessionContext && <SessionRoom context={sessionContext} go={go} onState={status => { refresh(teacherRepository.setSessionState(ownerKey, sessionContext.classroom.id, sessionContext.session.id, status)); showToast(status === 'RUNNING' ? '已继续上课' : status === 'PAUSED' ? '课堂已暂停' : '本次课堂已结束'); }} onAttendance={studentId => refresh(teacherRepository.toggleAttendance(ownerKey, sessionContext.classroom.id, sessionContext.session.id, studentId))} />}
          {page === 'sessions' && entityId && !sessionContext && <NotFound onBack={() => go('/teacher/sessions')} />}
          {page === 'profile' && <div className="teacher-account-page"><AccountPage /></div>}
          {page === 'help' && <TeacherEmbeddedPage eyebrow="SUPPORT" title="帮助与反馈" subtitle="获取使用帮助，或者把问题告诉我们。"><HelpPage /></TeacherEmbeddedPage>}
          {page === 'tools' && entityId === 'translate' && <TeacherEmbeddedPage eyebrow="LISTENING" title="实时转译" subtitle="在教师工作台中使用课堂音频实时识别与翻译。"><RealTimeTrans /></TeacherEmbeddedPage>}
          {page === 'tools' && entityId === 'writing-review' && <TeacherEmbeddedPage eyebrow="WRITING" title="作文批阅" subtitle="批阅学生作文并生成评分与逐句建议。"><EduWritingReview /></TeacherEmbeddedPage>}
          {page === 'tools' && entityId === 'materials' && <TeacherEmbeddedPage eyebrow="MATERIALS" title="教学素材" subtitle="为课堂生成单词、例句和图像素材。"><EduVocab /></TeacherEmbeddedPage>}
        </div>
      </main>

      {dialog === 'create' && <Modal title="创建课堂" subtitle="填写基础教学信息，创建后将自动生成课堂码" onClose={() => setDialog(null)}>
        <Field label="课堂名称"><input autoFocus value={classroomForm.name} onChange={event => setClassroomForm({ ...classroomForm, name: event.target.value })} placeholder="例如：高一英语口语 2 班" /></Field>
        <div className="teacher-form-grid"><Field label="教学语言"><select value={classroomForm.languageCode} onChange={event => setClassroomForm({ ...classroomForm, languageCode: event.target.value })}>{Object.entries(languageNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="学习阶段"><select value={classroomForm.stageCode} onChange={event => setClassroomForm({ ...classroomForm, stageCode: event.target.value })}>{Object.entries(stageNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
        <div className="teacher-form-grid"><Field label="学年"><input value={classroomForm.academicYear} onChange={event => setClassroomForm({ ...classroomForm, academicYear: event.target.value })} placeholder="2026-2027" /></Field><Field label="学期"><select value={classroomForm.semesterCode} onChange={event => setClassroomForm({ ...classroomForm, semesterCode: event.target.value })}><option value="FIRST">上学期</option><option value="SECOND">下学期</option></select></Field></div>
        <Field label="课堂说明"><textarea rows={4} value={classroomForm.description} onChange={event => setClassroomForm({ ...classroomForm, description: event.target.value })} placeholder="介绍课堂目标或教学安排" /></Field>
        <ModalActions onCancel={() => setDialog(null)} label="创建课堂" onConfirm={createClassroom} />
      </Modal>}

      {dialog === 'invite' && selectedClassroom && <Modal title="邀请学生" subtitle={selectedClassroom.name} onClose={() => setDialog(null)}>
        <div className="teacher-segmented"><button className={inviteMode === 'link' ? 'active' : ''} onClick={() => setInviteMode('link')}>邀请链接</button><button className={inviteMode === 'code' ? 'active' : ''} onClick={() => setInviteMode('code')}>课堂码</button><button onClick={() => { setDialog('member'); setInviteMode('direct'); }}>主动添加</button></div>
        {inviteMode === 'link' ? <ShareLink classroom={selectedClassroom} showToast={showToast} /> : <ShareCode classroom={selectedClassroom} onRefresh={() => { refresh(teacherRepository.regenerateCode(ownerKey, selectedClassroom.id)); showToast('课堂码已刷新'); }} showToast={showToast} />}
      </Modal>}

      {dialog === 'member' && selectedClassroom && <Modal title="主动添加学生" subtitle={selectedClassroom.name} onClose={() => setDialog(null)}>
        <div className="teacher-dialog-note"><UserPlus size={20} /><span>学生加入后使用这里填写的真实姓名参与课堂。</span></div>
        <Field label="学生账号"><input autoFocus value={memberForm.studentId} onChange={event => setMemberForm({ ...memberForm, studentId: event.target.value })} placeholder="输入学生账号" /></Field>
        <Field label="学生真实姓名"><input value={memberForm.studentName} onChange={event => setMemberForm({ ...memberForm, studentName: event.target.value })} placeholder="输入学生姓名" /></Field>
        <ModalActions onCancel={() => setDialog(null)} label="确认添加" onConfirm={() => addMember(selectedClassroom)} />
      </Modal>}

      {dialog === 'session' && selectedClassroom && <Modal title="开始上课" subtitle={selectedClassroom.name} onClose={() => setDialog(null)}>
        <div className="teacher-dialog-note"><Play size={20} /><span>开课后会根据当前课堂成员生成本次上课学生记录。</span></div>
        <Field label="课次名称"><input autoFocus value={sessionName} onChange={event => setSessionName(event.target.value)} placeholder={`例如：第 ${selectedClassroom.sessions.length + 1} 课时 · 情境对话`} /></Field>
        <div className="teacher-session-preview"><span>预计参与学生</span><strong>{selectedClassroom.members.length} 人</strong></div>
        <ModalActions onCancel={() => setDialog(null)} label="开始上课" onConfirm={() => startSession(selectedClassroom)} />
      </Modal>}
      {toast && <div className="teacher-toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function DashboardView({ classrooms, userName, go, onCreate, onStart }: { classrooms: TeacherClassroom[]; userName: string; go: (path: string) => void; onCreate: () => void; onStart: (classroom: TeacherClassroom) => void }) {
  const active = classrooms.filter(item => item.status === 'ACTIVE');
  const sessions = classrooms.flatMap(item => item.sessions);
  const latest = active.slice(0, 3);
  const running = classrooms.flatMap(classroom => classroom.sessions.map(session => ({ classroom, session }))).find(item => item.session.status !== 'ENDED');
  const presentCount = sessions.reduce((sum, session) => sum + session.students.filter(student => student.attendanceStatus === 1).length, 0);
  const attendanceCount = sessions.reduce((sum, session) => sum + session.students.length, 0);
  return <div className="teacher-page">
    <section className="teacher-welcome">
      <div><span>{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span><h1>上午好，{userName}</h1><p>{running ? `${running.classroom.name}正在进行，学生可以继续签到。` : '准备好今天的课堂，让语言学习自然发生。'}</p></div>
      <button className="teacher-primary" onClick={onCreate}><Plus size={17} />创建课堂</button>
    </section>
    <section className="teacher-stat-grid">
      <Stat icon={<LayoutGrid />} label="正常课堂" value={active.length} hint="本学期课堂" tone="green" onClick={() => go('/teacher/classrooms')} />
      <Stat icon={<Users />} label="课堂成员" value={active.reduce((sum, item) => sum + item.members.length, 0)} hint="全部正常课堂" tone="blue" onClick={() => go('/teacher/classrooms')} />
      <Stat icon={<History />} label="累计课次" value={sessions.length} hint="包含历史课次" tone="brown" onClick={() => go('/teacher/sessions')} />
      <Stat icon={<ClipboardCheck />} label="平均到课率" value={attendanceCount ? `${Math.round(presentCount / attendanceCount * 100)}%` : '--'} hint="按签到记录计算" tone="gold" onClick={() => go('/teacher/sessions')} />
    </section>
    <div className="teacher-dashboard-grid">
      <section className="teacher-card teacher-recent-card"><CardHead title="最近课堂" subtitle="继续上次的教学工作" action="查看全部" onAction={() => go('/teacher/classrooms')} />
        <div className="teacher-recent-list">{latest.map((classroom, index) => <button key={classroom.id} onClick={() => go(`/teacher/classrooms/${classroom.id}`)}><span className={`teacher-class-symbol tone-${index}`}><Languages size={19} /></span><span className="teacher-recent-info"><strong>{classroom.name}</strong><small>{languageNames[classroom.languageCode]} · {classroom.members.length} 名学生 · {classroom.sessions.length} 次课</small></span><span className="teacher-recent-action" onClick={event => { event.stopPropagation(); onStart(classroom); }}><Play size={14} />上课</span><ChevronRight size={17} /></button>)}</div>
      </section>
      <section className="teacher-card"><CardHead title="当前授课" subtitle="进行中与暂停中的课堂" />
        {running ? <button className="teacher-current-session" onClick={() => go(`/teacher/sessions/${running.session.id}`)}><span className="teacher-live-ring"><i /><Play size={22} /></span><strong>{running.session.sessionName}</strong><small>{running.classroom.name}</small><span>{running.session.status === 'PAUSED' ? '已暂停，点击继续' : '正在进行，进入授课区'}</span></button> : <div className="teacher-empty-small"><span><Clock3 size={22} /></span><strong>当前没有进行中的课堂</strong><p>从最近课堂中选择一个开始上课。</p></div>}
      </section>
    </div>
    <section className="teacher-card teacher-quick-card"><CardHead title="快捷操作" subtitle="常用的课堂管理入口" /><div className="teacher-quick-grid"><Quick icon={<Plus />} title="创建课堂" text="建立新的教学班级" onClick={onCreate} /><Quick icon={<UserPlus />} title="邀请学生" text="分享链接或课堂码" onClick={() => latest[0] ? go(`/teacher/classrooms/${latest[0].id}`) : onCreate()} /><Quick icon={<Play />} title="开始上课" text="创建本次开课记录" onClick={() => latest[0] ? onStart(latest[0]) : onCreate()} /><Quick icon={<History />} title="上课记录" text="查看签到和历史课次" onClick={() => go('/teacher/sessions')} /></div></section>
  </div>;
}

function ClassroomList({ classrooms, go, onCreate, onInvite }: { classrooms: TeacherClassroom[]; go: (path: string) => void; onCreate: () => void; onInvite: (classroom: TeacherClassroom) => void }) {
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const visible = classrooms.filter(item => (filter === 'ALL' || item.status === filter) && `${item.name}${item.inviteCode}${languageNames[item.languageCode]}`.toLowerCase().includes(keyword.toLowerCase()));
  return <div className="teacher-page"><PageHead eyebrow="CLASSROOMS" title="我的课堂" subtitle="集中管理课堂成员、邀请方式与每次开课。" action={<button className="teacher-primary" onClick={onCreate}><Plus size={17} />创建课堂</button>} />
    <div className="teacher-list-toolbar"><label><Search size={16} /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索课堂名称、语言或课堂码" /></label><div className="teacher-filter">{(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'ACTIVE' ? '正常课堂' : value === 'ARCHIVED' ? '已归档' : '全部'}</button>)}</div></div>
    <div className="teacher-class-grid">{visible.map((classroom, index) => <article className="teacher-class-card" key={classroom.id} onClick={() => go(`/teacher/classrooms/${classroom.id}`)}>
      <div className={`teacher-class-cover tone-${index % 3}`}><div><span>{languageNames[classroom.languageCode]}</span><small>{classroom.status === 'ACTIVE' ? '正常' : '已归档'}</small></div><h2>{classroom.name}</h2><p>{classroom.academicYear} · {semesterNames[classroom.semesterCode || '']} · {stageNames[classroom.stageCode || '']}</p></div>
      <div className="teacher-class-card-body"><p>{classroom.description}</p><div className="teacher-class-numbers"><span><Users size={15} />{classroom.members.length} 名学生</span><span><History size={15} />{classroom.sessions.length} 次课</span></div><div className="teacher-class-card-foot"><span>课堂码 <b>{classroom.inviteCode}</b></span><button onClick={event => { event.stopPropagation(); onInvite(classroom); }}><Link2 size={14} />邀请</button></div></div>
    </article>)}</div>
    {!visible.length && <div className="teacher-empty-page"><LayoutGrid size={27} /><h2>没有找到课堂</h2><p>调整筛选条件，或创建一个新的课堂。</p><button className="teacher-primary" onClick={onCreate}><Plus size={17} />创建课堂</button></div>}
  </div>;
}

function ClassroomDetail({ classroom, tab, setTab, go, onInvite, onStart, onRemove, onArchive }: { classroom: TeacherClassroom; tab: DetailTab; setTab: (tab: DetailTab) => void; go: (path: string) => void; onInvite: (mode: 'link' | 'code' | 'direct') => void; onStart: () => void; onRemove: (memberId: string) => void; onArchive: () => void }) {
  const running = classroom.sessions.find(session => session.status !== 'ENDED');
  return <div className="teacher-page"><button className="teacher-back" onClick={() => go('/teacher/classrooms')}><ArrowLeft size={16} />返回课堂列表</button>
    <section className="teacher-class-hero"><div className="teacher-class-hero-top"><div><span className="teacher-state"><i />{classroom.status === 'ACTIVE' ? '正常课堂' : '已归档'}</span><h1>{classroom.name}</h1><p>{languageNames[classroom.languageCode]} · {stageNames[classroom.stageCode || '']} · {classroom.academicYear} {semesterNames[classroom.semesterCode || '']}</p></div><div><button className="teacher-secondary" onClick={() => onInvite('link')}><UserPlus size={16} />邀请学生</button>{classroom.status === 'ACTIVE' && <button className="teacher-primary" onClick={() => running ? go(`/teacher/sessions/${running.id}`) : onStart()}><Play size={16} />{running ? '进入课堂' : '开始上课'}</button>}<button className="teacher-ghost-icon" title="更多" onClick={onArchive}>{classroom.status === 'ACTIVE' ? <Archive size={18} /> : <RefreshCw size={18} />}</button></div></div><div className="teacher-class-hero-stats"><span><strong>{classroom.members.length}</strong>课堂成员</span><button onClick={() => onInvite('code')}><strong>{classroom.inviteCode}</strong>课堂码</button><span><strong>{classroom.sessions.length}</strong>累计课次</span><span><strong>{classroom.sessions[0] ? formatDate(classroom.sessions[0].startTime) : '暂无'}</strong>最近上课</span></div></section>
    <div className="teacher-detail-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>课堂概览</button><button className={tab === 'members' ? 'active' : ''} onClick={() => setTab('members')}>成员管理 <span>{classroom.members.length}</span></button><button className={tab === 'sessions' ? 'active' : ''} onClick={() => setTab('sessions')}>上课记录 <span>{classroom.sessions.length}</span></button></div>
    {tab === 'overview' && <div className="teacher-detail-columns"><section className="teacher-card"><CardHead title="课堂信息" subtitle="基础教学安排" /><div className="teacher-info-grid"><Info label="教学语言" value={languageNames[classroom.languageCode]} /><Info label="学习阶段" value={stageNames[classroom.stageCode || ''] || '未设置'} /><Info label="学年" value={classroom.academicYear || '未设置'} /><Info label="学期" value={semesterNames[classroom.semesterCode || ''] || '未设置'} /></div><div className="teacher-description"><span>课堂说明</span><p>{classroom.description || '暂未填写课堂说明'}</p></div></section><aside className="teacher-card teacher-invite-card"><CardHead title="邀请学生" subtitle="三种方式均可加入" /><strong>{classroom.inviteCode}</strong><span>当前有效课堂码</span><button className="teacher-primary" onClick={() => onInvite('link')}><Link2 size={16} />复制邀请链接</button><button className="teacher-secondary" onClick={() => onInvite('direct')}><UserPlus size={16} />主动添加学生</button></aside></div>}
    {tab === 'members' && <section className="teacher-card"><CardHead title="课堂成员" subtitle="学生退出或被移除后不再出现在当前成员中" action="主动添加" onAction={() => onInvite('direct')} />{classroom.members.length ? <div className="teacher-table"><div className="teacher-table-row head"><span>学生</span><span>学生账号</span><span>加入方式</span><span>加入时间</span><span>操作</span></div>{classroom.members.map(member => <div className="teacher-table-row" key={member.id}><span className="teacher-person"><i>{member.studentName.slice(0, 1)}</i><b>{member.studentName}</b></span><span>{member.studentId}</span><span>{joinNames[member.joinType]}</span><span>{formatDate(member.joinedTime)}</span><button onClick={() => onRemove(member.id)}>移除</button></div>)}</div> : <EmptyInline text="还没有学生加入课堂" action="邀请学生" onClick={() => onInvite('link')} />}</section>}
    {tab === 'sessions' && <section className="teacher-card"><CardHead title="上课记录" subtitle="每次开课都会生成独立的学生出勤记录" action="开始上课" onAction={onStart} />{classroom.sessions.length ? <SessionList classroom={classroom} go={go} /> : <EmptyInline text="还没有上课记录" action="开始第一节课" onClick={onStart} />}</section>}
  </div>;
}

function SessionHistory({ classrooms, go }: { classrooms: TeacherClassroom[]; go: (path: string) => void }) {
  const all = classrooms.flatMap(classroom => classroom.sessions.map(session => ({ classroom, session }))).sort((a, b) => +new Date(b.session.startTime) - +new Date(a.session.startTime));
  return <div className="teacher-page"><PageHead eyebrow="SESSIONS" title="上课记录" subtitle="查看所有课堂的历史课次、签到情况和授课状态。" /><section className="teacher-card">{all.length ? <div className="teacher-history-list">{all.map(({ classroom, session }) => <button key={session.id} onClick={() => go(`/teacher/sessions/${session.id}`)}><span className={`teacher-session-icon ${session.status.toLowerCase()}`}><BookOpen size={18} /></span><span><strong>{session.sessionName}</strong><small>{classroom.name} · {formatFullDate(session.startTime)}</small></span><span className={`teacher-session-state ${session.status.toLowerCase()}`}>{session.status === 'RUNNING' ? '进行中' : session.status === 'PAUSED' ? '已暂停' : '已结束'}</span><span className="teacher-attendance">到课 {session.students.filter(student => student.attendanceStatus === 1).length}/{session.students.length}</span><ChevronRight size={17} /></button>)}</div> : <EmptyInline text="还没有上课记录" action="前往课堂" onClick={() => go('/teacher/classrooms')} />}</section></div>;
}

function SessionRoom({ context, go, onState, onAttendance }: { context: { classroom: TeacherClassroom; session: ClassroomSession }; go: (path: string) => void; onState: (state: 'RUNNING' | 'PAUSED' | 'ENDED') => void; onAttendance: (studentId: string) => void }) {
  const { classroom, session } = context;
  const present = session.students.filter(student => student.attendanceStatus === 1).length;
  return <div className="teacher-page"><button className="teacher-back" onClick={() => go(`/teacher/classrooms/${classroom.id}`)}><ArrowLeft size={16} />返回课堂详情</button>
    <section className={`teacher-session-hero ${session.status.toLowerCase()}`}><div><span><i />{session.status === 'RUNNING' ? '课堂进行中' : session.status === 'PAUSED' ? '课堂已暂停' : '本次课堂已结束'}</span><h1>{session.sessionName}</h1><p>{classroom.name} · 开始于 {formatFullDate(session.startTime)}</p></div><div className="teacher-session-controls">{session.status === 'RUNNING' && <button onClick={() => onState('PAUSED')}><CirclePause size={17} />暂停</button>}{session.status === 'PAUSED' && <button onClick={() => onState('RUNNING')}><Play size={17} />继续</button>}{session.status !== 'ENDED' && <button className="end" onClick={() => onState('ENDED')}><Square size={15} />结束课堂</button>}</div></section>
    <section className="teacher-session-stats"><span><small>应到学生</small><strong>{session.students.length}</strong></span><span><small>已签到</small><strong>{present}</strong></span><span><small>缺席</small><strong>{session.students.length - present}</strong></span><span><small>到课率</small><strong>{session.students.length ? Math.round(present / session.students.length * 100) : 0}%</strong></span></section>
    <div className="teacher-live-grid"><section className="teacher-card"><CardHead title="学生签到" subtitle="学生完成签到后即记为到课" /><div className="teacher-attendance-list">{session.students.map(student => <div key={student.id}><span className="teacher-person"><i>{student.studentName.slice(0, 1)}</i><span><b>{student.studentName}</b><small>{student.studentId}</small></span></span><span className={student.attendanceStatus ? 'present' : 'absent'}>{student.attendanceStatus ? <><Check size={14} />已到课</> : '未签到'}</span><time>{student.checkInTime ? formatTime(student.checkInTime) : '--:--'}</time>{session.status !== 'ENDED' && <button onClick={() => onAttendance(student.id)}>{student.attendanceStatus ? '取消签到' : '代为签到'}</button>}</div>)}</div>{!session.students.length && <EmptyInline text="课堂中还没有学生" action="返回添加成员" onClick={() => go(`/teacher/classrooms/${classroom.id}`)} />}</section><aside className="teacher-card teacher-live-tools"><CardHead title="课堂工具" subtitle="授课过程中的快捷入口" /><Quick icon={<MessageSquareText />} title="实时转译" text="打开课堂语音转译" onClick={() => go('/teacher/tools/translate')} /><Quick icon={<ClipboardCheck />} title="课堂签到" text={`${present} 人已完成签到`} onClick={() => undefined} /><Quick icon={<MoreHorizontal />} title="更多能力" text="课堂互动能力即将接入" onClick={() => undefined} /></aside></div>
  </div>;
}

function SessionList({ classroom, go }: { classroom: TeacherClassroom; go: (path: string) => void }) {
  return <div className="teacher-history-list">{classroom.sessions.map(session => <button key={session.id} onClick={() => go(`/teacher/sessions/${session.id}`)}><span className={`teacher-session-icon ${session.status.toLowerCase()}`}><BookOpen size={18} /></span><span><strong>{session.sessionName}</strong><small>{formatFullDate(session.startTime)}</small></span><span className={`teacher-session-state ${session.status.toLowerCase()}`}>{session.status === 'RUNNING' ? '进行中' : session.status === 'PAUSED' ? '已暂停' : '已结束'}</span><span className="teacher-attendance">到课 {session.students.filter(student => student.attendanceStatus === 1).length}/{session.students.length}</span><ChevronRight size={17} /></button>)}</div>;
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="teacher-nav-group"><span>{label}</span>{children}</div>; }
function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span>{badge !== undefined && <small>{badge}</small>}</button>; }
function Stat({ icon, label, value, hint, tone, onClick }: { icon: React.ReactNode; label: string; value: string | number; hint: string; tone: string; onClick: () => void }) { return <button className={`teacher-stat tone-${tone}`} onClick={onClick}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div><ChevronRight size={16} /></button>; }
function Quick({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) { return <button className="teacher-quick" onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div><ChevronRight size={16} /></button>; }
function CardHead({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) { return <div className="teacher-card-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ChevronRight size={14} /></button>}</div>; }
function PageHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) { return <header className="teacher-page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>; }
function Info({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function EmptyInline({ text, action, onClick }: { text: string; action: string; onClick: () => void }) { return <div className="teacher-empty-inline"><Users size={24} /><strong>{text}</strong><button onClick={onClick}>{action}</button></div>; }
function NotFound({ onBack }: { onBack: () => void }) { return <div className="teacher-empty-page"><BookOpen size={28} /><h2>没有找到对应内容</h2><button className="teacher-primary" onClick={onBack}>返回列表</button></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="teacher-field"><span>{label}</span>{children}</label>; }
function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) { return <div className="teacher-modal-mask" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="teacher-modal"><div className="teacher-modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}><X size={18} /></button></div><div className="teacher-modal-body">{children}</div></div></div>; }
function ModalActions({ onCancel, onConfirm, label }: { onCancel: () => void; onConfirm: () => void; label: string }) { return <div className="teacher-modal-actions"><button className="teacher-secondary" onClick={onCancel}>取消</button><button className="teacher-primary" onClick={onConfirm}>{label}</button></div>; }

function ShareLink({ classroom, showToast }: { classroom: TeacherClassroom; showToast: (message: string) => void }) {
  const link = `${window.location.origin}/join-classroom?code=${classroom.inviteCode}`;
  return <div className="teacher-share"><span><Link2 size={23} /></span><h3>分享课堂邀请链接</h3><p>学生登录后打开链接，即可填写真实姓名并加入课堂。</p><div><input readOnly value={link} /><button onClick={() => navigator.clipboard.writeText(link).then(() => showToast('邀请链接已复制')).catch(() => showToast('请手动复制邀请链接'))}><Copy size={15} />复制</button></div></div>;
}

function ShareCode({ classroom, onRefresh, showToast }: { classroom: TeacherClassroom; onRefresh: () => void; showToast: (message: string) => void }) {
  return <div className="teacher-share"><span><GraduationCap size={25} /></span><h3>让学生输入课堂码</h3><strong>{classroom.inviteCode}</strong><p>刷新后原课堂码立即失效，已经加入的学生不受影响。</p><div className="teacher-code-buttons"><button className="teacher-primary" onClick={() => navigator.clipboard.writeText(classroom.inviteCode).then(() => showToast('课堂码已复制')).catch(() => showToast('请手动复制课堂码'))}><Copy size={15} />复制课堂码</button><button className="teacher-secondary" onClick={onRefresh}><RefreshCw size={15} />刷新</button></div></div>;
}

function TeacherEmbeddedPage({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="teacher-page"><PageHead eyebrow={eyebrow} title={title} subtitle={subtitle} /><div className="teacher-embedded-content">{children}</div></div>;
}

function AccountMenu({ onProfile, onLogout }: { onProfile: () => void; onLogout: () => void }) {
  return <div className="teacher-account-menu"><button onClick={onProfile}><UserPlus size={15} />个人中心</button><button onClick={onLogout}><LogOut size={15} />退出登录</button></div>;
}

function pageTitle(page: string, classroom?: TeacherClassroom, session?: ClassroomSession) { if (classroom) return classroom.name; if (session) return session.sessionName; if (page === 'classrooms') return '我的课堂'; if (page === 'sessions') return '上课记录'; if (page === 'profile') return '个人中心'; if (page === 'help') return '帮助与反馈'; if (page === 'tools') return '智能教学'; return '教师工作台'; }
function pageSubtitle(page: string) { if (page === 'classrooms') return '课堂与成员管理'; if (page === 'sessions') return '课次与学生出勤'; if (page === 'profile') return '教师资料与账号安全'; if (page === 'help') return '教师支持'; if (page === 'tools') return '教师智能工具'; return '教学概览'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(value)); }
function formatFullDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function formatTime(value: string) { return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
