'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';

/**
 * Component Header Dashboard  - Thanh điều hướng trên cùng cho các trang đã đăng nhập.
 * 
 * Thiết kế dựa trên theme quản lý bãi đỗ xe NexPark: hiển thị đồng hồ thời gian thực kỹ thuật số,
 * thanh đường dẫn (breadcrumbs) động dựa trên URL hiện tại, và dropdown quản lý tài khoản góc trên bên phải.
 */
export default function Header() {
  // Sử dụng AuthContext để lấy thông tin người dùng hiện tại và hàm đăng xuất
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Các state để điều khiển việc đóng/mở dropdown và hiển thị đồng hồ thời gian thực
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState('00:00:00');
  const [currentDate, setCurrentDate] = React.useState('Loading date...');

  // Sử dụng ref để xác định vùng dropdown menu, hỗ trợ tính năng click ra ngoài để đóng
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Effect lắng nghe sự kiện click chuột bên ngoài để tự động đóng dropdown menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect thiết lập đồng hồ thời gian thực (Live Digital Clock) cập nhật mỗi 1 giây (1000ms)
  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Định dạng giờ theo kiểu 24 giờ (HH:mm:ss)
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      // Định dạng ngày đầy đủ (Thứ, ngày tháng năm) bằng tiếng Anh
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Xử lý khi người dùng nhấn nút Logout đăng xuất tài khoản
  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  // Tạo thanh breadcrumbs động dựa trên đường dẫn URL hiện tại (pathname)
  const breadcrumbs = React.useMemo(() => {
    // Giá trị breadcrumb mặc định nếu không phân tích được pathname
    const defaultBrumbs = [
      { label: 'Dashboard', href: '/dashboard/manager' },
      { label: 'Overview', href: '/dashboard/manager', isLast: true }
    ];

    if (!pathname) return defaultBrumbs;

    // Tách đường dẫn URL thành các phân đoạn và lọc bỏ các ký tự rỗng
    const segments = pathname.split('/').filter(Boolean);

    // Xử lý riêng biệt đối với trang thông tin cá nhân Profile
    if (segments.includes('profile')) {
      return [
        { label: 'User Settings', href: '/dashboard/profile' },
        { label: 'My Profile', href: '/dashboard/profile', isLast: true }
      ];
    }

    const roleSegment = segments[1]; // Ví dụ: "manager", "staff", "admin"
    const dashboardHome = `/dashboard/${roleSegment || 'manager'}`;

    // Nếu chỉ ở trang chủ dashboard tương ứng với role (độ dài URL <= 2)
    if (segments.length <= 2) {
      const roleLabels: Record<string, string> = {
        manager: 'Manager Portal',
        staff: 'Staff Portal',
        admin: 'Admin Portal'
      };
      return [
        { label: roleLabels[roleSegment] || 'Dashboard', href: dashboardHome },
        { label: 'Overview', href: dashboardHome, isLast: true }
      ];
    }

    const pageSegment = segments[2]; // Ví dụ: "facilities", "allocate-slot", "vehicles", "pricing", ...
    const basePath = `/dashboard/${roleSegment}/${pageSegment}`;

    // Bản đồ chuyển đổi từ URL segment sang tên hiển thị (Tiêu đề chính)
    const labelMap: Record<string, string> = {
      facilities: 'Facility Management',
      'allocate-slot': 'Slot Management',
      vehicles: 'Vehicle Details',
      pricing: 'Pricing Management',
      'check-in': 'Vehicle Check-in',
      'check-out': 'Vehicle Check-out',
      monitoring: 'Slot Monitoring',
      incident: 'Incident Handling',
      reports: 'Shift Reports',
      cards: 'Card Management',
      users: 'User Management',
      roles: 'Role & Permission',
      analytics: 'Parking Analytics',
      devices: 'Device Monitoring',
      settings: 'System Settings'
    };

    // Bản đồ chuyển đổi từ URL segment sang tên hiển thị (Tiêu đề phụ / phân nhánh đầu tiên)
    const subLabelMap: Record<string, string> = {
      facilities: 'Building Configuration',
      'allocate-slot': 'Slot Allocation',
      vehicles: 'Vehicle List',
      pricing: 'Pricing Workspace',
      'check-in': 'Check-in Workspace',
      'check-out': 'Check-out Workspace',
      monitoring: 'Monitoring Panel',
      incident: 'Incident Panel',
      reports: 'Shift Log',
      cards: 'Card Directory',
      users: 'System Users',
      roles: 'Roles & Permissions',
      analytics: 'Analytics Overview',
      devices: 'Device Status',
      settings: 'Configuration Panel'
    };

    const primaryLabel = labelMap[pageSegment] || pageSegment.charAt(0).toUpperCase() + pageSegment.slice(1);
    const secondaryLabel = subLabelMap[pageSegment] || 'Overview';

    const crumbs: Array<{ label: string; href: string; isLast?: boolean }> = [
      { label: primaryLabel, href: basePath }
    ];

    // Tạo các cấp điều hướng sâu hơn nếu URL dài hơn (ví dụ: chi tiết tòa nhà, thêm mới tòa nhà, quản lý tầng,...)
    if (segments.length === 3) {
      crumbs.push({ label: secondaryLabel, href: basePath, isLast: true });
    } else if (segments.length > 3) {
      crumbs.push({ label: secondaryLabel, href: basePath });

      const lastSegment = segments[segments.length - 1];
      if (lastSegment === 'new') {
        crumbs.push({ label: 'Add New Building', href: pathname, isLast: true });
      } else if (segments.includes('floors')) {
        crumbs.push({ label: 'Floor Management', href: pathname, isLast: true });
      } else if (segments.includes('access')) {
        crumbs.push({ label: 'Access Control', href: pathname, isLast: true });
      } else {
        crumbs.push({ label: 'Details', href: pathname, isLast: true });
      }
    }

    return crumbs;
  }, [pathname]);

  // Hàm tạo chữ cái viết tắt đại diện cho avatar từ Tên hiển thị (fullName)
  const initials = React.useMemo(() => {
    const name = user?.fullName || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  // Định dạng hiển thị vai trò (Role) của người dùng ở góc phải
  const userRoleDisplay = React.useMemo(() => {
    if (!user?.role) return 'Manager';
    const role = user.role.toUpperCase();
    if (role === 'MANAGER') return 'Manager';
    if (role === 'STAFF') return 'Staff';
    if (role === 'ADMIN') return 'Administrator';
    return role;
  }, [user]);

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-white sticky top-0 z-40 border-b border-[#d8e3fb] backdrop-blur-md bg-white/90 shadow-sm">
      {/* Vùng bên trái: Hệ thống đường dẫn Breadcrumbs động */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="material-symbols-outlined text-[16px] text-slate-400 select-none">
                  chevron_right
                </span>
              )}
              {crumb.isLast ? (
                <h1 className="font-bold text-slate-800">{crumb.label}</h1>
              ) : (
                <Link href={crumb.href} className="hover:text-emerald-600 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Vùng bên phải: Đồng hồ, Nút thông báo và Dropdown tài khoản */}
      <div className="flex items-center gap-6">
        {/* Đồng hồ kỹ thuật số hiển thị giờ và ngày tháng năm */}
        <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6 select-none">
          <span className="font-mono text-sm font-bold text-[#111c2d] tabular-nums leading-none">
            {currentTime}
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
            {currentDate}
          </span>
        </div>

        {/* Các nút tương tác tiện ích nhanh */}
        <div className="flex items-center gap-2 text-slate-500">
          {/* Nút thông báo có dấu chấm đỏ báo hiệu tin nhắn mới */}
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative" title="Notifications">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          </button>
          {/* Nút trợ giúp nhanh */}
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block" title="Help">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
        </div>

        {/* Dropdown Menu tài khoản người dùng */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-2 text-left focus:outline-none select-none hover:opacity-90 active:scale-[0.98] transition-all"
            id="user-profile-trigger"
          >
            {/* Hiển thị Tên người dùng và vai trò dưới avatar */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                {userRoleDisplay}
              </p>
            </div>
            {/* Chữ viết tắt làm ảnh đại diện Avatar (có hiệu ứng hover ring) */}
            <div className="w-9 h-9 rounded-full border border-emerald-600/20 flex items-center justify-center bg-emerald-50 text-emerald-700 font-semibold text-sm shadow-sm hover:ring-2 hover:ring-emerald-500/20 transition-all select-none">
              {initials}
            </div>
          </button>

          {/* Hộp Dropdown Menu xuất hiện khi bấm vào avatar */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-fade-in origin-top-right">
              {/* Tổng quan thông tin tài khoản đang đăng nhập */}
              <div className="px-4 py-2 border-b border-slate-50 mb-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed In As</p>
                <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{user?.fullName || 'Alex Thompson'}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email || 'manager@nexpark.com'}</p>
              </div>

              {/* Các liên kết điều hướng chức năng */}
              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-600 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>My Profile</span>
              </Link>


              {/* Thanh phân tách dòng menu */}
              <div className="h-[1px] bg-slate-100 my-1.5"></div>

              {/* Nút đăng xuất khỏi hệ thống */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60 transition-colors font-medium text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
