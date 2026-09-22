import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, GraduationCap, Users } from 'lucide-react';
import { api, useAppStore } from '../stores/appStore';
import { apiCall } from '../lib/api';
import { isTeacherUser } from '../lib/authRole';
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
  const [name, setName] = useState('');
  const [result, setResult] = useState<JoinedClassroom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (token && !user) void api.getUserInfo().then(setUser).catch(() => setError('登录状态已失效，请重新登录')); }, [token, user, setUser]);

  const join = async () => {
    if (!/^[A-Z0-9]{8}$/.test(code.trim())) { setError('请输入 8 位课堂码'); return; }
    if (!name.trim() || name.trim().length > 32) { setError('请输入不超过 32 字的真实姓名'); return; }
    if (!window.confirm(`确认用“${name.trim()}”加入课堂码 ${code.trim()} 对应的课堂吗？`)) return;
    setBusy(true);
    setError('');
    try {
      const classroom = await apiCall<JoinedClassroom>('/student/classroom/join', {
        method: 'POST', body: JSON.stringify({ inviteCode: code.trim(), studentName: name.trim() }),
      });
      setResult(classroom);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '加入失败'); }
    finally { setBusy(false); }
  };

  const loginPath = `/login?next=${encodeURIComponent(`/join-classroom?code=${code.trim()}`)}`;

  return <main className="join-classroom-page"><div className="join-classroom-card"><Link className="join-classroom-back" to="/"><ArrowLeft size={17} />返回首页</Link><span className="join-classroom-icon"><GraduationCap size={30} /></span><p className="join-classroom-eyebrow">智语同航 · 课堂邀请</p><h1>{result ? '加入成功' : '加入老师的课堂'}</h1>{result ? <><p className="join-classroom-description">你已加入「{result.name}」，可以前往学生端查看课堂。</p><button onClick={() => navigate('/dashboard')}><Check size={17} />进入学生端</button></> : <><p className="join-classroom-description">输入老师分享的课堂码，填写在课堂中使用的真实姓名。</p>{!token ? <><p className="join-classroom-hint">需要先登录学生账号，再回到这里完成加入。</p><Link className="join-classroom-action" to={loginPath}>登录学生账号</Link></> : isTeacherUser(user) ? <p className="join-classroom-hint">当前是教师账号，请使用学生账号登录后加入。</p> : <><label>课堂码<input maxLength={8} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="8 位课堂码" /></label><label>真实姓名<input maxLength={32} value={name} onChange={event => setName(event.target.value)} placeholder="例如：张同学" /></label><p className="join-classroom-hint"><Users size={15} />确认后会创建你的课堂成员记录。</p><button disabled={busy} onClick={() => void join()}>{busy ? '正在加入…' : '确认加入课堂'}</button></>}{error && <p className="join-classroom-error" role="alert">{error}</p>}</>}</div></main>;
}
