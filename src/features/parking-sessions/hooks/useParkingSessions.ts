/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useParkingSessions.ts - HOOK QUẢN LÝ VÀ TRA CỨU PHIÊN GỬI XE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State cho danh sách phiên đỗ xe, hỗ trợ phân trang, lọc và làm giàu dữ liệu (enrich data).
 * Gọi API thông qua Tầng Service: `parkingSessionService.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { ParkingSession, SessionFilter } from '../types';
import { parkingSessionService } from '../services/parkingSession.service';

export function useParkingSessions() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [hasLoadedSupport, setHasLoadedSupport] = useState(false);

  /**
   * Gọi Service tải đồng thời dữ liệu bổ trợ (Cards, Zones, Slots)
   */
  const loadSupportData = useCallback(async () => {
    return await parkingSessionService.getSupportData();
  }, []);

  /**
   * Gọi Service lấy danh sách các phiên đỗ xe và áp dụng bộ lọc client-side / enrich data
   */
  const fetchSessions = useCallback(async (filters: SessionFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      let currentCards = cards;
      let currentZones = zones;
      let currentSlots = slots;

      if (!hasLoadedSupport) {
        const support = await loadSupportData();
        currentCards = support.cards;
        currentZones = support.zones;
        currentSlots = support.slots;
        setCards(support.cards);
        setZones(support.zones);
        setSlots(support.slots);
        setHasLoadedSupport(true);
      }

      const isActiveOnly = filters.status === 'ACTIVE';
      const response = await parkingSessionService.getSessions(isActiveOnly);

      let items: any[] = [];
      if (response && response.success && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      }

      // Enrich items with support data
      const enrichedItems = items.map((item: any) => {
        const cardObj = currentCards.find((c: any) => c.id === item.cardId);
        const slotObj = currentSlots.find((s: any) => s.id === item.slotId);
        const zoneObj = currentZones.find((z: any) => z.id === (slotObj?.zoneId || item.zoneId));

        const cardCode = cardObj?.cardCode || item.cardCode || '';
        const slotCode = slotObj?.code || item.slotCode || '';
        const zoneCode = zoneObj?.code || item.zoneCode || '';

        return {
          id: item.id,
          vehicleId: item.vehicleId,
          accountId: item.accountId,
          buildingId: item.buildingId,
          cardId: item.cardId,
          zoneId: item.zoneId,
          slotId: item.slotId,
          checkInTime: item.checkInTime || '',
          checkOutTime: item.checkOutTime,
          licensePlateIn: item.licensePlateIn || cardCode || '',
          licensePlateOut: item.licensePlateOut,
          sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
          cardCode,
          zoneCode,
          slotCode,
          totalFee: item.totalFee,
          penaltyFee: item.penaltyFee,
          amountDue: item.amountDue,
          imageIn: item.imageIn,
          imageOut: item.imageOut,
          vehicleType: item.vehicleType || 'CAR',
          customerType: item.customerType || 'WALK_IN',
          buildingName: item.buildingName || 'Building',
        };
      });

      // Filter Client Side
      let filtered = enrichedItems;

      if (filters.buildingId && filters.buildingId !== ('ALL' as any)) {
        filtered = filtered.filter((s: any) => s.buildingId === filters.buildingId);
      }

      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((s: any) => s.sessionStatus === filters.status);
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter((s: any) =>
          (s.licensePlateIn && s.licensePlateIn.toLowerCase().includes(term)) ||
          (s.cardCode && s.cardCode.toLowerCase().includes(term)) ||
          (s.slotCode && s.slotCode.toLowerCase().includes(term)) ||
          s.id.toString().includes(term)
        );
      }

      if (filters.fromDate) {
        const from = new Date(filters.fromDate).getTime();
        filtered = filtered.filter((s: any) => new Date(s.checkInTime).getTime() >= from);
      }

      if (filters.toDate) {
        const to = new Date(filters.toDate).getTime();
        filtered = filtered.filter((s: any) => new Date(s.checkInTime).getTime() <= to);
      }

      // Pagination
      const count = filtered.length;
      const pages = Math.ceil(count / (filters.pageSize || 10)) || 1;
      const currPage = filters.pageIndex || 1;

      const startIndex = (currPage - 1) * (filters.pageSize || 10);
      const paginatedItems = filtered.slice(startIndex, startIndex + (filters.pageSize || 10));

      setSessions(paginatedItems);
      setTotalCount(count);
      setTotalPages(pages);
      setPageIndex(currPage);
      setPageSize(filters.pageSize || 10);
    } catch (err: any) {
      console.error('Error fetching parking sessions:', err);
      setError(err?.message || 'Failed to fetch parking sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [cards, zones, slots, hasLoadedSupport, loadSupportData]);

  /**
   * Tra cứu phiên đỗ xe theo Vehicle ID từ Service
   */
  const fetchSessionByVehicle = useCallback(async (vehicleId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let currentCards = cards;
      let currentZones = zones;
      let currentSlots = slots;

      if (!hasLoadedSupport) {
        const support = await loadSupportData();
        currentCards = support.cards;
        currentZones = support.zones;
        currentSlots = support.slots;
        setCards(support.cards);
        setZones(support.zones);
        setSlots(support.slots);
        setHasLoadedSupport(true);
      }

      const items = await parkingSessionService.getByVehicle(vehicleId);
      const mapped: ParkingSession[] = items.map((item: any) => {
        const cardObj = currentCards.find((c: any) => c.id === item.cardId);
        const slotObj = currentSlots.find((s: any) => s.id === item.slotId);
        const zoneObj = currentZones.find((z: any) => z.id === (slotObj?.zoneId || item.zoneId));

        const cardCode = cardObj?.cardCode || item.cardCode || '';
        const slotCode = slotObj?.code || item.slotCode || '';
        const zoneCode = zoneObj?.code || item.zoneCode || '';

        return {
          id: item.id,
          vehicleId: item.vehicleId,
          accountId: item.accountId,
          buildingId: item.buildingId,
          cardId: item.cardId,
          zoneId: item.zoneId,
          slotId: item.slotId,
          checkInTime: item.checkInTime || '',
          checkOutTime: item.checkOutTime,
          licensePlateIn: item.licensePlateIn || cardCode || '',
          licensePlateOut: item.licensePlateOut,
          sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
          cardCode,
          zoneCode,
          slotCode,
          totalFee: item.totalFee,
          penaltyFee: item.penaltyFee,
          amountDue: item.amountDue,
          imageIn: item.imageIn,
          imageOut: item.imageOut,
          vehicleType: item.vehicleType || 'CAR',
          customerType: item.customerType || 'WALK_IN',
          buildingName: item.buildingName || 'Building',
        };
      });
      setSessions(mapped);
      setTotalCount(mapped.length);
      setTotalPages(1);
      setPageIndex(1);
    } catch (err: any) {
      console.error('Error fetching by vehicle:', err);
      setError(err?.message || 'Failed to fetch sessions by vehicle.');
    } finally {
      setIsLoading(false);
    }
  }, [cards, zones, slots, hasLoadedSupport, loadSupportData]);

  /**
   * Tra cứu phiên đỗ xe theo Account ID từ Service
   */
  const fetchSessionByAccount = useCallback(async (accountId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let currentCards = cards;
      let currentZones = zones;
      let currentSlots = slots;

      if (!hasLoadedSupport) {
        const support = await loadSupportData();
        currentCards = support.cards;
        currentZones = support.zones;
        currentSlots = support.slots;
        setCards(support.cards);
        setZones(support.zones);
        setSlots(support.slots);
        setHasLoadedSupport(true);
      }

      const responseData = await parkingSessionService.getByAccount(accountId);
      const mapped: ParkingSession[] = responseData.map((item: any) => {
        const cardObj = currentCards.find((c: any) => c.id === item.cardId);
        const slotObj = currentSlots.find((s: any) => s.id === item.slotId);
        const zoneObj = currentZones.find((z: any) => z.id === (slotObj?.zoneId || item.zoneId));

        const cardCode = cardObj?.cardCode || item.cardCode || '';
        const slotCode = slotObj?.code || item.slotCode || '';
        const zoneCode = zoneObj?.code || item.zoneCode || '';

        return {
          id: item.id,
          vehicleId: item.vehicleId,
          accountId: item.accountId,
          buildingId: item.buildingId,
          cardId: item.cardId,
          zoneId: item.zoneId,
          slotId: item.slotId,
          checkInTime: item.checkInTime || '',
          checkOutTime: item.checkOutTime,
          licensePlateIn: item.licensePlateIn || cardCode || '',
          licensePlateOut: item.licensePlateOut,
          sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
          cardCode,
          zoneCode,
          slotCode,
          totalFee: item.totalFee,
          penaltyFee: item.penaltyFee,
          amountDue: item.amountDue,
          imageIn: item.imageIn,
          imageOut: item.imageOut,
          vehicleType: item.vehicleType || 'CAR',
          customerType: item.customerType || 'WALK_IN',
          buildingName: item.buildingName || 'Building',
        };
      });
      setSessions(mapped);
      setTotalCount(mapped.length);
      setTotalPages(1);
      setPageIndex(1);
    } catch (err: any) {
      console.error('Error fetching by account:', err);
      setError(err?.message || 'Failed to fetch sessions by account.');
    } finally {
      setIsLoading(false);
    }
  }, [cards, zones, slots, hasLoadedSupport, loadSupportData]);

  return {
    sessions,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    isLoading,
    error,
    fetchSessions,
    fetchSessionByVehicle,
    fetchSessionByAccount,
  };
}
