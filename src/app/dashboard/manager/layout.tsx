'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

/**
 * Manager Layout - Bố cục giao diện chung cho Manager Portal
 * 
 * 1. Bảo vệ toàn bộ các trang con bằng ProtectedRoute (chỉ cho phép MANAGER truy cập).
 * 2. Tích hợp Sidebar thống nhất ở bên trái và Header ở bên phải.
 * 3. Chừa vùng nội dung chính ở bên phải cho các trang quản lý.
 */
export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <div className="min-h-screen bg-[#f8f9ff] flex text-slate-800 antialiased">
        {/* Sidebar điều hướng thống nhất */}
        <Sidebar />

        {/* Vùng nội dung chính bên phải */}
        <div className="flex-1 pl-[260px] min-h-screen flex flex-col transition-all duration-200">
          <Header />
          <main className="flex-grow w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
