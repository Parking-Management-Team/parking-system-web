'use client';

import React from 'react';

/**
 * ParkingAnalytics Component - Thống kê và Phân tích hiệu suất đỗ xe dành cho Admin
 * Hiển thị các chỉ số kinh doanh, công suất sử dụng và dự báo doanh thu.
 */
export default function ParkingAnalytics() {
  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parking Operations Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Review system metrics, financial growth, and parking utilization trends.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm text-xs font-bold text-slate-600 self-start sm:self-center">
          <button className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-800">Weekly</button>
          <button className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">Monthly</button>
          <button className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">Yearly</button>
        </div>
      </div>

      {/* Tóm tắt chỉ số */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
          <h3 className="text-3xl font-black text-slate-800">$42,850.50</h3>
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> +14.2% from last week
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Occupancy</span>
          <h3 className="text-3xl font-black text-slate-800">76.4%</h3>
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> +3.1% occupancy rate
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peak Hour Traffic</span>
          <h3 className="text-3xl font-black text-slate-800">17:00 - 19:00</h3>
          <span className="text-xs font-bold text-slate-400">Regular weekday rush hour</span>
        </div>
      </div>

      {/* Grid biểu đồ giả lập */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doanh thu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Revenue Distribution by Zone</h3>
            <p className="text-xs text-slate-400 mt-1">Comparing zones efficiency and collection</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Zone A (Underground level)</span>
                <span>$21,425.25 (50%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Zone B (Premium Ground Level)</span>
                <span>$14,997.70 (35%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Zone C (Outdoor Level)</span>
                <span>$6,427.55 (15%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Khung tải dữ liệu biểu đồ chi tiết */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-base font-bold text-slate-800">Traffic Density Chart</h3>
            <p className="text-xs text-slate-400 mt-1">Real-time hourly vehicle inflow vs outflow</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="material-symbols-outlined text-4xl animate-bounce">query_stats</span>
            <span className="text-xs font-bold">Generating dynamic traffic graphs...</span>
            <span className="text-[10px] text-slate-300">Synchronizing database servers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
