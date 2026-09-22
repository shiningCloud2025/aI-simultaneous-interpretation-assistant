import { ArrowRight } from 'lucide-react';
import { studentToolGroups } from './studentToolCatalog';
import './student-tools.css';

export function StudentTools({ onOpen }: { onOpen: (id: string) => void }) {
  return <div className="student-tools"><header><h1>通用工具</h1><p>PPT、Word 和 Excel 放在一起，使用时再选择。</p></header>{studentToolGroups.map(group => <section key={group.title}><h2>{group.title}</h2><div className="student-tools-grid">{group.items.map(item => <button key={item.id} onClick={() => onOpen(item.id)}><span className="student-tools-icon"><item.icon size={20} /></span><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight size={16} /></button>)}</div></section>)}</div>;
}
