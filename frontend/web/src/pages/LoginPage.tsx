import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';
import { AuthBox } from '../components/AuthBox';

export function LoginPage() {
  const [tab, setTab] = useState<'password' | 'sms' | 'email'>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const setUser = useAppStore((s) => s.setUser);
  const setToken = useAppStore((s) => s.setToken);
  const nav = useNavigate();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const doLogin = async () => {
    if (!account.trim()) return showToast('请输入账号或手机号');
    if (!password.trim()) return showToast('请输入密码');
    setLoading(true);
    try {
      const data = await api.login({ keyword: account, password });
      setToken(data.token);
      const user = await api.getUserInfo();
      setUser(user);
      nav('/dashboard');
    } catch (e: any) {
      showToast(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const doSmsLogin = async () => {
    if (!phone.trim()) return showToast('请输入手机号');
    if (!code.trim()) return showToast('请输入验证码');
    setLoading(true);
    try {
      const data = await api.loginByPhone({ phone, captcha: code });
      setToken(data.token);
      const user = await api.getUserInfo();
      setUser(user);
      nav('/dashboard');
    } catch (e: any) {
      showToast(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const doEmailLogin = async () => {
    if (!email.trim()) return showToast('请输入邮箱');
    if (!code.trim()) return showToast('请输入验证码');
    setLoading(true);
    try {
      const data = await api.loginByEmail({ email, captcha: code });
      setToken(data.token);
      const user = await api.getUserInfo();
      setUser(user);
      nav('/dashboard');
    } catch (e: any) {
      showToast(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const sendSms = async () => {
    if (smsCountdown > 0) return;
    if (!phone.trim()) return showToast('请先输入手机号');
    try {
      await api.sendSmsCode(phone);
      showToast('验证码已发送');
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      showToast(e.message || '发送失败');
    }
  };

  const sendEmail = async () => {
    if (emailCountdown > 0) return;
    if (!email.trim()) return showToast('请先输入邮箱');
    try {
      await api.sendEmailCode(email);
      showToast('验证码已发送');
      setEmailCountdown(60);
      const timer = setInterval(() => {
        setEmailCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      showToast(e.message || '发送失败');
    }
  };

  return (
    <AuthBox title="智语同航" subtitle="基于多 Harness 智能体协作与编排的智慧外语课堂">
      <div style={{ display: 'flex', marginBottom: 24, background: '#f5f3f0', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setTab('password')} style={tb(tab === 'password')}>密码登录</button>
        <button onClick={() => setTab('sms')} style={tb(tab === 'sms')}>短信登录</button>
        <button onClick={() => setTab('email')} style={tb(tab === 'email')}>邮箱登录</button>
      </div>

      {tab === 'password' ? (
        <>
          <Fg label="账号 / 手机号 / 邮箱"><input style={inp} value={account} onChange={e => setAccount(e.target.value)} placeholder="请输入账号、手机号或邮箱" /></Fg>
          <Fg label="密码"><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" /></Fg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
            <label style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" defaultChecked style={{ accentColor: '#2c2c2c' }} />记住登录</label>
            <Link to="/forgot" style={{ color: '#666', textDecoration: 'none' }}>忘记密码？</Link>
          </div>
          <Btn onClick={doLogin} disabled={loading}>{loading ? '登录中...' : '登 录'}</Btn>
        </>
      ) : tab === 'sms' ? (
        <>
          <Fg label="手机号"><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" /></Fg>
          <Fg label="验证码">
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...inp, flex: 1, margin: 0 }} value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" />
              <button onClick={sendSms} style={sendBtn(smsCountdown > 0)}>{smsCountdown > 0 ? smsCountdown + 's' : '获取验证码'}</button>
            </div>
          </Fg>
          <Btn onClick={doSmsLogin} disabled={loading}>{loading ? '登录中...' : '登 录'}</Btn>
        </>
      ) : (
        <>
          <Fg label="邮箱"><input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" /></Fg>
          <Fg label="验证码">
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...inp, flex: 1, margin: 0 }} value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" />
              <button onClick={sendEmail} style={sendBtn(emailCountdown > 0)}>{emailCountdown > 0 ? emailCountdown + 's' : '获取验证码'}</button>
            </div>
          </Fg>
          <Btn onClick={doEmailLogin} disabled={loading}>{loading ? '登录中...' : '登 录'}</Btn>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
        还没有账号？<Link to="/register" style={{ color: '#2c2c2c', fontWeight: 500, textDecoration: 'none' }}>立即注册</Link>
        <span style={{ margin: '0 8px', color: '#d2cec6' }}>/</span>
        <Link to="/" style={{ color: '#234b49', fontWeight: 500, textDecoration: 'none' }}>返回官网</Link>
      </div>
      {toast && <Toast msg={toast} />}
    </AuthBox>
  );
}

function Fg({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16, width: '100%' }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div><div style={{ width: '100%' }}>{children}</div></div>;
}

function Btn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: 12, border: 'none', background: disabled ? '#999' : '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: disabled ? 'default' : 'pointer' }}>{children}</button>;
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>;
}

function tb(a: boolean): React.CSSProperties {
  return { flex: 1, padding: 10, border: 'none', background: a ? '#fff' : 'transparent', color: a ? '#1a1a1a' : '#999', borderRadius: 8, cursor: 'pointer', fontWeight: a ? 600 : 400, fontSize: 12, boxShadow: a ? '0 1px 3px rgba(0,0,0,.06)' : 'none' };
}

function sendBtn(disabled: boolean): React.CSSProperties {
  return { padding: '11px 14px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: disabled ? '#bbb' : '#666', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', fontWeight: 500 };
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
