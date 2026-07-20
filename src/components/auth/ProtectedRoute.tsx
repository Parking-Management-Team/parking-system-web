/**
 * ProtectedRoute - Component bảo vệ trang yêu cầu đăng nhập
 *
 * Kiểm tra token trong localStorage trước khi cho phép render children.
 * Nếu không có token → redirect về /login.
 * Nếu có allowedRoles → kiểm tra user.role có nằm trong danh sách không.
 *
 * Cách dùng:
 * // Bảo vệ trang - yêu cầu đăng nhập
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * // Bảo vệ trang - chỉ cho ADMIN và MANAGER
 * <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
 *   <ReportsPage />
 * </ProtectedRoute>
 *
 * @param children - Nội dung trang cần bảo vệ
 * @param allowedRoles - Danh sách role được phép truy cập (nếu không set → mọi role đều được)
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { ErrorView } from '@/components/ui';
import { Home, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    // Đợi AuthContext khôi phục session xong
    if (isLoading) return;

    // Chưa đăng nhập → redirect về login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Đang loading → hiển thị spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → không render gì (đang redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Hợp lệ → render children (quyền truy cập API chi tiết được kiểm tra Dynamic tại Server/Backend)
  return <>{children}</>;
}
