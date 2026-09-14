export type ClassroomState = 'ACTIVE' | 'ARCHIVED';
export type SessionState = 'RUNNING' | 'PAUSED' | 'ENDED';
export type JoinType = 'INVITE_CODE' | 'INVITE_LINK' | 'TEACHER_ADD';

export interface TeacherMember {
  id: string;
  studentId: string;
  studentName: string;
  joinType: JoinType;
  joinedTime: string;
}

export interface SessionStudent {
  id: string;
  classroomMemberId: string;
  studentId: string;
  studentName: string;
  attendanceStatus: 0 | 1;
  checkInTime?: string;
}

export interface ClassroomSession {
  id: string;
  classroomId: string;
  sessionName: string;
  status: SessionState;
  startTime: string;
  endTime?: string;
  students: SessionStudent[];
}

export interface TeacherClassroom {
  id: string;
  name: string;
  languageCode: string;
  stageCode?: string;
  academicYear?: string;
  semesterCode?: string;
  description: string;
  inviteCode: string;
  status: ClassroomState;
  createTime: string;
  members: TeacherMember[];
  sessions: ClassroomSession[];
}

export interface CreateClassroomInput {
  name: string;
  languageCode: string;
  stageCode: string;
  academicYear: string;
  semesterCode: string;
  description: string;
}

