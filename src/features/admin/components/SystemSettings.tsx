'use client';

import React, { useState } from 'react';

/**
 * SystemSettings Component - Cấu hình hệ thống dành cho Admin
 * Quản lý thời gian timeout phiên đăng nhập, sao lưu cơ sở dữ liệu, mức độ ghi nhật ký API.
 */
export default function SystemSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backupFreq, setBackupFreq] = useState('DAILY');
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('System configurations saved successfully.');
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Configurations</h1>
        <p className="text-slate-500 text-sm mt-1">Configure global server parameters, database backups, and security settings.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        {/* Hàng 1: Maintenance Mode */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Maintenance Mode</h3>
            <p className="text-xs text-slate-500 mt-1">Block customer portal and display a maintenance screen.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Hàng 2: Database Backup Frequency */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Database Auto-Backup Frequency</label>
          <select
            value={backupFreq}
            onChange={(e) => setBackupFreq(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="HOURLY">Hourly (High Security)</option>
            <option value="DAILY">Every Night (Recommended)</option>
            <option value="WEEKLY">Weekly Maintenance Slot</option>
          </select>
        </div>

        {/* Hàng 3: Session Timeout */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Admin/Staff Session Expiration (Minutes)</label>
          <input
            type="number"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            min="5"
            max="1440"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action button */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
