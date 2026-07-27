'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { ROLE_NAVIGATION } from '@/config/navigation';
import { useSidebar } from '@/components/layout/SidebarContext';
import LogoutConfirmModal from '@/components/auth/LogoutConfirmModal';

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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

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
    <nav className={`fixed left-0 top-0 h-full z-50 bg-[#1B2A41] border-r border-white/5 flex flex-col py-6 transition-all duration-200 ease-in-out ${
      isCollapsed ? 'w-[80px]' : 'w-[260px]'
    }`}>
      {/* Brand Logo & Header */}
      <div className={`pb-8 flex ${
        isCollapsed ? 'flex-col items-center gap-4 px-2' : 'items-center justify-between px-6'
      }`}>
        {!isCollapsed ? (
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-2xl tracking-wider hover:text-emerald-400 transition-colors">
              NexPark
            </h1>
            <p className="text-emerald-400 font-medium text-xs mt-1">
              {userRole === 'MANAGER' ? 'Manager Portal' : 'Enterprise Portal'}
            </p>
          </div>
        ) : (
          <h1 className="text-white font-black text-lg tracking-wider bg-black border border-white/10 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg">
            NP
          </h1>
        )}
        
        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white transition-colors flex items-center justify-center p-2 rounded-xl hover:bg-white/5"
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <span className="material-symbols-outlined text-xl">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      {/* Danh sách Menu chính (Main items) */}
      <div className={`flex-1 overflow-y-auto space-y-1.5 scrollbar-thin ${
        isCollapsed ? 'px-2' : 'px-3'
      }`}>
        {mainItems.map((item, index) => {
          // Kiểm tra xem đường dẫn hiện tại có khớp với menu này không để tô màu Active
          const isActive = pathname === item.href;

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center rounded-xl transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-0 w-12 h-12 mx-auto' : 'gap-3 py-3 px-4'
              } ${
                isActive
                  ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Danh sách Menu chân trang (Footer items & Đăng xuất) */}
      <div className={`pt-4 border-t border-white/10 mt-auto space-y-1.5 ${
        isCollapsed ? 'px-2' : 'px-3'
      }`}>
        {footerItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center rounded-xl transition-all duration-200 ${
                isCollapsed ? 'justify-center py-2.5 px-0 w-12 h-12 mx-auto' : 'gap-3 py-2.5 px-4'
              } ${
                isActive
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {/* Nút đăng xuất luôn hiển thị ở dưới cùng */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center rounded-xl transition-all duration-200 mt-2 font-medium cursor-pointer ${
            isCollapsed ? 'justify-center py-2.5 px-0 w-12 h-12 mx-auto' : 'w-full gap-3 py-2.5 px-4'
          } text-slate-400 hover:text-red-400 hover:bg-red-500/10`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
}
