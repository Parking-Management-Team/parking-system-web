import React from 'react';
import { ActivityLog } from '../types';

interface VehicleActivityLogsProps {
  logs: ActivityLog[];
  licensePlate: string;
}

/**
 * Hợp phần hiển thị bảng Nhật ký hoạt động của Xe
 */
export default function VehicleActivityLogs({ logs, licensePlate }: VehicleActivityLogsProps) {
  const handleExportCSV = () => {
    alert(`Đang xuất tệp lịch sử xe ${licensePlate} dưới dạng CSV...`);
  };

  return (
    <div className="rounded-2xl border border-slate-100 shadow-sm p-6 bg-white mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">history</span>
            Vehicle Activity Logs
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical movement records for this registration</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl text-xs text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100 flex items-center gap-1.5"
        >
          Export CSV
          <span className="material-symbols-outlined text-[16px]">download</span>
        </button>
      </div>

      {/* Bảng hoạt động */}
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-slate-100">
              <th className="py-4 px-6">Date &amp; Timestamp</th>
              <th className="py-4 px-6">Activity</th>
              <th className="py-4 px-6">Access Point</th>
              <th className="py-4 px-6 text-right">Session Length</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
            {logs.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold">{log.timestamp}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide
                    ${log.activity === 'Entry' ? 'bg-emerald-50 text-emerald-600' : ''}
                    ${log.activity === 'Exit' ? 'bg-slate-100 text-slate-500' : ''}
                    ${log.activity === 'Violation' ? 'bg-red-50 text-red-500' : ''}
                  `}>
                    {log.activity}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-500">{log.location}</td>
                <td className="py-4 px-6 text-right font-mono text-slate-500">{log.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
