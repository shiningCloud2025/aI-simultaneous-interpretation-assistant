import { FileSpreadsheet, FileText, Presentation } from 'lucide-react';

export const studentToolGroups = [
  { title: '文档工具', items: [
    { id: 'edu-ppt', title: 'PPT 集成', description: '处理演示文稿。', icon: Presentation },
    { id: 'edu-word', title: 'Word 集成', description: '处理文档内容。', icon: FileText },
    { id: 'edu-excel', title: 'Excel 集成', description: '处理表格数据。', icon: FileSpreadsheet },
  ] },
];

export const studentToolIds = new Set(studentToolGroups.flatMap(group => group.items.map(item => item.id)));
