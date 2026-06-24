'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse, PagedResult } from '@/lib/types/building.types';
import { useAuth } from '@/features/auth';
import {
  MonthlySubscription,
  SubscriptionFilter,
  RegisterSubscriptionRequest,
  UpdateCardRequest,
} from '../types';

interface ApiErrorLike {
  status?: number;
  message?: string;
  name?: string;
  data?: {
    message?: string;
    errors?: Record<string, string[] | string> | string[];
  };
}

const extractErrorMessage = (error: unknown): string => {
  let rawMsg = '';
  if (error && typeof error === 'object') {
    const err = error as ApiErrorLike;
    const isApiError = err.name === 'ApiError' || ('status' in err && 'data' in err);
    if (isApiError && err.data) {
      const errorData = err.data;
      if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const msgList: string[] = [];
        const dict = errorData.errors as Record<string, string[] | string>;
        for (const key in dict) {
          const val = dict[key];
          if (Array.isArray(val)) msgList.push(...val);
          else if (typeof val === 'string') msgList.push(val);
        }
        if (msgList.length > 0) rawMsg = msgList.join(' | ');
      }
      if (!rawMsg && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        rawMsg = errorData.errors.join(', ');
      }
      if (!rawMsg && errorData.message) {
        rawMsg = errorData.message;
      }
    }
    if (!rawMsg && 'status' in err) {
      rawMsg = `API Error ${err.status}: ${err.message || 'Request failed'}`;
    }
  }
  if (!rawMsg) {
    rawMsg = error instanceof Error ? error.message : 'Unknown connection error';
  }
  
  // User-friendly conversion of business exceptions
  if (rawMsg.includes('VEHICLE_NOT_FOUND')) return 'Vehicle license plate not found in database.';
  if (rawMsg.includes('OVERLAP_SUBSCRIPTION')) return 'This vehicle already has an active or pending monthly subscription.';
  if (rawMsg.includes('SLOT_NOT_AVAILABLE')) return 'No suitable slot is available for allocation on this floor/zone.';
  if (rawMsg.includes('CARD_NOT_AVAILABLE')) return 'The selected card is not available or already assigned.';
  if (rawMsg.includes('CAPACITY_FULL')) return 'The parking building has reached its maximum subscription capacity.';
  if (rawMsg.includes('NO_PRICE_CONFIG')) return 'No active subscription price config found for this vehicle type.';
  
  return rawMsg;
};

export interface SubscriptionPriceConfig {
  id: number;
  vehicleTypeId: number;
  price: number;
  isActive: boolean;
}

export interface BuildingItem {
  id: number;
  name: string;
  code: string;
  totalFloor: number;
}

export interface CardItem {
  id: number;
  cardCode: string;
  cardType: string;
  cardStatus: string;
}

export interface DriverItem {
  id: number;
  username: string;
  fullName: string | null;
  roleName: string;
}

export interface VehicleItem {
  id: number;
  licensePlate: string;
  vehicleTypeId: number;
  accountId: number;
}

export function useSubscriptions() {
  const { showToast } = useAuth();
  const [subscriptions, setSubscriptions] = useState<MonthlySubscription[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aux state for lookup selectors
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<SubscriptionPriceConfig[]>([]);

  // Fetch list of subscriptions
  const fetchSubscriptions = useCallback(async (filters: SubscriptionFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.pageSize.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.buildingId) params.append('buildingId', filters.buildingId.toString());
      if (filters.accountId) params.append('accountId', filters.accountId.toString());
      if (filters.licensePlate) params.append('licensePlate', filters.licensePlate);
      if (filters.cardCode) params.append('cardCode', filters.cardCode);

      const res = await api.get<BaseResponse<PagedResult<MonthlySubscription>>>(
        `/monthly-subscriptions?${params.toString()}`
      );

      if (res.success && res.data) {
        setSubscriptions(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 0);
        setPageIndex(res.data.pageIndex || 1);
        setPageSize(res.data.pageSize || 10);
      } else {
        setError(res.message || 'Failed to retrieve subscriptions.');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch auxiliary resources
  const loadResources = useCallback(async () => {
    try {
      const [resBld, resCards, resAccounts, resVehicles, resPriceConfigs] = await Promise.all([
        api.get<BaseResponse<PagedResult<BuildingItem>>>('/Buildings/paged?pageIndex=1&pageSize=100'),
        api.get<BaseResponse<CardItem[]> | CardItem[]>('/cards'),
        api.get<{ data: DriverItem[]; success: boolean }>('/accounts'),
        api.get<{ data: VehicleItem[]; success: boolean }>('/vehicles'),
        api.get<{ data: SubscriptionPriceConfig[]; success: boolean }>('/subscription-price-configs?onlyActive=true'),
      ]);

      if (resBld.success && resBld.data?.items) {
        setBuildings(resBld.data.items);
      }
      
      const cardList = Array.isArray(resCards) ? resCards : resCards.data || [];
      // filter out available or assigned monthly cards
      setCards(cardList.filter(c => c.cardType === 'MONTHLY'));

      if (resAccounts.success && resAccounts.data) {
        setDrivers(resAccounts.data.filter(a => a.roleName === 'DRIVER' || a.roleName === 'Driver'));
      }

      if (resVehicles.success && resVehicles.data) {
        setVehicles(resVehicles.data);
      }

      if (resPriceConfigs.success && resPriceConfigs.data) {
        setPriceConfigs(resPriceConfigs.data);
      }
    } catch (err) {
      console.error('Failed to load auxiliary resources for subscriptions:', err);
    }
  }, []);

  // Register subscription
  const registerSubscription = useCallback(async (payload: RegisterSubscriptionRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<MonthlySubscription>>('/monthly-subscriptions', payload);
      if (res.success) {
        showToast('Subscription registered successfully!', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to register subscription.', 'error');
        return false;
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Update Assigned Card
  const updateCard = useCallback(async (id: number, cardId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const payload: UpdateCardRequest = { assignedCardId: cardId };
      const res = await api.put<BaseResponse<string>>(`/monthly-subscriptions/${id}`, payload);
      if (res.success) {
        showToast('Subscription card updated successfully!', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to update subscription card.', 'error');
        return false;
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Activate Subscription
  const activateSubscription = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<string>>(`/monthly-subscriptions/${id}/activate`, {});
      if (res.success) {
        showToast('Subscription activated successfully!', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to activate subscription.', 'error');
        return false;
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Cancel Subscription
  const cancelSubscription = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.delete<BaseResponse<string>>(`/monthly-subscriptions/${id}`);
      if (res.success) {
        showToast('Subscription cancelled successfully!', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to cancel subscription.', 'error');
        return false;
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Cleanup Expired Pending
  const cleanupSubscriptions = useCallback(async (timeoutMinutes?: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const params = timeoutMinutes ? `?timeoutMinutes=${timeoutMinutes}` : '';
      const res = await api.post<BaseResponse<string>>(`/monthly-subscriptions/cleanup${params}`, {});
      if (res.success) {
        showToast('Pending subscriptions cleaned up successfully!', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to clean up pending subscriptions.', 'error');
        return false;
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return {
    subscriptions,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    isLoading,
    error,
    buildings,
    cards,
    drivers,
    vehicles,
    priceConfigs,
    fetchSubscriptions,
    loadResources,
    registerSubscription,
    updateCard,
    activateSubscription,
    cancelSubscription,
    cleanupSubscriptions,
  };
}
