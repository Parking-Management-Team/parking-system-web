'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building } from '@/lib/types/building.types';
import { Floor, Zone, Slot, ParkingSessionDto, FloorSlotSummary } from '../types';
import { parkingMapService } from '../services/parkingMapService';

/**
 * Custom Hook `useParkingMap`
 * Đóng gói toàn bộ logic quản lý state, fetch dữ liệu realtime, tự động polling và xử lý sự kiện
 * cho màn hình sơ đồ bãi đỗ xe (Slot Management Dashboard).
 */
export function useParkingMap() {
  // ─── State Dữ liệu Hạ tầng ──────────────────────────────────────────
  const [buildings, setBuildings] = useState<Building[]>([]); // Danh sách tòa nhà
  const [floors, setFloors] = useState<Floor[]>([]); // Danh sách các tầng
  const [zones, setZones] = useState<Zone[]>([]); // Danh sách khu vực trong tầng
  const [slots, setSlots] = useState<Slot[]>([]); // Danh sách ô đỗ ô tô/xe máy
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]); // Danh sách phương tiện đang gửi
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]); // Các loại xe được hỗ trợ

  // State lựa chọn hiển thị
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null); // Tòa nhà đang chọn
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null); // Tầng đang chọn
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map'); // Tab hiển thị (Bản đồ / Danh sách phiên đỗ)

  // State Giao diện & Thông báo
  const [loading, setLoading] = useState(false); // Trạng thái đang tải dữ liệu
  const [tableSearchQuery, setTableSearchQuery] = useState(''); // Từ khóa tìm kiếm trong bảng danh sách
  const [tableTypeFilter, setTableTypeFilter] = useState('All'); // Bộ lọc loại xe trong bảng
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null); // Thông báo popup

  // State Hộp thoại Modal làm việc với Ô đỗ (Slot Action Modal)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null); // Ô đỗ đang được chọn để thao tác
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái đóng/mở modal ô đỗ

  // State Hộp thoại Modal xem chi tiết phiên đỗ xe (Session Details Modal)
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<ParkingSessionDto | null>(null);
  const [completingSessionId, setCompletingSessionId] = useState<number | null>(null); // ID phiên đang được cưỡng chế giải phóng

  // Cấu hình đồng bộ dữ liệu Realtime (Polling)
  const POLL_INTERVAL_MS = 10_000; // Tự động làm mới dữ liệu mỗi 10 giây
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // Thời điểm cập nhật dữ liệu gần nhất
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State Tổng quan số lượng slot theo tầng lấy từ API
  const [floorSlotSummary, setFloorSlotSummary] = useState<FloorSlotSummary | null>(null);

  /**
   * Hàm hiển thị thông báo Toast nhanh trên màn hình
   */
  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Fetch Dữ liệu Hạ tầng Ban đầu ───────────────────────────────
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 0. Lấy danh sách loại phương tiện
      const loadedVehicleTypes = await parkingMapService.getVehicleTypes();
      setVehicleTypes(loadedVehicleTypes);

      // 1. Lấy danh sách tòa nhà
      const loadedBuildings = await parkingMapService.getBuildings();
      setBuildings(loadedBuildings);

      // 2. Lấy danh sách tầng
      const loadedFloors = await parkingMapService.getFloors();
      setFloors(loadedFloors);

      // 3. Lấy danh sách các zone (khu vực)
      const loadedZones = await parkingMapService.getZones(loadedVehicleTypes);
      setZones(loadedZones);

      // Tự động chọn tòa nhà và tầng đầu tiên làm mặc định
      if (loadedBuildings.length > 0) {
        const firstBld = loadedBuildings[0];
        setSelectedBuildingId(firstBld.id);

        const bldFloors = loadedFloors.filter((f) => f.buildingId === firstBld.id);
        if (bldFloors.length > 0) {
          setSelectedFloorId(bldFloors[0].id);
        }
      }
    } catch (err) {
      console.error('Không thể tải hạ tầng bãi đỗ xe:', err);
      showToastMessage('Không thể tải hạ tầng từ máy chủ.', 'error');
      setBuildings([]);
      setFloors([]);
      setZones([]);
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
    } finally {
      setLoading(false);
    }
  }, [showToastMessage]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ─── Tải Thông tin Tóm tắt Slot theo Tầng ────────────────────────
  const fetchSlotSummary = useCallback(async () => {
    if (!selectedBuildingId || !selectedFloorId) return;
    try {
      const mappedSummaries = await parkingMapService.getSlotSummary(selectedBuildingId);
      const summary = mappedSummaries.find((s) => s.floorId === selectedFloorId);
      setFloorSlotSummary(summary || null);
    } catch (err) {
      console.error('Không thể tải tóm tắt slot:', err);
      setFloorSlotSummary(null);
    }
  }, [selectedBuildingId, selectedFloorId]);

  useEffect(() => {
    fetchSlotSummary();
  }, [fetchSlotSummary]);

  // ─── Tải Danh sách Ô đỗ và Phiên làm việc theo Tầng đang chọn ────
  const fetchSlotsForFloor = useCallback(async () => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const floorZones = zones.filter((z) => z.floorId === selectedFloorId);
      const activeSess = await parkingMapService.getActiveSessions();
      setActiveSessions(activeSess);

      // Lấy song song ô đỗ cho từng zone trong tầng
      const zoneSlotsPromises = floorZones.map((zone) =>
        parkingMapService
          .getSlotsForZone(zone, selectedFloorId, selectedBuildingId || 0, activeSess)
          .catch((err) => {
            console.error(`Lỗi tải slots cho zone ${zone.id}:`, err);
            return [] as Slot[];
          })
      );

      const results = await Promise.all(zoneSlotsPromises);
      setSlots(results.flat());
    } catch (err) {
      console.error('Không thể tải các vị trí đỗ:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFloorId, zones, selectedBuildingId]);

  useEffect(() => {
    fetchSlotsForFloor();
  }, [fetchSlotsForFloor]);

  // ─── Đồng bộ dữ liệu định kỳ (Realtime Polling) ─────────────────
  const refreshSlotsAndSessions = useCallback(async () => {
    if (!selectedFloorId) return;
    try {
      const floorZones = zones.filter((z) => z.floorId === selectedFloorId);
      const activeSess = await parkingMapService.getActiveSessions();
      setActiveSessions(activeSess);

      const zoneSlotsPromises = floorZones.map((zone) =>
        parkingMapService
          .getSlotsForZone(zone, selectedFloorId, selectedBuildingId || 0, activeSess)
          .catch(() => [] as Slot[])
      );

      const results = await Promise.all(zoneSlotsPromises);
      setSlots(results.flat());
      setLastUpdated(new Date());

      if (selectedBuildingId) {
        const mappedSummaries = await parkingMapService
          .getSlotSummary(selectedBuildingId)
          .catch(() => []);
        const summary = mappedSummaries.find((s) => s.floorId === selectedFloorId);
        setFloorSlotSummary(summary || null);
      }
    } catch {
      /* Bỏ qua lỗi ngầm khi polling */
    }
  }, [selectedFloorId, zones, selectedBuildingId]);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedFloorId) return;
    pollingRef.current = setInterval(refreshSlotsAndSessions, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [refreshSlotsAndSessions, selectedFloorId]);

  // ─── Các Giá trị Tính toán Động (Derived States) ──────────────────

  // Danh sách các tầng thuộc tòa nhà đang chọn
  const activeFloors = useMemo(() => {
    if (!selectedBuildingId) return [];
    return floors.filter((f) => f.buildingId === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  // Các zone đỗ Ô tô thuộc tầng đang chọn
  const activeCarZones = useMemo(() => {
    if (!selectedFloorId) return [];
    return zones.filter((z) => z.floorId === selectedFloorId && z.vehicleType !== 'Motorbike');
  }, [zones, selectedFloorId]);

  // Các zone đỗ Xe máy thuộc tầng đang chọn
  const activeMotorbikeZones = useMemo(() => {
    if (!selectedFloorId) return [];
    return zones.filter((z) => z.floorId === selectedFloorId && z.vehicleType === 'Motorbike');
  }, [zones, selectedFloorId]);

  // Tóm tắt thông số khu vực xe máy của tầng
  const motorSummary = useMemo(() => {
    if (!floorSlotSummary) return null;
    return (
      floorSlotSummary.vehicleTypeSummaries.find((vt) => {
        const name = (vt.vehicleTypeName || '').toUpperCase();
        return name.includes('MOTOR') || name.includes('BIKE');
      }) || null
    );
  }, [floorSlotSummary]);

  // Tính tổng sức chứa chỗ đỗ xe máy thực tế của tầng
  const effectiveMotorTotal = useMemo(() => {
    const floorMotorSlots = slots.filter((s) => {
      const zone = zones.find((z) => z.id === s.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    });

    if (floorMotorSlots.length > 0) {
      return floorMotorSlots.length;
    }

    if (motorSummary) {
      return motorSummary.totalSlots ?? 0;
    }

    return activeMotorbikeZones.reduce((sum, z) => sum + (z.slotCapacity || 0), 0);
  }, [slots, zones, selectedFloorId, motorSummary, activeMotorbikeZones]);

  // Tính số lượng xe máy đang đỗ thực tế
  const effectiveMotorOccupied = useMemo(() => {
    const floorMotorSlots = slots.filter((s) => {
      const zone = zones.find((z) => z.id === s.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    });

    const occupiedSlotsCount = floorMotorSlots.filter((s) => s.status === 'OCCUPIED').length;

    const activeSessionsCount = activeSessions.filter((session) => {
      const zone = zones.find((z) => z.id === session.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    }).length;

    const count = Math.max(occupiedSlotsCount, activeSessionsCount);

    if (count > 0) {
      return count;
    }

    if (motorSummary) {
      return motorSummary.statusCounts?.Occupied ?? 0;
    }

    return 0;
  }, [slots, zones, selectedFloorId, motorSummary, activeSessions]);

  // Tính số chỗ đỗ xe máy còn trống
  const effectiveMotorAvailable = useMemo(() => {
    return Math.max(0, effectiveMotorTotal - effectiveMotorOccupied);
  }, [effectiveMotorTotal, effectiveMotorOccupied]);

  // ─── Các Hàm Xử lý Sự kiện (Event Handlers) ──────────────────────

  // Đổi tòa nhà được chọn
  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bldId = parseInt(e.target.value);
    setSelectedBuildingId(bldId);

    const bldFloors = floors.filter((f) => f.buildingId === bldId);
    if (bldFloors.length > 0) {
      setSelectedFloorId(bldFloors[0].id);
    } else {
      setSelectedFloorId(null);
    }
  };

  // Đổi tầng được chọn
  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFloorId(parseInt(e.target.value));
  };

  // Mở modal khi người dùng click vào ô đỗ
  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  // Đóng modal ô đỗ
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  // Callback xử lý sau khi cập nhật trạng thái ô đỗ thành công từ Modal
  const handleSlotUpdated = useCallback(
    async (
      slotId: number,
      newStatus: Slot['status'],
      assignedVehicle?: Slot['assignedVehicle']
    ) => {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id === slotId) {
            return {
              ...s,
              status: newStatus,
              assignedVehicle,
            };
          }
          return s;
        })
      );
      await refreshSlotsAndSessions();
      setTimeout(() => {
        refreshSlotsAndSessions();
      }, 1000);
    },
    [refreshSlotsAndSessions]
  );

  // Bộ lọc danh sách các phiên đỗ xe theo từ khóa và loại xe
  const filteredSessions = useMemo(() => {
    return activeSessions.filter((session) => {
      const zone = zones.find((z) => z.id === session.zoneId);
      if (!zone || zone.floorId !== selectedFloorId) return false;

      const slot = slots.find((s) => s.id === session.slotId);
      const slotCode = slot ? slot.slotCode : '';
      const plate = session.licensePlateIn || '';
      const subText = session.bookingId ? `BOOKING-${session.bookingId}` : 'WALK-IN';

      const searchMatch =
        slotCode.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        plate.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        subText.toLowerCase().includes(tableSearchQuery.toLowerCase());

      if (tableTypeFilter === 'All') return searchMatch;
      if (tableTypeFilter === 'Motorbike') return searchMatch && zone.vehicleType === 'Motorbike';
      return searchMatch && slot?.slotType === tableTypeFilter;
    });
  }, [activeSessions, zones, selectedFloorId, slots, tableSearchQuery, tableTypeFilter]);

  // Cưỡng chế kết thúc phiên gửi xe (dành cho quản lý)
  const handleForceCompleteSession = async (sessionId: number) => {
    const isConfirmed = window.confirm(
      'CẢNH BÁO: Bạn có chắc chắn muốn giải phóng phiên đỗ xe này không?\n\n' +
        'Hành động này sẽ kết thúc phiên gửi xe và giải phóng vị trí đỗ ngay lập tức trên hệ thống mà không qua cổng kiểm soát ra. Vui lòng đảm bảo xe đã di chuyển ra ngoài hoặc đã thanh toán trực tiếp.'
    );
    if (!isConfirmed) return;

    setCompletingSessionId(sessionId);
    try {
      await parkingMapService.forceCompleteSession(sessionId);
      showToastMessage('Đã kết thúc phiên đỗ xe và giải phóng vị trí đỗ thành công.');
      setSelectedSessionDetails(null);
      await fetchSlotsForFloor();
    } catch (err) {
      console.error(err);
      showToastMessage('Không thể kết thúc phiên đỗ xe.', 'error');
    } finally {
      setCompletingSessionId(null);
    }
  };

  return {
    // Dữ liệu hạ tầng và slot
    buildings,
    floors,
    zones,
    slots,
    activeSessions,
    vehicleTypes,

    // Lựa chọn & Tab
    selectedBuildingId,
    setSelectedBuildingId,
    selectedFloorId,
    setSelectedFloorId,
    activeTab,
    setActiveTab,

    // Trạng thái Giao diện
    loading,
    lastUpdated,
    toast,
    showToastMessage,
    tableSearchQuery,
    setTableSearchQuery,
    tableTypeFilter,
    setTableTypeFilter,

    // Hộp thoại Modals
    selectedSlot,
    isModalOpen,
    handleSlotClick,
    handleCloseModal,
    handleSlotUpdated,
    selectedSessionDetails,
    setSelectedSessionDetails,
    completingSessionId,
    handleForceCompleteSession,

    // Hàm hành động
    refreshSlotsAndSessions,
    handleBuildingChange,
    handleFloorChange,

    // Tính toán & Bộ lọc
    floorSlotSummary,
    activeFloors,
    activeCarZones,
    activeMotorbikeZones,
    effectiveMotorTotal,
    effectiveMotorOccupied,
    effectiveMotorAvailable,
    filteredSessions,
  };
}
