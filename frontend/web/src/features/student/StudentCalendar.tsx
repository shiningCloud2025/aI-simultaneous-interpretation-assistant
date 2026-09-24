import { useEffect, useState } from 'react';
import { FeatureCalendar, type CalendarEvent } from '../../components/FeatureCalendar';
import { studentClassroomApi } from './studentClassroomApi';
import { apiCall } from '../../lib/api';
import { useAppStore } from '../../stores/appStore';

interface HistoryItem {
  id: number;
  createTime?: string;
  title?: string;
  word?: string;
}

interface PageResult<T> {
  records: T[];
}

const sessionStatusText: Record<number, string> = { 1: '进行中', 2: '已暂停', 3: '已结束' };
const sessionTone = { 1: 'green', 2: 'gold', 3: 'blue' } as const;

const historyPage = <T,>(url: string) =>
  apiCall<PageResult<T>>(url, { method: 'POST', body: JSON.stringify({ page: 1, size: 50, filter: { success: true } }) });

interface StudentCalendarProps {
  onOpenPanel: (panel: string) => void;
  onOpenSession: (sessionId: number) => void;
}

export function StudentCalendar({ onOpenPanel, onOpenSession }: StudentCalendarProps) {
  const user = useAppStore(state => state.user);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const rooms = await studentClassroomApi.pageClassrooms(1).catch(() => null);
      const roomList = rooms?.records || [];
      const [sessions, speaking, writing, review, vocab] = await Promise.all([
        Promise.allSettled(roomList.map(room => studentClassroomApi.pageSessions(room.id, 1))),
        historyPage<HistoryItem>('/speaking/material/history/page').catch(() => null),
        historyPage<HistoryItem>('/writing/composition/generation/history/page').catch(() => null),
        historyPage<HistoryItem & { score?: number }>('/writing/composition/evaluation/history/page').catch(() => null),
        historyPage<HistoryItem>('/reading/word/material/history/page').catch(() => null),
      ]);
      if (cancelled) return;

      const next: CalendarEvent[] = [];
      sessions.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const roomName = roomList[index]?.name || '课堂';
        for (const session of result.value.records) {
          if (!session.startTime) continue;
          next.push({
            date: session.startTime.slice(0, 10),
            title: session.sessionName,
            subtitle: `${roomName} · ${sessionStatusText[session.status] || '课次'}`,
            tone: sessionTone[session.status] || 'blue',
            onClick: () => onOpenSession(session.id),
          });
        }
      });
      const pushHistory = (items: HistoryItem[] | undefined, label: string, tone: CalendarEvent['tone'], panel: string, extra?: (item: HistoryItem) => string | undefined) => {
        for (const item of items || []) {
          if (!item.createTime) continue;
          const detail = extra?.(item) || item.title || item.word;
          next.push({
            date: item.createTime.slice(0, 10),
            title: label,
            subtitle: `${item.createTime.slice(11, 16)}${detail ? ` · ${detail}` : ''}`,
            tone,
            onClick: () => onOpenPanel(panel),
          });
        }
      };
      pushHistory(speaking?.records, '口语练习', 'purple', 'speaking-practice');
      pushHistory(writing?.records, '生成写作题目', 'gold', 'writing');
      pushHistory(review?.records, '作文批阅', 'gold', 'writing-review', item => (item as { score?: number }).score != null ? `得分 ${(item as { score?: number }).score}` : item.title);
      pushHistory(vocab?.records, '单词学习', 'blue', 'vocab');

      setEvents(next);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
    // 回调 props 由父组件内联创建，不作为依赖，避免每次渲染重复拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', fontSize: 12, color: '#999' }}>正在汇总你的学习足迹…</div>;
  }
  return (
    <FeatureCalendar
      events={events}
      memoScope={`student-${user?.id || user?.account || 'anon'}`}
      emptyHint="这一天没有学习记录"
    />
  );
}
