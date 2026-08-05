import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../stores/appStore';
import { AuthBox } from '../components/AuthBox';

export function ForgotPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [smsCount, setSmsCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const nav = useNavigate();
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const doReset = async () => {
    if (tab === 'phone' && !phone.trim()) return showToast('请输入手机号');
    if (tab === 'email' && !email.trim()) return showToast('请输入邮箱');
    if (!code.trim()) return showToast('请输入验证码');
    if (!newPassword.trim() || newPassword.length < 6) return showToast('新密码至少6位');
    setLoading(true);
    try {
      const body: any = { captcha: code, newPassword };
      if (tab === 'phone') body.phone = phone;
      else body.email = email;
      await api.resetPassword(body);
      showToast('密码已重置，请登录');
      setTimeout(() => nav('/login'), 1500);
    } catch (e: any) {
      showToast(e.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  const sendSms = async () => {
    if (smsCount > 0) return;
    if (!phone.trim()) return showToast('请先输入手机号');
    try {
      await api.sendSmsCode(phone);
      showToast('验证码已发送');
      setSmsCount(60);
      const t = setInterval(() => setSmsCount(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    } catch (e: any) { showToast(e.message || '发送失败'); }
  };

  const sendEmailCode = async () => {
    if (emailCount > 0) return;
    if (!email.trim()) return showToast('请先输入邮箱');
    try {
      await api.sendEmailCode(email);
      showToast('验证码已发送');
      setEmailCount(60);
      const t = setInterval(() => setEmailCount(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    } catch (e: any) { showToast(e.message || '发送失败'); }
  };

  return (
    <AuthBox title="找回密码" subtitle="通过验证码重置密码">
      <div style={{ display: 'flex', marginBottom: 24, background: '#f5f3f0', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setTab('email')} style={tb(tab === 'email')}>邮箱找回</button>
        <button onClick={() => setTab('phone')} style={tb(tab === 'phone')}>手机号找回</button>
      </div>
      {tab === 'email' ? (
        <>
          <Fg label="邮箱"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入注册邮箱" style={inp} /></Fg>
          <Fg label="验证码">
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" style={{ ...inp, flex: 1 }} />
              <button onClick={sendEmailCode} style={sendBtn(emailCount > 0)}>{emailCount > 0 ? emailCount + 's' : '获取验证码'}</button>
            </div>
          </Fg>
        </>
      ) : (
        <>
          <Fg label="手机号"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入注册手机号" style={inp} /></Fg>
          <Fg label="验证码">
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" style={{ ...inp, flex: 1 }} />
              <button onClick={sendSms} style={sendBtn(smsCount > 0)}>{smsCount > 0 ? smsCount + 's' : '获取验证码'}</button>
            </div>
          </Fg>
        </>
      )}
      <Fg label="新密码"><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="请输入新密码（至少6位）" style={inp} /></Fg>
      <Btn onClick={doReset} disabled={loading}>{loading ? '重置中...' : '重 置 密 码'}</Btn>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}><Link to="/login" style={{ color: '#2c2c2c', fontWeight: 500, textDecoration: 'none' }}>返回登录</Link></div>
      {toast && <T msg={toast} />}
    </AuthBox>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
function Fg({ label, children }: { label: string; children: React.ReactNode }) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div>{children}</div>; }
function Btn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) { return <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: 12, border: 'none', background: disabled ? '#999' : '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: disabled ? 'default' : 'pointer' }}>{children}</button>; }
function tb(a: boolean): React.CSSProperties { return { flex: 1, padding: 10, border: 'none', background: a ? '#fff' : 'transparent', color: a ? '#1a1a1a' : '#999', borderRadius: 8, cursor: 'pointer', fontWeight: a ? 600 : 400, fontSize: 13, boxShadow: a ? '0 1px 3px rgba(0,0,0,.06)' : 'none' }; }
function T({ msg }: { msg: string }) { return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>; }
function sendBtn(disabled: boolean): React.CSSProperties { return { padding: '11px 14px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: disabled ? '#bbb' : '#666', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }; }
