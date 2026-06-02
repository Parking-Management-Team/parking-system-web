/**
 * Login Page - Trang đăng nhập
 *
 * URL: /login
 *
 * Trang này rất đơn giản vì component LoginForm đã được tách ra
 * thư mục features/auth/. Trang chỉ việc import và render.
 *
 * Tại sao tách? Để có thể dùng LoginForm ở nhiều nơi (drawer, trang riêng...)
 * mà không viết lại code.
 */

import { LoginForm } from '@/features/auth';

// SEO metadata - hiển thị trên tab trình duyệt và Google
export const metadata = {
  title: 'Sign In - NexPark Smart Parking',
  description: 'Log in to your NexPark account to manage enterprise smart parking logistics and slots.',
};

export default function LoginPage() {
  return <LoginForm />;  // Render component LoginForm từ features/auth
}
