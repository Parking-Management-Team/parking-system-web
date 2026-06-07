'use client';

export interface ActivityLog {
  id: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  details: string;
}

interface RecentActivityProps {
  activities: ActivityLog[];
}

// Map type → icon + color class
const TYPE_CONFIG = {
  warning: { icon: 'gpp_maybe',     color: 'text-red-500',     bg: 'bg-red-50' },
  success: { icon: 'check_circle',  color: 'text-emerald-500', bg: 'bg-emerald-50' },
  info:    { icon: 'info',          color: 'text-blue-500',    bg: 'bg-blue-50' },
} as const;

/**
 * RecentActivity - Nhật ký hoạt động gần đây
 *
 * Hiển thị danh sách hoạt động với icon màu theo type (warning/success/info).
 * Cuộn nội bộ khi có nhiều log.
 *
 * @param activities - Danh sách ActivityLog nhận từ parent (page.tsx)
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Danh sách log (có scroll) */}
      <div className="mt-4 flex-1 space-y-5 overflow-y-auto max-h-[420px] scrollbar-thin pr-1">
        {activities.map((act) => {
          const config = TYPE_CONFIG[act.type];
          return (
            <div key={act.id} className="flex gap-3 text-left">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                <span className={`material-symbols-outlined text-lg p-1 rounded-lg ${config.color} ${config.bg}`}>
                  {config.icon}
                </span>
              </div>
              {/* Nội dung */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{act.message}</span>
                  <span className="text-[10px] text-slate-400 font-medium tabular-nums">{act.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{act.details}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút xem toàn bộ lịch sử */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition-colors cursor-pointer">
          View Full History
        </button>
      </div>
    </div>
  );
}
