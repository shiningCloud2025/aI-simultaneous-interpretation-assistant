import { useCallback, useState } from 'react';
import { FeatureCalendar, type CalendarEvent } from '../../components/FeatureCalendar';
import { useAppStore } from '../../stores/appStore';
import { adminApi } from './adminApi';

const monthRange = (month: string): [string, string] => {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y || 1970, m || 1, 0).getDate();
  return [`${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`];
};

export function AdminCalendarPanel() {
  const user = useAppStore(state => state.user);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const loadMonth = useCallback((month: string) => {
    const [startDate, endDate] = monthRange(month);
    adminApi.userTrend(startDate, endDate).then(trend => {
      setEvents((trend || [])
        .filter(item => item.date && (item.newUsers || 0) > 0)
        .map(item => ({
          date: item.date.slice(0, 10),
          title: `新增用户 ${item.newUsers}`,
          subtitle: item.totalUsers != null ? `累计用户 ${item.totalUsers}` : undefined,
          tone: 'green' as const,
        })));
    }).catch(() => setEvents([]));
  }, []);

  return (
    <FeatureCalendar
      events={events}
      memoScope={`admin-${user?.id || user?.account || 'anon'}`}
      onMonthChange={loadMonth}
      emptyHint="这一天没有新增用户"
    />
  );
}
