import { useState } from 'react';
import { api } from '../lib/api';

/**
 * 桌面平台登录/注册/找回密码，能力对齐平台端：
 * - 登录三种方式：账号密码、手机验证码、邮箱验证码（同一接口，靠字段区分）
 * - 注册：账号 5-12 位数字，密码 6-26 位，手机/邮箱选填
 * - 找回：验证码 + 新密码
 */
type AuthTab = 'login' | 'register' | 'forgot';

export function AuthPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [tab, setTab] = useState<AuthTab>('login');
  // 登录子方式
  const [loginWay, setLoginWay] = useState<'password' | 'sms' | 'email'>('password');

  // 登录字段
  const [keyword, setKeyword] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');

  // 注册字段
  const [regAccount, setRegAccount] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSmsCode, setRegSmsCode] = useState('');
  const [regEmailCode, setRegEmailCode] = useState('');
  const [regShowContact, setRegShowContact] = useState(false);

  // 找回密码
  const [forgotWay, setForgotWay] = useState<'email' | 'phone'>('email');
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendCode = async (target: string, type: 'sms' | 'email') => {
    if (!target.trim()) {
      setError(type === 'sms' ? '请输入手机号' : '请输入邮箱');
      return;
    }
    try {
      if (type === 'sms') await api.sendSmsCode(target.trim());
      else await api.sendEmailCode(target.trim());
      setNotice('验证码已发送');
      setError('');
      startCountdown();
    } catch (e: any) {
      setError(e?.message || '验证码发送失败');
    }
  };

  const doLogin = async () => {
    setError('');
    setNotice('');
    if (loginWay === 'password') {
      if (!keyword.trim() || !password) return setError('请输入账号和密码');
    } else if (loginWay === 'sms') {
      if (!phone.trim() || !captcha.trim()) return setError('请输入手机号和验证码');
    } else {
      if (!email.trim() || !captcha.trim()) return setError('请输入邮箱和验证码');
    }
    setLoading(true);
    try {
      let data: { token: string };
      if (loginWay === 'password') data = await api.login(keyword.trim(), password);
      else if (loginWay === 'sms') data = await api.loginByPhone(phone.trim(), captcha.trim());
      else data = await api.loginByEmail(email.trim(), captcha.trim());
      onLogin(data.token);
    } catch (e: any) {
      setError(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    setError('');
    setNotice('');
    if (!/^\d{5,12}$/.test(regAccount.trim())) return setError('账号必须为 5-12 位数字');
    if (!regUsername.trim()) return setError('请输入用户名');
    if (regPassword.length < 6 || regPassword.length > 26) return setError('密码需 6-26 位');
    if (regPassword !== regPassword2) return setError('两次输入的密码不一致');

    const body: Record<string, string> = {
      account: regAccount.trim(),
      username: regUsername.trim(),
      password: regPassword,
    };
    if (regShowContact) {
      if (regPhone.trim()) {
        if (!regSmsCode.trim()) return setError('请输入短信验证码');
        body.phone = regPhone.trim();
        body.smsCaptcha = regSmsCode.trim();
      }
      if (regEmail.trim()) {
        if (!regEmailCode.trim()) return setError('请输入邮箱验证码');
        body.email = regEmail.trim();
        body.emailCaptcha = regEmailCode.trim();
      }
    }

    setLoading(true);
    try {
      const data = await api.register(body as never);
      onLogin(data.token); // 注册成功直接返回 token
    } catch (e: any) {
      setError(e?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setError('');
    setNotice('');
    if (!forgotTarget.trim()) return setError(forgotWay === 'phone' ? '请输入手机号' : '请输入邮箱');
    if (!forgotCode.trim()) return setError('请输入验证码');
    if (forgotPassword.length < 6 || forgotPassword.length > 26) return setError('新密码需 6-26 位');
    setLoading(true);
    try {
      await api.resetPassword({
        captcha: forgotCode.trim(),
        newPassword: forgotPassword,
        ...(forgotWay === 'phone' ? { phone: forgotTarget.trim() } : { email: forgotTarget.trim() }),
      });
      setNotice('密码已重置，请登录');
      setTab('login');
    } catch (e: any) {
      setError(e?.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desktop-card auth-card">
      <div className="auth-tabs">
        <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
          登录
        </button>
        <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
          注册
        </button>
        <button className={tab === 'forgot' ? 'active' : ''} onClick={() => setTab('forgot')}>
          找回密码
        </button>
      </div>

      {tab === 'login' && (
        <>
          <div className="auth-subtabs">
            <button className={loginWay === 'password' ? 'active' : ''} onClick={() => setLoginWay('password')}>
              账号密码
            </button>
            <button className={loginWay === 'sms' ? 'active' : ''} onClick={() => setLoginWay('sms')}>
              短信登录
            </button>
            <button className={loginWay === 'email' ? 'active' : ''} onClick={() => setLoginWay('email')}>
              邮箱登录
            </button>
          </div>

          {loginWay === 'password' ? (
            <>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="账号 / 手机号 / 邮箱" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </>
          ) : (
            <>
              <input
                value={loginWay === 'sms' ? phone : email}
                onChange={(e) => (loginWay === 'sms' ? setPhone(e.target.value) : setEmail(e.target.value))}
                placeholder={loginWay === 'sms' ? '手机号' : '邮箱'}
              />
              <div className="auth-code-row">
                <input value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="验证码" />
                <button
                  className="auth-code-btn"
                  disabled={countdown > 0}
                  onClick={() => sendCode(loginWay === 'sms' ? phone : email, loginWay === 'sms' ? 'sms' : 'email')}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </>
          )}
          <button className="desktop-primary" onClick={doLogin} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </>
      )}

      {tab === 'register' && (
        <>
          <input value={regAccount} onChange={(e) => setRegAccount(e.target.value)} placeholder="账号（5-12 位数字）" />
          <input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="用户名 / 昵称" />
          <input
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            placeholder="密码（6-26 位）"
          />
          <input
            type="password"
            value={regPassword2}
            onChange={(e) => setRegPassword2(e.target.value)}
            placeholder="确认密码"
          />
          <label className="auth-check">
            <input
              type="checkbox"
              checked={regShowContact}
              onChange={(e) => setRegShowContact(e.target.checked)}
            />
            绑定手机 / 邮箱（选填，用于找回密码）
          </label>
          {regShowContact && (
            <>
              <div className="auth-code-row">
                <input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="手机号（选填）" />
                <button className="auth-code-btn" disabled={countdown > 0 || !regPhone.trim()} onClick={() => sendCode(regPhone, 'sms')}>
                  {countdown > 0 ? `${countdown}s` : '验证码'}
                </button>
              </div>
              {regPhone.trim() && (
                <input value={regSmsCode} onChange={(e) => setRegSmsCode(e.target.value)} placeholder="短信验证码" />
              )}
              <div className="auth-code-row">
                <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="邮箱（选填）" />
                <button className="auth-code-btn" disabled={countdown > 0 || !regEmail.trim()} onClick={() => sendCode(regEmail, 'email')}>
                  {countdown > 0 ? `${countdown}s` : '验证码'}
                </button>
              </div>
              {regEmail.trim() && (
                <input value={regEmailCode} onChange={(e) => setRegEmailCode(e.target.value)} placeholder="邮箱验证码" />
              )}
            </>
          )}
          <button className="desktop-primary" onClick={doRegister} disabled={loading}>
            {loading ? '注册中...' : '注册并登录'}
          </button>
        </>
      )}

      {tab === 'forgot' && (
        <>
          <div className="auth-subtabs">
            <button className={forgotWay === 'email' ? 'active' : ''} onClick={() => setForgotWay('email')}>
              邮箱找回
            </button>
            <button className={forgotWay === 'phone' ? 'active' : ''} onClick={() => setForgotWay('phone')}>
              手机找回
            </button>
          </div>
          <div className="auth-code-row">
            <input
              value={forgotTarget}
              onChange={(e) => setForgotTarget(e.target.value)}
              placeholder={forgotWay === 'phone' ? '手机号' : '邮箱'}
            />
            <button
              className="auth-code-btn"
              disabled={countdown > 0}
              onClick={() => sendCode(forgotTarget, forgotWay === 'phone' ? 'sms' : 'email')}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
          <input value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} placeholder="验证码" />
          <input
            type="password"
            value={forgotPassword}
            onChange={(e) => setForgotPassword(e.target.value)}
            placeholder="新密码（6-26 位）"
          />
          <button className="desktop-primary" onClick={doReset} disabled={loading}>
            {loading ? '提交中...' : '重置密码'}
          </button>
        </>
      )}

      {error && <div className="desktop-error">{error}</div>}
      {notice && <div className="auth-notice">{notice}</div>}
      <div className="login-tip">
        桌面端与浏览器是相互独立的应用，登录态不共享，需在桌面端登录一次。
        <br />
        使用与平台端相同的账号，即可看到同一份历史记录。
      </div>
    </div>
  );
}
