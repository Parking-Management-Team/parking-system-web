import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { FloorResponse, ZoneResponse, ParkingSessionDto } from '@/features/parking-map/types';
import type { DashboardStats, ActivityLog } from '../index';

export interface RevenueStatisticDto {
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

export function useManagerDashboard() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [revenueList, setRevenueList] = useState<RevenueStatisticDto[]>([]);

  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active sessions only
  const fetchActiveSessions = useCallback(async () => {
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
  }, []);

  // Fetch daily revenue stats for a selected building
  const fetchRevenue = useCallback(async (buildingId: number | null) => {
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
  }, []);

  // Initial dashboard load
  const fetchDashboardData = useCallback(async () => {
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

      // Set default building
      if (loadedBuildings.length > 0) {
        const defaultBldId = loadedBuildings[0].id;
        setSelectedBuildingId(defaultBldId);
        await fetchRevenue(defaultBldId);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchActiveSessions, fetchRevenue]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchRevenue(selectedBuildingId);
    }
  }, [selectedBuildingId, fetchRevenue]);

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSessions();
      if (selectedBuildingId) {
        fetchRevenue(selectedBuildingId);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedBuildingId, fetchActiveSessions, fetchRevenue]);

  // Derived stats
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

    return {
      revenue,
      occupiedCount,
      occupancyRate,
      totalCapacity,
      floorsCount: buildingFloors.length,
      todaySessions: latestRevenueDto?.totalSessions ?? 0,
    };
  }, [selectedBuildingId, floors, zones, activeSessions, revenueList]);

  // Chart data for daily revenue
  const chartData = useMemo(() => {
    const dailyTotals = revenueList
      .filter(r => r.vehicleTypeId === null || r.vehicleTypeId === undefined || r.vehicleTypeName === 'Total Revenue')
      .map(r => ({
        date: new Date(r.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        rawDate: r.startDate,
        val: r.totalRevenue,
      }));

    dailyTotals.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    return dailyTotals.slice(-7);
  }, [revenueList]);

  // Recent activity logs
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

  return {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    loading,
    stats,
    chartData,
    activities,
    refetchData: fetchDashboardData,
  };
}
