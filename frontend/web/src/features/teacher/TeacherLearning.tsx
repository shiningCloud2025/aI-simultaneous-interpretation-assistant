import { ArrowRight, Sparkles } from 'lucide-react';
import { learningGroups, utilityGroups } from './teacherLearningCatalog';

type ToolKind = 'student' | 'utility';

export function TeacherLearningArea({ kind, activeId, onOpen, onHome }: { kind: ToolKind; activeId?: string; onOpen: (id: string) => void; onHome: () => void }) {
  const groups = kind === 'student' ? learningGroups : utilityGroups;
  return <div className="teacher-learning-layout">
    <nav className="teacher-learning-nav" aria-label={kind === 'student' ? '学生视角导航' : '通用工具导航'}>
      <button className={!activeId ? 'active' : ''} onClick={onHome}><Sparkles size={17} />全部功能</button>
      {groups.map(group => <div className="teacher-learning-nav-group" key={group.title}>
        <span>{group.title}</span>
        {group.items.map(item => <button key={item.id} className={activeId === item.id ? 'active' : ''} onClick={() => onOpen(item.id)}><item.icon size={16} />{item.label}</button>)}
      </div>)}
    </nav>
    <div className="teacher-learning-main">{activeId ? <TeacherLearningTool kind={kind} id={activeId} onBack={onHome} /> : <TeacherLearningHub kind={kind} onOpen={onOpen} />}</div>
  </div>;
}

export function TeacherLearningHub({ kind, onOpen }: { kind: ToolKind; onOpen: (id: string) => void }) {
  const groups = kind === 'student' ? learningGroups : utilityGroups;
  return <div className="teacher-page teacher-learning-page">
    {groups.map(group => <section className="teacher-learning-group" key={group.title}>
      <div className="teacher-learning-group-head"><h2>{group.title}</h2><span>{group.items.length} 项可体验功能</span></div>
      <div className="teacher-learning-grid">{group.items.map(item => <button key={item.id} className="teacher-learning-card" onClick={() => onOpen(item.id)}>
        <span className="teacher-learning-icon"><item.icon size={21} /></span>
        <strong>{item.label}</strong><p>{item.description}</p><span className="teacher-learning-link">进入体验 <ArrowRight size={15} /></span>
      </button>)}</div>
    </section>)}
  </div>;
}

export function TeacherLearningTool({ kind, id, onBack }: { kind: ToolKind; id: string; onBack: () => void }) {
  const groups = kind === 'student' ? learningGroups : utilityGroups;
  const item = groups.flatMap(group => group.items).find(entry => entry.id === id);
  if (!item) return null;
  const Component = item.component;
  return <div className="teacher-page teacher-learning-tool">
    <button className="teacher-learning-back" onClick={onBack}>← 返回{kind === 'student' ? '学生视角' : '通用工具'}</button>
    <div className="teacher-learning-tool-head"><div><span>{kind === 'student' ? '学生视角' : '通用工具'}</span><h1>{item.label}</h1><p>{item.description}</p></div>{kind === 'student' && <span>试用后可引导学生在自己的学习空间打开同名功能</span>}</div>
    <div className="teacher-embedded-content"><Component /></div>
  </div>;
}
