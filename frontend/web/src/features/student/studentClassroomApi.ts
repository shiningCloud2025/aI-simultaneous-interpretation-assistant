import { apiCall } from '../../lib/api';

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  pages: number;
}

export interface StudentClassroom {
  id: number;
  classroomMemberId: number;
  teacherId: number;
  name: string;
  languageCode: string;
  stageCode: string | null;
  academicYear: string | null;
  semesterCode: string | null;
  status: 0 | 1;
  studentName: string;
  joinedTime: string;
}

export interface StudentClassroomDetail extends StudentClassroom {
  description: string | null;
  createTime: string;
}

export interface ClassroomMember {
  id: number;
  studentId: number;
  studentName: string;
  joinedTime: string;
}

export interface ClassroomSession {
  id: number;
  classroomId?: number;
  sessionName: string;
  status: 1 | 2 | 3;
  startTime: string;
  endTime: string | null;
}

export interface SessionStudent {
  id: number;
  studentId: number;
  studentName: string;
  checkInStatus: 0 | 1;
  checkInTime: string | null;
}

const pageBody = (page: number, filter: Record<string, string | number | null> = {}) =>
  JSON.stringify({ page, size: 12, filter });

export const studentClassroomApi = {
  pageClassrooms: (page: number, keyword = '', status: number | null = null) =>
    apiCall<PageResult<StudentClassroom>>('/student/classroom/page', { method: 'POST', body: pageBody(page, { keyword: keyword || null, status }) }),
  classroom: (id: number) => apiCall<StudentClassroomDetail>(`/student/classroom/${id}`),
  join: (inviteCode: string, studentName: string) => apiCall<StudentClassroomDetail>('/student/classroom/join', {
    method: 'POST', body: JSON.stringify({ inviteCode, studentName }),
  }),
  pageMembers: (classroomId: number, page: number) => apiCall<PageResult<ClassroomMember>>(`/student/classroom/member/${classroomId}/page`, {
    method: 'POST', body: pageBody(page),
  }),
  updateMyName: (memberId: number, studentName: string) => apiCall(`/student/classroom/member/${memberId}`, {
    method: 'PUT', body: JSON.stringify({ studentName }),
  }),
  pageSessions: (classroomId: number, page: number) => apiCall<PageResult<ClassroomSession>>(`/student/classroom/session/${classroomId}/page`, {
    method: 'POST', body: pageBody(page),
  }),
  session: (id: number) => apiCall<ClassroomSession>(`/student/classroom/session/${id}`),
  pageSessionStudents: (sessionId: number, page: number) => apiCall<PageResult<SessionStudent>>(`/student/classroom/session/student/${sessionId}/page`, {
    method: 'POST', body: pageBody(page),
  }),
  checkIn: (sessionId: number) => apiCall<SessionStudent>(`/student/classroom/session/student/${sessionId}/check-in`, { method: 'POST' }),
};
