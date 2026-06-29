'use client';

import React from 'react';
import { Car, Bike, Info } from 'lucide-react';

interface OccupancyPieChartProps {
  carCount: number;
  bikeCount: number;
  occupiedCount: number;
}

export function OccupancyPieChart({ carCount, bikeCount, occupiedCount }: OccupancyPieChartProps) {
  // SVG Donut dimensions
  const r = 50;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r; // ~314.16

  // Calculate percentages
  const hasVehicles = occupiedCount > 0;
  const carPercent = hasVehicles ? (carCount / occupiedCount) * 100 : 0;
  const bikePercent = hasVehicles ? (bikeCount / occupiedCount) * 100 : 0;

  // Calculate dashes
  const carDash = (carPercent / 100) * circumference;
  const bikeDash = (bikePercent / 100) * circumference;

  // Offset calculations (start from top: -90 degrees or -C/4)
  const initialOffset = circumference / 4; // Shift start to 12 o'clock position
  const carOffset = initialOffset;
  const bikeOffset = initialOffset - carDash;

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#eceef6] shadow-sm flex flex-col justify-between h-full min-h-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-800">Vehicle Distribution</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time breakdown by vehicle type</p>
        </div>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          Live Shares
        </span>
      </div>

      {/* Body containing Chart and Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6 my-auto">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            {/* Background Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="16"
            />

            {!hasVehicles ? (
              // Empty state segment
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={initialOffset}
              />
            ) : (
              <>
                {/* Car Segment */}
                {carDash > 0 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="transparent"
                    stroke="#0284c7" // Sky Blue
                    strokeWidth="16"
                    strokeDasharray={`${carDash} ${circumference}`}
                    strokeDashoffset={carOffset}
                    className="transition-all duration-500 ease-out hover:stroke-[18px] cursor-pointer"
                    style={{ strokeLinecap: bikeDash > 0 ? 'butt' : 'round' }}
                  >
                    <title>{`Cars: ${carCount} (${Math.round(carPercent)}%)`}</title>
                  </circle>
                )}

                {/* Bike Segment */}
                {bikeDash > 0 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="transparent"
                    stroke="#006d43" // Emerald Green
                    strokeWidth="16"
                    strokeDasharray={`${bikeDash} ${circumference}`}
                    strokeDashoffset={bikeOffset}
                    className="transition-all duration-500 ease-out hover:stroke-[18px] cursor-pointer"
                    style={{ strokeLinecap: carDash > 0 ? 'butt' : 'round' }}
                  >
                    <title>{`Bikes: ${bikeCount} (${Math.round(bikePercent)}%)`}</title>
                  </circle>
                )}
              </>
            )}
          </svg>

          {/* Central Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {occupiedCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Active
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 w-full max-w-[160px]">
          {/* Cars Indicator */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0284c7] shrink-0" />
              <div className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Cars</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-800">{carCount}</div>
              <div className="text-[9px] text-slate-400 font-bold">{Math.round(carPercent)}%</div>
            </div>
          </div>

          {/* Motorbikes Indicator */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#006d43] shrink-0" />
              <div className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Bikes</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-800">{bikeCount}</div>
              <div className="text-[9px] text-slate-400 font-bold">{Math.round(bikePercent)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="bg-slate-50 p-3 rounded-xl flex gap-2 items-start border border-slate-100">
        <Info className="w-4 h-4 text-[#006d43] shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Motorbikes park on designated floors (L1/G) and do not reserve specific slots, while cars occupy numbered bays.
        </p>
      </div>
    </div>
  );
}
