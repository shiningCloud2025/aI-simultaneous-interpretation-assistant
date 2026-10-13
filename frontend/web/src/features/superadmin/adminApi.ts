import { apiCall } from '../../lib/api';

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export interface AdminMetric {
  value: number;
  comparePercent?: number;
  compareText?: string;
}

export interface AdminActiveMetric {
  value: number;
  activeRate?: number;
}

export interface UserDashboardSummary {
  totalUsers?: AdminMetric;
  todayNewUsers?: AdminMetric;
  monthNewUsers?: AdminMetric;
  dau?: AdminActiveMetric;
  wau?: AdminActiveMetric;
  mau?: AdminActiveMetric;
}

export interface UserTrendItem {
  date: string;
  newUsers?: number;
  totalUsers?: number;
}

export interface StructureItem {
  name?: string;
  userType?: string;
  userTypeName?: string;
  type?: string;
  statusName?: string;
  status?: string;
  value?: number;
  count?: number;
  percent?: number;
}

export interface UserDashboardStructure {
  totalUsers?: number;
  typeDistribution?: StructureItem[];
  statusDistribution?: StructureItem[];
  userTypes?: StructureItem[];
  statuses?: StructureItem[];
  typeItems?: StructureItem[];
  statusItems?: StructureItem[];
}

export interface DashboardOnlineUser {
  userId: number;
  account?: string;
  username?: string;
  userType?: string;
  userTypeName?: string;
  statusName?: string;
  lastLoginTime?: string;
}

export interface DashboardOnline {
  onlineCount: number;
  matchCount?: number;
  users: DashboardOnlineUser[];
}

export interface RecentRegisterUser {
  id: number;
  account?: string;
  username?: string;
  userType?: string;
  userTypeName?: string;
  userTypeText?: string;
  status?: string | number;
  statusName?: string;
  statusText?: string;
  lastLoginTime?: string;
  createTime?: string;
}

export interface ManagedUser {
  id: number;
  account?: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  userType?: string;
  userTypeText?: string;
  status?: string | number;
  statusText?: string;
  online?: boolean;
  lastLoginTime?: string;
  createTime?: string;
}

export interface OnlineUserPage {
  pageNum: number;
  pageSize: number;
  total: number;
  totalOnline: number;
  studentOnline: number;
  teacherOnline: number;
  records: ManagedUser[];
}

export interface LogFile {
  fileName: string;
  fileSize: number;
  fileSizeText: string;
  lastModifiedTime?: string;
  current: boolean;
}

export interface LogEntry {
  time?: string;
  level?: string;
  content: string;
}

export interface LogContent {
  fileName: string;
  fileSize?: number;
  fileSizeText?: string;
  lastModifiedTime?: string;
  tail?: number;
  all?: boolean;
  totalLines?: number;
  totalEntries?: number;
  matchedEntries?: number;
  errorCount?: number;
  warnCount?: number;
  entries: LogEntry[];
}

export interface FeedbackItem {
  id: number;
  feedbackNo?: string;
  type?: string;
  typeText?: string;
  title?: string;
  content?: string;
  status?: string;
  statusText?: string;
  replyContent?: string;
  username?: string;
  account?: string;
  userTypeText?: string;
  createTime?: string;
}

