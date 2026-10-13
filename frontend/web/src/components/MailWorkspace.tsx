import { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Clock3, Inbox, KeyRound, Mail, MailOpen, Paperclip, Plus, RefreshCw, Search, Send, ShieldCheck, Trash2, X } from 'lucide-react';
import { apiCall } from '../lib/api';
import { appConfirm } from '../lib/appDialog';
import './mail-workspace.css';

interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

interface MailAccount {
  id: number;
  provider: string;
  providerName: string;
  email: string;
  displayName?: string | null;
  accessProtected: boolean;
  status: number;
  statusText: string;
  lastTestTime?: string | null;
  lastError?: string | null;
  createTime?: string | null;
}

interface MailFolder {
  name: string;
  fullName: string;
  systemType: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'ARCHIVE' | 'CUSTOM';
  messageCount: number;
  unreadCount: number;
}

interface MailMessageSummary {
  uid: number;
  subject?: string | null;
  from?: string | null;
  sentDate?: string | null;
  receivedDate?: string | null;
  seen: boolean;
  hasAttachment: boolean;
  size?: number | null;
}

interface MailMessageDetail {
  uid: number;
  subject?: string | null;
  from?: string | null;
  to?: string[];
  cc?: string[];
  sentDate?: string | null;
  receivedDate?: string | null;
  seen: boolean;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments?: Array<{
    partPath: string;
    fileName?: string | null;
    contentType?: string | null;
    size?: number | null;
  }>;
}

const providers = [
  { value: 'QQ', label: 'QQ邮箱', hint: 'imap.qq.com / smtp.qq.com' },
  { value: 'NETEASE_163', label: '网易163邮箱', hint: 'imap.163.com / smtp.163.com' },
];

const folderIcons: Record<string, typeof Inbox> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: MailOpen,
  TRASH: Trash2,
  SPAM: ShieldCheck,
  ARCHIVE: Archive,
  CUSTOM: Mail,
};

const systemFolderNames: Record<string, string> = {
  INBOX: '收件箱',
  SENT: '已发送',
  DRAFTS: '草稿',
  TRASH: '已删除',
  SPAM: '垃圾邮件',
  ARCHIVE: '存档',
  CUSTOM: '自定义文件夹',
};

const emptyForm = {
  provider: 'QQ',
  email: '',
  displayName: '',
  mailAuthCode: '',
  accessPassword: '',
};

function request<T>(path: string, options?: RequestInit) {
  return apiCall<T>(path, options);
}

