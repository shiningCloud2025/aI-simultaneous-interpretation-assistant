import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Clock3, Pencil, Plus, RefreshCw, Search, Users, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useLiveConsole } from '../../components/LiveSessionBadge';
import { studentClassroomApi, type ClassroomMember, type ClassroomSession, type PageResult, type SessionStudent, type StudentClassroom, type StudentClassroomDetail } from './studentClassroomApi';
import { classroomCodeFromLink } from './classroomInvite';
import './student-classrooms.css';

const languages: Record<string, string> = { english: '英语', japanese: '日语', korean: '韩语' };
const semesters: Record<string, string> = { FIRST: '上学期', SECOND: '下学期' };
const grades: Record<string, string> = Object.fromEntries([
  ...Array.from({ length: 6 }, (_, i) => [`primary_${i + 1}`, `小学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`junior_${i + 1}`, `初中${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`senior_${i + 1}`, `高中${i + 1}年级`]),
  ...Array.from({ length: 4 }, (_, i) => [`university_${i + 1}`, `大学${i + 1}年级`]),
  ...Array.from({ length: 3 }, (_, i) => [`postgraduate_${i + 1}`, `研究生${i + 1}年级`]),
]);

function meta(classroom: StudentClassroom) {
  return [languages[classroom.languageCode] || classroom.languageCode, classroom.stageCode && (grades[classroom.stageCode] || classroom.stageCode), classroom.academicYear && `${classroom.academicYear} 学年`, classroom.semesterCode && (semesters[classroom.semesterCode] || classroom.semesterCode)].filter(Boolean).join(' · ');
}

function dateText(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

function plainText(html: string | null) {
  return html ? new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || '暂无课堂说明' : '暂无课堂说明';
}

function elapsedText(startTime: string, end: number) {
  const start = new Date(startTime.replace(' ', 'T')).getTime();
  const total = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function Pager({ data, page, onChange }: { data: PageResult<unknown> | null; page: number; onChange: (page: number) => void }) {
  if (!data || data.pages <= 1) return null;
  return <div className="student-rooms-pager"><span>第 {page} / {data.pages} 页</span><button disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</button><button disabled={page >= data.pages} onClick={() => onChange(page + 1)}>下一页</button></div>;
}

export function StudentClassrooms() {
  const userId = useAppStore(state => state.user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const setConsoleSession = useLiveConsole(state => state.setSessionId);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [revision, setRevision] = useState(0);
  const [classrooms, setClassrooms] = useState<PageResult<StudentClassroom> | null>(null);
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [classroom, setClassroom] = useState<StudentClassroomDetail | null>(null);
  const [section, setSection] = useState<'sessions' | 'members'>('sessions');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [sessions, setSessions] = useState<PageResult<ClassroomSession> | null>(null);
  const [members, setMembers] = useState<PageResult<ClassroomMember> | null>(null);
  const [students, setStudents] = useState<PageResult<SessionStudent> | null>(null);
  const [ownCheckedIn, setOwnCheckedIn] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinConfirm, setJoinConfirm] = useState(false);
  const [joinMode, setJoinMode] = useState<'code' | 'link'>('code');
  const [code, setCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = () => setRevision(value => value + 1);
  const inviteCode = joinMode === 'code' ? (/^[A-Z0-9]{8}$/.test(code.trim().toUpperCase()) ? code.trim().toUpperCase() : null) : classroomCodeFromLink(inviteLink);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studentClassroomApi.pageClassrooms(page, keyword.trim(), status === 'all' ? null : status === 'active' ? 1 : 0)
      .then(result => { if (!cancelled) { setClassrooms(result); setError(''); } })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '课堂加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, keyword, status, revision]);

  useEffect(() => {
    if (!classroomId) return;
    let cancelled = false;
    studentClassroomApi.classroom(classroomId).then(result => { if (!cancelled) setClassroom(result); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '课堂详情加载失败'); });
    return () => { cancelled = true; };
  }, [classroomId, revision]);

  useEffect(() => {
    if (!classroomId) return;
    let cancelled = false;
    studentClassroomApi.pageSessions(classroomId, sessionPage).then(result => { if (!cancelled) setSessions(result); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '上课记录加载失败'); });
    return () => { cancelled = true; };
  }, [classroomId, sessionPage, revision]);

  useEffect(() => {
    if (!classroomId || section !== 'members') return;
    let cancelled = false;
    studentClassroomApi.pageMembers(classroomId, memberPage).then(result => { if (!cancelled) setMembers(result); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '学生名单加载失败'); });
    return () => { cancelled = true; };
  }, [classroomId, section, memberPage, revision]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    studentClassroomApi.session(sessionId).then(result => { if (!cancelled) setSession(result); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '课次加载失败'); });
    studentClassroomApi.pageSessionStudents(sessionId, studentPage).then(result => { if (!cancelled) setStudents(result); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : '签到记录加载失败'); });
    return () => { cancelled = true; };
  }, [sessionId, studentPage, revision]);

  useEffect(() => {
    const raw = searchParams.get('sessionId');
    const linked = raw ? Number(raw) : null;
    if (!linked || !Number.isFinite(linked) || linked === sessionId) return;
    setSessionId(linked);
    setSession(null);
    setStudents(null);
    setOwnCheckedIn(false);
    setStudentPage(1);
    setError('');
    const next = new URLSearchParams(searchParams);
    next.delete('sessionId');
    setSearchParams(next, { replace: true });
  }, [searchParams, sessionId, setSearchParams]);

  useEffect(() => {
    setConsoleSession(sessionId && session?.id === sessionId && session.status !== 3 ? sessionId : null);
    return () => setConsoleSession(null);
  }, [sessionId, session, setConsoleSession]);

  useEffect(() => {
    if (!classroomId && session?.classroomId) setClassroomId(session.classroomId);
  }, [session, classroomId]);

  useEffect(() => {
    if (!sessionId || !session || session.status === 3) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, session]);

  useEffect(() => {
    if (!sessionId || !session || session.status === 3) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const latest = await studentClassroomApi.session(sessionId);
        if (cancelled) return;
        if (latest.status === 3) {
          backToClassroom();
          setNotice('老师已结束本次课程');
          refresh();
        } else {
          setSession(latest);
        }
      } catch { /* 轮询失败时静默，等待下次轮询 */ }
      try {
        const records = await studentClassroomApi.pageSessionStudents(sessionId, studentPage);
        if (!cancelled) setStudents(records);
      } catch { /* 轮询失败时静默，等待下次轮询 */ }
    };
    const timer = window.setInterval(() => { void poll(); }, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [sessionId, session, studentPage]);

  const openClassroom = (id: number) => { setClassroomId(id); setClassroom(null); setSessionId(null); setSessions(null); setMembers(null); setSection('sessions'); setSessionPage(1); setMemberPage(1); setError(''); };
  const backToClassroom = () => { setSessionId(null); setSession(null); setStudents(null); setError(''); };
  const openNameEditor = () => { if (!classroom || classroom.status !== 1) return; setName(classroom.studentName); setEditingName(true); setError(''); };
  const join = async () => {
    if (busy) return;
    if (!inviteCode) { setError('请填写有效的课堂码或邀请链接'); setJoinConfirm(false); return; }
    setBusy(true);
    try {
      const joined = await studentClassroomApi.join(inviteCode, name.trim());
      setJoinOpen(false); setJoinConfirm(false); setCode(''); setInviteLink(''); setName(''); setNotice('已加入课堂');
      setClassroomId(joined.id); setClassroom(null); setSessionId(null); refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : '加入课堂失败'); setJoinConfirm(false); }
    finally { setBusy(false); }
  };
  const saveName = async () => {
    if (!classroom || classroom.status !== 1 || !name.trim() || name.trim().length > 32 || busy) return;
    setBusy(true);
    try {
      const updated = await studentClassroomApi.updateMyName(classroom.classroomMemberId, name.trim());
      setClassroom(current => current?.id === classroom.id ? { ...current, studentName: updated.studentName } : current);
      setClassrooms(current => current ? { ...current, records: current.records.map(item => item.id === classroom.id ? { ...item, studentName: updated.studentName } : item) } : current);
      setMembers(current => current ? { ...current, records: current.records.map(item => item.id === updated.id ? { ...item, studentName: updated.studentName } : item) } : current);
      setEditingName(false); setError(''); setNotice('课堂姓名已更新'); refresh();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : '修改姓名失败'); }
    finally { setBusy(false); }
  };
  const checkIn = async () => {
    if (!sessionId || busy) return;
    setBusy(true);
    try { await studentClassroomApi.checkIn(sessionId); setOwnCheckedIn(true); setNotice('签到成功'); refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '签到失败'); }
    finally { setBusy(false); }
  };

  return <div className="student-rooms">
    {error && <div className="student-rooms-message error" role="alert">{error}<button onClick={() => { setError(''); refresh(); }}>重试</button></div>}
    {notice && <div className="student-rooms-message success"><Check size={16} />{notice}<button onClick={() => setNotice('')}>关闭</button></div>}
    {sessionId && session?.id !== sessionId ? <div className="student-rooms-panel student-rooms-empty"><h2>{error ? '课次暂时无法显示' : '正在加载课次…'}</h2><button className="student-rooms-text-button" onClick={backToClassroom}>返回课堂</button></div> : sessionId && session?.id === sessionId ? <>
      <button className="student-rooms-back" onClick={backToClassroom}>← 返回课堂</button>
      {session.status !== 3 ? <div className={`student-live-banner${session.status === 2 ? ' paused' : ''}`}>
        <span className="student-live-dot" aria-hidden="true" />
        <div className="student-live-main">
          <strong>{session.status === 1 ? '上课中' : '老师暂停中'}</strong>
          <h1>{session.sessionName}</h1>
          <p>首次开课 {dateText(session.startTime)}{session.status === 2 ? ' · 恢复上课后才能签到' : ''}</p>
        </div>
        <div className="student-live-side">
          <span>已进行</span>
          <strong>{elapsedText(session.startTime, now)}</strong>
          <button className="student-live-refresh" title="刷新课次和签到情况" aria-label="刷新课次和签到情况" onClick={refresh}><RefreshCw size={15} /></button>
        </div>
      </div> : <div className="student-rooms-head"><div><span>上课记录</span><h1>{session.sessionName}</h1><p>首次开课 {dateText(session.startTime)}{session.endTime ? ` · 时长 ${elapsedText(session.startTime, new Date(session.endTime.replace(' ', 'T')).getTime())}` : ''}</p></div><div className="student-rooms-head-actions"><span className={`student-rooms-badge state-${session.status}`}>已结束</span><button className="student-rooms-refresh" title="刷新课次和签到情况" aria-label="刷新课次和签到情况" onClick={refresh}><RefreshCw size={17} /></button></div></div>}
      <div className="student-rooms-panel student-rooms-attendance"><div><Clock3 size={20} /><div><strong>本次签到</strong><p>{session.status === 1 ? '课程进行中，可以签到。' : session.status === 2 ? '老师暂停了课程，继续上课后才能签到。' : '本次课程已结束。'}</p></div></div><button className="student-rooms-primary" disabled={busy || session.status !== 1 || ownCheckedIn || students?.records.some(item => item.studentId === userId && item.checkInStatus === 1)} onClick={() => void checkIn()}>{ownCheckedIn || students?.records.some(item => item.studentId === userId && item.checkInStatus === 1) ? '已签到' : busy ? '正在签到…' : '签到'}</button></div>
      <section className="student-rooms-panel"><h2>签到情况 <small>共 {students?.total ?? 0} 人</small></h2>{students?.records.length ? students.records.map(item => <div className="student-rooms-person" key={item.id}><span>{item.studentName}</span><span className={item.checkInStatus === 1 ? 'present' : ''}>{item.checkInStatus === 1 ? `已签到 · ${dateText(item.checkInTime)}` : '未签到'}</span></div>) : <p className="student-rooms-empty">暂无学生记录</p>}<Pager data={students} page={studentPage} onChange={setStudentPage} /></section>
    </> : classroomId && classroom?.id === classroomId ? <>
      <button className="student-rooms-back" onClick={() => { setClassroomId(null); setClassroom(null); }}>← 我的课堂</button>
      <div className="student-rooms-head"><div><span>{classroom.status === 1 ? '我的课堂' : '已归档课堂'}</span><h1>{classroom.name}</h1><p>{meta(classroom)}</p></div><span className="student-rooms-badge">{classroom.status === 1 ? '进行中' : '已归档'}</span></div>
      <section className="student-rooms-panel student-rooms-detail">
        {classroom.description && plainText(classroom.description) !== classroom.name && <p className="student-rooms-description">{plainText(classroom.description)}</p>}
        <div className="student-rooms-detail-fields">
          <div><span>任课老师</span><strong>{classroom.teacherName}</strong></div>
          <div><span>加入时间</span><strong>{dateText(classroom.joinedTime)}</strong></div>
          <div className="student-rooms-detail-name"><span>我在课堂中的姓名</span><strong>{classroom.studentName}</strong>{classroom.status === 1 && <button className="student-rooms-edit-name" onClick={openNameEditor}><Pencil size={13} />修改</button>}</div>
        </div>
      </section>
      <div className="student-rooms-tabs"><button className={section === 'sessions' ? 'active' : ''} onClick={() => setSection('sessions')}>上课记录</button><button className={section === 'members' ? 'active' : ''} onClick={() => setSection('members')}>学生名单</button></div>
      <section className="student-rooms-panel">{section === 'sessions' ? <><h2>上课记录 <small>共 {sessions?.total ?? 0} 次</small></h2>{sessions?.records.length ? sessions.records.map(item => <button className="student-rooms-session" key={item.id} onClick={() => { setSessionId(item.id); setSession(null); setStudents(null); setOwnCheckedIn(false); setStudentPage(1); setError(''); }}><BookOpen size={19} /><span><strong>{item.sessionName}</strong><small>{dateText(item.startTime)}</small></span><em>{item.status === 1 ? '进行中' : item.status === 2 ? '已暂停' : '已结束'}</em><ArrowRight size={17} /></button>) : <p className="student-rooms-empty">还没有上课记录</p>}<Pager data={sessions} page={sessionPage} onChange={setSessionPage} /></> : <><h2>学生名单 <small>共 {members?.total ?? 0} 人</small></h2>{members?.records.length ? members.records.map(item => <div className="student-rooms-person" key={item.id}><span>{item.studentName}{item.studentId === userId && <small>（我）</small>}</span><span className="student-rooms-person-actions">加入于 {dateText(item.joinedTime)}{item.studentId === userId && classroom.status === 1 && <button className="student-rooms-edit-name" onClick={openNameEditor}><Pencil size={13} />修改姓名</button>}</span></div>) : <p className="student-rooms-empty">暂无学生</p>}<Pager data={members} page={memberPage} onChange={setMemberPage} /></>}</section>
    </> : classroomId ? <div className="student-rooms-panel student-rooms-empty"><h2>{error ? '课堂暂时无法显示' : '正在加载课堂…'}</h2><button className="student-rooms-text-button" onClick={() => { setClassroomId(null); setClassroom(null); }}>返回我的课堂</button></div> : <>
      <div className="student-rooms-head"><div><span>教学空间</span><h1>我的课堂</h1><p>查看已加入的课堂、上课记录和签到情况。</p></div><button className="student-rooms-primary" onClick={() => { setJoinOpen(true); setError(''); }}><Plus size={17} />加入课堂</button></div>
      <div className="student-rooms-toolbar"><label><Search size={17} /><input value={keyword} maxLength={64} onChange={event => { setKeyword(event.target.value); setPage(1); }} placeholder="搜索课堂名称" /></label><div>{(['all', 'active', 'archived'] as const).map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => { setStatus(value); setPage(1); }}>{value === 'all' ? '全部' : value === 'active' ? '进行中' : '已归档'}</button>)}</div><button className="student-rooms-refresh" title="刷新" onClick={refresh}><RefreshCw size={17} /></button></div>
      {classrooms?.records.length ? <div className="student-rooms-list">{classrooms.records.map(item => <button key={item.id} onClick={() => openClassroom(item.id)}><span className="student-rooms-list-icon"><BookOpen size={20} /></span><span className="student-rooms-list-main"><strong>{item.name}</strong><small>{meta(item)}</small><small>任课老师：{item.teacherName}</small><small>加入于 {dateText(item.joinedTime)}</small></span><span className="student-rooms-badge">{item.status === 1 ? '进行中' : '已归档'}</span><ArrowRight size={17} /></button>)}</div> : <div className="student-rooms-panel student-rooms-empty"><Users size={28} /><h2>{loading ? '正在加载课堂…' : error ? '课堂暂时无法加载' : keyword || status !== 'all' ? '没有符合条件的课堂' : '还没有加入课堂'}</h2><p>{error ? '请刷新重试。' : keyword || status !== 'all' ? '换个关键词或状态试试。' : '向老师获取课堂码，加入后就可以查看上课记录。'}</p>{!loading && !error && !keyword && status === 'all' && <button className="student-rooms-primary" onClick={() => setJoinOpen(true)}><Plus size={17} />加入课堂</button>}</div>}
      <Pager data={classrooms} page={page} onChange={setPage} />
    </>}
    {(joinOpen || editingName) && <div className="student-rooms-mask" onMouseDown={event => { if (event.target === event.currentTarget && !busy) { setJoinOpen(false); setEditingName(false); setJoinConfirm(false); } }}>
      <div className="student-rooms-modal" role="dialog" aria-modal="true" aria-label={editingName ? '修改课堂姓名' : '加入课堂'}>
        <header><div><h2>{editingName ? '修改课堂姓名' : joinConfirm ? '确认加入课堂' : '加入课堂'}</h2><p>{editingName ? classroom?.name : joinMode === 'code' ? '输入老师分享的课堂码' : '粘贴老师分享的邀请链接'}</p></div><button aria-label="关闭" disabled={busy} onClick={() => { setJoinOpen(false); setEditingName(false); setJoinConfirm(false); }}><X size={18} /></button></header>
        {error && <p className="student-rooms-modal-error" role="alert">{error}</p>}
        {editingName ? <div className="student-rooms-modal-body"><label>我的课堂姓名<input autoFocus maxLength={32} value={name} onChange={event => setName(event.target.value)} /></label><div className="student-rooms-modal-actions"><button onClick={() => setEditingName(false)}>取消</button><button className="student-rooms-primary" disabled={busy || !name.trim()} onClick={() => void saveName()}>{busy ? '保存中…' : '保存'}</button></div></div>
          : joinConfirm ? <div className="student-rooms-modal-body"><p>将使用 <strong>{name.trim()}</strong> 通过{joinMode === 'code' ? '课堂码' : '邀请链接'}加入课堂。确认后会创建你的课堂成员记录。</p><div className="student-rooms-modal-actions"><button onClick={() => setJoinConfirm(false)}>返回修改</button><button className="student-rooms-primary" disabled={busy} onClick={() => void join()}>{busy ? '加入中…' : '确认加入'}</button></div></div>
            : <div className="student-rooms-modal-body">
              <div className="student-rooms-join-tabs" role="tablist" aria-label="加入方式"><button role="tab" aria-selected={joinMode === 'code'} className={joinMode === 'code' ? 'active' : ''} onClick={() => { setJoinMode('code'); setError(''); }}>课堂码</button><button role="tab" aria-selected={joinMode === 'link'} className={joinMode === 'link' ? 'active' : ''} onClick={() => { setJoinMode('link'); setError(''); }}>邀请链接</button></div>
              {joinMode === 'code' ? <label>课堂码<input autoFocus maxLength={8} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="8 位课堂码" /></label>
                : <label>邀请链接<input autoFocus type="url" value={inviteLink} onChange={event => setInviteLink(event.target.value)} placeholder="粘贴老师发送的完整邀请链接" /></label>}
              <label>真实姓名<input maxLength={32} value={name} onChange={event => setName(event.target.value)} placeholder="填写在课堂中使用的真实姓名" /></label>
              <div className="student-rooms-modal-actions"><button onClick={() => setJoinOpen(false)}>取消</button><button className="student-rooms-primary" onClick={() => { if (!inviteCode || !name.trim()) { setError(joinMode === 'link' ? '请粘贴有效的课堂邀请链接，并填写真实姓名' : '请填写 8 位课堂码和真实姓名'); return; } setError(''); setJoinConfirm(true); }}>下一步</button></div>
            </div>}
      </div>
    </div>}
  </div>;
}
