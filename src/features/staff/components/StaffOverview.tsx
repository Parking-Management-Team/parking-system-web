'use client';

import React from 'react';

// Dữ liệu mock phục vụ hiển thị
const MOCK_STATS = [
  { label: 'Active Sessions', value: '142', icon: 'sync_alt', color: 'text-emerald-500 bg-emerald-50' },
  { label: 'Available Slots', value: '358/500', icon: 'local_parking', color: 'text-blue-500 bg-blue-50' },
  { label: 'Blocked Slots', value: '12', icon: 'block', color: 'text-amber-500 bg-amber-50' },
  { label: 'Open Incidents', value: '3', icon: 'report_problem', color: 'text-red-500 bg-red-50' },
];

const MOCK_ALERTS = [
  { id: 1, type: 'warning', msg: 'Lost Ticket registered', details: 'Vehicle 51A-999.99 at Gate 2', time: '5m ago' },
  { id: 2, type: 'info', msg: 'Valet parking assigned', details: 'Slot B1-12 assigned to Mercedes C200', time: '12m ago' },
  { id: 3, type: 'danger', msg: 'Wrong lane access blocked', details: 'Motorcycle entry denied at Gate 1', time: '20m ago' },
];

/**
 * StaffOverview Component - Trang HUD điều hành chính của Staff
 * Hiển thị tổng quan trạng thái bãi đỗ xe và các cảnh báo sự cố theo thời gian thực.
 */
export default function StaffOverview() {
  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề & Thông tin ca trực */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operational HUD Control</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time parking supervision and quick action tools.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-semibold text-slate-700">Gate 1 & 2 Active</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">Shift: Morning (06:00 - 14:00)</span>
        </div>
      </div>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${stat.color} shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Grid chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bản đồ 2D đơn giản mô phỏng Basement B1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Zone Grid (Basement B1)</h3>
              <p className="text-xs text-slate-400">Click a slot to modify its operational status</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-slate-100"></span>Empty</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500"></span>Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span>VIP</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500"></span>Issue</span>
            </div>
          </div>

          {/* Sơ đồ bãi xe giả lập bằng CSS Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-3 flex-1 min-h-[240px]">
            {Array.from({ length: 40 }).map((_, i) => {
              // Phân bổ ngẫu nhiên trạng thái ô đỗ
              let status = 'empty';
              let bgClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500';
              if (i % 3 === 0) {
                status = 'occupied';
                bgClass = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 font-semibold';
              } else if (i === 7 || i === 18) {
                status = 'vip';
                bgClass = 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600 font-semibold';
              } else if (i === 12 || i === 29) {
                status = 'issue';
                bgClass = 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 font-semibold';
              }

              return (
                <button
                  key={i}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs transition-all ${bgClass}`}
                >
                  <span className="text-[10px] text-slate-400">B1</span>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-100 mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Shift Activity Alerts</h3>
            <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">Live</span>
          </div>

          <div className="space-y-4 flex-1">
            {MOCK_ALERTS.map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 flex gap-3">
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  {alert.type === 'danger' ? 'report' : alert.type === 'warning' ? 'warning' : 'info'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{alert.msg}</span>
                    <span className="text-[10px] text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{alert.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition-colors">
              Clear All Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
