'use client';

import React, { useState } from 'react';

const MOCK_ACTIVITIES = [
  { id: 1, action: 'Car Checked-in', details: 'Plate: 51A-123.45 | Slot: B1-05', time: '11:15:30' },
  { id: 2, action: 'Car Checked-out', details: 'Plate: 30K-888.88 | Fee: 30,000 VND', time: '11:02:15' },
  { id: 3, action: 'Lost Ticket Resolved', details: 'Plate: 51A-987.65 | Fine: 200,000 VND', time: '10:45:00' },
  { id: 4, action: 'Slot Status Override', details: 'Slot A-12 marked as BLOCKED', time: '09:30:12' },
];

/**
 * ShiftReports Component - Module báo cáo ca trực và tổng kết vận hành
 * Cho phép nhân viên xuất báo cáo doanh thu ca, kiểm kê vé, và đóng ca bàn giao.
 */
export default function ShiftReports() {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [isShiftEnded, setIsShiftEnded] = useState(false);

  const handleEndShift = () => {
    const confirm = window.confirm('Are you sure you want to CLOSE the current shift and send reports to Manager?');
    if (confirm) {
      setIsShiftEnded(true);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shift Reports & Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Review active shift stats, view transactional logs, and complete handover procedures.</p>
        </div>
        {!isShiftEnded ? (
          <button
            onClick={handleEndShift}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/15 transition-all text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            Close Current Shift
          </button>
        ) : (
          <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl border border-slate-200 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-500">lock_open</span>
            Shift Handed Over
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doanh thu & Thống kê ca trực */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">Shift Financials</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Revenue Collected</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">1,450,000 VND</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Payments</span>
                <p className="text-sm font-bold text-slate-700 mt-1">450,000 VND</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digital Payments</span>
                <p className="text-sm font-bold text-slate-700 mt-1">1,000,000 VND</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Vehicles Handled (In/Out)</span>
                <span className="font-bold text-slate-800">182 cars</span>
              </div>
              <div className="flex justify-between">
                <span>Resolved Incidents</span>
                <span className="font-bold text-slate-800">4 cases</span>
              </div>
              <div className="flex justify-between">
                <span>Active Handover Code</span>
                <span className="font-mono font-bold text-slate-800">SH-9824</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nhật ký hoạt động chi tiết trong ca */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">Activity Log Timeline</h3>

          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-4 relative">
                {/* Dấu chấm timeline */}
                <span className="w-6.5 h-6.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 z-10 text-[9px] font-bold text-emerald-600">
                  {act.id}
                </span>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{act.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{act.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
