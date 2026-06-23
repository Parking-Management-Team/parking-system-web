/**
 * Navigation Config - Cấu hình Menu Điều hướng của hệ thống
 *
 * Quản lý tập trung các liên kết sidebar cho từng vai trò người dùng (MANAGER, STAFF, ADMIN).
 * Dữ liệu này giúp Sidebar tự động hiển thị đúng chức năng sau khi đăng nhập.
 */

// Định nghĩa kiểu dữ liệu cho một phần tử menu
export interface NavigationItem {
  label: string;          // Nhãn hiển thị trên UI
  href: string;           // Đường dẫn liên kết URL
  icon: string;           // Tên icon Material Symbols Outlined
  isFooter?: boolean;     // Có hiển thị dưới góc chân trang không (ví dụ: Settings, Support)
}

// Cấu hình menu riêng biệt cho từng vai trò
export const ROLE_NAVIGATION: Record<string, NavigationItem[]> = {
  MANAGER: [
    // Menu chính của Manager
    {
      label: 'Dashboard',
      href: '/dashboard/manager',
      icon: 'dashboard',
    },
    {
      label: 'Facility Management',
      href: '/dashboard/manager/facilities',
      icon: 'location_city',
    },
    {
      label: 'Slot Management',
      href: '/dashboard/manager/allocate-slot',
      icon: 'local_parking',
    },
    {
      label: 'Pricing Management',
      href: '/dashboard/manager/pricing',
      icon: 'payments',
    },
    {
      label: 'Incident Tracking',
      href: '/dashboard/manager/incidents',
      icon: 'report_problem',
    },
    // Các menu chân trang (Footer items)
    {
      label: 'My Profile',
      href: '/dashboard/profile',
      icon: 'person',
      isFooter: true,
    },
    {
      label: 'Support',
      href: '#',
      icon: 'help',
      isFooter: true,
    },
  ],
  STAFF: [
    {
      label: 'Dashboard Overview',
      href: '/dashboard/staff',
      icon: 'dashboard',
    },
    {
      label: 'Vehicle Check-in',
      href: '/dashboard/staff/check-in',
      icon: 'login',
    },
    {
      label: 'Vehicle Check-out',
      href: '/dashboard/staff/check-out',
      icon: 'logout',
    },
    {
      label: 'Slot Monitoring',
      href: '/dashboard/staff/monitoring',
      icon: 'sensors',
    },
    {
      label: 'Incident Handling',
      href: '/dashboard/staff/incident',
      icon: 'report_problem',
    },
    {
      label: 'Shift Reports',
      href: '/dashboard/staff/reports',
      icon: 'assignment',
    },
    {
      label: 'My Profile',
      href: '/dashboard/profile',
      icon: 'person',
      isFooter: true,
    },
    {
      label: 'Support',
      href: '#',
      icon: 'help',
      isFooter: true,
    },
    {
      label: "Card Management",
      href: "/dashboard/staff/cards",
      icon: "credit_card",
    }
  ],
  ADMIN: [
    {
      label: 'Admin Dashboard',
      href: '/dashboard/admin',
      icon: 'dashboard',
    },
    {
      label: 'User Management',
      href: '/dashboard/admin/users',
      icon: 'group',
    },
    {
      label: 'Facility Management',
      href: '/dashboard/admin/facilities',
      icon: 'location_city',
    },
    {
      label: 'Incident Tracking',
      href: '/dashboard/admin/incidents',
      icon: 'report_problem',
    },
    {
      label: 'Role & Permission',
      href: '/dashboard/admin/roles',
      icon: 'security',
    },
    {
      label: 'Parking Analytics',
      href: '/dashboard/admin/analytics',
      icon: 'analytics',
    },
    {
      label: 'Device Monitoring',
      href: '/dashboard/admin/devices',
      icon: 'router',
    },
    {
      label: 'System Settings',
      href: '/dashboard/admin/settings',
      icon: 'settings',
    },
    {
      label: 'My Profile',
      href: '/dashboard/profile',
      icon: 'person',
      isFooter: true,
    },
    {
      label: 'Support',
      href: '#',
      icon: 'help',
      isFooter: true,
    },
  ],
  DRIVER: [
    {
      label: 'Dashboard',
      href: '/dashboard/driver',
      icon: 'grid_view',
    },
    {
      label: 'Parking Booking',
      href: '/dashboard/driver/booking',
      icon: 'calendar_month',
    },
    {
      label: 'Parking Session',
      href: '/dashboard/driver/sessions',
      icon: 'timer',
    },
    {
      label: 'Payment',
      href: '/dashboard/driver/payments',
      icon: 'account_balance_wallet',
    },
    {
      label: 'Payment History',
      href: '/dashboard/driver/payment-history',
      icon: 'receipt_long',
    },
    {
      label: 'Parking History',
      href: '/dashboard/driver/parking-history',
      icon: 'history',
    },
    {
      label: 'My Vehicles',
      href: '/dashboard/driver/vehicles',
      icon: 'directions_car',
    },
    {
      label: 'Feedback & Reports',
      href: '/dashboard/driver/reports',
      icon: 'chat_bubble',
    },
    {
      label: 'Help Center',
      href: '/dashboard/driver/help',
      icon: 'help',
    },
    {
      label: 'My Profile',
      href: '/dashboard/profile',
      icon: 'person',
      isFooter: true,
    },
  ],
};

