import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Card, SettingRow } from './ui';

export function AccountPage() {
  const user = useAppStore((s) => s.user);
  const nav = useNavigate();

  return (
    <>
      <Card title="">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 600, margin: '0 auto 16px' }}>{user?.avatar || 'U'}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>{user?.email}</div>
          <Btn>📷 更换头像</Btn>
        </div>
      </Card>
      <Card title="账户信息">
        <SettingRow label="用户ID"><span style={{ color: '#999', fontSize: 13 }}>TF_20240001</span></SettingRow>
        <SettingRow label="邮箱"><span style={{ color: '#999', fontSize: 13 }}>{user?.email}</span></SettingRow>
        <SettingRow label="手机号"><span style={{ color: '#999', fontSize: 13 }}>138****8888</span></SettingRow>
      </Card>
      <Card title="安全设置">
        <SettingRow label="修改密码"><Btn onClick={() => nav('/change-pwd')}>修改</Btn></SettingRow>
        <SettingRow label="修改手机号"><Btn>修改</Btn></SettingRow>
        <SettingRow label="注销账号"><button style={{ ...btnStyle, color: '#e55c5c' }}>注销</button></SettingRow>
      </Card>
    </>
  );
}

const btnStyle: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer' };
function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={btnStyle}>{children}</button>;
}
