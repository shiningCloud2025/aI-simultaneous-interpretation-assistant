/**
 * 悬浮条与桌面平台共用的选项常量。
 * 全部与后端枚举一一对应（见 backend/.../common/enums/），避免两处不一致。
 * 注意：阅读与写作的「学段」是两个不同枚举，不可混用。
 */

export const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

/** 阅读语言：ReadingLanguageEnum */
export const READING_LANGUAGES = [
  { code: 'english', desc: '英语' },
  { code: 'japanese', desc: '日语' },
  { code: 'korean', desc: '韩语' },
];

/** 阅读学段：ReadingStageEnum（8 项，比写作学段多小学/初中/雅思/托福） */
export const READING_STAGES = [
  { code: 'en_primary', desc: '小学英语' },
  { code: 'en_junior', desc: '初中英语' },
  { code: 'en_senior', desc: '高中英语' },
  { code: 'en_cet4', desc: '大学英语四级' },
  { code: 'en_cet6', desc: '大学英语六级' },
  { code: 'en_postgraduate', desc: '考研英语' },
  { code: 'en_ielts', desc: '雅思' },
  { code: 'en_toefl', desc: '托福' },
];

/** 写作语言：CompositionLanguageEnum */
export const WRITING_LANGUAGES = [
  { code: 'english', desc: '英语' },
  { code: 'japanese', desc: '日语' },
  { code: 'korean', desc: '韩语' },
];

/** 写作学段：CompositionStageEnum（4 项） */
export const WRITING_STAGES = [
  { code: 'en_senior', desc: '高中英语' },
  { code: 'en_cet4', desc: '大学英语四级' },
  { code: 'en_cet6', desc: '大学英语六级' },
  { code: 'en_postgraduate', desc: '考研英语' },
];

/** 写作题型：CompositionGenreEnum */
export const WRITING_GENRES = [
  { code: 'en_senior_application', desc: '高中应用文', stage: 'en_senior' },
  { code: 'en_cet4_short_essay', desc: '四级短文写作', stage: 'en_cet4' },
  { code: 'en_cet6_short_essay', desc: '六级短文写作', stage: 'en_cet6' },
  { code: 'en_postgraduate_part_a', desc: '考研小作文', stage: 'en_postgraduate' },
  { code: 'en_postgraduate_part_b', desc: '考研大作文', stage: 'en_postgraduate' },
];

/** 写作难度：CompositionDifficultyEnum */
export const DIFFICULTIES = [
  { code: 'easy', desc: '简单' },
  { code: 'medium', desc: '中等' },
  { code: 'hard', desc: '困难' },
];

/** 写作场景：CompositionSceneEnum */
export const SCENES = [
  { code: 'campus', desc: '校园生活' },
  { code: 'technology', desc: '科技发展' },
  { code: 'environment', desc: '环境保护' },
  { code: 'culture', desc: '文化交流' },
  { code: 'career', desc: '职业规划' },
  { code: 'travel', desc: '旅行见闻' },
  { code: 'social', desc: '社会热点' },
  { code: 'custom', desc: '自定义' },
];
