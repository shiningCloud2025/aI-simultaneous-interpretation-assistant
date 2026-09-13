import { useMemo, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  classroomRepository,
  type ClassroomStatus,
  type CreateClassroomInput,
  type TeacherClassroom,
} from './classroomRepository';
import './teacher-classrooms.css';

type DialogType = 'create' | 'invite' | 'add-member' | null;
type InviteMode = 'link' | 'code' | 'direct';

const emptyForm: CreateClassroomInput = {
  name: '',
  subject: '英语',
  stage: '高中',
  description: '',
};

const statusText: Record<ClassroomStatus, string> = {
  PREPARING: '待开课',
  LIVE: '授课中',
  ENDED: '已结束',
};

const joinMethodText = {
  INVITE_CODE: '邀请码加入',
  INVITE_LINK: '邀请链接',
  TEACHER_ADDED: '老师添加',
};

export function TeacherClassrooms() {
  const user = useAppStore((state) => state.user);
  const ownerKey = String(user?.id || user?.account || 'teacher');
  const [classrooms, setClassrooms] = useState<TeacherClassroom[]>(() => classroomRepository.list(ownerKey));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [inviteMode, setInviteMode] = useState<InviteMode>('link');
  const [form, setForm] = useState<CreateClassroomInput>(emptyForm);
  const [memberAccount, setMemberAccount] = useState('');
  const [memberName, setMemberName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'ALL' | ClassroomStatus>('ALL');
  const [toast, setToast] = useState('');

  const selectedClassroom = classrooms.find((classroom) => classroom.id === selectedId) || null;
  const visibleClassrooms = useMemo(() => classrooms.filter((classroom) => {
    const matchesKeyword = `${classroom.name} ${classroom.inviteCode}`.toLowerCase().includes(keyword.trim().toLowerCase());
    return matchesKeyword && (status === 'ALL' || classroom.status === status);
  }), [classrooms, keyword, status]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const replaceClassrooms = (nextClassrooms: TeacherClassroom[]) => {
    setClassrooms(nextClassrooms);
  };

  const createClassroom = () => {
    if (!form.name.trim()) return showToast('请输入课堂名称');
    const nextClassrooms = classroomRepository.create(ownerKey, form);
    const classroom = nextClassrooms[0];
    replaceClassrooms(nextClassrooms);
    setSelectedId(classroom.id);
    setForm(emptyForm);
    setInviteMode('link');
    setDialog('invite');
    showToast('课堂创建成功');
  };

  const openInvite = (classroom: TeacherClassroom, mode: InviteMode = 'link') => {
    setSelectedId(classroom.id);
    setInviteMode(mode);
    setDialog('invite');
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      showToast('浏览器未授予剪贴板权限，请手动复制');
    }
  };

  const regenerateCode = () => {
    if (!selectedClassroom) return;
    replaceClassrooms(classroomRepository.regenerateInviteCode(ownerKey, selectedClassroom.id));
    showToast('邀请码已刷新，原邀请码失效');
  };

  const addMember = () => {
    if (!selectedClassroom) return;
    const account = memberAccount.trim();
    if (!/^\d{5,12}$/.test(account)) return showToast('学生账号必须为 5–12 位数字');
    if (!memberName.trim()) return showToast('请输入学生姓名');

    try {
      replaceClassrooms(classroomRepository.addMember(ownerKey, selectedClassroom.id, account, memberName.trim()));
      setMemberAccount('');
      setMemberName('');
      setDialog(null);
      showToast('学生已添加到课堂');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '添加学生失败');
    }
  };

  const removeMember = (memberId: string) => {
    if (!selectedClassroom || !window.confirm('确定将该学生移出课堂吗？')) return;
    replaceClassrooms(classroomRepository.removeMember(ownerKey, selectedClassroom.id, memberId));
    showToast('学生已移出课堂');
  };

  const startClassroom = (classroom: TeacherClassroom) => {
    replaceClassrooms(classroomRepository.start(ownerKey, classroom.id));
    setSelectedId(classroom.id);
    showToast('课堂已开始');
  };

  const endClassroom = (classroom: TeacherClassroom) => {
    if (!window.confirm('确定结束当前课堂吗？')) return;
    replaceClassrooms(classroomRepository.end(ownerKey, classroom.id));
    showToast('课堂已结束');
  };

  const inviteLink = selectedClassroom
    ? `${window.location.origin}/join-classroom?code=${selectedClassroom.inviteCode}`
    : '';

  if (selectedClassroom) {
    const freshClassroom = classrooms.find((classroom) => classroom.id === selectedClassroom.id) || selectedClassroom;
    return (
      <div className="tc-page">
        <button className="tc-back" onClick={() => setSelectedId(null)}>← 返回课堂列表</button>
        <section className={`tc-detail-hero ${freshClassroom.status === 'LIVE' ? 'is-live' : ''}`}>
          <div>
            <span className={`tc-status ${freshClassroom.status.toLowerCase()}`}>{statusText[freshClassroom.status]}</span>
            <h1>{freshClassroom.name}</h1>
            <p>{freshClassroom.subject} · {freshClassroom.stage} · 创建于 {formatDate(freshClassroom.createdAt)}</p>
          </div>
          <div className="tc-hero-actions">
            <button className="tc-button secondary" onClick={() => openInvite(freshClassroom)}>邀请学生</button>
            {freshClassroom.status === 'LIVE' ? (
              <button className="tc-button danger" onClick={() => endClassroom(freshClassroom)}>结束课堂</button>
            ) : (
              <button className="tc-button primary" onClick={() => startClassroom(freshClassroom)}>▶ 开始上课</button>
            )}
          </div>
          <div className="tc-hero-stats">
            <div><strong>{freshClassroom.members.length}</strong><span>课堂成员</span></div>
            <button onClick={() => openInvite(freshClassroom, 'code')}><strong>{freshClassroom.inviteCode}</strong><span>课堂邀请码</span></button>
            <div><strong>{freshClassroom.startedAt ? formatTime(freshClassroom.startedAt) : '未开始'}</strong><span>最近开课</span></div>
          </div>
        </section>

        {freshClassroom.status === 'LIVE' && (
          <section className="tc-live-panel">
            <div className="tc-live-pulse" />
            <div><strong>课堂正在进行</strong><span>学生端可进入课堂，实时协作能力将在后续阶段接入。</span></div>
            <button className="tc-button secondary" onClick={() => showToast('实时课堂区域将在下一阶段接入')}>进入授课区</button>
          </section>
        )}

        <div className="tc-detail-grid">
          <section className="tc-panel">
            <div className="tc-panel-head">
              <div><h2>课堂成员</h2><p>管理已加入课堂的学生</p></div>
              <button className="tc-button primary small" onClick={() => setDialog('add-member')}>＋ 主动添加</button>
            </div>
            {freshClassroom.members.length === 0 ? (
              <div className="tc-empty compact"><div className="tc-empty-icon">👥</div><h3>还没有学生加入</h3><p>分享邀请链接、课堂码，或按账号主动添加学生。</p></div>
            ) : (
              <div className="tc-member-list">
                {freshClassroom.members.map((member) => (
                  <div className="tc-member" key={member.id}>
                    <span className="tc-avatar">{member.name.slice(0, 1)}</span>
                    <div><strong>{member.name}</strong><span>账号 {member.account} · {joinMethodText[member.joinMethod]}</span></div>
                    <time>{formatDate(member.joinedAt)}</time>
                    <button onClick={() => removeMember(member.id)}>移除</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="tc-panel tc-invite-summary">
            <div className="tc-panel-head"><div><h2>邀请学生</h2><p>课堂码可随时刷新</p></div></div>
            <span>当前课堂码</span>
            <strong>{freshClassroom.inviteCode}</strong>
            <button className="tc-button primary" onClick={() => openInvite(freshClassroom, 'link')}>分享邀请链接</button>
            <button className="tc-button secondary" onClick={() => openInvite(freshClassroom, 'code')}>展示课堂码</button>
            <button className="tc-button secondary" onClick={() => setDialog('add-member')}>按账号添加学生</button>
          </aside>
        </div>

        {renderDialog()}
        {toast && <div className="tc-toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="tc-page">
      <header className="tc-page-head">
        <div><span className="tc-eyebrow">TEACHER CLASSROOM</span><h1>我的课堂</h1><p>创建课堂、邀请学生并开始授课。</p></div>
        <button className="tc-button primary" onClick={() => setDialog('create')}>＋ 创建课堂</button>
      </header>

      <section className="tc-overview">
        <button onClick={() => setStatus('ALL')}><span>课堂总数</span><strong>{classrooms.length}</strong><small>全部课堂</small></button>
        <button onClick={() => setStatus('PREPARING')}><span>待开课</span><strong>{classrooms.filter((item) => item.status === 'PREPARING').length}</strong><small>可以开始授课</small></button>
        <button onClick={() => setStatus('LIVE')}><span>授课中</span><strong>{classrooms.filter((item) => item.status === 'LIVE').length}</strong><small>正在进行</small></button>
        <button onClick={() => showToast(`当前共有 ${classrooms.reduce((sum, item) => sum + item.members.length, 0)} 名课堂成员`)}><span>课堂成员</span><strong>{classrooms.reduce((sum, item) => sum + item.members.length, 0)}</strong><small>所有课堂合计</small></button>
      </section>

      <section className="tc-panel">
        <div className="tc-toolbar">
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索课堂名称或邀请码" />
          <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | ClassroomStatus)}>
            <option value="ALL">全部状态</option><option value="PREPARING">待开课</option><option value="LIVE">授课中</option><option value="ENDED">已结束</option>
          </select>
        </div>

        {visibleClassrooms.length === 0 ? (
          <div className="tc-empty">
            <div className="tc-empty-icon">▣</div>
            <h2>{classrooms.length ? '没有符合条件的课堂' : '创建你的第一个课堂'}</h2>
            <p>{classrooms.length ? '尝试更换搜索词或状态筛选。' : '创建后会立即生成课堂码和邀请链接。'}</p>
            {!classrooms.length && <button className="tc-button primary" onClick={() => setDialog('create')}>创建课堂</button>}
          </div>
        ) : (
          <div className="tc-class-grid">
            {visibleClassrooms.map((classroom, index) => (
              <article className="tc-class-card" key={classroom.id} onClick={() => setSelectedId(classroom.id)}>
                <div className={`tc-class-cover tone-${index % 3}`}>
                  <span className={`tc-status ${classroom.status.toLowerCase()}`}>{statusText[classroom.status]}</span>
                  <small>课堂码 · {classroom.inviteCode}</small>
                  <h2>{classroom.name}</h2>
                </div>
                <div className="tc-class-body">
                  <p>{classroom.description || '暂未填写课堂说明'}</p>
                  <div className="tc-class-meta"><span>{classroom.subject} · {classroom.stage}</span><span>{classroom.members.length} 名学生</span></div>
                  <div className="tc-card-actions">
                    <button onClick={(event) => { event.stopPropagation(); setSelectedId(classroom.id); }}>查看课堂</button>
                    <button onClick={(event) => { event.stopPropagation(); openInvite(classroom); }}>邀请</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {renderDialog()}
      {toast && <div className="tc-toast">{toast}</div>}
    </div>
  );

  function renderDialog() {
    if (!dialog) return null;
    return (
      <div className="tc-dialog-mask" onMouseDown={(event) => event.target === event.currentTarget && setDialog(null)}>
        <div className="tc-dialog">
          {dialog === 'create' && (
            <>
              <DialogHead title="创建课堂" description="创建后自动生成课堂码和邀请链接" onClose={() => setDialog(null)} />
              <div className="tc-dialog-body">
                <Field label="课堂名称"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：高一英语口语 2 班" autoFocus /></Field>
                <div className="tc-form-row">
                  <Field label="学科"><select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option>英语</option><option>日语</option><option>韩语</option><option>其他</option></select></Field>
                  <Field label="学习阶段"><select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}><option>小学</option><option>初中</option><option>高中</option><option>大学</option><option>研究生</option></select></Field>
                </div>
                <Field label="课堂说明"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="介绍课堂目标或教学安排" rows={4} /></Field>
              </div>
              <DialogFoot onCancel={() => setDialog(null)} actionText="创建并邀请学生" onAction={createClassroom} />
            </>
          )}

          {dialog === 'invite' && selectedClassroom && (
            <>
              <DialogHead title="邀请学生" description={selectedClassroom.name} onClose={() => setDialog(null)} />
              <div className="tc-dialog-body">
                <div className="tc-invite-tabs">
                  <button className={inviteMode === 'link' ? 'active' : ''} onClick={() => setInviteMode('link')}>邀请链接</button>
                  <button className={inviteMode === 'code' ? 'active' : ''} onClick={() => setInviteMode('code')}>课堂码</button>
                  <button className={inviteMode === 'direct' ? 'active' : ''} onClick={() => setInviteMode('direct')}>主动添加</button>
                </div>
                {inviteMode === 'link' && <div className="tc-share-box"><span className="tc-share-icon">↗</span><h3>分享课堂邀请链接</h3><p>学生登录后打开链接即可申请加入课堂。</p><div className="tc-copy-row"><input readOnly value={inviteLink} /><button onClick={() => copyText(inviteLink, '邀请链接已复制')}>复制链接</button></div></div>}
                {inviteMode === 'code' && <div className="tc-share-box"><span className="tc-share-icon">#</span><h3>让学生输入课堂码</h3><strong className="tc-big-code">{selectedClassroom.inviteCode}</strong><div className="tc-code-actions"><button className="tc-button primary" onClick={() => copyText(selectedClassroom.inviteCode, '课堂码已复制')}>复制课堂码</button><button className="tc-button secondary" onClick={regenerateCode}>刷新课堂码</button></div><p>刷新后原课堂码立即失效，已加入的学生不受影响。</p></div>}
                {inviteMode === 'direct' && <AddMemberForm account={memberAccount} name={memberName} onAccountChange={setMemberAccount} onNameChange={setMemberName} onSubmit={addMember} />}
              </div>
            </>
          )}

          {dialog === 'add-member' && selectedClassroom && (
            <><DialogHead title="主动添加学生" description={selectedClassroom.name} onClose={() => setDialog(null)} /><div className="tc-dialog-body"><AddMemberForm account={memberAccount} name={memberName} onAccountChange={setMemberAccount} onNameChange={setMemberName} onSubmit={addMember} /></div></>
          )}
        </div>
      </div>
    );
  }
}

function AddMemberForm({ account, name, onAccountChange, onNameChange, onSubmit }: {
  account: string;
  name: string;
  onAccountChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="tc-share-box align-left">
      <span className="tc-share-icon">＋</span><h3>按学生账号主动添加</h3>
      <p>当前后端尚未提供学生检索接口，此处保存为教师端本地课堂成员。</p>
      <Field label="学生账号"><input value={account} onChange={(event) => onAccountChange(event.target.value)} placeholder="5–12 位数字账号" /></Field>
      <Field label="学生姓名"><input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="输入学生姓名" /></Field>
      <button className="tc-button primary full" onClick={onSubmit}>确认添加</button>
    </div>
  );
}

function DialogHead({ title, description, onClose }: { title: string; description: string; onClose: () => void }) {
  return <div className="tc-dialog-head"><div><h2>{title}</h2><p>{description}</p></div><button onClick={onClose}>×</button></div>;
}

function DialogFoot({ onCancel, actionText, onAction }: { onCancel: () => void; actionText: string; onAction: () => void }) {
  return <div className="tc-dialog-foot"><button className="tc-button secondary" onClick={onCancel}>取消</button><button className="tc-button primary" onClick={onAction}>{actionText}</button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="tc-field"><span>{label}</span>{children}</label>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
