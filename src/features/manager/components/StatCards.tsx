'use client';

import React from 'react';
import { Coins, Car, Warehouse, Activity } from 'lucide-react';

export interface DashboardStats {
  revenue: number;
  occupiedCount: number;
  occupancyRate: number;
  totalCapacity: number;
  floorsCount: number;
  todaySessions: number;
}

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const formattedRevenue = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(stats.revenue);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Daily Revenue */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#006d43] flex items-center justify-center shadow-inner">
            <Coins className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="bg-emerald-50 text-[#006d43] text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
            Live Today
          </span>
        </div>
        <div className="mt-5">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Daily Revenue</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            {stats.revenue > 0 ? formattedRevenue : '0 VND'}
          </p>
        </div>
      </div>

      {/* Active Vehicles — with inline occupancy rate */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Car className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
            {stats.occupancyRate}% Full
          </span>
        </div>
        <div className="mt-5">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Vehicles</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            {stats.occupiedCount}
            <span className="text-base font-bold text-slate-400 ml-1">/ {stats.totalCapacity} slots</span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Sessions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <Activity className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
            Today
          </span>
        </div>
        <div className="mt-5">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sessions</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            {stats.todaySessions}
            <span className="text-base font-bold text-slate-400 ml-1">trips</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1.5">Check-ins recorded today</p>
        </div>
      </div>

      {/* Total Capacity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shadow-inner">
            <Warehouse className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
            {stats.floorsCount} Floors
          </span>
        </div>
        <div className="mt-5">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Capacity</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            {stats.totalCapacity}
            <span className="text-base font-bold text-slate-400 ml-1">slots</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{stats.totalCapacity - stats.occupiedCount} currently available</p>
        </div>
      </div>

    </div>
  );
}
