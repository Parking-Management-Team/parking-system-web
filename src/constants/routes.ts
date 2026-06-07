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
  HOME: '/',
  BOOKING: '/booking',
  PRICING: '/pricing',
  PARKING_MAP: '/parking-map',
  MONTHLY_CARD: '/monthly-card',

  // Dashboard (staff/manager)
  DASHBOARD: '/dashboard',
  MANAGER_FACILITIES: '/dashboard/manager/facilities',       // Trang quản lý cơ sở (Facility Management)
  MANAGER_EDIT_FACILITY: '/dashboard/manager/facilities/edit',  // Trang chỉnh sửa thông tin cơ sở
  MANAGER_ALLOCATE: '/dashboard/manager/allocate',            // Trang cấp phát slot đỗ xe
  MANAGER_VEHICLES: '/dashboard/manager/vehicles',            // Trang chi tiết phương tiện
  
  // Staff Routes
  STAFF_DASHBOARD: '/dashboard/staff',
  STAFF_CHECKIN: '/dashboard/staff/check-in',
  STAFF_CHECKOUT: '/dashboard/staff/check-out',
  STAFF_MONITORING: '/dashboard/staff/monitoring',
  STAFF_INCIDENT: '/dashboard/staff/incident',
  STAFF_REPORTS: '/dashboard/staff/reports',

  CHECKIN: '/checkin',
  CHECKOUT: '/checkout',
  SESSIONS: '/sessions',
  REPORTS: '/reports',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
