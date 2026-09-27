import { Megaphone, Shuffle, Vote, Zap, type LucideIcon } from 'lucide-react';

export interface TeacherInteraction {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: 'available' | 'coming';
}

export const teacherInteractions: TeacherInteraction[] = [
  { id: 'rush-answer', name: '抢答', description: '发起抢答，学生拼手速抢答，实时公布抢到的人', icon: Zap, status: 'coming' },
  { id: 'random-pick', name: '随机点名', description: '从课堂学生中随机抽取一名回答问题', icon: Shuffle, status: 'coming' },
  { id: 'vote', name: '课堂投票', description: '发起即时投票，选项和结果实时可见', icon: Vote, status: 'coming' },
  { id: 'broadcast', name: '消息广播', description: '向全班学生推送一条课堂通知', icon: Megaphone, status: 'coming' },
];
