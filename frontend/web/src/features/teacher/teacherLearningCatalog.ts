import { BookOpen, ClipboardList, Headphones, Mic2, PenLine, Presentation, Sparkles } from 'lucide-react';
import { RealTimeTrans } from '../../components/RealTimeTrans';
import { EduSpeakingGenerate, EduSpeakingPractice } from '../../components/EduSpeaking';
import { EduVocab } from '../../components/EduVocab';
import { EduWriting } from '../../components/EduWriting';
import { EduWritingReview } from '../../components/EduWritingReview';
import { EduWritingTutor } from '../../components/EduWritingTutor';
import { EduPPT } from '../../components/EduPPT';
import { EduWord } from '../../components/EduWord';
import { EduExcel } from '../../components/EduExcel';

export const learningGroups = [
  { title: '听力', items: [
    { id: 'translate', label: '实时转译', description: '识别课堂音频，查看翻译和纠错结果。', icon: Headphones, component: RealTimeTrans },
  ] },
  { title: '口语', items: [
    { id: 'speaking-generate', label: '生成口语素材', description: '按学段、难度和场景准备跟读材料。', icon: Mic2, component: EduSpeakingGenerate },
    { id: 'speaking-practice', label: '口语练习', description: '录音跟读，查看口语评测反馈。', icon: Mic2, component: EduSpeakingPractice },
  ] },
  { title: '阅读', items: [
    { id: 'vocab', label: '单词记忆', description: '通过例句、译文和配图练习词汇。', icon: BookOpen, component: EduVocab },
  ] },
  { title: '写作', items: [
    { id: 'writing', label: '生成写作题目', description: '按要求生成写作练习题目。', icon: PenLine, component: EduWriting },
    { id: 'writing-review', label: '批阅作文', description: '查看评分、逐句建议和修改意见。', icon: ClipboardList, component: EduWritingReview },
    { id: 'writing-tutor', label: '作文答疑', description: '根据批阅结果继续提问。', icon: Sparkles, component: EduWritingTutor },
  ] },
];

export const utilityGroups = [
  { title: '通用工具', items: [
    { id: 'edu-ppt', label: 'PPT', description: '制作或整理课堂演示文稿。', icon: Presentation, component: EduPPT },
    { id: 'edu-word', label: 'Word', description: '处理教案、讲义等文档。', icon: ClipboardList, component: EduWord },
    { id: 'edu-excel', label: 'Excel', description: '整理课堂数据与表格。', icon: ClipboardList, component: EduExcel },
  ] },
];
