/**
 * API Client - HTTP client wrapper cho API calls
 *
 * Wrapper fetch API với các tính năng:
 * - Tự động thêm base URL (APP_CONFIG.apiBaseUrl)
 * - Timeout (APP_CONFIG.requestTimeout = 10s)
 * - Xử lý lỗi tự động (throw ApiError)
 * - Helper methods: api.get, api.post, api.put, api.delete
 *
 * @example
 * // GET request
 * const users = await api.get<User[]>('/users')
 *
 * // POST request
 * const result = await api.post<User>('/users', { name: 'John' })
 */

import { APP_CONFIG } from '@/constants/config';

// ─── Error class ───────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
    message = `API error ${status}`
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Lấy token từ localStorage ────────────────────────────────────
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexpark_token');
}

// ─── Xử lý lỗi 401 - tự động logout ──────────────────────────────
function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nexpark_token');
  localStorage.removeItem('nexpark_user');
  window.location.href = '/login';
}

// ─── Base fetch wrapper ────────────────────────────────────────────
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    APP_CONFIG.requestTimeout
  );

  // Tự động gắn JWT token vào header nếu có
  const token = getAuthToken();

  try {
    const res = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);

      // Xử lý 401 - token hết hạn hoặc không hợp lệ
      if (res.status === 401) {
        handleUnauthorized();
      }

      throw new ApiError(res.status, data);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * HTTP Helper Methods
 *
 * Shortcut cho các method HTTP thường dùng.
 * Tự động stringify body và set Content-Type: application/json.
 */
export const api = {
  get:    <T>(url: string, opts?: RequestInit) =>
    apiClient<T>(url, { method: 'GET', ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestInit) =>
    apiClient<T>(url, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestInit) =>
    apiClient<T>(url, { method: 'PUT',  body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestInit) =>
    apiClient<T>(url, { method: 'DELETE', ...opts }),
};
