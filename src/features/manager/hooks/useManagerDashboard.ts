/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useManagerDashboard.ts - HOOK ĐIỀU HÀNH TRANG DASHBOARD DÀNH CHO MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Tải và quản lý toàn bộ dữ liệu thời gian thực (realtime) cho trang Dashboard Manager:
 * - Gọi các API thông qua Tầng Service: `managerService.dashboard.*`
 * - Tính toán thống kê tổng quan (DashboardStats), biểu đồ doanh thu theo ngày (chartData) và hoạt động vào/ra mới nhất (activities).
 * - Tự động polling cập nhật dữ liệu mỗi 30 giây.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Building } from '@/lib/types/building.types';
import { FloorResponse, ZoneResponse, ParkingSessionDto } from '@/features/parking-map/types';
import type { DashboardStats, ActivityLog } from '../index';
import { managerService, RevenueStatisticDto } from '../services/manager.service';

export function useManagerDashboard() {
  // Danh sách tòa nhà quản lý
  const [buildings, setBuildings] = useState<Building[]>([]);
  // Danh sách tất cả tầng trong hệ thống
  const [floors, setFloors] = useState<FloorResponse[]>([]);
  // Danh sách tất cả khu vực đỗ xe (zones) trong hệ thống
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  // Danh sách các phiên gửi xe đang hoạt động (active)
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  // Danh sách dữ liệu thống kê doanh thu từ API
  const [revenueList, setRevenueList] = useState<RevenueStatisticDto[]>([]);

  // Tòa nhà đang được người dùng lựa chọn trên dropdown
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  // Trạng thái đang tải dữ liệu ban đầu
  const [loading, setLoading] = useState(true);

  /**
   * Lấy danh sách các phiên đỗ xe đang active từ Service
   */
  const fetchActiveSessions = useCallback(async () => {
    try {
      const loadedSessions = await managerService.dashboard.getActiveSessions();
      setActiveSessions(loadedSessions);
    } catch (err) {
      console.error('Lỗi khi tải phiên gửi xe active:', err);
    }
  }, []);

  /**
   * Lấy thống kê doanh thu theo ngày từ Service cho tòa nhà đang chọn
   */
  const fetchRevenue = useCallback(async (buildingId: number | null) => {
    if (!buildingId) return;
    try {
      const items = await managerService.dashboard.getRevenue(buildingId);
      setRevenueList(items);
    } catch (err) {
      console.error('Lỗi khi tải thống kê doanh thu:', err);
      setRevenueList([]);
    }
  }, []);

  /**
   * Tải toàn bộ cấu trúc hạ tầng (Tòa nhà, Tầng, Khu vực) và các phiên đỗ xe lần đầu thông qua Service
   */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Tải danh sách Tòa nhà
      const loadedBuildings = await managerService.dashboard.getBuildings();
      setBuildings(loadedBuildings);

      // 2. Tải danh sách Tầng
      const loadedFloors = await managerService.dashboard.getFloors();
      setFloors(loadedFloors);

      // 3. Tải danh sách Khu vực (Zones)
      const loadedZones = await managerService.dashboard.getZones();
      setZones(loadedZones);

      // 4. Tải các phiên đỗ xe active
      await fetchActiveSessions();

      // Đặt tòa nhà mặc định đầu tiên nếu có
      if (loadedBuildings.length > 0) {
        const defaultBldId = loadedBuildings[0].id;
        setSelectedBuildingId(defaultBldId);
        await fetchRevenue(defaultBldId);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchActiveSessions, fetchRevenue]);

  // Trigger tải dữ liệu ban đầu
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Cập nhật thống kê doanh thu mỗi khi chọn tòa nhà khác
  useEffect(() => {
    if (selectedBuildingId) {
      fetchRevenue(selectedBuildingId);
    }
  }, [selectedBuildingId, fetchRevenue]);

  // Polling tự động làm mới dữ liệu realtime mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSessions();
      if (selectedBuildingId) {
        fetchRevenue(selectedBuildingId);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedBuildingId, fetchActiveSessions, fetchRevenue]);

  /**
   * Tính toán chỉ số thống kê tổng quan (DashboardStats) dựa trên tòa nhà đang chọn
   */
  const stats = useMemo<DashboardStats>(() => {
    if (!selectedBuildingId) {
      return { revenue: 0, occupiedCount: 0, occupancyRate: 0, totalCapacity: 0, floorsCount: 0, todaySessions: 0 };
    }

    // Lọc các tầng và zone thuộc tòa nhà đang chọn
    const buildingFloors = floors.filter(f => f.buildingId === selectedBuildingId);
    const buildingFloorIds = buildingFloors.map(f => f.id);
    const buildingZones = zones.filter(z => buildingFloorIds.includes(z.floorId));
    // Tính tổng số ô đỗ (capacity) của tòa nhà
    const totalCapacity = buildingZones.reduce((sum, z) => sum + (z.capacity || 0), 0);

    // Đếm số xe đang đỗ trong tòa nhà
    const buildingActiveSessions = activeSessions.filter(s => s.buildingId === selectedBuildingId);
    const occupiedCount = buildingActiveSessions.length;
    // Tính tỉ lệ lấp đầy %
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 1000) / 10 : 0;

    // Lấy doanh thu của ngày mới nhất
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

  /**
   * Xử lý dữ liệu vẽ biểu đồ doanh thu 7 ngày gần nhất
   */
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

  /**
   * Lịch sử lượt xe check-in mới nhất trong tòa nhà (Tối đa 10 lượt)
   */
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
