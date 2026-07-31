import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthBox } from '../components/AuthBox';

export function ForgotPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [toast, setToast] = useState('');
  const [smsCount, setSmsCount] = useState(0);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1500); };

  return (
    <AuthBox title="找回密码" subtitle="输入注册信息重置密码">
      <div style={{ display: 'flex', marginBottom: 24, background: '#f5f3f0', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setTab('email')} style={tb(tab === 'email')}>邮箱找回</button>
        <button onClick={() => setTab('phone')} style={tb(tab === 'phone')}>手机号找回</button>
      </div>
      {tab === 'email' ? (
        <>
          <Fg label="邮箱"><input placeholder="请输入注册邮箱" style={inp} /></Fg>
          <Btn onClick={() => showToast('重置邮件已发送，请查收')}>发送重置邮件</Btn>
        </>
      ) : (
        <>
          <Fg label="手机号"><input placeholder="请输入注册手机号" style={inp} /></Fg>
          <Fg label="验证码"><div style={{ display: 'flex', gap: 10 }}><input placeholder="请输入验证码" style={{ ...inp, flex: 1 }} /><button onClick={() => { showToast('验证码已发送（123456）'); setSmsCount(60); const t = setInterval(() => { setSmsCount(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }); }, 1000); }} style={{ padding: '11px 16px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: smsCount > 0 ? '#bbb' : '#666', cursor: smsCount > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>{smsCount > 0 ? smsCount + 's' : '获取验证码'}</button></div></Fg>
          <Fg label="新密码"><input type="password" placeholder="请输入新密码（至少6位）" style={inp} /></Fg>
          <Btn onClick={() => showToast('密码已重置，请登录')}>重 置 密 码</Btn>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}><Link to="/login" style={{ color: '#2c2c2c', fontWeight: 500, textDecoration: 'none' }}>返回登录</Link></div>
      {toast && <T msg={toast} />}
    </AuthBox>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none' };
function Fg({ label, children }: { label: string; children: React.ReactNode }) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div>{children}</div>; }
function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={{ width: '100%', padding: 12, border: 'none', background: '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer' }}>{children}</button>; }
function tb(a: boolean): React.CSSProperties { return { flex: 1, padding: 10, border: 'none', background: a ? '#fff' : 'transparent', color: a ? '#1a1a1a' : '#999', borderRadius: 8, cursor: 'pointer', fontWeight: a ? 600 : 400, fontSize: 13, boxShadow: a ? '0 1px 3px rgba(0,0,0,.06)' : 'none' }; }
function T({ msg }: { msg: string }) { return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>; }
