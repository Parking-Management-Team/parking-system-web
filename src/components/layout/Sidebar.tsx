'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { ROLE_NAVIGATION, NavigationItem } from '@/config/navigation';

/**
 * Sidebar Component - Thanh điều hướng bên trái toàn cục cho Dashboard
 * 
 * Tự động đồng nhất giao diện và cấu trúc cho các Role (Manager, Staff, Admin).
 * Lấy danh sách menu tương ứng từ `ROLE_NAVIGATION` dựa theo user.role hiện tại.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Xác định vai trò hiện tại (mặc định MANAGER nếu chưa xác định để an toàn hiển thị mockup)
  const userRole = user?.role || 'MANAGER';
  
  // Lấy danh sách menu của vai trò hiện tại
  const navigationItems = ROLE_NAVIGATION[userRole] || [];

  // Phân chia menu chính và menu chân trang (Footer items)
  const mainItems = navigationItems.filter(item => !item.isFooter);
  const footerItems = navigationItems.filter(item => item.isFooter);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] z-50 bg-[#1B2A41] border-r border-white/5 flex flex-col py-6 transition-all duration-200 ease-in-out">
      {/* Brand Logo & Header */}
      <div className="px-6 pb-8 flex items-center gap-4">
        {/* Logo NexPark nhỏ gọn, hiện đại */}
        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
          <span className="text-white font-bold text-lg tracking-wider">NP</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-semibold text-lg leading-tight tracking-tight">NexPark</h1>
          <p className="text-emerald-400 font-medium text-xs">
            {userRole === 'MANAGER' ? 'Manager Portal' : 'Enterprise Portal'}
          </p>
        </div>
      </div>

      {/* Danh sách Menu chính (Main items) */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
        {mainItems.map((item, index) => {
          // Kiểm tra xem đường dẫn hiện tại có khớp với menu này không để tô màu Active
          const isActive = pathname === item.href;

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Danh sách Menu chân trang (Footer items & Đăng xuất) */}
      <div className="px-3 pt-4 border-t border-white/10 mt-auto space-y-1.5">
        {footerItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Nút đăng xuất luôn hiển thị ở dưới cùng */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 py-2.5 px-4 rounded-xl transition-all duration-200 mt-2 font-medium"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </nav>
  );
}
