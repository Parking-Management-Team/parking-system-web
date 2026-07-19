'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { ParkingSession, SessionFilter } from '../types';

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

  const loadSupportData = useCallback(async () => {
    try {
      const [cardsRes, zonesRes, slotsRes] = await Promise.all([
        api.get<any>('/cards').catch(() => null),
        api.get<any>('/Zones').catch(() => null),
        api.get<any>('/ParkingSlots').catch(() => null)
      ]);

      const loadedCards = cardsRes?.success && cardsRes.data ? cardsRes.data : (Array.isArray(cardsRes) ? cardsRes : []);
      const loadedZones = zonesRes?.success && zonesRes.data ? zonesRes.data : (Array.isArray(zonesRes) ? zonesRes : []);
      const loadedSlots = slotsRes?.success && slotsRes.data ? slotsRes.data : (Array.isArray(slotsRes) ? slotsRes : []);

      return { cards: loadedCards, zones: loadedZones, slots: loadedSlots };
    } catch (err) {
      console.error('Error fetching support data in hook:', err);
      return { cards: [], zones: [], slots: [] };
    }
  }, []);

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

      let endpoint = '/parking-sessions';
      if (filters.status === 'ACTIVE') {
        endpoint = '/parking-sessions/active';
      }

      const response = await api.get<any>(endpoint);
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

        // If cardCode is resolved, use it for licensePlateIn fallback if empty
        const resolvedLicensePlateIn = item.licensePlateIn || cardCode || '';

        return {
          ...item,
          cardCode,
          slotCode,
          zoneCode,
          licensePlateIn: resolvedLicensePlateIn,
        };
      });

      // Filter locally since Backend handles simple list retrieval
      let filtered = enrichedItems;
      if (filters.buildingId) {
        filtered = filtered.filter((s: any) => s.buildingId === filters.buildingId);
      }
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((s: any) => (s.sessionStatus || '').toUpperCase() === filters.status?.toUpperCase());
      }
      if (filters.search) {
        const searchVal = filters.search.trim().toLowerCase();
        filtered = filtered.filter((s: any) => 
          (s.licensePlateIn || '').toLowerCase().includes(searchVal) ||
          (s.licensePlateOut || '').toLowerCase().includes(searchVal) ||
          (s.slotCode || '').toLowerCase().includes(searchVal) ||
          (s.cardCode || '').toLowerCase().includes(searchVal) ||
          String(s.id).includes(searchVal)
        );
      }

      // Sort by check-in time descending (most recent first)
      filtered.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

      const count = filtered.length;
      const pSize = filters.pageSize;
      const pageIdx = filters.pageIndex;
      const tPages = Math.max(1, Math.ceil(count / pSize));
      const sliced = filtered.slice((pageIdx - 1) * pSize, pageIdx * pSize);

      // Map response to unified ParkingSession format
      const mappedItems: ParkingSession[] = sliced.map((item: any) => {
        return {
          id: item.id,
          vehicleId: item.vehicleId,
          accountId: item.accountId,
          buildingId: item.buildingId,
          cardId: item.cardId,
          zoneId: item.zoneId,
          slotId: item.slotId,
          bookingId: item.bookingId,
          bookingCode: item.bookingCode,
          monthlySubscriptionId: item.monthlySubscriptionId,
          inStaffId: item.inStaffId,
          outStaffId: item.outStaffId,
          checkInTime: item.checkInTime || '',
          checkOutTime: item.checkOutTime,
          licensePlateIn: item.licensePlateIn,
          licensePlateOut: item.licensePlateOut,
          sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
          cardCode: item.cardCode || '',
          zoneCode: item.zoneCode || '',
          slotCode: item.slotCode || '',
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

      setSessions(mappedItems);
      setTotalCount(count);
      setTotalPages(tPages);
      setPageIndex(pageIdx);
      setPageSize(pSize);

    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err?.message || 'Failed to retrieve parking sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [cards, zones, slots, hasLoadedSupport, loadSupportData]);

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

      const res = await api.get<any>(`/parking-sessions/by-vehicle/${vehicleId}`);
      const items = Array.isArray(res) ? res : res.data || [];
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

      const res = await api.get<any>(`/parking-sessions/by-account/${accountId}`);
      const responseData = res && res.success && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : res.data || []);
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
