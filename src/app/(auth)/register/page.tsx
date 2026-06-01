/**
 * Register Page - Trang đăng ký tài khoản
 *
 * URL: /register
 *
 * Tương tự trang login, component RegisterForm đã được tách ra
 * thư mục features/auth/. Trang chỉ việc import và render.
 */

import { RegisterForm } from '@/features/auth';

// SEO metadata - hiển thị trên tab trình duyệt và Google
export const metadata = {
  title: 'Create Account - NexPark Smart Parking',
  description: 'Join NexPark to streamline your smart-parking logistics operations and dedicated slots.',
};

export default function RegisterPage() {
  return <RegisterForm />;  // Render component RegisterForm từ features/auth
}
