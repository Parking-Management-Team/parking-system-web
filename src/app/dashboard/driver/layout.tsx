'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

/**
 * Driver Layout - Bố cục giao diện chung cho Driver Portal
 * 
 * 1. Bảo vệ toàn bộ các trang con bằng ProtectedRoute (chỉ cho phép DRIVER truy cập).
 * 2. Tích hợp Sidebar điều hướng bên trái và Header ở bên phải.
 * 3. Chừa vùng nội dung chính ở bên phải cho các chức năng dành cho tài xế.
 */
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['DRIVER']}>
      <div className="min-h-screen bg-[#f8f9ff] flex text-slate-800 antialiased">
        {/* Sidebar điều hướng thống nhất cho Driver */}
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
