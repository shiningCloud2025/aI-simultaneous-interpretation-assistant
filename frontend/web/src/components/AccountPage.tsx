import { useState, useEffect } from 'react';
import { useAppStore, api } from '../stores/appStore';
import { uploadFile } from '../lib/api';

type ModalType = 'profile' | 'password' | 'phone' | 'email' | null;

export function AccountPage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const token = useAppStore((s) => s.token);
  const [modal, setModal] = useState<ModalType>(null);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsCaptcha, setSmsCaptcha] = useState('');
  const [emailCaptcha, setEmailCaptcha] = useState('');
  const [smsCount, setSmsCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  // 进入页面时主动拉取用户信息
  useEffect(() => {
    if (!user && token) {
      setLoading(true);
      api.getUserInfo().then(u => setUser(u)).catch(() => {}).finally(() => setLoading(false));
    }
  }, []);

  const openModal = (type: ModalType) => {
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setPassword(''); setConfirmPassword(''); setPhone(''); setEmail('');
    setSmsCaptcha(''); setEmailCaptcha('');
    setModal(type);
  };

  const saveProfile = async () => {
    try {
      const body: any = {};
      if (modal === 'profile') {
        if (username && username !== user?.username) body.username = username;
        if (avatar && avatar !== user?.avatar) body.avatar = avatar;
      } else if (modal === 'password') {
        if (!password) return showToast('请输入新密码');
        if (password !== confirmPassword) return showToast('两次密码不一致');
        body.password = password;
      } else if (modal === 'phone') {
        if (!phone) return showToast('请输入新手机号');
        if (!smsCaptcha) return showToast('请输入短信验证码');
        body.phone = phone;
        body.smsCaptcha = smsCaptcha;
      } else if (modal === 'email') {
        if (!email) return showToast('请输入新邮箱');
        if (!emailCaptcha) return showToast('请输入邮箱验证码');
        body.email = email;
        body.emailCaptcha = emailCaptcha;
      }
      await api.updateProfile(body);
      if (user) setUser({ ...user, ...body });
      setModal(null);
      showToast('保存成功');
    } catch (e: any) { showToast(e.message || '保存失败'); }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const uploaded = await uploadFile<{ url: string }>(file);
      if (!uploaded.url) {
        return showToast('头像上传失败');
      }
      setAvatar(uploaded.url);
      showToast('头像上传成功');
    } catch (e: any) {
      showToast(e.message || '头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const sendSms = async () => {
    if (smsCount > 0 || !phone) return;
    try { await api.sendSmsCode(phone); showToast('验证码已发送'); setSmsCount(60); const t = setInterval(() => setSmsCount(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000); } catch (e: any) { showToast(e.message || '发送失败'); }
  };

  const sendEmailCode = async () => {
    if (emailCount > 0 || !email) return;
    try { await api.sendEmailCode(email); showToast('验证码已发送'); setEmailCount(60); const t = setInterval(() => setEmailCount(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000); } catch (e: any) { showToast(e.message || '发送失败'); }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 14 }}>
        {loading ? '加载中...' : '获取用户信息失败，请刷新页面'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* 头像区 */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#234b49', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff', fontWeight: 700, overflow: 'hidden', boxShadow: '0 4px 24px rgba(35,75,73,.18)' }}>
          {user.avatar ? <img src={user.avatar} style={{ width: 100, height: 100, objectFit: 'cover' }} /> : user.username?.[0]?.toUpperCase()}
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

      {/* 操作按钮 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => openModal('profile')} style={menuBtn}>✏️ 编辑资料</button>
        <button onClick={() => openModal('password')} style={menuBtn}>🔒 修改密码</button>
        <button onClick={() => openModal('phone')} style={menuBtn}>📱 换绑手机</button>
        <button onClick={() => openModal('email')} style={menuBtn}>📧 换绑邮箱</button>
      </div>

      {/* 悬浮编辑框 */}
      {modal && (
        <div onClick={() => setModal(null)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 24 }}>
              {modal === 'profile' ? '编辑资料' : modal === 'password' ? '修改密码' : modal === 'phone' ? '换绑手机' : '换绑邮箱'}
            </div>

            {modal === 'profile' && (
              <>
                <Field label="用户名"><input value={username} onChange={e => setUsername(e.target.value)} style={inp} placeholder="用户名" /></Field>
                <Field label="头像">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#234b49', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, overflow: 'hidden', boxShadow: '0 4px 18px rgba(35,75,73,.16)', flex: '0 0 auto' }}>
                      {avatar ? <img src={avatar} alt="头像预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ width: 96, textAlign: 'center', padding: '9px 0', border: '1px solid #dedbd3', borderRadius: 10, background: uploadingAvatar ? '#f3f1ed' : '#fff', color: uploadingAvatar ? '#aaa' : '#444', fontSize: 13, fontWeight: 600, cursor: uploadingAvatar ? 'default' : 'pointer' }}>
                        {uploadingAvatar ? '上传中...' : '上传头像'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarUpload(file);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <div style={{ fontSize: 12, color: '#999' }}>保存资料后生效</div>
                    </div>
                  </div>
                </Field>
              </>
            )}

            {modal === 'password' && (
              <>
                <Field label="新密码"><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} placeholder="至少6位密码" /></Field>
                <Field label="确认新密码"><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inp} placeholder="再次输入新密码" /></Field>
              </>
            )}

            {modal === 'phone' && (
              <>
                <Field label="新手机号"><input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="请输入新手机号" /></Field>
                <Field label="短信验证码">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={smsCaptcha} onChange={e => setSmsCaptcha(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="请输入验证码" />
                    <button onClick={sendSms} style={captchaBtn(smsCount > 0)}>{smsCount > 0 ? smsCount + 's' : '获取'}</button>
                  </div>
                </Field>
              </>
            )}

            {modal === 'email' && (
              <>
                <Field label="新邮箱"><input value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="请输入新邮箱" /></Field>
                <Field label="邮箱验证码">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={emailCaptcha} onChange={e => setEmailCaptcha(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="请输入验证码" />
                    <button onClick={sendEmailCode} style={captchaBtn(emailCount > 0)}>{emailCount > 0 ? emailCount + 's' : '获取'}</button>
                  </div>
                </Field>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={saveProfile} style={btnPrimary}>保存</button>
              <button onClick={() => setModal(null)} style={btnCancel}>取消</button>
            </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>{label}</div>{children}</div>;
}

function fmt(t: string) {
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 12px 40px rgba(0,0,0,.15)' };
const menuBtn: React.CSSProperties = { width: '100%', padding: '16px 24px', background: '#fff', border: '1px solid #f0efec', borderRadius: 12, fontSize: 15, color: '#555', cursor: 'pointer', textAlign: 'left' as const };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f7f6f4', border: '1px solid transparent', borderRadius: 10, color: '#333', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { flex: 1, padding: 12, border: 'none', borderRadius: 10, background: '#2c2c2c', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnCancel: React.CSSProperties = { flex: 1, padding: 12, border: '1px solid #e0ded8', borderRadius: 10, background: '#fff', color: '#666', fontSize: 14, cursor: 'pointer' };
function captchaBtn(disabled: boolean): React.CSSProperties {
  return { padding: '10px 14px', background: '#f5f3f0', border: 'none', borderRadius: 10, fontSize: 13, color: disabled ? '#bbb' : '#666', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', fontWeight: 500 };
}
