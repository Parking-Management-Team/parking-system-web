'use client';

import React from 'react';

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
    </div>
  );
}
