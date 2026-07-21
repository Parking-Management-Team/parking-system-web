import { redirect } from 'next/navigation';

/**
 * Trang chủ Dashboard dành cho Quản trị viên (Admin Dashboard Route Page)
 *
 * Đường dẫn gốc: /dashboard/admin
 * Hành vi: Tự động chuyển hướng (redirect) người dùng tới trang Quản lý người dùng (/dashboard/admin/users)
 * làm trang mặc định khi truy cập vào bảng điều khiển Admin.
 */
export default function AdminDashboardPage() {
  redirect('/dashboard/admin/users');
}
