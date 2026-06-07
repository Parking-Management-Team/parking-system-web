'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';

/**
 * Staff Layout - Bố cục giao diện chung cho Staff Portal
 * 
 * 1. Bảo vệ toàn bộ các trang con bằng ProtectedRoute (chỉ cho phép STAFF truy cập).
 * 2. Tích hợp Sidebar thống nhất ở bên trái.
 * 3. Chừa vùng nội dung chính ở bên phải cho các trang nghiệp vụ vận hành bãi xe.
 */
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['STAFF']}>
      <div className="min-h-screen bg-[#f8f9ff] flex text-slate-800 antialiased">
        {/* Sidebar điều hướng thống nhất */}
        <Sidebar />

        {/* Vùng nội dung chính bên phải */}
        <div className="flex-1 pl-[260px] min-h-screen flex flex-col transition-all duration-200">
          <main className="flex-grow w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
