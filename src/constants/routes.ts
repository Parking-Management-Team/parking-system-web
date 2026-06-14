/**
 * Route Constants - Đường dẫn URL của ứng dụng được tổ chức theo cấu trúc Feature-Based
 *
 * Tập trung quản lý tất cả đường dẫn URL tại 1 nơi.
 * Nếu muốn đổi URL, chỉ cần sửa ở đây thay vì tìm khắp code.
 */

// ─── Route constants organized by features ─────────────────────────
export const ROUTES = {
  // Public Routes (Trang công khai)
  PUBLIC: {
    HOME: '/',
    BOOKING: '/booking',
    PRICING: '/pricing',
    PARKING_MAP: '/parking-map',
    MONTHLY_CARD: '/monthly-card',
  },

  // Auth Routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },

  // General Dashboard Route
  DASHBOARD: '/dashboard',

  // Feature: Facilities (Quản lý cơ sở vật chất, tòa nhà, tầng, phân khu)
  FACILITIES: {
    ROOT: '/dashboard/manager/facilities',
    NEW: '/dashboard/manager/facilities/new',
    EDIT: '/dashboard/manager/facilities/edit',
    ALLOCATE: '/dashboard/manager/allocate-slot', // Đường dẫn cấp phát slot đỗ xe
    
    // Dynamic Sub-routes for specific building details
    DETAILS: (id: string | number) => `/dashboard/manager/facilities/${id}` as const,
    ACCESS: (id: string | number) => `/dashboard/manager/facilities/${id}/access` as const,
    FLOORS: (id: string | number) => `/dashboard/manager/facilities/${id}/floors` as const,
  },

  // Feature: Vehicles (Theo dõi phương tiện, vé đỗ xe)
  VEHICLES: {
    ROOT: '/dashboard/manager/vehicles',
  },

  // Feature: Pricing (Quản lý biểu phí, dịch vụ và tiền phạt)
  PRICING: {
    ROOT: '/dashboard/manager/pricing',
  },

  // Feature: Staff Operations (Chức năng dành cho nhân viên bãi xe)
  STAFF: {
    DASHBOARD: '/dashboard/staff',
    CHECKIN: '/dashboard/staff/check-in',
    CHECKOUT: '/dashboard/staff/check-out',
    MONITORING: '/dashboard/staff/monitoring',
    INCIDENT: '/dashboard/staff/incident',
    REPORTS: '/dashboard/staff/reports',
  },

  // Feature: System Administration (Chức năng của quản trị viên)
  ADMIN: {
    DASHBOARD: '/dashboard/admin',
    USERS: '/dashboard/admin/users',
    ROLES: '/dashboard/admin/roles',
    ANALYTICS: '/dashboard/admin/analytics',
    DEVICES: '/dashboard/admin/devices',
    SETTINGS: '/dashboard/admin/settings',
  },
} as const;

export type AppRoute = string;
