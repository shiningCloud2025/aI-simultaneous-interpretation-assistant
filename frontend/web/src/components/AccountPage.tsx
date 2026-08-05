import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';
import { Card, SettingRow } from './ui';

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
    } catch (e: any) {
      showToast(e.message || '保存失败');
    }
  };

  if (!user) return null;

  return (
    <>
      <Card title="">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 600, margin: '0 auto 16px' }}>{user.username?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{user.username}</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>{user.email || '未绑定邮箱'}</div>
        </div>
      </Card>
      <Card title="账户信息">
        <SettingRow label="用户ID"><span style={{ color: '#999', fontSize: 13 }}>{user.id}</span></SettingRow>
        <SettingRow label="账号"><span style={{ color: '#999', fontSize: 13 }}>{user.account}</span></SettingRow>
        <SettingRow label="邮箱"><span style={{ color: '#999', fontSize: 13 }}>{user.email || '未绑定'}</span></SettingRow>
        <SettingRow label="手机号"><span style={{ color: '#999', fontSize: 13 }}>{user.phone || '未绑定'}</span></SettingRow>
        <SettingRow label="注册时间"><span style={{ color: '#999', fontSize: 13 }}>{user.createTime}</span></SettingRow>
      </Card>
      <Card title="个人资料">
        {editing ? (
          <>
            <SettingRow label="用户名">
              <input value={username} onChange={e => setUsername(e.target.value)} style={inp} placeholder="用户名" />
            </SettingRow>
            <SettingRow label="头像URL">
              <input value={avatar} onChange={e => setAvatar(e.target.value)} style={inp} placeholder="头像URL" />
            </SettingRow>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Btn onClick={saveProfile}>保存</Btn>
              <Btn onClick={() => setEditing(false)}>取消</Btn>
            </div>
          </>
        ) : (
          <SettingRow label="编辑资料"><Btn onClick={() => setEditing(true)}>编辑</Btn></SettingRow>
        )}
      </Card>
      <Card title="安全设置">
        <SettingRow label="修改密码"><Btn onClick={() => nav('/change-pwd')}>修改</Btn></SettingRow>
      </Card>
      {toast && <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{toast}</div>}
    </>
  );
}

const btnStyle: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={btnStyle}>{children}</button>;
}
const inp: React.CSSProperties = { padding: '6px 10px', background: '#f7f6f4', border: '1px solid #e0ded8', borderRadius: 6, color: '#333', fontSize: 13, outline: 'none', width: 200 };
