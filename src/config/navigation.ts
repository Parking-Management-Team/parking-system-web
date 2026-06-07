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
      label: 'Vehicle Details',
      href: '/dashboard/manager/vehicles',
      icon: 'directions_car',
    },
    // Các menu chân trang (Footer items)
    {
      label: 'Support',
      href: '#',
      icon: 'help',
      isFooter: true,
    },
    {
      label: 'Settings',
      href: '#',
      icon: 'settings',
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
      label: 'Support',
      href: '#',
      icon: 'help',
      isFooter: true,
    },
    {
      label: 'Settings',
      href: '#',
      icon: 'settings',
      isFooter: true,
    },
  ],
  ADMIN: [
    // Menu chính của Admin (Ví dụ mẫu cho tương lai)
    {
      label: 'System Overview',
      href: '/dashboard/admin/overview',
      icon: 'admin_panel_settings',
    },
    {
      label: 'User Management',
      href: '/dashboard/admin/users',
      icon: 'group',
    },
    {
      label: 'Settings',
      href: '#',
      icon: 'settings',
      isFooter: true,
    },
  ],
};
