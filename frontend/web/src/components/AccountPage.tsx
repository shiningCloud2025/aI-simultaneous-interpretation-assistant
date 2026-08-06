import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';

export function AccountPage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const saveProfile = async () => {
    try {
      await api.updateProfile({ username: username || undefined, avatar: avatar || undefined });
      if (user) setUser({ ...user, username, avatar });
      setEditing(false);
      showToast('保存成功');
    } catch (e: any) { showToast(e.message || '保存失败'); }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* 头像区 */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 600, overflow: 'hidden', boxShadow: '0 4px 20px rgba(102,126,234,.25)' }}>
          {user.avatar ? <img src={user.avatar} style={{ width: 80, height: 80, objectFit: 'cover' }} /> : user.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginTop: 16 }}>{user.username}</div>
      </div>

      {/* 信息卡片 */}
      <div style={{ background: '#fff', border: '1px solid #f0efec', borderRadius: 14, overflow: 'hidden' }}>
        <Row label="账号" value={user.account} />
        <Row label="邮箱" value={user.email || '未绑定'} />
        <Row label="手机号" value={user.phone || '未绑定'} />
        <Row label="最后登录" value={user.lastLoginTime ? fmt(user.lastLoginTime) : '-'} />
        <Row label="注册时间" value={user.createTime ? fmt(user.createTime) : '-'} />
      </div>

      {/* 操作 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => setEditing(!editing)} style={menuBtn}>✏️ 编辑资料</button>
        <button onClick={() => nav('/change-pwd')} style={menuBtn}>🔒 修改密码</button>
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #f0efec', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>编辑资料</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>用户名</div>
            <input value={username} onChange={e => setUsername(e.target.value)} style={inp} placeholder="用户名" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>头像URL</div>
            <input value={avatar} onChange={e => setAvatar(e.target.value)} style={inp} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={saveProfile} style={{ ...menuBtn, background: '#2c2c2c', color: '#fff', flex: 1 }}>保存</button>
            <button onClick={() => { setUsername(user.username); setAvatar(user.avatar); setEditing(false); }} style={{ ...menuBtn, flex: 1 }}>取消</button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f5f3f0', fontSize: 15 }}>
      <span style={{ color: '#999' }}>{label}</span>
      <span style={{ color: '#333' }}>{value}</span>
    </div>
  );
}

function fmt(t: string) {
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const menuBtn: React.CSSProperties = { width: '100%', padding: '16px 24px', background: '#fff', border: '1px solid #f0efec', borderRadius: 12, fontSize: 15, color: '#555', cursor: 'pointer', textAlign: 'left' as const };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#333', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
