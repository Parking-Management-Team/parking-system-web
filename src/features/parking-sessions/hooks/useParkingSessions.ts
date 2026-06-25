'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';
import { ParkingSession, SessionFilter } from '../types';

export function useParkingSessions() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (filters: SessionFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pageIndex', filters.pageIndex.toString());
      params.append('pageSize', filters.pageSize.toString());
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.buildingId) params.append('buildingId', filters.buildingId.toString());
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      let rawData: any = null;
      let isFallback = false;

      try {
        const response = await api.get<any>(`/parking-sessions/history?${params.toString()}`);
        if (response && response.success && response.data) {
          rawData = response.data;
        } else if (response && response.items) {
          rawData = response;
        } else if (Array.isArray(response)) {
          rawData = { items: response, totalCount: response.length };
        } else if (response && response.data && Array.isArray(response.data)) {
          rawData = { items: response.data, totalCount: response.data.length };
        }
      } catch (historyErr) {
        console.warn('Advanced history endpoint failed, falling back to general parking-sessions endpoint:', historyErr);
        isFallback = true;
      }

      if (isFallback || !rawData) {
        // Fallback to general list and filter locally
        const fallbackRes = await api.get<any>('/parking-sessions');
        const items = Array.isArray(fallbackRes) ? fallbackRes : fallbackRes.data || [];
        
        let filtered = items;
        if (filters.status && filters.status !== 'ALL') {
          filtered = filtered.filter((s: any) => (s.sessionStatus || '').toUpperCase() === filters.status?.toUpperCase());
        }
        if (filters.buildingId) {
          filtered = filtered.filter((s: any) => s.buildingId === filters.buildingId);
        }
        if (filters.search) {
          const searchVal = filters.search.trim().toLowerCase();
          filtered = filtered.filter((s: any) => 
            (s.licensePlateIn || '').toLowerCase().includes(searchVal) ||
            (s.slotCode || '').toLowerCase().includes(searchVal) ||
            (s.cardCode || '').toLowerCase().includes(searchVal)
          );
        }

        const count = filtered.length;
        const pSize = filters.pageSize;
        const pageIdx = filters.pageIndex;
        const tPages = Math.max(1, Math.ceil(count / pSize));
        const sliced = filtered.slice((pageIdx - 1) * pSize, pageIdx * pSize);

        rawData = {
          items: sliced,
          totalCount: count,
          totalPages: tPages,
          pageIndex: pageIdx,
          pageSize: pSize
        };
      }

      // Map response to unified ParkingSession format
      const mappedItems: ParkingSession[] = (rawData.items || []).map((item: any) => ({
        id: item.id,
        licensePlateIn: item.licensePlateIn || item.licensePlate || '',
        licensePlateOut: item.licensePlateOut,
        checkInTime: item.checkInTime || '',
        checkOutTime: item.checkOutTime,
        slotCode: item.slotCode,
        zoneCode: item.zoneCode,
        sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
        buildingName: item.buildingName || 'Building',
        buildingId: item.buildingId,
        totalFee: item.totalFee || item.fee || 0,
        cardCode: item.cardCode || item.cardId?.toString(),
        vehicleType: item.vehicleType || (item.slotCode?.startsWith('M') ? 'Motorbike' : 'Car'),
      }));

      setSessions(mappedItems);
      setTotalCount(rawData.totalCount || mappedItems.length);
      setTotalPages(rawData.totalPages || Math.ceil(mappedItems.length / filters.pageSize));
      setPageIndex(rawData.pageIndex || filters.pageIndex);
      setPageSize(rawData.pageSize || filters.pageSize);

    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err?.message || 'Failed to retrieve parking sessions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessionByVehicle = useCallback(async (vehicleId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/parking-sessions/by-vehicle/${vehicleId}`);
      const items = Array.isArray(res) ? res : res.data || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        licensePlateIn: item.licensePlateIn || item.licensePlate || '',
        checkInTime: item.checkInTime || '',
        checkOutTime: item.checkOutTime,
        slotCode: item.slotCode,
        zoneCode: item.zoneCode,
        sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
        buildingName: item.buildingName || 'Building',
        totalFee: item.totalFee || 0,
        cardCode: item.cardCode,
      }));
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
  }, []);

  const fetchSessionByAccount = useCallback(async (accountId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/parking-sessions/by-account/${accountId}`);
      const items = Array.isArray(res) ? res : res.data || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        licensePlateIn: item.licensePlateIn || item.licensePlate || '',
        checkInTime: item.checkInTime || '',
        checkOutTime: item.checkOutTime,
        slotCode: item.slotCode,
        zoneCode: item.zoneCode,
        sessionStatus: item.sessionStatus || (item.checkOutTime ? 'COMPLETED' : 'ACTIVE'),
        buildingName: item.buildingName || 'Building',
        totalFee: item.totalFee || 0,
        cardCode: item.cardCode,
      }));
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
  }, []);

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
