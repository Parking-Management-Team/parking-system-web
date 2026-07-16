'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface OccupancyPieChartProps {
  occupiedCount: number;
  totalCapacity: number;
}

export function OccupancyPieChart({ occupiedCount, totalCapacity }: OccupancyPieChartProps) {
  const r = 50;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  const available = Math.max(0, totalCapacity - occupiedCount);
  const hasData = totalCapacity > 0;

  const occupiedPct = hasData ? (occupiedCount / totalCapacity) * 100 : 0;
  const availablePct = hasData ? (available / totalCapacity) * 100 : 0;

  const occupiedDash = (occupiedPct / 100) * circumference;
  const availableDash = (availablePct / 100) * circumference;

  const initialOffset = circumference / 4;
  const availableOffset = initialOffset - occupiedDash;

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm flex flex-col justify-between h-full min-h-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-800">Slot Occupancy</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Occupied vs available capacity</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6 my-auto">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            {/* Track */}
            <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="16" />

            {!hasData ? (
              <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#e2e8f0" strokeWidth="16"
                strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={initialOffset} />
            ) : (
              <>
                {/* Occupied segment */}
                {occupiedDash > 0 && (
                  <circle cx={cx} cy={cy} r={r} fill="transparent"
                    stroke="#006d43"
                    strokeWidth="16"
                    strokeDasharray={`${occupiedDash} ${circumference}`}
                    strokeDashoffset={initialOffset}
                    className="transition-all duration-500 ease-out"
                    style={{ strokeLinecap: availableDash > 0 ? 'butt' : 'round' }}
                  >
                    <title>{`Occupied: ${occupiedCount} (${Math.round(occupiedPct)}%)`}</title>
                  </circle>
                )}
                {/* Available segment */}
                {availableDash > 0 && (
                  <circle cx={cx} cy={cy} r={r} fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeDasharray={`${availableDash} ${circumference}`}
                    strokeDashoffset={availableOffset}
                    className="transition-all duration-500 ease-out"
                    style={{ strokeLinecap: occupiedDash > 0 ? 'butt' : 'round' }}
                  >
                    <title>{`Available: ${available} (${Math.round(availablePct)}%)`}</title>
                  </circle>
                )}
              </>
            )}
          </svg>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {hasData ? `${Math.round(occupiedPct)}%` : '—'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Full
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full max-w-[160px]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#006d43] shrink-0" />
              <span className="text-xs font-bold text-slate-700">Occupied</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-800">{occupiedCount}</div>
              <div className="text-[9px] text-slate-400 font-bold">{Math.round(occupiedPct)}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Available</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-800">{available}</div>
              <div className="text-[9px] text-slate-400 font-bold">{Math.round(availablePct)}%</div>
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] text-slate-400 font-semibold">{totalCapacity} total slots</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 p-3 rounded-xl flex gap-2 items-start border border-slate-100">
        <Info className="w-4 h-4 text-[#006d43] shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Based on active parking sessions in the selected building. Refreshes every 30s.
        </p>
      </div>
    </div>
  );
}
