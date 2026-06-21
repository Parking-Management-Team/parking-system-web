'use client';

interface RevenueChartItem {
  date: string;
  val: number;
}

interface HourlyTrafficChartProps {
  chartData: RevenueChartItem[];
}

export function HourlyTrafficChart({ chartData }: HourlyTrafficChartProps) {
  const maxVal = Math.max(...chartData.map(d => d.val), 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-800">Daily Revenue Trends</h3>
          <p className="text-xs text-slate-400 font-semibold">Comparison of daily total revenue over the last 7 days</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          Live Data
        </span>
      </div>

      <div className="pt-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-slate-350 text-3xl">bar_chart</span>
            <p className="text-xs text-slate-400 font-bold mt-2">No revenue history available for this building.</p>
          </div>
        ) : (
          /* SVG Bar Chart with subtle grids */
          <svg className="w-full h-56" viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
            {/* Background Grids */}
            <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f3f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="70" x2="580" y2="70" stroke="#f1f3f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f3f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="40" y1="170" x2="580" y2="170" stroke="#e9ecf4" strokeWidth="1.5" />

            {/* Chart Bars */}
            {chartData.map((item, idx) => {
              const barWidth = 36;
              const spacing = 580 / (chartData.length + 1);
              const x = 40 + (idx + 0.5) * spacing - barWidth / 2;
              
              // Prevent divide by zero
              const barHeight = maxVal > 0 ? (item.val / maxVal) * 135 : 0;
              const y = 170 - barHeight;

              const isMax = item.val === maxVal && maxVal > 0;
              const formattedVal = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0
              }).format(item.val);

              return (
                <g key={idx} className="group cursor-pointer">
                  {/* Tooltip Overlay */}
                  <rect
                    x={x - 30}
                    y={Math.max(y - 30, 5)}
                    width={barWidth + 60}
                    height={25}
                    rx={5}
                    fill="#1e293b"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(y - 14, 21)}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {formattedVal}
                  </text>

                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={isMax ? '#006d43' : '#a7f3d0'}
                    className="transition-all duration-300 hover:fill-[#006d43]/90"
                  />

                  {/* X label */}
                  <text
                    x={x + barWidth / 2}
                    y="192"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {item.date}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
