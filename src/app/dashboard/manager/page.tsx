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
 * Toàn bộ nhãn UI đã được dịch sang tiếng Anh theo yêu cầu.
 */
export default function ManagerDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Cập nhật đồng hồ thời gian thực tế dạng 24h bằng tiếng Anh
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Danh sách các hoạt động giả lập gần đây bằng tiếng Anh
  const recentActivities: ActivityLog[] = [
    {
      id: 'ACT-001',
      time: '10:45 AM',
      type: 'warning',
      message: 'Parking violation detected',
      details: 'Vehicle 29A-123.45 parked out of line at Level L2 - Zone A.'
    },
    {
      id: 'ACT-002',
      time: '10:30 AM',
      type: 'success',
      message: 'Monthly permit renewed',
      details: 'Customer Nguyen Van An successfully renewed monthly card Card-9981.'
    },
    {
      id: 'ACT-003',
      time: '10:15 AM',
      type: 'info',
      message: 'Online slot allocated',
      details: 'Successfully allocated Slot L03-24 for visitor vehicle 30H-889.90.'
    },
    {
      id: 'ACT-004',
      time: '09:50 AM',
      type: 'success',
      message: 'Facility details updated',
      details: 'Manager successfully updated configuration details for Facility PBMS Landmark.'
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">
      {/* Tiêu đề Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Welcome back! Monitor real-time parking stats and activity.
          </p>
        </div>
        
        {/* Widget Thời gian thực tế */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 shrink-0 self-start md:self-auto">
          <span className="material-symbols-outlined text-emerald-500 fill animate-pulse">schedule</span>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider font-sans">System Live</div>
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
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Today&apos;s Revenue</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">15,420,000 VND</p>
          </div>
        </div>

        {/* Lượt xe Vào/Ra */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">sync_alt</span>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Today
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Check-ins / Outs</h3>
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
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Occupancy Rate</h3>
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
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Incidents & Violations</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">2 Cases</p>
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
                <h3 className="text-lg font-bold text-slate-800">Hourly Traffic</h3>
                <p className="text-xs text-slate-400">Hourly check-in and check-out distribution</p>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            
            {/* Biểu đồ mô phỏng bằng cột CSS */}
            <div className="h-64 flex items-end justify-between pt-6 px-4">
              {[30, 45, 60, 95, 75, 50, 40, 65, 85, 110, 80, 55].map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-[6%] group">
                  <div className="relative w-full">
                    {/* Tooltip khi di chuột */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {value} check-ins
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Management Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link 
                href="/dashboard/manager/facilities" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">location_city</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Parking Facilities</div>
                  <div className="text-[11px] text-slate-400">View slots and occupancy</div>
                </div>
              </Link>

              <Link 
                href="/dashboard/manager/allocate-slot" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">local_parking</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Allocate Slot</div>
                  <div className="text-[11px] text-slate-400">Register and assign slots</div>
                </div>
              </Link>

              <Link 
                href="/dashboard/manager/vehicles" 
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">directions_car</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Monitor Vehicles</div>
                  <div className="text-[11px] text-slate-400">View live feeds & tickets</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Cột phải: Nhật ký hoạt động */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
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
              View Full History
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
