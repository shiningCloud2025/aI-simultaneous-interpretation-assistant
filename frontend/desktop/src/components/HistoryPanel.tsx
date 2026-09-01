import { useCallback, useEffect, useState } from 'react';
import type { PageResult } from '../lib/api';

/**
 * 通用历史记录面板。
 * 三个业务面板（阅读/写作/批阅）共用，解决"切走再回来要重新生成、看不到记录"的问题。
 */
export function HistoryPanel<T>(props: {
  title: string;
  /** 分页拉取，返回 MyBatis-Plus 分页结果 */
  fetcher: (page: number, size: number) => Promise<PageResult<T>>;
  /** 每条记录的主标题 */
  renderTitle: (item: T) => string;
  /** 每条记录的副标题/摘要 */
  renderSummary?: (item: T) => string;
  /** 点击某条记录时回显到主区域 */
  onSelect: (item: T) => void;
  /** 当前是否正在生成新内容（生成中隐藏加载更多，避免误触） */
  busy?: boolean;
  /** 外部数据版本号，变化时自动重新加载（如生成成功后 +1） */
  refreshKey?: number;
}) {
  const { title, fetcher, renderTitle, renderSummary, onSelect, busy, refreshKey } = props;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);

  const PAGE_SIZE = 10;

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetcher(targetPage, PAGE_SIZE);
        const records = res.records || [];
        setItems((prev) => (append ? [...prev, ...records] : records));
        setTotal(res.total || 0);
        setPage(targetPage);
      } catch (e: any) {
        setError(e?.message || '历史记录加载失败');
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  // 首次进入或数据版本变化时重新拉取
  useEffect(() => {
    load(1, false);
  }, [load, refreshKey]);

  if (items.length === 0 && !loading && !error) {
    return null; // 没有历史时不占用空间
  }

  const hasMore = items.length < total;

  return (
    <div className="history-panel">
      <div className="history-head">
        <button className="history-toggle" onClick={() => setOpen((v) => !v)}>
          <span className={`history-arrow ${open ? 'open' : ''}`}>▾</span>
          {title}
          <span className="history-count">{total}</span>
        </button>
        {!busy && (
          <button className="history-refresh" onClick={() => load(1, false)} disabled={loading} title="刷新历史">
            ↻
          </button>
        )}
      </div>

      {open && (
        <>
          {error && <div className="desktop-error">{error}</div>}
          <div className="history-list">
            {items.map((item, index) => (
              <button
                className="history-item"
                key={(item as { id?: number })?.id ?? index}
                onClick={() => onSelect(item)}
                title="点击查看这条记录"
              >
                <span className="history-item-title">{renderTitle(item)}</span>
                {renderSummary && <span className="history-item-summary">{renderSummary(item)}</span>}
                <span className="history-item-time">
                  {formatTime((item as { createTime?: string })?.createTime)}
                </span>
              </button>
            ))}
          </div>
          {hasMore && (
            <button
              className="history-more"
              onClick={() => load(page + 1, true)}
              disabled={loading || busy}
            >
              {loading ? '加载中...' : `加载更多（还有 ${total - items.length} 条）`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function formatTime(raw?: unknown) {
  if (!raw) return '';
  // 后端 LocalDateTime 通常序列化为字符串；少数配置为数组 [y,m,d,h,mi,s]
  const text = Array.isArray(raw) ? (raw as unknown[]).slice(0, 6).join('-') : String(raw);
  const date = new Date(text.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(raw).slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
