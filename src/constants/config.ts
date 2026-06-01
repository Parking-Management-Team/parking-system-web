/**
 * App Config - Cấu hình chung của ứng dụng NexPark
 *
 * Chứa các hằng số cấu hình cho:
 * - Tên app, URL API, URL app
 * - Cài đặt API (timeout, retry)
 * - Quy tắc booking (giờ tối thiểu/tối đa, grace period)
 *
 * Lưu ý: Các giá trị có thể ghi đè bằng biến môi trường (.env)
 *   NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_APP_URL
 */

// ─── App Config ───────────────────────────────────────────────────
export const APP_CONFIG = {
  name:        process.env.NEXT_PUBLIC_APP_NAME ?? 'NexPark',
  apiBaseUrl:  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  appUrl:      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  // API settings
  requestTimeout: 10_000, // ms
  retryAttempts:  2,

  // Booking rules
  bookingMinHours:    1,
  bookingMaxHours:    8,
  noShowGracePeriod:  45, // minutes
  gracePeriodMinutes: 15, // rounding grace
} as const;
