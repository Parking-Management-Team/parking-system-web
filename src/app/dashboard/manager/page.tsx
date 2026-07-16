'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { FloorResponse, ZoneResponse, ParkingSessionDto } from '@/features/parking-map/types';
import {
  StatCards,
  HourlyTrafficChart,
  OccupancyPieChart,
  QuickLinks,
  RecentActivity,
} from '@/features/manager';
import type { DashboardStats, ActivityLog } from '@/features/manager';

interface RevenueStatisticDto {
  id: number;
  buildingId: number;
  buildingName: string;
  startDate: string;
  endDate: string;
  periodType: string;
  vehicleTypeId?: number;
  vehicleTypeName: string;
  totalRevenue: number;
  totalBookings: number;
  totalSessions: number;
  totalSubscriptions: number;
}

export default function ManagerDashboard() {
  // Real Data States
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [revenueList, setRevenueList] = useState<RevenueStatisticDto[]>([]);
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);


  // Fetch active sessions only
  const fetchActiveSessions = async () => {
    try {
      const sessionRes = await api.get<any>('/parking-sessions/active').catch(() => null);
      let loadedSessions: ParkingSessionDto[] = [];
      if (sessionRes) {
        if (sessionRes.success && Array.isArray(sessionRes.data)) {
          loadedSessions = sessionRes.data;
        } else if (Array.isArray(sessionRes)) {
          loadedSessions = sessionRes;
        } else if (sessionRes.data && Array.isArray(sessionRes.data)) {
          loadedSessions = sessionRes.data;
        }
      }
      setActiveSessions(loadedSessions);
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  };

  // Fetch daily revenue stats
  const fetchRevenue = async (buildingId: number | null) => {
    if (!buildingId) return;
    try {
      const res = await api.get<any>(
        `/Revenue?BuildingId=${buildingId}&PeriodType=DAILY&pageIndex=1&pageSize=30`
      );
      
      let data: any = null;
      if (res && res.success && res.data) {
        data = res.data;
      } else if (res && res.items) {
        data = res;
      }

      if (data && data.items) {
        setRevenueList(data.items);
      } else {
        setRevenueList([]);
      }
    } catch (err) {
      console.error('Failed to fetch revenue stats:', err);
      setRevenueList([]);
    }
  };

  // Fetch initial infrastructure and live sessions
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Buildings
      const resBld = await api.get<BaseResponse<PagedResult<Building>>>('/Buildings/paged?pageIndex=1&pageSize=100');
      let loadedBuildings: Building[] = [];
      if (resBld.success && resBld.data?.items) {
        loadedBuildings = resBld.data.items;
        setBuildings(loadedBuildings);
      }

      // 2. Fetch Floors
      const resFloors = await api.get<BaseResponse<FloorResponse[]>>('/Floors');
      let loadedFloors: FloorResponse[] = [];
      if (resFloors.success && resFloors.data) {
        loadedFloors = resFloors.data;
        setFloors(loadedFloors);
      }

      // 3. Fetch Zones
      const resZones = await api.get<BaseResponse<ZoneResponse[]>>('/Zones');
      let loadedZones: ZoneResponse[] = [];
      if (resZones.success && resZones.data) {
        loadedZones = resZones.data;
        setZones(loadedZones);
      }

      // 4. Fetch Active Sessions
      await fetchActiveSessions();

      // Set default selected building
      if (loadedBuildings.length > 0) {
        const defaultBldId = loadedBuildings[0].id;
        setSelectedBuildingId(defaultBldId);
        // Fetch revenue for this default building immediately
        await fetchRevenue(defaultBldId);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch daily revenue stats when building selection changes
  useEffect(() => {
    if (selectedBuildingId) {
      fetchRevenue(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  // Polling active sessions and revenue every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSessions();
      if (selectedBuildingId) {
        fetchRevenue(selectedBuildingId);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedBuildingId]);

  const stats = useMemo<DashboardStats>(() => {
    if (!selectedBuildingId) {
      return { revenue: 0, occupiedCount: 0, occupancyRate: 0, totalCapacity: 0, floorsCount: 0, todaySessions: 0 };
    }

    const buildingFloors = floors.filter(f => f.buildingId === selectedBuildingId);
    const buildingFloorIds = buildingFloors.map(f => f.id);
    const buildingZones = zones.filter(z => buildingFloorIds.includes(z.floorId));
    const totalCapacity = buildingZones.reduce((sum, z) => sum + (z.capacity || 0), 0);

    const buildingActiveSessions = activeSessions.filter(s => s.buildingId === selectedBuildingId);
    const occupiedCount = buildingActiveSessions.length;
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 1000) / 10 : 0;

    const latestRevenueDto = revenueList
      .filter(r => r.vehicleTypeId === null || r.vehicleTypeId === undefined || r.vehicleTypeName === 'Total Revenue')
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    const revenue = latestRevenueDto ? latestRevenueDto.totalRevenue : 0;

    return { revenue, occupiedCount, occupancyRate, totalCapacity, floorsCount: buildingFloors.length, todaySessions: latestRevenueDto?.totalSessions ?? 0 };
  }, [selectedBuildingId, floors, zones, activeSessions, revenueList]);

  // Daily revenue chart data (filter total revenue records and sort chronologically)
  const chartData = useMemo(() => {
    // Group and aggregate by date for Total Revenue
    const dailyTotals = revenueList
      .filter(r => r.vehicleTypeId === null || r.vehicleTypeId === undefined || r.vehicleTypeName === 'Total Revenue')
      .map(r => ({
        date: new Date(r.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        rawDate: r.startDate,
        val: r.totalRevenue,
      }));
    
    // Sort chronologically
    dailyTotals.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    
    return dailyTotals.slice(-7); // Keep the last 7 days
  }, [revenueList]);

  const activities = useMemo<ActivityLog[]>(() => {
    if (!selectedBuildingId) return [];
    return [...activeSessions]
      .filter(s => s.buildingId === selectedBuildingId)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
      .slice(0, 10)
      .map(s => ({
        id: s.id.toString(),
        plate: s.licensePlateIn,
        time: new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }));
  }, [selectedBuildingId, activeSessions]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">
      
      {/* ── Header with Live-Ticker & Building Selector ── */}
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
