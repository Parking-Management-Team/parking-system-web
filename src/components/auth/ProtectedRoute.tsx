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

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  React.useEffect(() => {
    // Đợi AuthContext khôi phục session xong
    if (isLoading) return;

    // Chưa đăng nhập → redirect về login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

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

  // Sai vai trò → Hiển thị trang báo lỗi 403 Access Denied sử dụng component ErrorView dùng chung
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <ErrorView
        statusCode="403"
        title="Access Denied"
        description={`You do not have permission to view this page. You are currently logged in as ${user.fullName} with the role ${user.role}.`}
        customActions={
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button 
              onClick={() => {
                if (user.role === 'MANAGER') {
                  router.push('/dashboard/manager/facilities');
                } else {
                  router.push('/');
                }
              }}
              className="w-full sm:w-auto bg-[#006d43] hover:bg-[#005232] text-white font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] min-w-[160px]"
            >
              <Home className="w-5 h-5" />
              <span>Go to Home</span>
            </button>
            <button 
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full sm:w-auto bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] min-w-[160px]"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout & Switch</span>
            </button>
          </div>
        }
      />
    );
  }

  // Hợp lệ → render children
  return <>{children}</>;
}
