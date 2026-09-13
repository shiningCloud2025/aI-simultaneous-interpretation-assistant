import { create } from 'zustand';

export interface UserInfo {
  id: number;
  account: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
  lastLoginTime: string;
  createTime: string;
  /** 用户类型：student 学生 / teacher 老师 / superadmin 超管 */
  userType?: string;
}

export interface AppState {
  user: UserInfo | null;
  token: string | null;
  activePanel: string;
  setUser: (user: UserInfo) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setActivePanel: (panel: string) => void;
}

// API 请求工具
const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAppStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(json.detail || json.message || '请求失败');
  }
  return json.data;
}

export const api = {
  // 登录（学生端接口，用户类型由后端固定为 student，前端无法指定）
  login: (data: { keyword: string; password: string }) =>
    request<{ token: string }>('/sys/user/student/login', { method: 'POST', body: JSON.stringify(data) }),
  loginByPhone: (data: { phone: string; captcha: string }) =>
    request<{ token: string }>('/sys/user/student/login', { method: 'POST', body: JSON.stringify(data) }),
  loginByEmail: (data: { email: string; captcha: string }) =>
    request<{ token: string }>('/sys/user/student/login', { method: 'POST', body: JSON.stringify(data) }),
  // 老师登录
  teacherLogin: (data: { keyword?: string; phone?: string; email?: string; password?: string; captcha?: string }) =>
    request<{ token: string }>('/sys/user/teacher/login', { method: 'POST', body: JSON.stringify(data) }),
  // 注册
  register: (data: { account: string; username: string; password: string; phone?: string; email?: string; smsCaptcha?: string; emailCaptcha?: string }) =>
    request<{ token: string }>('/sys/user/student/register', { method: 'POST', body: JSON.stringify(data) }),
  teacherRegister: (data: { account: string; username: string; password: string; phone?: string; email?: string; smsCaptcha?: string; emailCaptcha?: string }) =>
    request<{ token: string }>('/sys/user/teacher/register', { method: 'POST', body: JSON.stringify(data) }),
  // 获取用户信息
  getUserInfo: () => request<UserInfo>('/sys/user/info'),
  // 发送短信验证码
  sendSmsCode: (phone: string) =>
    request<void>(`/sys/user/sms/send?phone=${encodeURIComponent(phone)}`, { method: 'POST' }),
  // 发送邮箱验证码
  sendEmailCode: (email: string) =>
    request<void>(`/sys/user/email/send?email=${encodeURIComponent(email)}`, { method: 'POST' }),
  // 修改密码
  resetPassword: (data: { phone?: string; email?: string; captcha: string; newPassword: string }) =>
    request<void>('/sys/user/reset-password', { method: 'PUT', body: JSON.stringify(data) }),
  // 修改个人资料
  updateProfile: (data: { username?: string; phone?: string; email?: string; avatar?: string; password?: string; smsCaptcha?: string; emailCaptcha?: string }) =>
    request<void>('/sys/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  // 设置模型偏好
  saveModelPreference: (data: { modelType: string; provider: string; modelName: string }) =>
    request<void>('/sys/user/model-preference', { method: 'PUT', body: JSON.stringify(data) }),
  // API Key 管理
  listApiKeys: () => request<any[]>('/sys/user/api-key'),
  saveApiKey: (data: { provider: string; keyType: string; apiKey: string }) =>
    request<void>('/sys/user/api-key', { method: 'POST', body: JSON.stringify(data) }),
  deleteApiKey: (id: number) => request<void>(`/sys/user/api-key/${id}`, { method: 'DELETE' }),
  testApiKey: (id: number) => request<void>(`/sys/user/api-key/${id}/test`, { method: 'POST' }),
  // 模型偏好
  listModelPreferences: () => request<any[]>('/sys/user/model-preference'),
  // 反馈
  submitFeedback: (data: { type: string; title: string; content: string }) =>
    request<void>('/sys/user/feedback/submit', { method: 'POST', body: JSON.stringify(data) }),
  getFeedbacks: (data: { page: number; size: number }) =>
    request<any>('/sys/user/feedback/page', { method: 'POST', body: JSON.stringify(data) }),
  getFeedbackDetail: (id: number) =>
    request<any>(`/sys/user/feedback/${id}`),
  // 快捷键
  getShortcuts: () => request<any[]>('/sys/user/shortcut/config'),
  saveShortcuts: (data: { shortcuts: any[] }) =>
    request<void>('/sys/user/shortcut/config', { method: 'PUT', body: JSON.stringify(data) }),
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  activePanel: 'dashboard',
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, activePanel: 'dashboard' });
  },
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
