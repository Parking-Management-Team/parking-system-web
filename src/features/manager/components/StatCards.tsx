'use client';

export interface DashboardStats {
  todayRevenue: string;
  checkInOuts: string;
  occupancyRate: number;
  activeViolations: number;
}

interface StatCardsProps {
  stats: DashboardStats;
}

/**
 * StatCards - 4 thẻ số liệu thống kê tổng quan
 * Hiển thị: Doanh thu hôm nay, Lượt xe Vào/Ra, Công suất lấp đầy, Vi phạm
 */
export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Doanh thu hôm nay */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-0.5">
            +12.4% <span className="material-symbols-outlined text-xs">trending_up</span>
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Today&apos;s Revenue</h3>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.todayRevenue}</p>
        </div>
      </div>

      {/* Lượt xe Vào/Ra */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined">sync_alt</span>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            Today
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Check-ins / Outs</h3>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.checkInOuts}</p>
        </div>
      </div>

      {/* Công suất lấp đầy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined">donut_large</span>
          </div>
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {stats.occupancyRate}% Slots
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Occupancy Rate</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vi phạm đang hoạt động */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined">gpp_maybe</span>
          </div>
          <span className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
            {stats.activeViolations} Active
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Incidents & Violations</h3>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.activeViolations} Cases</p>
        </div>
      </div>

    </div>
  );
}
