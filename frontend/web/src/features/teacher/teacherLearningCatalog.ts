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
    { id: 'translate', label: '实时转译', description: '体验课堂音频的识别、翻译与纠错，便于演示听力辅助。', icon: Headphones, component: RealTimeTrans },
  ] },
  { title: '口语', items: [
    { id: 'speaking-generate', label: '生成口语素材', description: '按学段、难度和场景生成跟读材料，备课时先试听。', icon: Mic2, component: EduSpeakingGenerate },
    { id: 'speaking-practice', label: '口语练习', description: '以学生视角体验跟读和口语评测流程。', icon: Mic2, component: EduSpeakingPractice },
  ] },
  { title: '阅读', items: [
    { id: 'vocab', label: '单词记忆', description: '查看例句、译文与配图怎样辅助学生记词。', icon: BookOpen, component: EduVocab },
  ] },
  { title: '写作', items: [
    { id: 'writing', label: '生成写作题目', description: '预览学生练习时看到的写作题目与要求。', icon: PenLine, component: EduWriting },
    { id: 'writing-review', label: '批阅作文', description: '体验作文评分、逐句建议与修改反馈。', icon: ClipboardList, component: EduWritingReview },
    { id: 'writing-tutor', label: '已批阅作文答疑', description: '体验学生如何围绕批阅结果继续提问。', icon: Sparkles, component: EduWritingTutor },
  ] },
];

export const utilityGroups = [
  { title: '通用工具', items: [
    { id: 'edu-ppt', label: 'PPT 集成', description: '制作或整理课堂演示文稿。', icon: Presentation, component: EduPPT },
    { id: 'edu-word', label: 'Word 集成', description: '处理教案、讲义等文档。', icon: ClipboardList, component: EduWord },
    { id: 'edu-excel', label: 'Excel 集成', description: '整理课堂数据与表格。', icon: ClipboardList, component: EduExcel },
  ] },
];
