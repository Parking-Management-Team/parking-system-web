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
import { ShieldAlert, Home, LogOut } from 'lucide-react';

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

  // Sai vai trò → Hiển thị trang báo lỗi 403 Access Denied đồng bộ với thiết kế của hệ thống
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-12">
        {/* Background radial grid trang trí */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none">
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundImage: 'radial-gradient(#006d43 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }}
          />
        </div>

        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-red-100 rounded-full blur-[100px] opacity-30 pointer-events-none" />

        {/* Khung nội dung chính */}
        <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <ShieldAlert className="text-red-600 w-8 h-8" />
            </div>
          </div>

          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-[#111c2d] mb-3">
            Access Denied
          </h2>
          
          <p className="font-sans text-[#3d4a41] text-sm md:text-base leading-relaxed mb-8">
            You do not have permission to view this page. You are currently logged in as <strong className="text-[#111c2d]">{user.fullName}</strong> with the role <strong className="text-[#006d43]">{user.role}</strong>.
          </p>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <button 
              onClick={() => {
                if (user.role === 'MANAGER') {
                  router.push('/dashboard/manager/facilities');
                } else {
                  router.push('/');
                }
              }}
              className="w-full bg-[#006d43] hover:bg-[#005232] text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
            <button 
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout & Switch</span>
            </button>
          </div>

          <div className="mt-12 font-mono text-xs text-[#505f79]/60">
            Error Code: 403 Forbidden
          </div>
        </div>
      </div>
    );
  }

  // Hợp lệ → render children
  return <>{children}</>;
}