const STORAGE_PREFIX = 'teacher-console-v1:';

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function daysAgo(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function seed(): TeacherClassroom[] {
  const oralMembers: TeacherMember[] = [
    { id: 'm-101', studentId: '20260001', studentName: '陈嘉宁', joinType: 'INVITE_CODE', joinedTime: daysAgo(28) },
    { id: 'm-102', studentId: '20260002', studentName: '林思语', joinType: 'INVITE_LINK', joinedTime: daysAgo(25) },
    { id: 'm-103', studentId: '20260003', studentName: '周子涵', joinType: 'TEACHER_ADD', joinedTime: daysAgo(23) },
    { id: 'm-104', studentId: '20260004', studentName: '许安然', joinType: 'INVITE_CODE', joinedTime: daysAgo(20) },
    { id: 'm-105', studentId: '20260005', studentName: '沈一诺', joinType: 'INVITE_LINK', joinedTime: daysAgo(18) },
  ];
  const endedStudents: SessionStudent[] = oralMembers.map((member, index) => ({
    id: `ss-10${index}`,
    classroomMemberId: member.id,
    studentId: member.studentId,
    studentName: member.studentName,
    attendanceStatus: index === 3 ? 0 : 1,
    checkInTime: index === 3 ? undefined : daysAgo(2, 9),
  }));

  return [
    {
      id: 'class-english-oral',
      name: '高一英语口语 2 班',
      languageCode: 'en',
      stageCode: 'senior',
      academicYear: '2026-2027',
      semesterCode: 'FIRST',
      description: '围绕真实情境开展英语听说训练，每周完成一次主题表达与课堂互动。',
      inviteCode: 'EN2K8M4Q',
      status: 'ACTIVE',
      createTime: daysAgo(36),
      members: oralMembers,
      sessions: [
        { id: 'session-english-3', classroomId: 'class-english-oral', sessionName: '第 3 课时 · Campus life', status: 'ENDED', startTime: daysAgo(2, 9), endTime: daysAgo(2, 10), students: endedStudents },
        { id: 'session-english-2', classroomId: 'class-english-oral', sessionName: '第 2 课时 · Self introduction', status: 'ENDED', startTime: daysAgo(9, 9), endTime: daysAgo(9, 10), students: endedStudents.map(student => ({ ...student, id: `${student.id}-2` })) },
      ],
    },
    {
      id: 'class-japanese-basic',
      name: '大学日语基础班',
      languageCode: 'ja',
      stageCode: 'university',
      academicYear: '2026-2027',
      semesterCode: 'FIRST',
      description: '从五十音与基础会话开始，结合校园生活主题完成阶段练习。',
      inviteCode: 'JP7N3X9A',
      status: 'ACTIVE',
      createTime: daysAgo(22),
      members: [
        { id: 'm-201', studentId: '20261021', studentName: '王予希', joinType: 'INVITE_LINK', joinedTime: daysAgo(16) },
        { id: 'm-202', studentId: '20261022', studentName: '李沐阳', joinType: 'INVITE_CODE', joinedTime: daysAgo(14) },
        { id: 'm-203', studentId: '20261023', studentName: '何雨桐', joinType: 'TEACHER_ADD', joinedTime: daysAgo(12) },
      ],
      sessions: [],
    },
    {
      id: 'class-korean-interest',
      name: '韩语兴趣入门',
      languageCode: 'ko',
      stageCode: 'university',
      academicYear: '2025-2026',
      semesterCode: 'SECOND',
      description: '已完成本学期教学，保留课堂成员与历史课次供回顾。',
      inviteCode: 'KR5H2W8C',
      status: 'ARCHIVED',
      createTime: daysAgo(130),
      members: [],
      sessions: [],
    },
  ];
}

function key(ownerKey: string) {
  return `${STORAGE_PREFIX}${ownerKey}`;
}

function save(ownerKey: string, classrooms: TeacherClassroom[]) {
  localStorage.setItem(key(ownerKey), JSON.stringify(classrooms));
  return classrooms;
}

function read(ownerKey: string): TeacherClassroom[] {
  const raw = localStorage.getItem(key(ownerKey));
  if (!raw) return save(ownerKey, seed());
  try {
    const value = JSON.parse(raw) as TeacherClassroom[];
    return Array.isArray(value) ? value : save(ownerKey, seed());
  } catch {
    return save(ownerKey, seed());
  }
}

function updateClassroom(ownerKey: string, classroomId: string, updater: (classroom: TeacherClassroom) => TeacherClassroom) {
  return save(ownerKey, read(ownerKey).map(classroom => classroom.id === classroomId ? updater(classroom) : classroom));
}

export const teacherRepository = {
  list: read,

  create(ownerKey: string, input: CreateClassroomInput) {
    const classroom: TeacherClassroom = {
      id: id(),
      name: input.name.trim(),
      languageCode: input.languageCode,
      stageCode: input.stageCode || undefined,
      academicYear: input.academicYear || undefined,
      semesterCode: input.semesterCode || undefined,
      description: input.description.trim(),
      inviteCode: inviteCode(),
      status: 'ACTIVE',
      createTime: new Date().toISOString(),
      members: [],
      sessions: [],
    };
    return save(ownerKey, [classroom, ...read(ownerKey)]);
  },

  regenerateCode(ownerKey: string, classroomId: string) {
    return updateClassroom(ownerKey, classroomId, classroom => ({ ...classroom, inviteCode: inviteCode() }));
  },

  archive(ownerKey: string, classroomId: string, archived: boolean) {
    return updateClassroom(ownerKey, classroomId, classroom => ({ ...classroom, status: archived ? 'ARCHIVED' : 'ACTIVE' }));
  },

  addMember(ownerKey: string, classroomId: string, studentId: string, studentName: string) {
    return updateClassroom(ownerKey, classroomId, classroom => {
      if (classroom.members.some(member => member.studentId === studentId)) throw new Error('该学生已经在课堂中');
      const member: TeacherMember = { id: id(), studentId, studentName, joinType: 'TEACHER_ADD', joinedTime: new Date().toISOString() };
      return { ...classroom, members: [member, ...classroom.members] };
    });
  },

  removeMember(ownerKey: string, classroomId: string, memberId: string) {
    return updateClassroom(ownerKey, classroomId, classroom => ({ ...classroom, members: classroom.members.filter(member => member.id !== memberId) }));
  },

  startSession(ownerKey: string, classroomId: string, sessionName: string) {
    let sessionId = '';
    const classrooms = updateClassroom(ownerKey, classroomId, classroom => {
      const running = classroom.sessions.find(session => session.status !== 'ENDED');
      if (running) {
        sessionId = running.id;
        return classroom;
      }
      sessionId = id();
      const session: ClassroomSession = {
        id: sessionId,
        classroomId,
        sessionName: sessionName.trim() || `第 ${classroom.sessions.length + 1} 课时`,
        status: 'RUNNING',
        startTime: new Date().toISOString(),
        students: classroom.members.map(member => ({
          id: id(),
          classroomMemberId: member.id,
          studentId: member.studentId,
          studentName: member.studentName,
          attendanceStatus: 0,
        })),
      };
      return { ...classroom, sessions: [session, ...classroom.sessions] };
    });
    return { classrooms, sessionId };
  },

  setSessionState(ownerKey: string, classroomId: string, sessionId: string, status: SessionState) {
    return updateClassroom(ownerKey, classroomId, classroom => ({
      ...classroom,
      sessions: classroom.sessions.map(session => session.id === sessionId
        ? { ...session, status, endTime: status === 'ENDED' ? new Date().toISOString() : undefined }
        : session),
    }));
  },

  toggleAttendance(ownerKey: string, classroomId: string, sessionId: string, studentRecordId: string) {
    return updateClassroom(ownerKey, classroomId, classroom => ({
      ...classroom,
      sessions: classroom.sessions.map(session => session.id === sessionId ? {
        ...session,
        students: session.students.map(student => student.id === studentRecordId ? {
          ...student,
          attendanceStatus: student.attendanceStatus === 1 ? 0 : 1,
          checkInTime: student.attendanceStatus === 1 ? undefined : new Date().toISOString(),
        } : student),
      } : session),
    }));
  },
};
