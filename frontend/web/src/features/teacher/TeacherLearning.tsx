import { ArrowLeft, ArrowRight } from 'lucide-react';
import { learningGroups, utilityGroups } from './teacherLearningCatalog';

type ToolKind = 'student' | 'utility';

export function TeacherLearningArea({ kind, activeId, onOpen, onHome }: { kind: ToolKind; activeId?: string; onOpen: (id: string) => void; onHome: () => void }) {
  return activeId
    ? <TeacherLearningTool kind={kind} id={activeId} onBack={onHome} onOpen={onOpen} />
    : <TeacherLearningHub kind={kind} onOpen={onOpen} />;
}

export function TeacherLearningHub({ kind, onOpen }: { kind: ToolKind; onOpen: (id: string) => void }) {
  const groups = kind === 'student' ? learningGroups : utilityGroups;
  return <div className="teacher-page teacher-learning-page">
    <header className="teacher-learning-heading">
      <h1>{kind === 'student' ? '学生预习' : '通用工具'}</h1>
      <p>{kind === 'student' ? '先了解学生能用哪些功能，再安排课前预习。' : '演示文稿、文档和表格都在这里。'}</p>
    </header>
    {groups.map(group => <section className="teacher-learning-group" key={group.title}>
      <h2>{group.title}</h2>
      <div className="teacher-learning-grid">{group.items.map(item => <button key={item.id} className="teacher-learning-card" onClick={() => onOpen(item.id)}>
        <span className="teacher-learning-icon"><item.icon size={21} /></span>
        <strong>{item.label}</strong><p>{item.description}</p><span className="teacher-learning-link">打开 <ArrowRight size={15} /></span>
      </button>)}</div>
    </section>)}
  </div>;
}

export function TeacherLearningTool({ kind, id, onBack, onOpen }: { kind: ToolKind; id: string; onBack: () => void; onOpen: (id: string) => void }) {
  const groups = kind === 'student' ? learningGroups : utilityGroups;
  const item = groups.flatMap(group => group.items).find(entry => entry.id === id);
  if (!item) return <div className="teacher-page"><button className="teacher-learning-back" onClick={onBack}><ArrowLeft size={16} />返回功能列表</button><p>没有找到这个功能。</p></div>;
  const Component = item.component;
  return <div className="teacher-page teacher-learning-tool">
    <div className="teacher-learning-tool-top">
      <button className="teacher-learning-back" onClick={onBack}><ArrowLeft size={16} />全部功能</button>
      <label>切换功能 <select value={id} onChange={event => onOpen(event.target.value)}>
        {groups.map(group => <optgroup key={group.title} label={group.title}>{group.items.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</optgroup>)}
      </select></label>
    </div>
    <div className="teacher-learning-tool-head"><div><h1>{item.label}</h1><p>{item.description}</p></div></div>
    <div className="teacher-embedded-content"><Component /></div>
  </div>;
}
