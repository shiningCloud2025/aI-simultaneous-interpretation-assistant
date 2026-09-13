export type ClassroomStatus = 'PREPARING' | 'LIVE' | 'ENDED';

export interface ClassroomMember {
  id: string;
  account: string;
  name: string;
  joinedAt: string;
  joinMethod: 'INVITE_CODE' | 'INVITE_LINK' | 'TEACHER_ADDED';
}

export interface TeacherClassroom {
  id: string;
  name: string;
  subject: string;
  stage: string;
  description: string;
  inviteCode: string;
  status: ClassroomStatus;
  createdAt: string;
  startedAt?: string;
  members: ClassroomMember[];
}

export interface CreateClassroomInput {
  name: string;
  subject: string;
  stage: string;
  description: string;
}

const STORAGE_PREFIX = 'teacher-classrooms:';

function storageKey(ownerKey: string) {
  return `${STORAGE_PREFIX}${ownerKey}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function save(ownerKey: string, classrooms: TeacherClassroom[]) {
  localStorage.setItem(storageKey(ownerKey), JSON.stringify(classrooms));
  return classrooms;
}

export const classroomRepository = {
  list(ownerKey: string): TeacherClassroom[] {
    const stored = localStorage.getItem(storageKey(ownerKey));
    if (!stored) return [];

    try {
      const classrooms = JSON.parse(stored) as TeacherClassroom[];
      return Array.isArray(classrooms) ? classrooms : [];
    } catch {
      return [];
    }
  },

  create(ownerKey: string, input: CreateClassroomInput) {
    const classroom: TeacherClassroom = {
      id: createId(),
      name: input.name.trim(),
      subject: input.subject,
      stage: input.stage,
      description: input.description.trim(),
      inviteCode: createInviteCode(),
      status: 'PREPARING',
      createdAt: new Date().toISOString(),
      members: [],
    };
    return save(ownerKey, [classroom, ...this.list(ownerKey)]);
  },

  regenerateInviteCode(ownerKey: string, classroomId: string) {
    const classrooms = this.list(ownerKey).map((classroom) => (
      classroom.id === classroomId ? { ...classroom, inviteCode: createInviteCode() } : classroom
    ));
    return save(ownerKey, classrooms);
  },

  addMember(ownerKey: string, classroomId: string, account: string, name: string) {
    const classrooms = this.list(ownerKey).map((classroom) => {
      if (classroom.id !== classroomId) return classroom;
      if (classroom.members.some((member) => member.account === account)) {
        throw new Error('该学生已经在课堂中');
      }

      const member: ClassroomMember = {
        id: createId(),
        account,
        name,
        joinedAt: new Date().toISOString(),
        joinMethod: 'TEACHER_ADDED',
      };
      return { ...classroom, members: [member, ...classroom.members] };
    });
    return save(ownerKey, classrooms);
  },

  removeMember(ownerKey: string, classroomId: string, memberId: string) {
    const classrooms = this.list(ownerKey).map((classroom) => (
      classroom.id === classroomId
        ? { ...classroom, members: classroom.members.filter((member) => member.id !== memberId) }
        : classroom
    ));
    return save(ownerKey, classrooms);
  },

  start(ownerKey: string, classroomId: string) {
    const classrooms = this.list(ownerKey).map((classroom) => (
      classroom.id === classroomId
        ? { ...classroom, status: 'LIVE' as const, startedAt: new Date().toISOString() }
        : classroom
    ));
    return save(ownerKey, classrooms);
  },

  end(ownerKey: string, classroomId: string) {
    const classrooms = this.list(ownerKey).map((classroom) => (
      classroom.id === classroomId ? { ...classroom, status: 'ENDED' as const } : classroom
    ));
    return save(ownerKey, classrooms);
  },
};