export interface SkillItem {
  id: number;
  name: string;
  description?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillDetail extends SkillItem {
  skillContent?: string;
  resources?: SkillResource[];
  metadataJson?: string;
}

export interface SkillResource {
  path: string;
  content: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  coverUrl?: string | null;
  status?: number | string | null;
  statusText?: string | null;
  publishTime?: string | null;
  read?: boolean | null;
  createTime?: string | null;
}

export interface AnnouncementDetail extends AnnouncementItem {
  titleContent?: string | null;
  content?: string | null;
  createdById?: number | null;
  updatedById?: number | null;
  updateTime?: string | null;
}

export interface AnnouncementSaveInput {
  title: string;
  titleContent?: string;
  content: string;
  coverUrl?: string;
  status: number;
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const adminApi = {
  login: (data: { keyword?: string; phone?: string; email?: string; password?: string; captcha?: string }) =>
    apiCall<{ token: string }>('/sys/superadmin/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  sendSmsCode: (phone: string) =>
    apiCall<void>(`/sys/user/sms/send?phone=${encodeURIComponent(phone)}`, { method: 'POST', skipAuth: true }),
  sendEmailCode: (email: string) =>
    apiCall<void>(`/sys/user/email/send?email=${encodeURIComponent(email)}`, { method: 'POST', skipAuth: true }),

  userSummary: () => apiCall<UserDashboardSummary>('/superadmin/dashboard/users/summary'),
  userTrend: (startDate?: string, endDate?: string) =>
    apiCall<UserTrendItem[]>(`/superadmin/dashboard/users/trend${qs({ startDate, endDate })}`),
  userStructure: () => apiCall<UserDashboardStructure>('/superadmin/dashboard/users/structure'),
  userDashboardOnline: (keyword?: string, userType?: string) =>
    apiCall<DashboardOnline>(`/superadmin/dashboard/users/online${qs({ keyword, userType })}`),
  recentRegisters: (limit = 100) =>
    apiCall<RecentRegisterUser[]>(`/superadmin/dashboard/users/recent-registers${qs({ limit })}`),

  allUsers: (params: { pageNum: number; pageSize: number; keyword?: string; userType?: string; status?: string }) =>
    apiCall<PageResult<ManagedUser>>(`/superadmin/users/all/page${qs(params)}`),
  batchUpdateStatus: (userIds: number[], status: number) =>
    apiCall<void>('/superadmin/users/all/status', { method: 'PUT', body: JSON.stringify({ userIds, status }) }),
  batchUpdateType: (userIds: number[], userType: string) =>
    apiCall<void>('/superadmin/users/all/type', { method: 'PUT', body: JSON.stringify({ userIds, userType }) }),
  resetPassword: (userId: number, newPassword: string) =>
    apiCall<void>(`/superadmin/users/all/${userId}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),

  onlineUsers: (params: { pageNum: number; pageSize: number; keyword?: string; userType?: string }) =>
    apiCall<OnlineUserPage>(`/superadmin/users/online/page${qs(params)}`),
  kickOnlineUsers: (userIds: number[]) =>
    apiCall<void>('/superadmin/users/online', { method: 'DELETE', body: JSON.stringify({ userIds }) }),

  logFiles: () => apiCall<LogFile[]>('/superadmin/dashboard/logs/files'),
  logContent: (params: { fileName?: string; keyword?: string; level?: string; tail?: number; all?: boolean }) =>
    apiCall<LogContent>(`/superadmin/dashboard/logs/content${qs(params)}`),

  feedbacks: (params: { pageNum: number; pageSize: number; keyword?: string; type?: string; status?: string }) =>
    apiCall<PageResult<FeedbackItem>>(`/superadmin/feedback/page${qs(params)}`),
  processFeedback: (id: number, replyContent?: string) =>
    apiCall<void>(`/superadmin/feedback/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(replyContent ? { replyContent } : {}),
    }),

  skills: (params: { pageNum: number; pageSize: number; name?: string }) =>
    apiCall<PageResult<SkillItem>>(`/superadmin/skills/page${qs(params)}`),
  skillDetail: (name: string) => apiCall<SkillDetail>(`/superadmin/skills/${encodeURIComponent(name)}`),
  createSkill: (data: { name: string; description: string; skillContent: string; resources?: SkillResource[]; overwrite?: boolean }) =>
    apiCall<void>('/superadmin/skills', { method: 'POST', body: JSON.stringify(data) }),
  updateSkill: (name: string, data: { description: string; skillContent: string; resources?: SkillResource[] }) =>
    apiCall<void>(`/superadmin/skills/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSkill: (name: string) =>
    apiCall<void>(`/superadmin/skills/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  announcements: (data: { page: number; size: number; filter?: { keyword?: string | null; status?: number | null } }) =>
    apiCall<PageResult<AnnouncementItem>>('/superadmin/announcement/page', { method: 'POST', body: JSON.stringify(data) }),
  announcementDetail: (id: number) => apiCall<AnnouncementDetail>(`/superadmin/announcement/${id}`),
  createAnnouncement: (data: AnnouncementSaveInput) =>
    apiCall<void>('/superadmin/announcement', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: number, data: AnnouncementSaveInput) =>
    apiCall<void>(`/superadmin/announcement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: number) =>
    apiCall<void>(`/superadmin/announcement/${id}`, { method: 'DELETE' }),
  publishAnnouncement: (id: number) =>
    apiCall<void>(`/superadmin/announcement/${id}/publish`, { method: 'PUT' }),
};
