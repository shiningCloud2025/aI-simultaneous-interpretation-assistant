import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronLeft, Eye, Megaphone, Search, X } from 'lucide-react';
import { apiCall } from '../lib/api';
import './announcement-center.css';

interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export interface AnnouncementListItem {
  id: number;
  title: string;
  coverUrl?: string | null;
  status?: number | string | null;
  statusText?: string | null;
  publishTime?: string | null;
  read?: boolean | null;
  createTime?: string | null;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  titleContent?: string | null;
  content?: string | null;
  createdById?: number | null;
  updatedById?: number | null;
  updateTime?: string | null;
}

const pageSize = 8;

const announcementApi = {
  latestUnread: () => apiCall<AnnouncementDetail | null>('/sys/user/announcement/latest-unread'),
  page: (page: number, keyword: string) =>
    apiCall<PageResult<AnnouncementListItem>>('/sys/user/announcement/page', {
      method: 'POST',
      body: JSON.stringify({ page, size: pageSize, filter: { keyword: keyword.trim() || null } }),
    }),
  detail: (id: number) => apiCall<AnnouncementDetail>(`/sys/user/announcement/${id}`),
  read: (id: number) => apiCall<void>(`/sys/user/announcement/${id}/read`, { method: 'PUT' }),
};

export function AnnouncementCenter({ buttonClassName = 'announcement-trigger' }: { buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PageResult<AnnouncementListItem>>({ records: [], total: 0, size: pageSize, current: 1 });
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [latest, setLatest] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pages = useMemo(() => items.pages || Math.max(1, Math.ceil((items.total || 0) / (items.size || pageSize))), [items]);

  const load = async (targetPage = page, targetKeyword = keyword) => {
    setLoading(true);
    try {
      setItems(await announcementApi.page(targetPage, targetKeyword));
      setError('');
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  };

  const openList = () => {
    setOpen(true);
    setDetail(null);
    void load(1);
  };

  const openDetail = async (id: number) => {
    setLoading(true);
    try {
      const data = await announcementApi.detail(id);
      setDetail(data);
      setError('');
      if (!data.read) {
        await announcementApi.read(id);
        setItems(current => ({
          ...current,
          records: current.records.map(item => item.id === id ? { ...item, read: true } : item),
        }));
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  };

  const closeLatest = async () => {
    const id = latest?.id;
    setLatest(null);
    if (!id) return;
    try {
      await announcementApi.read(id);
    } catch {
      // 主动弹窗关闭失败不打断用户进入系统，公告栏仍可再次查看。
    }
  };

  const viewLatestDetail = async () => {
    const data = latest;
    if (!data) return;
    setOpen(true);
    setDetail(data);
    setLatest(null);
    try {
      await announcementApi.read(data.id);
    } catch {
      // 用户已经进入详情，标记失败时不阻断阅读。
    }
  };

  useEffect(() => {
    let cancelled = false;
    announcementApi.latestUnread()
      .then(data => { if (!cancelled && data?.id) setLatest(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (open && !detail) void load(page);
  }, [page]);

  return (
    <>
      <button className={buttonClassName} onClick={openList}><Bell size={16} />公告</button>
      {open && (
        <div className="announcement-mask" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}>
          <section className="announcement-panel">
            <header className="announcement-head">
              <div>
                <h2>{detail ? '公告详情' : '系统公告'}</h2>
                <p>{detail ? '查看公告正文与发布时间' : '查看平台发布的全部系统公告'}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="关闭公告"><X size={18} /></button>
            </header>

            {error && <div className="announcement-error">{error}</div>}

            {detail ? (
              <AnnouncementDetailView detail={detail} onBack={() => setDetail(null)} />
            ) : (
              <>
                <div className="announcement-toolbar">
                  <label><Search size={15} /><input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { setPage(1); void load(1); } }} placeholder="搜索公告标题" /></label>
                  <button onClick={() => { setPage(1); void load(1); }}>查询</button>
                </div>
                <div className="announcement-list">
                  {items.records.map(item => (
                    <button key={item.id} className={`announcement-row ${item.read ? '' : 'unread'}`} onClick={() => openDetail(item.id)}>
                      <span className="announcement-row-icon"><Megaphone size={18} /></span>
                      <span className="announcement-row-main">
                        <strong>{item.title || '未命名公告'}</strong>
                        <small>{item.publishTime ? `发布于 ${formatTime(item.publishTime)}` : `创建于 ${formatTime(item.createTime)}`}</small>
                      </span>
                      {!item.read && <span className="announcement-unread">未读</span>}
                      <Eye size={16} />
                    </button>
                  ))}
                  {!items.records.length && <div className="announcement-empty">{loading ? '正在加载公告...' : '暂无公告'}</div>}
                </div>
                <div className="announcement-pager">
                  <span>共 {items.total || 0} 条 · 第 {items.current || page}/{pages} 页</span>
                  <div>
                    <button disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))}>上一页</button>
                    <button disabled={page >= pages || loading} onClick={() => setPage(value => Math.min(pages, value + 1))}>下一页</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {latest && (
        <div className="announcement-mask announcement-latest-mask">
          <section className="announcement-latest">
            <span className="announcement-latest-icon"><Megaphone size={22} /></span>
            <h2>{latest.title || '系统公告'}</h2>
            {latest.coverUrl && <img src={latest.coverUrl} alt="" />}
            <div className="announcement-rich" dangerouslySetInnerHTML={{ __html: sanitizeHtml(latest.content || latest.titleContent || '') }} />
            <p>{latest.publishTime ? `发布于 ${formatTime(latest.publishTime)}` : ''}</p>
            <div>
              <button onClick={viewLatestDetail}>查看详情</button>
              <button className="primary" onClick={closeLatest}><CheckCircle2 size={16} />我知道了</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function AnnouncementDetailView({ detail, onBack }: { detail: AnnouncementDetail; onBack: () => void }) {
  return (
    <article className="announcement-detail">
      <button className="announcement-back" onClick={onBack}><ChevronLeft size={16} />公告列表</button>
      {detail.coverUrl && <img className="announcement-cover" src={detail.coverUrl} alt="" />}
      <h1 dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail.titleContent || detail.title || '系统公告') }} />
      <div className="announcement-detail-meta">
        <span>{detail.statusText || '已发布'}</span>
        <span>{detail.publishTime ? `发布于 ${formatTime(detail.publishTime)}` : `创建于 ${formatTime(detail.createTime)}`}</span>
      </div>
      <div className="announcement-rich" dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail.content || '') }} />
    </article>
  );
}

export function sanitizeHtml(html: string) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link, meta, style').forEach(node => node.remove());
  doc.body.querySelectorAll('*').forEach(element => {
    [...element.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) element.removeAttribute(attribute.name);
    });
  });
  return doc.body.innerHTML;
}

function formatTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function errorText(cause: unknown) {
  return cause instanceof Error ? cause.message : '操作失败，请稍后重试';
}
