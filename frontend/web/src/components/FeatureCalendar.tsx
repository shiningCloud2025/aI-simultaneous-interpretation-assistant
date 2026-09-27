import { useEffect, useMemo, useState } from 'react';
import './feature-calendar.css';

export interface CalendarEvent {
  date: string;
  title: string;
  subtitle?: string;
  tone?: 'green' | 'blue' | 'gold' | 'red' | 'purple';
  onClick?: () => void;
}

interface FeatureCalendarProps {
  events: CalendarEvent[];
  memoScope: string;
  onMonthChange?: (month: string) => void;
  emptyHint?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MAX_DOTS = 3;

function readMemos(key: string): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    return raw && typeof raw === 'object' ? raw as Record<string, string> : {};
  } catch {
    return {};
  }
}

export function FeatureCalendar({ events, memoScope, onMonthChange, emptyHint = '这一天没有安排' }: FeatureCalendarProps) {
  const todayKey = dateKey(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayKey);
  const storageKey = `feature-calendar-memo:${memoScope}`;
  const [memos, setMemos] = useState<Record<string, string>>(() => readMemos(storageKey));
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMemos(readMemos(storageKey));
  }, [storageKey]);

  useEffect(() => {
    setDraft(memos[selected] || '');
  }, [selected, memos]);

  const cursorMonth = monthKeyOf(cursor);
  useEffect(() => {
    onMonthChange?.(cursorMonth);
  }, [cursorMonth, onMonthChange]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date);
      if (list) list.push(ev);
      else map.set(ev.date, [ev]);
    }
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const persist = (next: Record<string, string>) => {
    setMemos(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore quota */ }
  };

  const moveMonth = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  const jumpToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(dateKey(now));
  };

  const pickDay = (day: Date) => {
    setSelected(dateKey(day));
    if (day.getMonth() !== cursor.getMonth()) setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
  };

  const saveMemo = () => {
    const text = draft.trim();
    const next = { ...memos };
    if (text) next[selected] = text;
    else delete next[selected];
    persist(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const clearMemo = () => {
    const next = { ...memos };
    delete next[selected];
    persist(next);
  };

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
  }, [selected]);
  const selectedEvents = eventsByDate.get(selected) || [];
  const selectedMemo = memos[selected];

  return (
    <div className="fcal">
      <div className="fcal-main">
        <div className="fcal-head">
          <strong>{cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月</strong>
          <div className="fcal-nav">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="上个月">‹</button>
            <button type="button" className="fcal-today-btn" onClick={jumpToday}>今天</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="下个月">›</button>
          </div>
        </div>
        <div className="fcal-week">
          {WEEK_LABELS.map(label => <span key={label}>周{label}</span>)}
        </div>
        <div className="fcal-grid">
          {gridDays.map(day => {
            const key = dateKey(day);
            const dayEvents = eventsByDate.get(key) || [];
            const hasMemo = Boolean(memos[key]);
            const classes = ['fcal-day'];
            if (day.getMonth() !== cursor.getMonth()) classes.push('out');
            if (key === todayKey) classes.push('today');
            if (key === selected) classes.push('sel');
            return (
              <button type="button" key={key} className={classes.join(' ')} onClick={() => pickDay(day)}>
                <span className="fcal-day-num">{day.getDate()}</span>
                {(dayEvents.length > 0 || hasMemo) && (
                  <span className="fcal-marks">
                    {dayEvents.slice(0, MAX_DOTS).map((ev, i) => (
                      <i key={i} className={`fcal-dot tone-${ev.tone || 'green'}`} />
                    ))}
                    {dayEvents.length > MAX_DOTS && <em className="fcal-more">+{dayEvents.length - MAX_DOTS}</em>}
                    {hasMemo && <b className="fcal-memo-mark" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="fcal-side">
        <div className="fcal-side-head">
          <strong>{selectedDate.getMonth() + 1} 月 {selectedDate.getDate()} 日</strong>
          <span>{WEEK_NAMES[selectedDate.getDay()]}{selected === todayKey ? ' · 今天' : ''}</span>
        </div>

        <div className="fcal-events">
          {selectedEvents.length === 0 && <p className="fcal-empty">{emptyHint}</p>}
          {selectedEvents.map((ev, i) => (
            <button
              type="button"
              key={`${ev.title}-${i}`}
              className={`fcal-event ${ev.onClick ? 'link' : ''}`}
              onClick={ev.onClick}
              disabled={!ev.onClick}
            >
              <i className={`fcal-dot tone-${ev.tone || 'green'}`} />
              <span>
                <strong>{ev.title}</strong>
                {ev.subtitle && <small>{ev.subtitle}</small>}
              </span>
              {ev.onClick && <em className="fcal-event-go">›</em>}
            </button>
          ))}
        </div>

        <div className="fcal-memo">
          <div className="fcal-memo-head">
            <strong>备忘录</strong>
            <span>仅自己可见 · 保存在本机</span>
          </div>
          <textarea
            rows={4}
            value={draft}
            maxLength={500}
            placeholder="给这一天留点什么…"
            onChange={event => setDraft(event.target.value)}
          />
          <div className="fcal-memo-actions">
            <button type="button" className="fcal-save" onClick={saveMemo} disabled={draft.trim() === (selectedMemo || '')}>
              {saved ? '已保存 ✓' : '保存备忘'}
            </button>
            {selectedMemo && <button type="button" className="fcal-clear" onClick={clearMemo}>清除</button>}
          </div>
        </div>
      </aside>
    </div>
  );
}
