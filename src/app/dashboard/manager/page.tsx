'use client';

import React from 'react';
import {
  StatCards,
  HourlyTrafficChart,
  OccupancyPieChart,
  QuickLinks,
  RecentActivity,
  useManagerDashboard,
} from '@/features/manager';

export default function ManagerDashboard() {
  const {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    loading,
    stats,
    chartData,
    activities,
  } = useManagerDashboard();

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">
      
      {/* ── Header with Building Selector ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">
            Monitor real-time parking spaces, capacity metrics, and operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          {/* Building Selector */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              domain
            </span>
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
              aria-label="Select Building"
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer shadow-sm min-w-[200px]"
            >
              {buildings.map(bld => (
                <option key={bld.id} value={bld.id}>{bld.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <>
          {/* ── 4 Stat Cards ── */}
          <StatCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <HourlyTrafficChart chartData={chartData} />
            </div>
            <div className="lg:col-span-1">
              <OccupancyPieChart occupiedCount={stats.occupiedCount} totalCapacity={stats.totalCapacity} />
            </div>
          </div>

          {/* ── Actions & Activities Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <QuickLinks />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity activities={activities} />
            </div>
          </div>
        </>
      )}

    </div>
  );
}
