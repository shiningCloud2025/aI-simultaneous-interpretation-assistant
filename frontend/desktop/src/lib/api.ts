/**
 * 桌面端统一请求层。
 * 与平台端共用同一套后端接口，返回结构统一为 BaseResult<T> = { code, message, detail, data }。
 */

// 默认连本地后端；生产打包时通过 .env 覆盖为线上域名。
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '');

/** 后端 origin（去掉 /api 后缀），用于拼接 WebSocket 地址 */
export const APP_ORIGIN = API_BASE.replace(/\/api$/, '');

const TOKEN_KEY = 'desktop-token';
const LEGACY_TOKEN_KEY = 'token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // 兼容平台端 key，方便两端登录态互通
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (json && typeof json === 'object' && 'code' in json && json.code !== 200) {
    throw new Error(json.detail || json.message || `请求失败 (code=${json.code})`);
  }
  return (json?.data ?? json) as T;
}

export async function uploadFile<T>(file: File): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/common/file/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (json && typeof json === 'object' && 'code' in json && json.code !== 200) {
    throw new Error(json.detail || json.message || '上传失败');
  }
  return (json?.data ?? json) as T;
}

// ============ 业务模型定义 ============

export interface Provider {
  key: string;
  name: string;
}

export interface ModelInfo {
  name: string;
  display: string;
}

export interface Preference {
  modelType: string; // ASR / LLM
  provider: string;
  modelName: string;
}

export interface UserInfo {
  id: number;
  account?: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface WordMaterial {
  sentence?: string;
  translation?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface WritingTopic {
  title: string;
  prompt: string;
  requirement: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  keyPoints?: string[];
  vocabularyHints?: string[];
  structureHints?: string[];
  scoringCriteria?: string[];
}

/** MyBatis-Plus 分页结果 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/** 阅读单词素材历史记录（后端 ReadingWordMaterialRecordVO） */
export interface WordMaterialRecord {
  id: number;
  success: boolean;
  word: string;
  languageCode: string;
  stageCode: string;
  sentence?: string;
  translation?: string;
  imagePrompt?: string;
  imageUrl?: string;
  provider?: string;
  modelName?: string;
  errorMessage?: string;
  createTime?: string;
}

/** 作文生成历史记录（后端 WritingCompositionGenerationRecordVO） */
export interface GenerationRecord {
  id: number;
  success: boolean;
  languageCode: string;
  stageCode: string;
  genreCode: string;
  difficultyCode: string;
  sceneCode?: string;
  customScene?: string;
  title?: string;
  prompt?: string;
  requirement?: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  keyPoints?: string[];
  vocabularyHints?: string[];
  structureHints?: string[];
  scoringCriteria?: string[];
  provider?: string;
  modelName?: string;
  errorMessage?: string;
  createTime?: string;
}

/** 作文批阅历史记录（后端 WritingCompositionEvaluationRecordVO） */
export interface EvaluationRecord {
  id: number;
  success: boolean;
  generationId?: number;
  submitType?: string;
  languageCode?: string;
  stageCode?: string;
  genreCode?: string;
  title?: string;
  prompt?: string;
  scoringCriteria?: string;
  content?: string;
  imageUrls?: string[];
  ocrText?: string;
  score?: number;
  feedback?: string;
  suggestion?: string;
  highlights?: string[];
  improvementPoints?: string[];
  sentenceFeedback?: SentenceFeedback[];
  improvedVersion?: string;
  provider?: string;
  modelName?: string;
  errorMessage?: string;
  createTime?: string;
}

export interface SentenceFeedback {
  index?: number;
  original?: string;
  feedback?: string;
  suggestion?: string;
}

export interface ReviewResult {
  score: number;
  feedback?: string;
  suggestion?: string;
  highlights?: string[];
  improvementPoints?: string[];
  sentenceFeedback?: SentenceFeedback[];
  improvedVersion?: string;
}

// ============ 接口封装 ============

export const api = {
  // ---- 登录（三种方式，与平台端一致，均走 /sys/user/login，靠字段区分）----
  login: (keyword: string, password: string) =>
    request<{ token: string }>('/sys/user/login', {
      method: 'POST',
      body: JSON.stringify({ keyword, password }),
    }),

  loginByPhone: (phone: string, captcha: string) =>
    request<{ token: string }>('/sys/user/login', {
      method: 'POST',
      body: JSON.stringify({ phone, captcha }),
    }),

  loginByEmail: (email: string, captcha: string) =>
    request<{ token: string }>('/sys/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, captcha }),
    }),

  /** 注册：账号 5-12 位数字，密码 6-26 位；成功后直接返回 token */
  register: (data: {
    account: string;
    username: string;
    password: string;
    phone?: string;
    email?: string;
    smsCaptcha?: string;
    emailCaptcha?: string;
  }) =>
    request<{ token: string }>('/sys/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendSmsCode: (phone: string) =>
    request<void>(`/sys/user/sms/send?phone=${encodeURIComponent(phone)}`, { method: 'POST' }),

  sendEmailCode: (email: string) =>
    request<void>(`/sys/user/email/send?email=${encodeURIComponent(email)}`, { method: 'POST' }),

  resetPassword: (data: { phone?: string; email?: string; captcha: string; newPassword: string }) =>
    request<void>('/sys/user/reset-password', { method: 'PUT', body: JSON.stringify(data) }),

  updateProfile: (data: {
    username?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    password?: string;
    smsCaptcha?: string;
    emailCaptcha?: string;
  }) => request<void>('/sys/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

  userInfo: () => request<UserInfo>('/sys/user/info'),

  listProviders: (type: 'ASR' | 'LLM') =>
    request<Provider[]>(`/sys/user/ai/${type.toLowerCase()}/providers`),

  listModels: (type: 'ASR' | 'LLM', provider: string) =>
    request<ModelInfo[]>(`/sys/user/ai/${type.toLowerCase()}/models?provider=${encodeURIComponent(provider)}`),

  listPreferences: () => request<Preference[]>('/sys/user/model-preference'),

  savePreference: (modelType: 'ASR' | 'LLM', provider: string, modelName: string) =>
    request<void>('/sys/user/model-preference', {
      method: 'PUT',
      body: JSON.stringify({ modelType, provider, modelName }),
    }),

  generateWordMaterial: (word: string, languageCode: string, stageCode: string) =>
    request<WordMaterial>('/reading/word/material/generate', {
      method: 'POST',
      body: JSON.stringify({ word, languageCode, stageCode }),
    }),

  generateWritingTopic: (payload: Record<string, unknown>) =>
    request<WritingTopic>('/writing/composition/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  evaluateWriting: (payload: Record<string, unknown>) =>
    request<ReviewResult>('/writing/composition/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ---- 历史记录（后端已提供分页接口，枚举以小写 code 传输）----

  pageWordHistory: (page = 1, size = 10, filter?: Record<string, unknown>) =>
    request<PageResult<WordMaterialRecord>>('/reading/word/material/history/page', {
      method: 'POST',
      body: JSON.stringify({ page, size, filter }),
    }),

  pageGenerationHistory: (page = 1, size = 10, filter?: Record<string, unknown>) =>
    request<PageResult<GenerationRecord>>('/writing/composition/generation/history/page', {
      method: 'POST',
      body: JSON.stringify({ page, size, filter }),
    }),

  pageEvaluationHistory: (page = 1, size = 10, filter?: Record<string, unknown>) =>
    request<PageResult<EvaluationRecord>>('/writing/composition/evaluation/history/page', {
      method: 'POST',
      body: JSON.stringify({ page, size, filter }),
    }),
};
