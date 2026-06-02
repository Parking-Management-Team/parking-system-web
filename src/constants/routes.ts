/**
 * Route Constants - Đường dẫn URL của ứng dụng
 *
 * Tập trung quản lý tất cả đường dẫn URL tại 1 nơi.
 * Nếu muốn đổi URL, chỉ cần sửa ở đây thay vì tìm khắp code.
 *
 * Phân loại:
 * - Public: Trang công khai (ai cũng truy cập được)
 * - Dashboard: Trang quản lý (chỉ staff/manager)
 */

// ─── Route constants ─────────────────────────────────────────────
export const ROUTES = {
  // Public
  HOME:          '/',
  BOOKING:       '/booking',
  PRICING:       '/pricing',
  PARKING_MAP:   '/parking-map',
  MONTHLY_CARD:  '/monthly-card',

  // Dashboard (staff/manager)
  DASHBOARD:     '/dashboard',
  CHECKIN:       '/checkin',
  CHECKOUT:      '/checkout',
  SESSIONS:      '/sessions',
  REPORTS:       '/reports',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
