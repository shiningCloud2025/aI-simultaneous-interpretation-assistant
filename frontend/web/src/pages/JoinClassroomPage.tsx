import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, GraduationCap, Users } from 'lucide-react';
import { api, useAppStore } from '../stores/appStore';
import { apiCall } from '../lib/api';
import { isTeacherUser } from '../lib/authRole';
import { classroomCodeFromLink } from '../features/student/classroomInvite';
import './join-classroom.css';

interface JoinedClassroom {
  id: number;
  name: string;
  inviteCode: string;
}

export function JoinClassroomPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
  const token = useAppStore(state => state.token);
  const setUser = useAppStore(state => state.setUser);
  const [code, setCode] = useState((params.get('code') || '').toUpperCase());
  const [inviteLink, setInviteLink] = useState('');
  const [joinMode, setJoinMode] = useState<'code' | 'link'>('code');
  const [name, setName] = useState('');
  const [result, setResult] = useState<JoinedClassroom | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token && !user) void api.getUserInfo().then(setUser).catch(() => setError('登录状态已失效，请重新登录')); }, [token, user, setUser]);

  const inviteCode = joinMode === 'code' ? (/^[A-Z0-9]{8}$/.test(code.trim().toUpperCase()) ? code.trim().toUpperCase() : null) : classroomCodeFromLink(inviteLink);
  const join = async () => {
    if (!inviteCode) { setError('请输入有效的课堂码或邀请链接'); return; }
    if (!name.trim() || name.trim().length > 32) { setError('请输入不超过 32 字的真实姓名'); return; }
    setBusy(true);
    setError('');
    try {
      const classroom = await apiCall<JoinedClassroom>('/student/classroom/join', {
        method: 'POST', body: JSON.stringify({ inviteCode, studentName: name.trim() }),
      });
      setResult(classroom);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '加入失败'); }
    finally { setBusy(false); }
  };

  const loginPath = `/login?next=${encodeURIComponent(`/join-classroom?code=${code.trim()}`)}`;

  return <main className="join-classroom-page"><div className="join-classroom-card">
    <Link className="join-classroom-back" to={token && !isTeacherUser(user) ? '/dashboard?panel=classrooms' : '/'}><ArrowLeft size={17} />返回{token && !isTeacherUser(user) ? '我的课堂' : '首页'}</Link>
    <span className="join-classroom-icon"><GraduationCap size={30} /></span><p className="join-classroom-eyebrow">智语同航 · 课堂邀请</p><h1>{result ? '加入成功' : confirming ? '确认加入课堂' : '加入老师的课堂'}</h1>
    {result ? <><p className="join-classroom-description">你已加入「{result.name}」，可以前往学生端查看课堂。</p><button onClick={() => navigate('/dashboard?panel=classrooms')}><Check size={17} />查看我的课堂</button></>
      : <><p className="join-classroom-description">{confirming ? `将使用“${name.trim()}”通过${joinMode === 'code' ? '课堂码' : '邀请链接'}加入课堂。` : '输入课堂码或粘贴老师分享的邀请链接，填写在课堂中使用的真实姓名。'}</p>
        {!token ? <><p className="join-classroom-hint">需要先登录学生账号，再回到这里完成加入。</p><Link className="join-classroom-action" to={loginPath}>登录学生账号</Link></>
          : isTeacherUser(user) ? <p className="join-classroom-hint">当前是教师账号，请使用学生账号登录后加入。</p>
            : confirming ? <><p className="join-classroom-hint"><Users size={15} />确认后会创建你的课堂成员记录。</p><button disabled={busy} onClick={() => void join()}>{busy ? '正在加入…' : '确认加入'}</button><button className="join-classroom-secondary" disabled={busy} onClick={() => setConfirming(false)}>返回修改</button></>
              : <><div className="join-classroom-tabs" role="tablist" aria-label="加入方式"><button role="tab" aria-selected={joinMode === 'code'} className={joinMode === 'code' ? 'active' : ''} onClick={() => { setJoinMode('code'); setError(''); }}>课堂码</button><button role="tab" aria-selected={joinMode === 'link'} className={joinMode === 'link' ? 'active' : ''} onClick={() => { setJoinMode('link'); setError(''); }}>邀请链接</button></div>
                {joinMode === 'code' ? <label>课堂码<input maxLength={8} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="8 位课堂码" /></label> : <label>邀请链接<input type="url" value={inviteLink} onChange={event => setInviteLink(event.target.value)} placeholder="粘贴老师发送的完整邀请链接" /></label>}
                <label>真实姓名<input maxLength={32} value={name} onChange={event => setName(event.target.value)} placeholder="例如：张同学" /></label><p className="join-classroom-hint"><Users size={15} />确认后会创建你的课堂成员记录。</p>
                <button onClick={() => { if (!inviteCode || !name.trim() || name.trim().length > 32) { setError(joinMode === 'link' ? '请粘贴有效的邀请链接，并填写真实姓名' : '请输入 8 位课堂码和不超过 32 字的真实姓名'); return; } setError(''); setConfirming(true); }}>下一步</button></>}
        {error && <p className="join-classroom-error" role="alert">{error}</p>}</>}
  </div></main>;
}
