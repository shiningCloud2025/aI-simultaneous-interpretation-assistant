// 通用 API 请求工具：自动带 token、解 BaseResult(code/message/data) 包裹。
// 后端统一返回 BaseResult<T> = { code, message, detail, data }。
const API_BASE = '/api';

export async function apiCall<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token') || '';
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
