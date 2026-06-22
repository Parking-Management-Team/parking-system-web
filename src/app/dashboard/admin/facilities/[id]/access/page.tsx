'use client';

import React from 'react';

/**
 * Trang cấu hình Kiểm soát Ra vào (Access Control) - Sub-route của Tòa nhà
 */
export default function BuildingAccessPage() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center py-16">
      <span className="material-symbols-outlined text-4xl text-slate-300">security_key</span>
      <h3 className="text-lg font-bold text-[#111c2d] mt-4">Access Control System</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        Configure gates, barriers, RFID reader arrays, and authentication rules for this building level.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Planned for Next Phase
        </span>
      </div>
    </div>
  );
}
