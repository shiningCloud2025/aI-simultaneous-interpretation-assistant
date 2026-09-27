import { ArrowRight, BookOpen, CircleHelp, Headphones, Info, KeyRound, Keyboard, UserRound } from 'lucide-react';
import './personal-workspace.css';

const groups = [
  {
    title: '账号与设备',
    items: [
      { id: 'account', label: '个人中心', description: '查看和修改个人资料、账号信息。', icon: UserRound },
      { id: 'audio', label: '音频设备', description: '选择麦克风和扬声器。', icon: Headphones },
      { id: 'shortcuts', label: '快捷键', description: '查看和调整常用快捷操作。', icon: Keyboard },
    ],
  },
  {
    title: '服务与帮助',
    items: [
      { id: 'api-key', label: 'API Key 配置', description: '管理自己使用的模型服务密钥。', icon: KeyRound },
      { id: 'term-library', label: '术语库', description: '整理翻译时使用的专有词汇。', icon: BookOpen },
      { id: 'help', label: '帮助反馈', description: '查看帮助，反馈使用中遇到的问题。', icon: CircleHelp },
      { id: 'about', label: '关于', description: '查看平台信息。', icon: Info },
    ],
  },
];

export function PersonalWorkspace({ onOpen }: { onOpen: (id: string) => void }) {
  return <div className="personal-workspace">
    <header className="personal-workspace-heading"><h1>个人工作台</h1><p>个人资料、设备设置和常用配置。</p></header>
    {groups.map(group => <section className="personal-workspace-group" key={group.title}>
      <h2>{group.title}</h2>
      <div className="personal-workspace-grid">{group.items.map(item => <button key={item.id} className="personal-workspace-card" onClick={() => onOpen(item.id)}>
        <span className="personal-workspace-icon"><item.icon size={20} /></span>
        <span className="personal-workspace-card-text"><strong>{item.label}</strong><small>{item.description}</small></span>
        <ArrowRight size={17} />
      </button>)}</div>
    </section>)}
  </div>;
}
