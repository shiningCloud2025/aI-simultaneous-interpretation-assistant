import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { appConfirm } from '../../lib/appDialog';
import { adminApi, type MailAccountManageFilter, type ManagedMailAccount, type PageResult } from './adminApi';
import './admin-mail-account.css';

export function AdminMailAccountPanel() {
  const [filter, setFilter] = useState<MailAccountManageFilter>({});
  const [query, setQuery] = useState({ page: 1, size: 20, filter: {} as MailAccountManageFilter });
  const [data, setData] = useState<PageResult<ManagedMailAccount>>({ records: [], total: 0, current: 1, size: 20 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<ManagedMailAccount | null>(null);
  const requestId = useRef(0);
  const mutationPending = useRef(false);
  const pages = Math.max(1, Math.ceil(data.total / query.size));

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    adminApi.mailAccounts(query).then(result => {
      if (id !== requestId.current) return;
      const lastPage = Math.max(1, Math.ceil(result.total / query.size));
      if (query.page > lastPage) {
        setQuery(current => ({ ...current, page: lastPage }));
        return;
      }
      setData(result);
    }).catch(cause => {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : '邮箱绑定加载失败');
    }).finally(() => {
      if (id === requestId.current) setLoading(false);
    });
    return () => { requestId.current++; };
  }, [query]);

  const changeAccount = async (item: ManagedMailAccount, action: 'delete' | 1 | 3) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setBusy(true);
    const label = action === 'delete' ? '删除绑定' : action === 3 ? '禁用绑定' : '设为可用';
    try {
      const confirmed = await appConfirm({
        title: label,
        message: action === 'delete'
          ? `确定删除 ${item.email} 的平台绑定？不会删除邮箱服务商中的账号或邮件。`
          : action === 3
            ? `确定禁用 ${item.email}？用户将无法通过平台访问该邮箱。`
            : `确定将 ${item.email} 设为可用？此操作不会测试邮箱连接。`,
        confirmText: label,
        danger: action !== 1,
      });
      if (!confirmed) return;
      setError('');
      setNotice('');
      if (action === 'delete') await adminApi.deleteMailAccount(item.id);
      else await adminApi.updateMailAccountStatus(item.id, action);
      setNotice(`${item.email} 已${action === 'delete' ? '删除绑定' : action === 3 ? '禁用' : '设为可用'}`);
      setQuery(current => ({ ...current }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败');
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  };

  return <div className="admin-panel admin-mail-panel">
    <h2>邮箱管理</h2>
    <form className="admin-toolbar" onSubmit={event => {
      event.preventDefault();
      setQuery({ ...query, page: 1, filter: { ...filter, keyword: filter.keyword?.trim() || undefined } });
    }}>
      <input className="admin-input" aria-label="邮箱或备注名" placeholder="邮箱 / 备注名" maxLength={128} value={filter.keyword || ''} onChange={event => setFilter({ ...filter, keyword: event.target.value })} />
      <select className="admin-select" aria-label="邮箱厂商" value={filter.provider || ''} onChange={event => setFilter({ ...filter, provider: event.target.value as MailAccountManageFilter['provider'] || undefined })}>
        <option value="">全部厂商</option><option value="QQ">QQ邮箱</option><option value="NETEASE_163">网易163邮箱</option>
      </select>
      <select className="admin-select" aria-label="用户类型" value={filter.userType || ''} onChange={event => setFilter({ ...filter, userType: event.target.value as MailAccountManageFilter['userType'] || undefined })}>
        <option value="">全部角色</option><option value="student">学生</option><option value="teacher">老师</option><option value="superadmin">超级管理员</option>
      </select>
      <select className="admin-select" aria-label="邮箱状态" value={filter.status ?? ''} onChange={event => setFilter({ ...filter, status: event.target.value === '' ? undefined : Number(event.target.value) as ManagedMailAccount['status'] })}>
        <option value="">全部状态</option><option value="0">未测试</option><option value="1">可用</option><option value="2">不可用</option><option value="3">禁用</option>
      </select>
      <button className="admin-btn primary" disabled={loading || busy}><Search size={15} />查询</button>
      <button type="button" className="admin-btn" disabled={loading || busy} onClick={() => { setFilter({}); setQuery({ page: 1, size: query.size, filter: {} }); }}>重置</button>
      <button type="button" className="admin-btn" title="刷新" aria-label="刷新" disabled={loading || busy} onClick={() => setQuery(current => ({ ...current }))}><RefreshCw size={16} /></button>
    </form>
    {error && <div role="alert" className="admin-mail-error">{error}</div>}
    {notice && <div role="status" className="admin-mail-notice">{notice}</div>}
    <div className="admin-table-wrap" aria-busy={loading}>
      <table className="admin-table admin-mail-table">
        <thead><tr><th>邮箱</th><th>所属用户</th><th>角色</th><th>状态</th><th>访问密码</th><th>最后测试</th><th>绑定时间</th><th className="admin-mail-actions-col">操作</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={8} className="admin-mail-empty">正在加载邮箱绑定…</td></tr> : error ? <tr><td colSpan={8} className="admin-mail-empty">请刷新重试</td></tr> : !data.records.length ? <tr><td colSpan={8} className="admin-mail-empty">暂无匹配的邮箱绑定</td></tr> : data.records.map(item => <tr key={item.id}>
            <td><strong>{item.displayName || item.email}</strong><div>{item.email}</div><small className="admin-muted">{item.providerName}</small></td>
            <td><strong>{item.username || '未知用户'}</strong><div>{item.account || '—'}</div><small className="admin-muted">ID：{item.userId}</small></td>
            <td>{item.userTypeText || '—'}</td>
            <td><span className={`admin-pill ${item.status === 1 ? 'ok' : item.status >= 2 ? 'err' : ''}`}>{item.statusText}</span></td>
            <td>{item.accessProtected ? '已设置' : '未设置'}</td>
            <td>{item.lastTestTime || '暂未测试'}</td><td>{item.createTime || '—'}</td>
            <td className="admin-mail-actions-col"><div className="admin-mail-actions">
              <button className="admin-btn" disabled={busy} onClick={() => setDetail(item)}>详情</button>
              {item.status !== 1 && <button className="admin-btn" disabled={busy} onClick={() => void changeAccount(item, 1)}>设为可用</button>}
              {item.status !== 3 && <button className="admin-btn" disabled={busy} onClick={() => void changeAccount(item, 3)}>禁用</button>}
              <button className="admin-btn danger" disabled={busy} onClick={() => void changeAccount(item, 'delete')}>删除</button>
            </div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="admin-pagination">
      <span>共 {data.total} 条 · 第 {query.page} / {pages} 页</span>
      <div className="admin-page-buttons">
        <select className="admin-select" aria-label="每页条数" value={query.size} disabled={loading || busy} onChange={event => setQuery({ ...query, page: 1, size: Number(event.target.value) })}>{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} 条/页</option>)}</select>
        <button className="admin-btn" aria-label="上一页" title="上一页" disabled={loading || busy || query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}><ChevronLeft size={16} /></button>
        <button className="admin-btn" aria-label="下一页" title="下一页" disabled={loading || busy || query.page >= pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}><ChevronRight size={16} /></button>
      </div>
    </div>
    {detail && <div className="admin-account-edit-mask" onClick={event => { if (event.target === event.currentTarget) setDetail(null); }} onKeyDown={event => { if (event.key === 'Escape') setDetail(null); }}>
      <div className="admin-account-edit admin-mail-detail" role="dialog" aria-modal="true" aria-labelledby="mail-detail-title">
        <header><h3 id="mail-detail-title">邮箱绑定详情</h3><button autoFocus className="admin-btn" title="关闭" aria-label="关闭" onClick={() => setDetail(null)}><X size={18} /></button></header>
        <dl>{[
          ['绑定ID', detail.id], ['邮箱账号', detail.email], ['邮箱命名', detail.displayName],
          ['用户名', detail.username || '—'], ['登录账号', detail.account || '—'], ['用户 ID', detail.userId],
          ['用户角色', detail.userTypeText], ['邮箱厂商', detail.providerName], ['状态', detail.statusText], ['访问密码', detail.accessProtected ? '已设置' : '未设置'],
          ['最后测试时间', detail.lastTestTime], ['最后错误', detail.lastError], ['创建人ID', detail.createdById], ['创建时间', detail.createTime], ['更新人ID', detail.updatedById], ['更新时间', detail.updateTime],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
      </div>
    </div>}
  </div>;
}
