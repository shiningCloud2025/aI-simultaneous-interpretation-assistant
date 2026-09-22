import { PersonalWorkspace } from '../../components/PersonalWorkspace';

const teacherPersonalPaths: Record<string, string> = {
  account: '/teacher/profile',
  audio: '/teacher/settings/audio',
  shortcuts: '/teacher/settings/shortcuts',
  'api-key': '/teacher/settings/api-key',
  'term-library': '/teacher/settings/term-library',
  help: '/teacher/help',
  about: '/teacher/settings/about',
};

export function TeacherPersonalWorkspace({ onOpen }: { onOpen: (path: string) => void }) {
  return <PersonalWorkspace onOpen={id => {
    const path = teacherPersonalPaths[id];
    if (path) onOpen(path);
  }} />;
}
