/**
 * ===================================================================================
 * 🔀 FE COMPONENT: CombinedGate.tsx (Cổng Gộp Song Song / Combined Staff Gate Workspace)
 * ===================================================================================
 *
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Giao diện gộp 2 làn xe đỗ (Check-in & Check-out) song song trên cùng 1 màn hình cho Staff.
 * - Render side-by-side 2 Component chính:
 *   + Nửa bên trái: VehicleCheckin (Xử lý xe vào)
 *   + Nửa bên phải: VehicleCheckout (Xử lý xe ra & thanh toán)
 * - Tự động đồng bộ State liên động (State Triggering): Khi xe check-in thành công -> Tự động nạp lại danh sách xe đỗ active bên cổng Check-out.
 */

'use client';

import React, { useState, useCallback } from 'react';
import VehicleCheckin from './VehicleCheckin';
import VehicleCheckout from './VehicleCheckout';

export default function CombinedGate() {
  const [checkoutRefreshTrigger, setCheckoutRefreshTrigger] = useState(0);

  const handleCheckinSuccess = useCallback(() => {
    setCheckoutRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4 bg-slate-50 min-h-screen">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-xl">
              sync_alt
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Combined Gate Workspace
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Simultaneous lane control: Entrance Check-in (Left) and Exit Check-out (Right).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Dual-Lane Synchronization Active
        </div>
      </div>

      {/* Side-by-side Dual Gate Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Side: Vehicle Check-in (Gate In) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">
                login
              </span>
              <h2 className="text-base font-extrabold text-slate-800">
                Gate Entrance (Check-in)
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
              Inbound Lane
            </span>
          </div>

          <VehicleCheckin compact={true} onCheckinSuccess={handleCheckinSuccess} />
        </div>

        {/* Right Side: Vehicle Check-out (Gate Out) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">
                logout
              </span>
              <h2 className="text-base font-extrabold text-slate-800">
                Gate Exit (Check-out & Payment)
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
              Outbound Lane
            </span>
          </div>

          <VehicleCheckout compact={true} refreshTrigger={checkoutRefreshTrigger} />
        </div>
      </div>
    </div>
  );
}
