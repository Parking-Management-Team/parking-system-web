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
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'NexPark',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  // Google Client ID dùng cho đăng nhập Google OAuth
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '768808098768-vop4tnm5u22h8stb6464bqtogse2rqvm.apps.googleusercontent.com',

  // API settings
  requestTimeout: 45_000, // ms (45s cho Render cold start & gửi OTP email)
  retryAttempts: 2,

  // Booking rules
  bookingMinHours: 1,
  bookingMaxHours: 8,
  noShowGracePeriod: 45, // minutes
  gracePeriodMinutes: 15, // rounding grace
} as const;
