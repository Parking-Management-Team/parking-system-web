'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export interface ActivityLog {
  id: string;
  time: string;
  plate: string;
  type: string;
  message: string;
  details: string;
}

interface RecentActivityProps {
  activities: ActivityLog[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm flex flex-col h-full">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800">Live Vehicle Feeds</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time check-ins on current facility</p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Dynamic activity checklist from actual active sessions */}
      <div className="mt-6 flex-1 space-y-6 overflow-y-auto max-h-[380px] pr-1 text-left">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 text-3xl">directions_car</span>
            <p className="text-xs text-slate-400 font-bold mt-2">No active sessions in this facility.</p>
          </div>
        ) : (
          activities.map(act => (
            <div key={act.id} className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <span className="material-symbols-outlined text-sm p-1.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-500/10">
                  login
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 font-mono tracking-wide px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    {act.plate}
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold tabular-nums">{act.time}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {act.message} • {act.details}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link
          href={ROUTES.FACILITIES.ROOT}
          className="block w-full py-2.5 text-center text-xs font-extrabold text-slate-650 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/40 rounded-xl border border-slate-200/60 transition-colors"
        >
          Manage Active Allocations Map
        </Link>
      </div>

    </div>
  );
}
