import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPage } from './pages/ForgotPage';
import { MainLayout } from './pages/MainLayout';
import { ChangePwdPage } from './pages/ChangePwdPage';
import { OfficialSitePage } from './pages/OfficialSitePage';
import { ApiKeyGuidePage } from './pages/ApiKeyGuidePage';
import { DesktopAppPage } from './pages/DesktopAppPage';
import { SuperAdminConsole, SuperAdminLoginPage } from './features/superadmin/SuperAdminConsole';
import { TeacherConsole } from './features/teacher/TeacherConsole';
import './App.css';

function ProtectedRoute({ children, redirectTo = '/login' }: { children: React.ReactNode; redirectTo?: string }) {
  const token = useAppStore((s) => s.token);
  if (!token) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

export default function App() {
  const syncToken = useAppStore((s) => s.syncToken);

  useEffect(() => {
    const syncCurrentToken = () => {
      syncToken(localStorage.getItem('token'));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'token') {
        syncToken(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-token-invalid', syncCurrentToken);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-token-invalid', syncCurrentToken);
    };
  }, [syncToken]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OfficialSitePage />} />
        <Route path="/api-key-guide" element={<ApiKeyGuidePage />} />
        <Route path="/desktop" element={<DesktopAppPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/admin/login" element={<SuperAdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute redirectTo="/admin/login"><SuperAdminConsole /></ProtectedRoute>} />
        <Route path="/teacher/*" element={<ProtectedRoute><TeacherConsole /></ProtectedRoute>} />
        <Route path="/change-pwd" element={<ProtectedRoute><ChangePwdPage /></ProtectedRoute>} />
        <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
