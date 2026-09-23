import type { ReactNode } from 'react';
import { CirclePause, Play, Square } from 'lucide-react';
import type { SessionDetail } from './teachingApi';
import { teacherInteractions } from './teacherInteractionCatalog';
import './teacher-live-console.css';

export interface ConsoleStats {
  total: number;
  present: number;
  absent: string[];
}

function dateText(value: string | null | undefined) {
  if (!value) return '—';
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TeacherLiveConsole({ session, classroomName, stats, busy, onPause, onResume, onEnd, onInteraction, children }: {
  session: SessionDetail;
  classroomName: string;
  stats: ConsoleStats | null;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onInteraction: (id: string) => void;
  children?: ReactNode;
}) {
  const paused = session.status === 2;
  const absentCount = stats ? stats.total - stats.present : 0;
  return <div className="teacher-console">
    <div className={`teacher-console-topbar${paused ? ' paused' : ''}`}>
      <span className="teacher-console-dot" aria-hidden="true" />
      <div className="teacher-console-title">
        <strong>{paused ? '已暂停' : '上课中'}</strong>
        <h1>{session.sessionName}</h1>
        <p>{classroomName} · 首次开课 {dateText(session.startTime)}{paused ? ' · 学生暂时无法签到' : ''}</p>
      </div>
      <div className="teacher-console-controls">
        {session.status === 1 && <button disabled={busy} onClick={onPause}><CirclePause size={16} />暂停</button>}
        {session.status === 2 && <button disabled={busy} onClick={onResume}><Play size={16} />继续</button>}
        <button className="end" disabled={busy} onClick={onEnd}><Square size={14} />结束课次</button>
      </div>
    </div>
    <div className="teacher-console-grid">
      <section className="teacher-console-interactions" aria-label="课中互动">
        <div className="teacher-console-section-head">
          <h2>课中互动</h2>
          <p>互动功能陆续上线，发起后学生端会实时收到</p>
        </div>
        <div className="teacher-interaction-grid">
          {teacherInteractions.map(item => <button key={item.id} className="teacher-interaction-card" data-state={item.status} onClick={() => onInteraction(item.id)}>
            <span className="teacher-interaction-icon"><item.icon size={20} /></span>
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            {item.status === 'coming' && <em>即将上线</em>}
          </button>)}
        </div>
      </section>
      <aside className="teacher-console-rail">
        <section className="teacher-console-board" aria-label="签到看板">
          <div className="teacher-console-board-head"><h2>签到看板</h2><strong>{stats ? `${stats.present}/${stats.total}` : '—'}</strong></div>
          <div className="teacher-console-board-track"><i style={{ width: stats && stats.total ? `${Math.round(stats.present / stats.total * 100)}%` : '0%' }} /></div>
          {stats && absentCount > 0 && <div className="teacher-console-absent"><span>未到 {absentCount} 人</span><div>{stats.absent.map(name => <em key={name}>{name}</em>)}{absentCount > stats.absent.length && <em>+{absentCount - stats.absent.length}</em>}</div></div>}
          {stats && stats.total > 0 && absentCount === 0 && <p className="teacher-console-all-present">全员到齐</p>}
        </section>
        {children}
      </aside>
    </div>
  </div>;
}
