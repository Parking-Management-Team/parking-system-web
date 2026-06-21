'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export function QuickLinks() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-4">Quick Management Links</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={ROUTES.FACILITIES.ROOT}
          className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[#006d43] group-hover:scale-110 transition-transform">
            location_city
          </span>
          <div>
            <div className="text-sm font-bold text-slate-800">Parking Map</div>
            <div className="text-[10px] text-slate-400 font-semibold">View slots and occupancy</div>
          </div>
        </Link>

        <Link
          href={ROUTES.FACILITIES.ALLOCATE}
          className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[#006d43] group-hover:scale-110 transition-transform">
            local_parking
          </span>
          <div>
            <div className="text-sm font-bold text-slate-800">Allocate Slot</div>
            <div className="text-[10px] text-slate-400 font-semibold">Manual slot allocations</div>
          </div>
        </Link>

        <Link
          href="/dashboard/manager/pricing"
          className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[#006d43] group-hover:scale-110 transition-transform">
            payments
          </span>
          <div>
            <div className="text-sm font-bold text-slate-800">Pricing Settings</div>
            <div className="text-[10px] text-slate-400 font-semibold">Configure rates & fees</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
