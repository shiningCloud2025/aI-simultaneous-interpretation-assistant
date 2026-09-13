// 通用 API 请求工具：自动带 token、解 BaseResult(code/message/data) 包裹。
// 后端统一返回 BaseResult<T> = { code, message, detail, data }。
export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

/** 后端 origin（去掉 /api 后缀），用于拼接 WebSocket 地址 */
export const APP_ORIGIN = API_BASE.startsWith('http')
  ? API_BASE.replace(/\/api$/, '')
  : window.location.origin;

export function getToken(): string {
  return localStorage.getItem('token') || '';
}

export async function apiCall<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (json && typeof json === 'object' && 'code' in json && json.code !== 200) {
    throw new Error(json.detail || json.message || `请求失败 (code=${json.code})`);
  }
  return (json?.data ?? json) as T;
}

export async function uploadFile<T = unknown>(file: File): Promise<T> {
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
    throw new Error(json.detail || json.message || `上传失败 (code=${json.code})`);
  }
  return (json?.data ?? json) as T;
}
