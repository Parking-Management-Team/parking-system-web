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

  try {
    const res = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
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
