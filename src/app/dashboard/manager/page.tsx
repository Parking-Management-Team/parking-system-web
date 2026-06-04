'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu cho một hoạt động gần đây
interface ActivityLog {
  id: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  details: string;
}

/**
 * Manager Dashboard Page - Trang tổng quan dành cho Quản lý
 * 
 * Hiển thị số liệu thống kê nhanh về doanh thu, lưu lượng xe, hiệu suất đỗ
 * và nhật ký hoạt động gần đây trong hệ thống bãi đỗ NexPark.
 */
export default function ManagerDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Cập nhật đồng hồ thời gian thực tế
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Danh sách các hoạt động giả lập gần đây
  const recentActivities: ActivityLog[] = [
    {
      id: 'ACT-001',
      time: '10:45 AM',
      type: 'warning',
      message: 'Phát hiện vi phạm đỗ sai vị trí',
      details: 'Xe 29A-123.45 đỗ sai vạch kẻ tại Level L2 - Zone A.'
    },
    {
      id: 'ACT-002',
      time: '10:30 AM',
      type: 'success',
      message: 'Gia hạn vé tháng thành công',
      details: 'Khách hàng Nguyễn Văn An gia hạn thành công thẻ tháng mã thẻ Card-9981.'
    },
    {
      id: 'ACT-003',
      time: '10:15 AM',
      type: 'info',
      message: 'Cấp phát chỗ đỗ trực tuyến',
      details: 'Cấp phát thành công Slot L03-24 cho xe ô tô vãng lai biển số 30H-889.90.'
    },
    {
      id: 'ACT-004',
      time: '09:50 AM',
      type: 'success',
      message: 'Cập nhật thông số cơ sở',
      details: 'Quản lý thay đổi thành công thông tin cấu hình tại Facility PBMS Landmark.'
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Chào mừng trở lại! Xem thống kê hoạt động thời gian thực tại các bãi đỗ.
          </p>
        </div>
        
        {/* Widget Thời gian thực tế */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 shrink-0 self-start md:self-auto">
          <span className="material-symbols-outlined text-emerald-500 fill animate-pulse">schedule</span>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Hệ thống Live</div>
            <div className="text-base font-bold text-slate-800 tabular-nums">{currentTime || '--:--:--'}</div>
          </div>
        </div>
      </div>

      {/* Grid thẻ số liệu thống kê (Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Doanh thu hôm nay */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-0.5">
              +12.4% <span className="material-symbols-outlined text-xs">trending_up</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Doanh thu Hôm nay</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">15.420.000 đ</p>
          </div>
        </div>

        {/* Lượt xe Vào/Ra */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">sync_alt</span>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Hôm nay
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Lượt Xe Vào / Ra</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">342 / 298</p>
          </div>
        </div>

        {/* Công suất lấp đầy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined">donut_large</span>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              78.4% Slots
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Lấp Đầy</h3>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '78.4%' }}></div>
            </div>
          </div>
        </div>

        {/* Cảnh báo vi phạm */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined">gpp_maybe</span>
            </div>
            <span className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
              2 Active
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sự cố & Vi phạm</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">2 Trường hợp</p>
          </div>
        </div>

      </div>

      {/* Grid Nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột trái & giữa: Biểu đồ và Bản đồ số liệu */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Lưu lượng Xe Theo Giờ</h3>
                <p className="text-xs text-slate-400">Dữ liệu phân bổ luồng xe vào ra hôm nay</p>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option>Hôm nay</option>
                <option>Hôm qua</option>
                <option>7 ngày qua</option>
              </select>
            </div>
            
            {/* Biểu đồ mô phỏng bằng cột CSS */}
            <div className="h-64 flex items-end justify-between pt-6 px-4">
              {[30, 45, 60, 95, 75, 50, 40, 65, 85, 110, 80, 55].map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-[6%] group">
                  <div className="relative w-full">
                    {/* Tooltip khi di chuột */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {value} lượt
                    </div>
                    {/* Cột Bar Chart */}
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 origin-bottom group-hover:bg-emerald-400 ${
                        i === 9 ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                      style={{ height: `${(value / 120) * 100}%`, minHeight: '10px' }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{i * 2}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Truy cập nhanh các chức năng quản trị */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Lối tắt Quản lý (Quick Links)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/dashboard/manager/facilities" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">location_city</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Cơ sở đỗ xe</div>
                  <div className="text-[11px] text-slate-400">Xem sơ đồ & Tỷ lệ trống</div>
                </div>
              </Link>

              <Link 
                href="/dashboard/manager/allocate" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">local_parking</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Cấp phát slot</div>
                  <div className="text-[11px] text-slate-400">Đăng ký & Cấp thẻ xe</div>
                </div>
              </Link>

              <Link 
                href="/dashboard/manager/vehicles" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">directions_car</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Giám sát xe</div>
                  <div className="text-[11px] text-slate-400">Xem trực tiếp camera & Vé</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Cột phải: Nhật ký hoạt động */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Hoạt động Gần đây</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="mt-4 flex-1 space-y-5 overflow-y-auto max-h-[420px] scrollbar-thin pr-1">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex gap-3 text-left group">
                {/* Icon chỉ thị màu theo type */}
                <div className="mt-0.5 shrink-0">
                  {act.type === 'warning' && (
                    <span className="material-symbols-outlined text-red-500 text-lg bg-red-50 p-1 rounded-lg">gpp_maybe</span>
                  )}
                  {act.type === 'success' && (
                    <span className="material-symbols-outlined text-emerald-500 text-lg bg-emerald-50 p-1 rounded-lg">check_circle</span>
                  )}
                  {act.type === 'info' && (
                    <span className="material-symbols-outlined text-blue-500 text-lg bg-blue-50 p-1 rounded-lg">info</span>
                  )}
                </div>
                {/* Chi tiết log */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{act.message}</span>
                    <span className="text-[10px] text-slate-400 font-medium tabular-nums">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {act.details}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition-colors">
              Xem Toàn bộ Lịch sử
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
