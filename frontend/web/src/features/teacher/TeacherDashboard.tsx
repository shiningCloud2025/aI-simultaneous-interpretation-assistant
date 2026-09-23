import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Clock3, GraduationCap, History, LayoutGrid, Play, Plus, Users } from 'lucide-react';
import { teachingApi, type ClassroomList, type SessionList } from './teachingApi';

interface RecentSession extends SessionList {
  classroomName: string;
}

interface DashboardData {
  classrooms: ClassroomList[];
  memberTotal: number | null;
  sessionTotal: number;
  sessions: RecentSession[];
}

const sessionStatusNames: Record<number, string> = { 1: '进行中', 2: '已暂停', 3: '已结束' };
const sessionStatusClass: Record<number, string> = { 1: '', 2: 'paused', 3: 'ended' };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function dateText(value: string | null | undefined) {
  if (!value) return '—';
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TeacherDashboard({
  userName,
  revision = 0,
  onGo,
  onCreateClassroom,
}: {
  userName: string;
  revision?: number;
  onGo: (path: string) => void;
  onCreateClassroom: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const classroomPage = await teachingApi.pageClassrooms(1, 100, {});
        const rooms = classroomPage.records || [];
        const details = await Promise.all(rooms.map(async room => {
          const [members, sessions] = await Promise.all([
            teachingApi.pageMembers(room.id, 1, 1).catch(() => null),
            teachingApi.pageSessions(room.id, 1, 50).catch(() => null),
          ]);
          return { room, members, sessions };
        }));
        if (cancelled) return;
        const memberTotal = details.every(item => item.members)
          ? details.reduce((sum, item) => sum + (item.members?.total || 0), 0)
          : null;
        const sessions = details.flatMap(item =>
          (item.sessions?.records || []).map(session => ({ ...session, classroomName: item.room.name }))
        );
        const sessionTotal = details.reduce((sum, item) => sum + (item.sessions?.total || 0), 0);
        setData({ classrooms: rooms, memberTotal, sessionTotal, sessions });
      } catch {
        if (!cancelled) setData({ classrooms: [], memberTotal: null, sessionTotal: 0, sessions: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [revision]);

  const rooms = data?.classrooms ?? [];
  const activeRooms = rooms.filter(room => room.status === 1);
  const archivedCount = rooms.length - activeRooms.length;
  const sortedSessions = [...(data?.sessions ?? [])]
    .sort((a, b) => +new Date(b.startTime.replace(' ', 'T')) - +new Date(a.startTime.replace(' ', 'T')));
  const running = sortedSessions.filter(session => session.status === 1);
  const paused = sortedSessions.filter(session => session.status === 2);
  const live = running[0] || paused[0] || null;
  const weekCount = sortedSessions
    .filter(session => Date.now() - +new Date(session.startTime.replace(' ', 'T')) < 7 * 86400000)
    .length;
  const recent = sortedSessions.slice(0, 6);

  return <div className="teacher-page">
    <section className="teacher-welcome">
      <div>
        <span>{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
        <h1>{greeting()}，{userName}</h1>
        <p>{live
          ? `「${live.sessionName}」${live.status === 1 ? '正在进行' : '已暂停'} · ${live.classroomName}，可在下方卡片进入课堂控制台。`
          : '准备好今天的课堂，让语言学习自然发生。'}</p>
      </div>
      <button className="teacher-primary" onClick={onCreateClassroom}><Plus size={17} />创建课堂</button>
    </section>

    <section className="teacher-stat-grid">
      <Stat icon={<LayoutGrid />} label="我的课堂" value={activeRooms.length} hint={`共 ${rooms.length} 个 · 归档 ${archivedCount} 个`} tone="green" onClick={() => onGo('/teacher/classrooms')} />
      <Stat icon={<Users />} label="学生总数" value={data?.memberTotal ?? (loading ? '…' : '--')} hint="全部课堂成员" tone="blue" onClick={() => onGo('/teacher/classrooms')} />
      <Stat icon={<History />} label="累计课节" value={data ? data.sessionTotal : '…'} hint={`近 7 天开课 ${weekCount} 节`} tone="brown" onClick={() => onGo('/teacher/sessions')} />
      <Stat icon={<Play />} label="进行中课节" value={running.length} hint={`已暂停 ${paused.length} 节`} tone="gold" onClick={() => onGo(live ? `/teacher/sessions/${live.id}` : '/teacher/sessions')} />
    </section>

    <div className="teacher-dashboard-grid">
      <section className="teacher-card teacher-recent-card">
        <CardHead title="最近课节" subtitle="所有课堂的最新开课记录" action="上课记录" onAction={() => onGo('/teacher/sessions')} />
        {recent.length ? <div className="teacher-recent-list">
          {recent.map((session, index) => <button key={session.id} onClick={() => onGo(`/teacher/sessions/${session.id}`)}>
            <span className={`teacher-class-symbol tone-${index % 3}`}><BookOpen size={19} /></span>
            <span className="teacher-recent-info">
              <strong>{session.sessionName}</strong>
              <small>{session.classroomName} · {dateText(session.startTime)}</small>
            </span>
            <span className={`teacher-session-state ${sessionStatusClass[session.status]}`}>{sessionStatusNames[session.status]}</span>
            <ChevronRight size={17} />
          </button>)}
        </div> : <div className="teacher-empty-small"><span><Clock3 size={22} /></span><strong>{loading ? '正在加载课节…' : '还没有上课记录'}</strong><p>从「我的课堂」选择一间课堂开始上课。</p></div>}
      </section>

      <section className="teacher-card">
        <CardHead title="当前授课" subtitle="进行中与暂停中的课节" />
        {live ? <button className="teacher-current-session" onClick={() => onGo(`/teacher/sessions/${live.id}`)}>
          <span className="teacher-live-ring"><i /><Play size={22} /></span>
          <strong>{live.sessionName}</strong>
          <small>{live.classroomName}</small>
          <span>{live.status === 2 ? '已暂停，点击进入继续' : '正在进行，点击进入控制台'}</span>
        </button> : <div className="teacher-empty-small"><span><Clock3 size={22} /></span><strong>当前没有进行中的课节</strong><p>从「我的课堂」选择一间课堂开始上课。</p></div>}
      </section>
    </div>

    <section className="teacher-card teacher-quick-card">
      <CardHead title="快捷操作" subtitle="常用的教学管理入口" />
      <div className="teacher-quick-grid">
        <Quick icon={<Plus />} title="创建课堂" text="建立新的教学班级" onClick={onCreateClassroom} />
        <Quick icon={<LayoutGrid />} title="我的课堂" text="管理课堂与学生" onClick={() => onGo('/teacher/classrooms')} />
        <Quick icon={<GraduationCap />} title="学生预习" text="体验学生学习链路" onClick={() => onGo('/teacher/preview')} />
        <Quick icon={<BookOpen />} title="通用工具" text="写作口语等教学工具" onClick={() => onGo('/teacher/utilities')} />
      </div>
    </section>
  </div>;
}

function Stat({ icon, label, value, hint, tone, onClick }: { icon: React.ReactNode; label: string; value: string | number; hint: string; tone: string; onClick: () => void }) {
  return <button className={`teacher-stat tone-${tone}`} onClick={onClick}>
    <span>{icon}</span>
    <div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div>
    <ChevronRight size={16} />
  </button>;
}

function Quick({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button className="teacher-quick" onClick={onClick}>
    <span>{icon}</span>
    <div><strong>{title}</strong><small>{text}</small></div>
    <ChevronRight size={16} />
  </button>;
}

function CardHead({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="teacher-card-head">
    <div><h2>{title}</h2><p>{subtitle}</p></div>
    {action && <button onClick={onAction}>{action}<ChevronRight size={14} /></button>}
  </div>;
}
