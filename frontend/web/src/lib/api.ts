// 通用 API 请求工具：自动带 token、解 BaseResult(code/message/data) 包裹。
// 后端统一返回 BaseResult<T> = { code, message, detail, data }。
export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

/** 后端 origin（去掉 /api 后缀），用于拼接 WebSocket 地址 */
export const APP_ORIGIN = API_BASE.startsWith('http')
  ? API_BASE.replace(/\/api$/, '')
  : window.location.origin;

const SERVICE_UNAVAILABLE_MESSAGE = '系统暂时无法响应，请稍后再试';

export function getToken(): string {
  return localStorage.getItem('token') || '';
}

function clearAuthState() {
  localStorage.removeItem('token');
  window.dispatchEvent(new CustomEvent('auth-token-invalid'));
}

type ApiRequestInit = RequestInit & {
  skipAuth?: boolean;
};

function parseResponseJson(res: Response) {
  return res.json().catch(() => ({}));
}

export async function apiCall<T = unknown>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const token = getToken();
  const { skipAuth, ...requestOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(requestOptions.headers as Record<string, string> | undefined),
  };
  if (!skipAuth && token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...requestOptions, headers });
  } catch {
    throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  }
  const json = await parseResponseJson(res);
  if (res.status === 401) {
    clearAuthState();
  }
  if (!res.ok) {
    throw new Error(json?.detail || json?.message || SERVICE_UNAVAILABLE_MESSAGE);
  }
  if (json && typeof json === 'object' && 'code' in json && json.code !== 200) {
    throw new Error(json.detail || json.message || SERVICE_UNAVAILABLE_MESSAGE);
  }
  return (json?.data ?? json) as T;
}

export async function uploadFile<T = unknown>(file: File): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/common/file/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
  } catch {
    throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  }
  const json = await parseResponseJson(res);
  if (res.status === 401) {
    clearAuthState();
  }
  if (!res.ok) {
    throw new Error(json?.detail || json?.message || SERVICE_UNAVAILABLE_MESSAGE);
  }
  if (json && typeof json === 'object' && 'code' in json && json.code !== 200) {
    throw new Error(json.detail || json.message || SERVICE_UNAVAILABLE_MESSAGE);
  }
  return (json?.data ?? json) as T;
}
