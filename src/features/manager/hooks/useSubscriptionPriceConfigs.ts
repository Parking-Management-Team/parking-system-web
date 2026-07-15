import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type SubscriptionPriceConfig = {
  id: number;
  vehicleTypeId: number;
  vehicleTypeName?: string;
  monthlyPrice: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useSubscriptionPriceConfigs() {
  const [configs, setConfigs] = useState<SubscriptionPriceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: SubscriptionPriceConfig[] } | SubscriptionPriceConfig[]>(
        '/subscription-price-configs'
      );
      if (Array.isArray(res)) {
        setConfigs(res);
      } else if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        setConfigs(res.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getActiveByVehicleType = useCallback(async (vehicleTypeId: number) => {
    try {
      const res = await api.get<{ data: SubscriptionPriceConfig } | SubscriptionPriceConfig>(
        `/subscription-price-configs/active/${vehicleTypeId}`
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as SubscriptionPriceConfig;
      }
      return res as SubscriptionPriceConfig;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  const createConfig = useCallback(async (data: {
    vehicleTypeId: number;
    monthlyPrice: number;
    description?: string;
  }) => {
    try {
      await api.post('/subscription-price-configs', data);
      await fetchConfigs();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchConfigs]);

  const deactivateConfig = useCallback(async (id: number) => {
    try {
      await api.put(`/subscription-price-configs/${id}/deactivate`, {});
      await fetchConfigs();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchConfigs]);

  const deleteConfig = useCallback(async (id: number) => {
    try {
      await api.delete(`/subscription-price-configs/${id}`);
      await fetchConfigs();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchConfigs]);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    getActiveByVehicleType,
    createConfig,
    deactivateConfig,
    deleteConfig,
  };
}
