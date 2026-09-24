import { useEffect, useState } from 'react';
import { FeatureCalendar, type CalendarEvent } from '../../components/FeatureCalendar';
import { useAppStore } from '../../stores/appStore';
import { teachingApi } from './teachingApi';

const sessionStatusText: Record<number, string> = { 1: '进行中', 2: '已暂停', 3: '已结束' };
const sessionTone = { 1: 'green', 2: 'gold', 3: 'blue' } as const;

interface TeacherCalendarProps {
  revision?: number;
  onGo: (path: string) => void;
}

export function TeacherCalendar({ revision = 0, onGo }: TeacherCalendarProps) {
  const user = useAppStore(state => state.user);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const classrooms = await teachingApi.pageClassrooms(1, 100).catch(() => null);
      const rooms = classrooms?.records || [];
      const sessionLists = await Promise.allSettled(
        rooms.map(room => teachingApi.pageSessions(room.id, 1, 50)),
      );
      if (cancelled) return;

      const next: CalendarEvent[] = [];
      sessionLists.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const roomName = rooms[index]?.name || '课堂';
        for (const session of result.value.records) {
          if (!session.startTime) continue;
          next.push({
            date: session.startTime.slice(0, 10),
            title: session.sessionName,
            subtitle: `${roomName} · ${session.startTime.slice(11, 16)} · ${sessionStatusText[session.status] || '课次'}`,
            tone: sessionTone[session.status] || 'blue',
            onClick: () => onGo(`/teacher/sessions/${session.id}`),
          });
        }
      });
      setEvents(next);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
    // onGo 由父组件内联创建，不作为依赖，避免每次渲染重复拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, revision]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', fontSize: 12, color: '#999' }}>正在汇总各课堂的课次…</div>;
  }
  return (
    <FeatureCalendar
      events={events}
      memoScope={`teacher-${user?.id || user?.account || 'anon'}`}
      emptyHint="这一天没有课次安排"
    />
  );
}
