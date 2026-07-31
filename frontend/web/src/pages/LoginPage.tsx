import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { AuthBox } from '../components/AuthBox';

export function LoginPage() {
  const [tab, setTab] = useState<'password' | 'sms'>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [toast, setToast] = useState('');
  const setUser = useAppStore((s) => s.setUser);
  const nav = useNavigate();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1500); };

  const doLogin = () => {
    if (!account.trim()) return showToast('请输入账号或手机号');
    if (!password.trim()) return showToast('请输入密码');
    setUser({ name: account, email: account.includes('@') ? account : account + '@example.com', avatar: account[0].toUpperCase() });
    nav('/dashboard');
  };

  const doSmsLogin = () => {
    if (!phone.trim()) return showToast('请输入手机号');
    if (!code.trim()) return showToast('请输入验证码');
    if (code !== '123456') return showToast('验证码错误（试试 123456）');
    setUser({ name: phone, email: phone + '@example.com', avatar: phone[0] });
    nav('/dashboard');
  };

  const sendSms = () => {
    if (smsCountdown > 0) return;
    if (!phone.trim()) return showToast('请先输入手机号');
    showToast('验证码已发送（123456）');
    setSmsCountdown(60);
    const timer = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <AuthBox title="TransFlow" subtitle="同声转译，随时随地">
      <div style={{ display: 'flex', marginBottom: 24, background: '#f5f3f0', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setTab('password')} style={{ flex: 1, padding: 10, border: 'none', background: tab === 'password' ? '#fff' : 'transparent', color: tab === 'password' ? '#1a1a1a' : '#999', borderRadius: 8, cursor: 'pointer', fontWeight: tab === 'password' ? 600 : 400, fontSize: 13, boxShadow: tab === 'password' ? '0 1px 3px rgba(0,0,0,.06)' : 'none' }}>密码登录</button>
        <button onClick={() => setTab('sms')} style={{ flex: 1, padding: 10, border: 'none', background: tab === 'sms' ? '#fff' : 'transparent', color: tab === 'sms' ? '#1a1a1a' : '#999', borderRadius: 8, cursor: 'pointer', fontWeight: tab === 'sms' ? 600 : 400, fontSize: 13, boxShadow: tab === 'sms' ? '0 1px 3px rgba(0,0,0,.06)' : 'none' }}>短信登录</button>
      </div>

      {tab === 'password' ? (
        <>
          <Fg label="账号 / 手机号"><input style={inp} value={account} onChange={e => setAccount(e.target.value)} placeholder="请输入账号或手机号" /></Fg>
          <Fg label="密码"><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" /></Fg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
            <label style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" defaultChecked style={{ accentColor: '#2c2c2c' }} />记住登录</label>
            <Link to="/forgot" style={{ color: '#666', textDecoration: 'none' }}>忘记密码？</Link>
          </div>
          <Btn onClick={doLogin}>登 录</Btn>
        </>
      ) : (
        <>
          <Fg label="手机号"><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" /></Fg>
          <Fg label="验证码">
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={inp} value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" style={{ ...inp, flex: 1, margin: 0 }} />
              <button onClick={sendSms} style={{ padding: '11px 16px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: smsCountdown > 0 ? '#bbb' : '#666', cursor: smsCountdown > 0 ? 'default' : 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>{smsCountdown > 0 ? smsCountdown + 's' : '获取验证码'}</button>
            </div>
          </Fg>
          <Btn onClick={doSmsLogin}>登 录</Btn>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
        还没有账号？<Link to="/register" style={{ color: '#2c2c2c', fontWeight: 500, textDecoration: 'none' }}>立即注册</Link>
      </div>
      {toast && <Toast msg={toast} />}
    </AuthBox>
  );
}

function Fg({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16, width: '100%' }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div><div style={{ width: '100%' }}>{children}</div></div>;
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ width: '100%', padding: 12, border: 'none', background: '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: 'pointer' }}>{children}</button>;
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>;
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
