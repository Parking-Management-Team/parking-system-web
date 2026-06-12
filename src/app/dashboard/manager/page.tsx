'use client';

import React, { useState, useEffect } from 'react';
import {
  StatCards,
  HourlyTrafficChart,
  QuickLinks,
  RecentActivity,
} from '@/features/manager';
import type { DashboardStats, ActivityLog } from '@/features/manager';

// ─── Mock data (thay bằng API call khi backend sẵn sàng) ──────────────────────

const INITIAL_STATS: DashboardStats = {
  todayRevenue: '15,420,000 VND',
  checkInOuts: '342 / 298',
  occupancyRate: 78.4,
  activeViolations: 2,
};

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'ACT-001',
    time: '10:45 AM',
    type: 'warning',
    message: 'Parking violation detected',
    details: 'Vehicle 29A-123.45 parked out of line at Level L2 - Zone A.',
  },
  {
    id: 'ACT-002',
    time: '10:30 AM',
    type: 'success',
    message: 'Monthly permit renewed',
    details: 'Customer Nguyen Van An successfully renewed monthly card Card-9981.',
  },
  {
    id: 'ACT-003',
    time: '10:15 AM',
    type: 'info',
    message: 'Online slot allocated',
    details: 'Successfully allocated Slot L03-24 for visitor vehicle 30H-889.90.',
  },
  {
    id: 'ACT-004',
    time: '09:50 AM',
    type: 'success',
    message: 'Facility details updated',
    details: 'Manager successfully updated configuration details for Facility PBMS Landmark.',
  },
];

/**
 * ManagerDashboard Page
 *
 * Trang tổng quan dành cho Quản lý.
 * File này chỉ chứa: state, đồng hồ realtime, API fetch stub,
 * và ghép các component từ features/manager.
 *
 * Để thêm chức năng mới → tạo component mới trong features/manager/components/
 * rồi export qua features/manager/index.ts, sau đó import vào đây.
 */
export default function ManagerDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [stats] = useState<DashboardStats>(INITIAL_STATS);
  const [activities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);

  // Đồng hồ realtime cập nhật mỗi giây
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    setCurrentTime(fmt());
    const timer = setInterval(() => setCurrentTime(fmt()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dữ liệu từ Backend API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        /**
         * TODO: Điền API endpoint khi backend sẵn sàng:
         *
         * const statsRes = await api.get<BaseResponse<DashboardStats>>('/manager/stats');
         * if (statsRes.success) setStats(statsRes.data);
         *
         * const logsRes  = await api.get<BaseResponse<ActivityLog[]>>('/manager/recent-logs');
         * if (logsRes.success) setActivities(logsRes.data);
         */
        console.log('Dashboard ready. Waiting for backend API integration.');
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">

      {/* ── Tiêu đề + Đồng hồ ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Welcome back! Monitor real-time parking stats and activity.
          </p>
        </div>

        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 shrink-0 self-start md:self-auto">
          <span className="material-symbols-outlined text-emerald-500 fill animate-pulse">schedule</span>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Live</div>
            <div className="text-base font-bold text-slate-800 tabular-nums">{currentTime || '--:--:--'}</div>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <StatCards stats={stats} />

      {/* ── Biểu đồ + Quick Links (trái & giữa) + Activity Log (phải) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <HourlyTrafficChart />
          <QuickLinks />
        </div>
        <RecentActivity activities={activities} />
      </div>

    </div>
  );
}
