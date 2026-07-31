import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthBox } from '../components/AuthBox';

export function ChangePwdPage() {
  const nav = useNavigate();
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1500); };

  return (
    <AuthBox title="修改密码" subtitle="请输入旧密码并设置新密码">
      <Fg label="旧密码"><input type="password" placeholder="请输入当前密码" style={inp} /></Fg>
      <Fg label="新密码"><input type="password" placeholder="至少6位新密码" style={inp} /></Fg>
      <Fg label="确认新密码"><input type="password" placeholder="再次输入新密码" style={inp} /></Fg>
      <Btn onClick={() => { showToast('密码修改成功！'); setTimeout(() => nav('/dashboard'), 1000); }}>确 认 修 改</Btn>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
        <span onClick={() => nav('/dashboard')} style={{ color: '#2c2c2c', fontWeight: 500, cursor: 'pointer' }}>返回个人中心</span>
      </div>
      {toast && <T msg={toast} />}
    </AuthBox>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none' };
function Fg({ label, children }: { label: string; children: React.ReactNode }) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div>{children}</div>; }
function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={{ width: '100%', padding: 12, border: 'none', background: '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer' }}>{children}</button>; }
function T({ msg }: { msg: string }) { return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>; }
