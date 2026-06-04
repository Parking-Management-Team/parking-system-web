/**
 * Auth Feature - Public API (Cổng xuất công khai)
 *
 * Đây là "cửa ngõ" của feature auth. Các feature khác chỉ import từ file này,
 * KHÔNG import trực tiếp từ bên trong auth/ (để dễ quản lý và refactor).
 *
 * Export:
 * - LoginForm: Component form đăng nhập
 * - RegisterForm: Component form đăng ký
 * - AuthDrawer: Drawer toàn màn hình chứa login/register
 * - AuthProvider: Context provider cung cấp thông tin đăng nhập
 * - useAuth: Hook để truy cập thông tin user, login, logout
 * - User: Kiểu dữ liệu user
 *
 * @example
 * import { useAuth, AuthDrawer, LoginForm } from '@/features/auth'
 */

// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { AuthDrawer } from './components/AuthDrawer';
export { AuthLoadingScreen } from './components/AuthLoadingScreen';

// Context & Hooks
export { AuthProvider, useAuth } from './context/AuthContext';

// Types
export type { User } from './context/AuthContext';
