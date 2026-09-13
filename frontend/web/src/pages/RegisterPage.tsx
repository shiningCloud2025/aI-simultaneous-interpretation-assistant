import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, api } from '../stores/appStore';
import { AuthBox } from '../components/AuthBox';

export function RegisterPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [account, setAccount] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [smsCount, setSmsCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setToken = useAppStore((s) => s.setToken);
  const nav = useNavigate();
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const doRegister = async () => {
    if (!account.trim()) return showToast('请输入账号');
    if (!/^\d{5,12}$/.test(account.trim())) return showToast('账号必须为5-12位数字');
    if (!username.trim()) return showToast('请输入用户名');
    if (!password.trim() || password.length < 6) return showToast('密码至少6位');
    if (password !== confirmPwd) return showToast('两次密码不一致');
    if (!showPhone && !showEmail) {
      setConfirmDialog(true);
      return;
    }

    submitRegister();
  };

  const submitRegister = async () => {
    setLoading(true);
    try {
      const body: any = { account: account.trim(), username: username.trim(), password };
      if (showPhone && phone.trim()) {
        if (!smsCode.trim()) return showToast('请输入短信验证码');
        body.phone = phone.trim();
        body.smsCaptcha = smsCode.trim();
      }
      if (showEmail && email.trim()) {
        if (!emailCode.trim()) return showToast('请输入邮箱验证码');
        body.email = email.trim();
        body.emailCaptcha = emailCode.trim();
      }
      const data = role === 'teacher' ? await api.teacherRegister(body) : await api.register(body);
      setToken(data.token);
      const user = await api.getUserInfo();
      setUser(user);
      nav(user.userType === 'teacher' ? '/dashboard?panel=teacher-classrooms' : '/dashboard');
    } catch (e: any) {
      showToast(e.message || '注册失败');
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
    <AuthBox title="创建账号" subtitle="加入智语同航 - 基于多 Harness 智能体协作与编排的智慧外语课堂">
      <div style={{ display: 'flex', marginBottom: 20, background: '#eeefff', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setRole('student')} style={roleButton(role === 'student')}>注册学生账号</button>
        <button onClick={() => setRole('teacher')} style={roleButton(role === 'teacher')}>注册老师账号</button>
      </div>
      <Fg label="账号"><input value={account} onChange={e => setAccount(e.target.value)} placeholder="5-12位数字账号" style={inp} /></Fg>
      <Fg label="用户名"><input value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名/昵称" style={inp} /></Fg>
      <Fg label="密码"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6位密码" style={inp} /></Fg>
      <Fg label="确认密码"><input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="再次输入密码" style={inp} /></Fg>

      {/* 手机号绑定 */}
      <div style={{ marginBottom: 16 }}>
        <div onClick={() => setShowPhone(!showPhone)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '11px 14px', background: '#f7f6f4', borderRadius: 10, fontSize: 14, color: phone ? '#1a1a1a' : '#bbb', transition: 'all .1s' }}>
          <span>{phone ? `📱 ${phone}` : '+ 绑定手机号（选填）'}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{showPhone ? '▲' : '▼'}</span>
        </div>
        {showPhone && (
          <div style={{ marginTop: 10 }}>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" style={{ ...inp, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={smsCode} onChange={e => setSmsCode(e.target.value)} placeholder="请输入验证码" style={{ ...inp, flex: 1 }} />
              <button onClick={sendSms} style={sendBtn(smsCount > 0)}>{smsCount > 0 ? smsCount + 's' : '获取验证码'}</button>
            </div>
          </div>
        )}
      </div>

      {/* 邮箱绑定 */}
      <div style={{ marginBottom: 20 }}>
        <div onClick={() => setShowEmail(!showEmail)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '11px 14px', background: '#f7f6f4', borderRadius: 10, fontSize: 14, color: email ? '#1a1a1a' : '#bbb', transition: 'all .1s' }}>
          <span>{email ? `📧 ${email}` : '+ 绑定邮箱（选填）'}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{showEmail ? '▲' : '▼'}</span>
        </div>
        {showEmail && (
          <div style={{ marginTop: 10 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" style={{ ...inp, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="请输入验证码" style={{ ...inp, flex: 1 }} />
              <button onClick={sendEmailCode} style={sendBtn(emailCount > 0)}>{emailCount > 0 ? emailCount + 's' : '获取验证码'}</button>
            </div>
          </div>
        )}
      </div>

      <Btn onClick={doRegister} disabled={loading}>{loading ? '注册中...' : '注 册'}</Btn>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
        已有账号？<Link to="/login" style={{ color: '#2c2c2c', fontWeight: 500, textDecoration: 'none' }}>立即登录</Link>
        <span style={{ margin: '0 8px', color: '#d2cec6' }}>/</span>
        <Link to="/" style={{ color: '#234b49', fontWeight: 500, textDecoration: 'none' }}>返回官网</Link>
      </div>
      {toast && <T msg={toast} />}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 340, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>提示</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>您尚未绑定手机号或邮箱，如果后续账号丢失将无法找回密码。<br />确定继续注册吗？</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDialog(false)} style={{ flex: 1, padding: 10, border: '1px solid #e0ded8', borderRadius: 8, background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer' }}>返回绑定</button>
              <button onClick={() => { setConfirmDialog(false); submitRegister(); }} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#2c2c2c', color: '#fff', fontSize: 13, cursor: 'pointer' }}>确定注册</button>
            </div>
          </div>
        </div>
      )}
    </AuthBox>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
function Fg({ label, children }: { label: string; children: React.ReactNode }) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div>{children}</div>; }
function Btn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) { return <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: 12, border: 'none', background: disabled ? '#999' : '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, cursor: disabled ? 'default' : 'pointer' }}>{children}</button>; }
function T({ msg }: { msg: string }) { return <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 999 }}>{msg}</div>; }
function sendBtn(disabled: boolean): React.CSSProperties { return { padding: '11px 14px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: disabled ? '#bbb' : '#666', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }; }
function roleButton(active: boolean): React.CSSProperties { return { flex: 1, padding: 10, border: 'none', background: active ? '#5962d9' : 'transparent', color: active ? '#fff' : '#74758b', borderRadius: 8, cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 13 }; }
