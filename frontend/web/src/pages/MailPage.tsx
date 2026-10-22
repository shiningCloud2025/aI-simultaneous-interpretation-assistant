import { useEffect, useMemo, useState } from 'react';
import { Home, Mail } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, useAppStore } from '../stores/appStore';
import { MailWorkspace } from '../components/MailWorkspace';
import './mail-page.css';

function roleHome(userType?: string) {
  const type = String(userType || '').toLowerCase();
  if (type === 'superadmin') return '/admin';
  if (type === 'teacher') return '/teacher';
  return '/dashboard';
}

export function MailPage() {
  const token = useAppStore(state => state.token);
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const logout = useAppStore(state => state.logout);
  const nav = useNavigate();
  const [loading, setLoading] = useState(!user);
  const home = useMemo(() => roleHome(user?.userType), [user?.userType]);

  useEffect(() => {
    if (user || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getUserInfo()
      .then(setUser)
      .catch(() => {
        logout();
        nav('/login', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [user, token, setUser, logout, nav]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div className="mail-page-loading">正在进入邮箱空间…</div>;

  return (
    <div className="mail-page-shell">
      <header className="mail-page-topbar">
        <button className="mail-page-brand" onClick={() => nav(home)}>
          <span><Mail size={20} /></span>
          <strong>邮箱空间</strong>
        </button>
        <div className="mail-page-actions">
          <button onClick={() => nav(home)}><Home size={16} />返回智语同航</button>
        </div>
      </header>
      <main className="mail-page-main">
        <MailWorkspace key={user?.id} isSuperAdmin={String(user?.userType || '').toLowerCase() === 'superadmin'} />
      </main>
    </div>
  );
}
