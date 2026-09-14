import type { UserInfo } from '../stores/appStore';

export type AppUserRole = 'student' | 'teacher' | 'superadmin' | '';

const ROLE_STORAGE_KEY = 'user-role';

export function normalizeUserRole(value: unknown): AppUserRole {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'student' || role === 'teacher' || role === 'superadmin') return role;
  return '';
}

export function rememberUserRole(role: unknown) {
  const normalized = normalizeUserRole(role);
  if (normalized) localStorage.setItem(ROLE_STORAGE_KEY, normalized);
}

export function clearRememberedUserRole() {
  localStorage.removeItem(ROLE_STORAGE_KEY);
}

export function getUserRole(user?: UserInfo | null): AppUserRole {
  return normalizeUserRole(user?.userType);
}

export function isTeacherUser(user?: UserInfo | null) {
  return getUserRole(user) === 'teacher';
}