const mailApi = {
  accounts: () => request<MailAccount[]>('/sys/user/mail-account'),
  saveAccount: (data: typeof emptyForm) => request<void>('/sys/user/mail-account', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: number, data: typeof emptyForm) => request<void>(`/sys/user/mail-account/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id: number) => request<void>(`/sys/user/mail-account/${id}`, { method: 'DELETE' }),
  testAccount: (id: number) => request<void>(`/sys/user/mail-account/${id}/test`, { method: 'POST' }),
  verifyAccess: (id: number, accessPassword: string) => request<void>(`/sys/user/mail-account/${id}/verify-access`, { method: 'POST', body: JSON.stringify({ accessPassword }) }),
  folders: (accountId: number) => request<MailFolder[]>(`/sys/user/mail-account/${accountId}/space/folders`),
  messages: (accountId: number, page: number, size: number, folderName: string) =>
    request<PageResult<MailMessageSummary>>(`/sys/user/mail-account/${accountId}/space/messages/page`, {
      method: 'POST',
      body: JSON.stringify({ page, size, filter: { folderName } }),
    }),
  detail: (accountId: number, folderName: string, uid: number) =>
    request<MailMessageDetail>(`/sys/user/mail-account/${accountId}/space/messages/detail`, {
      method: 'POST',
      body: JSON.stringify({ folderName, uid }),
    }),
};

export function MailWorkspace() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<MailAccount | null>(null);
  const [verifiedAccountIds, setVerifiedAccountIds] = useState<Set<number>>(new Set());
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<MailFolder | null>(null);
  const [messages, setMessages] = useState<PageResult<MailMessageSummary> | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MailMessageDetail | null>(null);
  const [page, setPage] = useState(1);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showBindModal, setShowBindModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState<MailAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<MailAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [accessPassword, setAccessPassword] = useState('');
  const pageSize = 12;

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await mailApi.accounts();
      setAccounts(data);
      setError('');
      setActiveAccount(current => current ? data.find(item => item.id === current.id) || null : current);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoadingAccounts(false);
    }
  };

  const openAccount = async (account: MailAccount) => {
    if (account.accessProtected && !verifiedAccountIds.has(account.id)) {
      setAccessPassword('');
      setShowAccessModal(account);
      return;
    }
    setActiveAccount(account);
    setSelectedMessage(null);
    setActiveFolder(null);
    setPage(1);
  };

  const confirmAccess = async () => {
    if (!showAccessModal) return;
    try {
      await mailApi.verifyAccess(showAccessModal.id, accessPassword);
      setVerifiedAccountIds(previous => new Set(previous).add(showAccessModal.id));
      const account = showAccessModal;
      setShowAccessModal(null);
      setAccessPassword('');
      await openAccount({ ...account, accessProtected: false });
    } catch (cause) {
      setError(errorText(cause));
    }
  };

  const saveAccount = async () => {
    if (!form.email.trim()) return setError('请输入邮箱地址');
    if (!form.mailAuthCode.trim()) return setError('请输入邮箱客户端授权码');
    try {
      const payload = {
        ...form,
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        mailAuthCode: form.mailAuthCode.trim(),
        accessPassword: form.accessPassword.trim(),
      };
      if (editingAccount) await mailApi.updateAccount(editingAccount.id, payload);
      else await mailApi.saveAccount(payload);
      setShowBindModal(false);
      setEditingAccount(null);
      setForm(emptyForm);
      showNotice(editingAccount ? '邮箱绑定已更新' : '邮箱已绑定');
      await loadAccounts();
    } catch (cause) {
      setError(errorText(cause));
    }
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setShowBindModal(true);
  };

  const openEditModal = (account: MailAccount) => {
    setEditingAccount(account);
    setForm({
      provider: account.provider || 'QQ',
      email: account.email || '',
      displayName: account.displayName || '',
      mailAuthCode: '',
      accessPassword: '',
    });
    setShowBindModal(true);
  };

  const deleteAccount = async (account: MailAccount) => {
    const ok = await appConfirm({
      title: '删除邮箱绑定',
      message: `确定删除 ${account.displayName || account.email}？删除后平台将不再读取该邮箱。`,
      confirmText: '删除',
      danger: true,
    });
    if (!ok) return;
    setBusyId(account.id);
    try {
      await mailApi.deleteAccount(account.id);
      if (activeAccount?.id === account.id) {
        setActiveAccount(null);
        setFolders([]);
        setMessages(null);
        setSelectedMessage(null);
      }
      showNotice('邮箱绑定已删除');
      await loadAccounts();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusyId(null);
    }
  };

  const testAccount = async (account: MailAccount) => {
    setBusyId(account.id);
    try {
      await mailApi.testAccount(account.id);
      showNotice('连接测试通过');
      await loadAccounts();
    } catch (cause) {
      setError(errorText(cause));
      await loadAccounts();
    } finally {
      setBusyId(null);
    }
  };

  const loadFolders = async (account: MailAccount) => {
    setLoadingFolders(true);
    try {
      const data = await mailApi.folders(account.id);
      setFolders(data);
      const inbox = data.find(item => item.systemType === 'INBOX') || data[0] || null;
      setActiveFolder(inbox);
      setSelectedMessage(null);
      setPage(1);
      setError('');
    } catch (cause) {
      setError(errorText(cause));
      setFolders([]);
      setActiveFolder(null);
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadMessages = async (account: MailAccount, folder: MailFolder, targetPage = page) => {
    setLoadingMessages(true);
    try {
      const data = await mailApi.messages(account.id, targetPage, pageSize, folder.fullName);
      setMessages(data);
      setSelectedMessage(null);
      setError('');
    } catch (cause) {
      setError(errorText(cause));
      setMessages(null);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadDetail = async (message: MailMessageSummary) => {
    if (!activeAccount || !activeFolder) return;
    setLoadingDetail(true);
    try {
      setSelectedMessage(await mailApi.detail(activeAccount.id, activeFolder.fullName, message.uid));
      setError('');
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  useEffect(() => {
    if (activeAccount) void loadFolders(activeAccount);
  }, [activeAccount?.id]);

  useEffect(() => {
    if (activeAccount && activeFolder) void loadMessages(activeAccount, activeFolder, page);
  }, [activeAccount?.id, activeFolder?.fullName, page]);

  const messagePages = useMemo(() => {
    if (!messages) return 1;
    return messages.pages || Math.max(1, Math.ceil(messages.total / messages.size));
  }, [messages]);

  return (
    <div className="mail-workspace">
      <header className="mail-heading">
        <div>
          <h1>邮箱空间</h1>
          <p>绑定 QQ 或 163 邮箱后，可在平台内查看文件夹、邮件列表和邮件详情。</p>
        </div>
        <button className="mail-primary" onClick={openCreateModal}><Plus size={16} />绑定邮箱</button>
      </header>

      {error && <div className="mail-alert"><span>{error}</span><button onClick={() => setError('')}><X size={15} /></button></div>}

      {!activeAccount ? (
        <section className="mail-account-panel">
          <div className="mail-section-head">
            <div>
              <h2>我的绑定邮箱</h2>
              <p>{loadingAccounts ? '正在读取邮箱绑定…' : `${accounts.length} 个邮箱账号`}</p>
            </div>
            <button className="mail-ghost" onClick={loadAccounts}><RefreshCw size={15} />刷新</button>
          </div>

          {accounts.length === 0 && !loadingAccounts ? (
            <div className="mail-empty">
              <Mail size={38} />
              <strong>还没有绑定邮箱</strong>
              <span>绑定后即可读取收件箱、已发送等文件夹。</span>
              <button className="mail-primary" onClick={openCreateModal}>绑定第一个邮箱</button>
            </div>
          ) : (
            <div className="mail-account-grid">
              {accounts.map(account => (
                <article className="mail-account-card" key={account.id}>
                  <div className="mail-account-main" onClick={() => openAccount(account)}>
                    <span className="mail-account-icon"><Mail size={19} /></span>
                    <div>
                      <h3>{account.displayName || account.email}</h3>
                      <p>{account.providerName} · {account.email}</p>
                    </div>
                  </div>
                  <div className="mail-account-meta">
                    <span className={`mail-status status-${account.status}`}>{account.statusText}</span>
                    {account.accessProtected && <span className="mail-protected"><KeyRound size={13} />访问密码</span>}
                    <span>{account.lastTestTime ? `测试于 ${formatTime(account.lastTestTime)}` : '暂未测试'}</span>
                  </div>
                  {account.lastError && <div className="mail-account-error">{account.lastError}</div>}
                  <div className="mail-account-actions">
                    <button onClick={() => openAccount(account)}>进入邮箱</button>
                    <button onClick={() => openEditModal(account)}>编辑</button>
                    <button disabled={busyId === account.id} onClick={() => testAccount(account)}>{busyId === account.id ? '测试中…' : '测试连接'}</button>
                    <button className="danger" disabled={busyId === account.id} onClick={() => deleteAccount(account)}>删除</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mail-space">
          <aside className="mail-folder-sidebar">
            <button className="mail-back" onClick={() => { setActiveAccount(null); setSelectedMessage(null); }}>← 邮箱列表</button>
            <div className="mail-current-account">
              <strong>{activeAccount.displayName || activeAccount.email}</strong>
              <span>{activeAccount.providerName} · {activeAccount.email}</span>
            </div>
            <div className="mail-folder-list">
              {loadingFolders ? <div className="mail-loading">正在读取文件夹…</div> : folders.map(folder => {
                const Icon = folderIcons[folder.systemType] || Mail;
                return <button key={folder.fullName} className={activeFolder?.fullName === folder.fullName ? 'active' : ''} onClick={() => { setActiveFolder(folder); setPage(1); }}>
                  <Icon size={16} />
                  <span>{folderName(folder)}</span>
                  {folder.unreadCount > 0 && <b>{folder.unreadCount}</b>}
                </button>;
              })}
            </div>
          </aside>

          <main className="mail-message-area">
            <div className="mail-message-toolbar">
              <div>
                <h2>{activeFolder ? folderName(activeFolder) : '邮箱文件夹'}</h2>
                <p>{messages ? `${messages.total} 封邮件` : activeFolder?.fullName || '选择文件夹查看邮件'}</p>
              </div>
              <button className="mail-ghost" disabled={!activeFolder} onClick={() => activeAccount && activeFolder && loadMessages(activeAccount, activeFolder, page)}><RefreshCw size={15} />刷新</button>
            </div>
            <div className="mail-message-layout">
              <div className="mail-message-list">
                {loadingMessages ? <div className="mail-empty compact"><Clock3 size={28} /><span>正在读取邮件…</span></div> : messages?.records.length ? messages.records.map(message => (
                  <button key={message.uid} className={`mail-message-row ${selectedMessage?.uid === message.uid ? 'active' : ''} ${message.seen ? '' : 'unseen'}`} onClick={() => loadDetail(message)}>
                    <span className="mail-message-from">{message.from || '未知发件人'}</span>
                    <span className="mail-message-subject">{message.subject || '无主题'}</span>
                    <span className="mail-message-extra">
                      {message.hasAttachment && <Paperclip size={13} />}
                      {formatDate(message.sentDate || message.receivedDate)}
                    </span>
                  </button>
                )) : <div className="mail-empty compact"><Search size={28} /><span>该文件夹暂无邮件</span></div>}
                {messages && messages.total > 0 && (
                  <div className="mail-pager">
                    <button disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>上一页</button>
                    <span>{page} / {messagePages}</span>
                    <button disabled={page >= messagePages} onClick={() => setPage(value => Math.min(messagePages, value + 1))}>下一页</button>
                  </div>
                )}
              </div>
              <div className="mail-detail-panel">
                {loadingDetail ? <div className="mail-empty compact"><Clock3 size={28} /><span>正在读取详情…</span></div> : selectedMessage ? <MailDetail detail={selectedMessage} /> : <div className="mail-empty compact"><MailOpen size={30} /><span>选择一封邮件查看正文</span></div>}
              </div>
            </div>
          </main>
        </section>
      )}

      {showBindModal && (
        <div className="mail-modal-mask" onMouseDown={event => {
          if (event.target === event.currentTarget) {
            setShowBindModal(false);
            setEditingAccount(null);
          }
        }}>
          <div className="mail-modal">
            <header><h2>{editingAccount ? '编辑邮箱绑定' : '绑定邮箱'}</h2><button onClick={() => { setShowBindModal(false); setEditingAccount(null); }}><X size={17} /></button></header>
            <label>邮箱厂商<select value={form.provider} disabled={Boolean(editingAccount)} onChange={event => setForm({ ...form, provider: event.target.value })}>{providers.map(provider => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></label>
            <p className="mail-form-hint">{providers.find(item => item.value === form.provider)?.hint}</p>
            <label>邮箱地址<input value={form.email} disabled={Boolean(editingAccount)} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="例如 name@qq.com" /></label>
            <label>备注名<input value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} placeholder="例如 我的QQ邮箱，可不填" /></label>
            <label>客户端授权码<input value={form.mailAuthCode} onChange={event => setForm({ ...form, mailAuthCode: event.target.value })} placeholder={editingAccount ? '重新输入授权码后保存' : 'QQ/163 邮箱开启 IMAP 后生成的授权码'} /></label>
            <label>平台访问密码<input type="password" value={form.accessPassword} onChange={event => setForm({ ...form, accessPassword: event.target.value })} placeholder={editingAccount ? '重新设置访问密码，可不填' : '进入该邮箱前需要输入，可不填'} /></label>
            <div className="mail-modal-actions"><button onClick={() => { setShowBindModal(false); setEditingAccount(null); }}>取消</button><button className="mail-primary" onClick={saveAccount}>{editingAccount ? '保存修改' : '保存绑定'}</button></div>
          </div>
        </div>
      )}

      {showAccessModal && (
        <div className="mail-modal-mask" onMouseDown={event => event.target === event.currentTarget && setShowAccessModal(null)}>
          <div className="mail-modal small">
            <header><h2>输入访问密码</h2><button onClick={() => setShowAccessModal(null)}><X size={17} /></button></header>
            <p className="mail-form-hint">该邮箱设置了平台内访问密码，通过后才会读取邮箱空间。</p>
            <label>访问密码<input autoFocus type="password" value={accessPassword} onChange={event => setAccessPassword(event.target.value)} onKeyDown={event => event.key === 'Enter' && confirmAccess()} placeholder="请输入访问密码" /></label>
            <div className="mail-modal-actions"><button onClick={() => setShowAccessModal(null)}>取消</button><button className="mail-primary" onClick={confirmAccess}>确认进入</button></div>
          </div>
        </div>
      )}

      {notice && <div className="mail-toast"><CheckCircle2 size={16} />{notice}</div>}
    </div>
  );
}

function MailDetail({ detail }: { detail: MailMessageDetail }) {
  const hasHtml = Boolean(detail.htmlContent?.trim());
  return <article className="mail-detail">
    <header>
      <h3>{detail.subject || '无主题'}</h3>
      <p>来自 {detail.from || '未知发件人'}</p>
      <div className="mail-detail-meta">
        <span>发送：{formatTime(detail.sentDate)}</span>
        {detail.to?.length ? <span>收件人：{detail.to.join('、')}</span> : null}
        {detail.cc?.length ? <span>抄送：{detail.cc.join('、')}</span> : null}
      </div>
    </header>
    <div className="mail-detail-body">
      {hasHtml ? <iframe title="邮件正文" sandbox="" srcDoc={detail.htmlContent || ''} /> : <pre>{detail.textContent || '这封邮件没有可展示的正文。'}</pre>}
    </div>
    {detail.attachments?.length ? <div className="mail-attachments">
      <strong>附件</strong>
      {detail.attachments.map(item => <span key={item.partPath}><Paperclip size={14} />{item.fileName || '未命名附件'} · {formatSize(item.size)}</span>)}
    </div> : null}
  </article>;
}

function folderName(folder: MailFolder) {
  return folder.systemType === 'CUSTOM' ? folder.name || folder.fullName : systemFolderNames[folder.systemType] || folder.name || folder.fullName;
}

function errorText(cause: unknown) {
  return cause instanceof Error ? cause.message : '操作失败，请稍后重试';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function formatTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatSize(value?: number | null) {
  if (!value || value < 0) return '未知大小';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
