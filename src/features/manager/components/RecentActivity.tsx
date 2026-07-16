'use client';

export interface ActivityLog {
  id: string;
  plate: string;
  time: string;
}

interface RecentActivityProps {
  activities: ActivityLog[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm flex flex-col h-full">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800">Active Vehicles</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Currently parked in this facility</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto max-h-[340px] space-y-2 pr-0.5">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 text-3xl">directions_car</span>
            <p className="text-xs text-slate-400 font-bold mt-2">No active vehicles in this facility.</p>
          </div>
        ) : (
          activities.map(act => (
            <div key={act.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-mono font-black text-sm text-slate-800 tracking-wider">{act.plate}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold tabular-nums">{act.time}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
        <span>{activities.length} vehicle{activities.length !== 1 ? 's' : ''} parked</span>
        <span>Refreshes every 30s</span>
      </div>
    </div>
  );
}
