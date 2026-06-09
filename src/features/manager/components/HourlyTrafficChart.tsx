'use client';

// Dữ liệu mẫu: lưu lượng xe theo từng khung giờ (sẽ thay bằng API sau)
const MOCK_HOURLY_DATA = [30, 45, 60, 95, 75, 50, 40, 65, 85, 110, 80, 55];
const PEAK_INDEX = 9; // Khung giờ cao điểm (mốc 18h)

/**
 * HourlyTrafficChart - Biểu đồ cột hiển thị lưu lượng xe theo giờ
 *
 * Dùng pure CSS bar chart (không cần thư viện chart).
 * Tooltip hiện số check-in khi hover.
 * Cột cao nhất được tô màu emerald để nổi bật.
 *
 * TODO: Thay MOCK_HOURLY_DATA bằng dữ liệu từ API backend.
 */
export function HourlyTrafficChart() {
  const maxValue = Math.max(...MOCK_HOURLY_DATA);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hourly Traffic</h3>
          <p className="text-xs text-slate-400">Hourly check-in and check-out distribution</p>
        </div>
        <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
          <option>Today</option>
          <option>Yesterday</option>
          <option>Last 7 Days</option>
        </select>
      </div>

      {/* CSS Bar Chart */}
      <div className="h-64 flex items-end justify-between pt-6 px-4">
        {MOCK_HOURLY_DATA.map((value, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-[6%] group">
            <div className="relative w-full">
              {/* Tooltip khi hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {value} check-ins
              </div>
              {/* Cột bar */}
              <div
                className={`w-full rounded-t-lg transition-all duration-500 group-hover:bg-emerald-400 ${
                  i === PEAK_INDEX ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
                style={{ height: `${(value / maxValue) * 200}px`, minHeight: '10px' }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{i * 2}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
