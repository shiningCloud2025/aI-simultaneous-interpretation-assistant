import { apiCall } from '../../lib/api';

export type ClassroomStatus = 0 | 1;
export type SessionStatus = 1 | 2 | 3;
export type CheckInStatus = 0 | 1;

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

export interface ClassroomList {
  id: number;
  name: string;
  languageCode: string;
  stageCode: string | null;
  academicYear: string | null;
  semesterCode: string | null;
  inviteCode: string;
  status: ClassroomStatus;
  createTime: string;
  updateTime: string;
}

export interface ClassroomDetail extends ClassroomList {
  teacherId: number;
  description: string | null;
}

export interface MemberList {
  id: number;
  studentId: number;
  studentName: string;
  joinType: string;
  joinedTime: string;
}

export interface MemberDetail extends MemberList {
  classroomId: number;
  updateTime: string;
}

export interface SessionList {
  id: number;
  teacherId: number;
  sessionName: string;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
}

export interface SessionDetail extends SessionList {
  classroomId: number;
  createTime: string;
  updateTime: string;
}

export interface SessionStudentList {
  id: number;
  classroomMemberId: number;
  studentId: number;
  studentName: string;
  checkInStatus: CheckInStatus;
  checkInTime: string | null;
}

export interface SessionStudentDetail extends SessionStudentList {
  classroomId: number;
  classroomSessionId: number;
}

export interface ClassroomInput {
  name: string;
  languageCode: string;
  stageCode: string | null;
  academicYear: string | null;
  semesterCode: string | null;
  description: string;
}

type PageFilter = Record<string, string | number | null>;

function pageBody(page: number, size: number, filter: PageFilter = {}) {
  return JSON.stringify({ page, size, filter });
}

export const teachingApi = {
  pageClassrooms: (page: number, size: number, filter: PageFilter = {}) =>
    apiCall<PageResult<ClassroomList>>('/teacher/classroom/page', { method: 'POST', body: pageBody(page, size, filter) }),
  classroom: (id: number) => apiCall<ClassroomDetail>(`/teacher/classroom/${id}`),
  createClassroom: (input: ClassroomInput) =>
    apiCall<ClassroomDetail>('/teacher/classroom', { method: 'POST', body: JSON.stringify(input) }),
  updateClassroom: (id: number, input: Pick<ClassroomInput, 'name' | 'description'>) =>
    apiCall<ClassroomDetail>(`/teacher/classroom/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  refreshInviteCode: (id: number) =>
    apiCall<{ inviteCode: string }>(`/teacher/classroom/${id}/invite-code/refresh`, { method: 'POST' }),
  archiveClassroom: (id: number) =>
    apiCall<void>(`/teacher/classroom/${id}/archive`, { method: 'POST' }),
  pageMembers: (classroomId: number, page: number, size: number, keyword = '') =>
    apiCall<PageResult<MemberList>>(`/teacher/classroom/member/${classroomId}/page`, {
      method: 'POST', body: pageBody(page, size, { keyword: keyword || null }),
    }),
  member: (id: number) => apiCall<MemberDetail>(`/teacher/classroom/member/${id}`),
  removeMember: (id: number) => apiCall<void>(`/teacher/classroom/member/${id}`, { method: 'DELETE' }),
  pageSessions: (classroomId: number, page: number, size: number, filter: PageFilter = {}) =>
    apiCall<PageResult<SessionList>>(`/teacher/classroom/session/${classroomId}/page`, {
      method: 'POST', body: pageBody(page, size, filter),
    }),
  session: (id: number) => apiCall<SessionDetail>(`/teacher/classroom/session/${id}`),
  startSession: (classroomId: number, sessionName: string) =>
    apiCall<SessionDetail>(`/teacher/classroom/session/${classroomId}`, {
      method: 'POST', body: JSON.stringify({ sessionName }),
    }),
  pauseSession: (id: number) => apiCall<SessionDetail>(`/teacher/classroom/session/${id}/pause`, { method: 'POST' }),
  resumeSession: (id: number) => apiCall<SessionDetail>(`/teacher/classroom/session/${id}/resume`, { method: 'POST' }),
  endSession: (id: number) => apiCall<SessionDetail>(`/teacher/classroom/session/${id}/end`, { method: 'POST' }),
  pageSessionStudents: (sessionId: number, page: number, size: number, filter: PageFilter = {}) =>
    apiCall<PageResult<SessionStudentList>>(`/teacher/classroom/session/student/${sessionId}/page`, {
      method: 'POST', body: pageBody(page, size, filter),
    }),
  sessionStudent: (id: number) =>
    apiCall<SessionStudentDetail>(`/teacher/classroom/session/student/${id}`),
};
