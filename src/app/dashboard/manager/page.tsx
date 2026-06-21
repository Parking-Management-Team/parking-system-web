'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { FloorResponse, ZoneResponse, ParkingSessionDto } from '@/features/parking-map/types';
import {
  StatCards,
  HourlyTrafficChart,
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
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Real Data States
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [revenueList, setRevenueList] = useState<RevenueStatisticDto[]>([]);
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Time ticker
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
      const sessionRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active').catch(() => null);
      if (sessionRes?.success && sessionRes.data) {
        setActiveSessions(sessionRes.data);
      }

      // Set default selected building
      if (loadedBuildings.length > 0) {
        setSelectedBuildingId(loadedBuildings[0].id);
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
    if (!selectedBuildingId) return;

    const fetchRevenue = async () => {
      try {
        const res = await api.get<BaseResponse<PagedResult<RevenueStatisticDto>>>(
          `/revenue?BuildingId=${selectedBuildingId}&PeriodType=DAILY`
        );
        if (res.success && res.data?.items) {
          setRevenueList(res.data.items);
        } else {
          setRevenueList([]);
        }
      } catch (err) {
        console.error('Failed to fetch revenue stats:', err);
        setRevenueList([]);
      }
    };

    fetchRevenue();
  }, [selectedBuildingId]);

  // Dynamic calculations based on selected building
  const stats = useMemo<DashboardStats>(() => {
    if (!selectedBuildingId) {
      return { revenue: 0, occupiedCount: 0, carCount: 0, bikeCount: 0, occupancyRate: 0, totalCapacity: 0, floorsCount: 0 };
    }

    const buildingFloors = floors.filter(f => f.buildingId === selectedBuildingId);
    const buildingFloorIds = buildingFloors.map(f => f.id);
    const buildingZones = zones.filter(z => buildingFloorIds.includes(z.floorId));
    
    const totalCapacity = buildingZones.reduce((sum, z) => sum + (z.capacity || 0), 0);
    const buildingActiveSessions = activeSessions.filter(s => s.buildingId === selectedBuildingId);
    const occupiedCount = buildingActiveSessions.length;
    
    // Split into car slots (has slotId) and motorbikes (no slotId)
    const carCount = buildingActiveSessions.filter(s => s.slotId !== null && s.slotId !== undefined).length;
    const bikeCount = occupiedCount - carCount;

    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 1000) / 10 : 0;

    // Total daily revenue from API
    const latestRevenueDto = revenueList.find(r => r.vehicleTypeId === null || r.vehicleTypeId === undefined);
    const revenue = latestRevenueDto ? latestRevenueDto.totalRevenue : 0;

    return {
      revenue,
      occupiedCount,
      carCount,
      bikeCount,
      occupancyRate,
      totalCapacity,
      floorsCount: buildingFloors.length,
    };
  }, [selectedBuildingId, floors, zones, activeSessions, revenueList]);

  // Daily revenue chart data (filter total revenue records and sort chronologically)
  const chartData = useMemo(() => {
    const dailyTotals = revenueList
      .filter(r => r.vehicleTypeId === null || r.vehicleTypeName === 'Total Revenue')
      .map(r => ({
        date: new Date(r.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        rawDate: r.startDate,
        val: r.totalRevenue,
      }));
    
    // Sort chronologically
    dailyTotals.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    
    return dailyTotals.slice(-7); // Keep the last 7 days
  }, [revenueList]);

  // Filtered active sessions for the building (representing recent check-ins)
  const activities = useMemo<ActivityLog[]>(() => {
    if (!selectedBuildingId) return [];
    
    return activeSessions
      .filter(s => s.buildingId === selectedBuildingId)
      .slice(0, 5) // Show top 5 active parking sessions
      .map(s => {
        const sessionZone = s.zoneId ? zones.find(z => z.id === s.zoneId) : null;
        const floorName = sessionZone 
          ? (floors.find(f => f.id === sessionZone.floorId)?.name || 'L1') 
          : 'L1';
        return {
          id: s.id.toString(),
          time: new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          plate: s.licensePlateIn,
          type: s.monthlySubscriptionId ? 'subscription' : 'walkin',
          message: s.monthlySubscriptionId ? 'Monthly Subscriber Check-in' : 'Visitor Check-in',
          details: `Vehicle ${s.licensePlateIn} entered floor ${floorName} via Card #${s.cardId}.`
        };
      });
  }, [selectedBuildingId, activeSessions, floors, zones]);

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

          {/* Time indicator */}
          <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Live</div>
              <div className="text-sm font-bold text-slate-700 tabular-nums">{currentTime || '--:--:--'}</div>
            </div>
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

          {/* ── Visual Analytics & Activity Columns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Center Column: Hourly Analytics & Quick Actions */}
            <div className="lg:col-span-2 space-y-8">
              <HourlyTrafficChart chartData={chartData} />
              <QuickLinks />
            </div>

            {/* Right Column: Live Checked-in Vehicles Timeline */}
            <div>
              <RecentActivity activities={activities} />
            </div>

          </div>
        </>
      )}

    </div>
  );
}
