'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';

/**
 * Dashboard Redirect Page - Trang điều hướng Dashboard trung tâm
 * 
 * Khi người dùng truy cập /dashboard, trang này sẽ kiểm tra vai trò (role)
 * của họ và điều hướng đến Dashboard phù hợp (ví dụ: Manager -> /dashboard/manager/facilities).
 */
export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Chờ tải thông tin xác thực xong
    if (isLoading) return;

    if (!user) {
      // Chưa đăng nhập -> quay về trang chủ
      router.replace('/');
    } else if (user.role === 'MANAGER') {
      // Vai trò Manager -> điều hướng đến trang dashboard tổng
      router.replace('/dashboard/manager');
    } else if (user.role === 'STAFF') {
      // Vai trò Staff -> điều hướng đến staff portal
      router.replace('/dashboard/staff');
    } else {
      // Các vai trò khác (Admin) -> tạm thời quay về trang chủ hoặc trang tương ứng
      router.replace('/');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner quay đều sang xịn mịn */}
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Đang chuyển hướng đến cổng quản trị...</p>
      </div>
    </div>
  );
}
