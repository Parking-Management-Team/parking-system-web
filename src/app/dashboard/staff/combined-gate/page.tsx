'use client';

import VehicleCheckin from '@/features/vehicles/components/VehicleCheckin';
import VehicleCheckout from '@/features/vehicles/components/VehicleCheckout';

export default function CombinedGatePage() {
  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto flex flex-col gap-4 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900">Staff Gate Combined</h1>
        </div>

        {/* Two independent gate panels side by side */}
        <div className="grid gap-4 xl:grid-cols-2">
          {/* CHECK-IN panel */}
          <section className="rounded-3xl border border-emerald-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl">login</span>
              <h2 className="text-base font-black text-slate-900">CỔNG VÀO (CHECK-IN)</h2>
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 ml-auto">IN</span>
            </div>
            <VehicleCheckin compact />
          </section>

          {/* CHECK-OUT panel */}
          <section className="rounded-3xl border border-rose-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <span className="material-symbols-outlined text-rose-600 text-xl">logout</span>
              <h2 className="text-base font-black text-slate-900">CỔNG RA (CHECK-OUT)</h2>
              <span className="text-[9px] font-bold bg-rose-50 text-rose-600 rounded-full px-2 py-0.5 ml-auto">OUT</span>
            </div>
            <VehicleCheckout compact />
          </section>
        </div>
      </div>
    </div>
  );
}
