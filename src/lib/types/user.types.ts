/**
 * User Types - Kiểu dữ liệu người dùng
 *
 * Phân quyền: ADMIN > MANAGER > STAFF > DRIVER
 *
 * - ADMIN: Quản trị hệ thống
 * - MANAGER: Quản lý bãi đỗ
 * - STAFF: Nhân viên (check-in/check-out)
 * - DRIVER: Tài xế (người dùng thường)
 */

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'DRIVER';
  email?: string | null;
}
