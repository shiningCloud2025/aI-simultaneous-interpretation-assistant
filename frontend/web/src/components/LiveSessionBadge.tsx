import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { ArrowRight } from 'lucide-react';
import { studentClassroomApi } from '../features/student/studentClassroomApi';
import { teachingApi } from '../features/teacher/teachingApi';
import './live-session-badge.css';

interface LiveConsoleState {
  sessionId: number | null;
  setSessionId: (sessionId: number | null) => void;
}

export const useLiveConsole = create<LiveConsoleState>(set => ({
  sessionId: null,
  setSessionId: sessionId => set({ sessionId }),
}));

interface LiveTarget {
  sessionId: number;
  sessionName: string;
  startTime: string;
}

const POLL_INTERVAL = 30000;

async function detectStudentLive(): Promise<LiveTarget | null> {
  const classrooms = await studentClassroomApi.pageClassrooms(1, '', 1);
  const found = await Promise.all(classrooms.records.map(room =>
    studentClassroomApi.pageSessions(room.id, 1, { status: 1 })
      .then(page => page.records[0] || null)
      .catch(() => null),
  ));
  return pickLatest(found);
}

async function detectTeacherLive(): Promise<LiveTarget | null> {
  const classrooms = await teachingApi.pageClassrooms(1, 100, {});
  const found = await Promise.all(classrooms.records.filter(room => room.status === 1).map(room =>
    teachingApi.pageSessions(room.id, 1, 12, { status: 1 })
      .then(page => page.records[0] || null)
      .catch(() => null),
  ));
  return pickLatest(found);
}

function pickLatest(sessions: ({ id: number; sessionName: string; startTime: string } | null)[]): LiveTarget | null {
  const live = sessions.filter((item): item is { id: number; sessionName: string; startTime: string } => Boolean(item));
  if (!live.length) return null;
  live.sort((a, b) => b.startTime.localeCompare(a.startTime));
  return { sessionId: live[0].id, sessionName: live[0].sessionName, startTime: live[0].startTime };
}

export function LiveSessionBadge({ role, onOpen }: { role: 'student' | 'teacher'; onOpen: (sessionId: number) => void }) {
  const consoleSessionId = useLiveConsole(state => state.sessionId);
  const [target, setTarget] = useState<LiveTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const found = role === 'student' ? await detectStudentLive() : await detectTeacherLive();
        if (!cancelled) setTarget(found);
      } catch {
        if (!cancelled) setTarget(null);
      }
    };
    void check();
    const timer = window.setInterval(() => { void check(); }, POLL_INTERVAL);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [role]);

  if (!target || consoleSessionId === target.sessionId) return null;
  return (
    <button className="live-session-badge" onClick={() => onOpen(target.sessionId)} title={`进入课次：${target.sessionName}`}>
      <span className="live-session-badge-dot" aria-hidden="true" />
      <span className="live-session-badge-label">上课中</span>
      <strong>{target.sessionName}</strong>
      <ArrowRight size={14} />
    </button>
  );
}
