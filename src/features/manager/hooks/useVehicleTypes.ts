import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type VehicleType = {
  id: number;
  name: string;
  description?: string;
  vehicleTypeStatus: string;
  bufferRatio?: number;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: VehicleType[] } | VehicleType[]>('/vehicle-types');
      if (Array.isArray(res)) {
        setVehicleTypes(res);
      } else if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        setVehicleTypes(res.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  const getVehicleTypeById = useCallback(async (id: number) => {
    try {
      const res = await api.get<{ data: VehicleType } | VehicleType>(`/vehicle-types/${id}`);
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as VehicleType;
      }
      return res as VehicleType;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  const createVehicleType = useCallback(async (data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
    try {
      const res = await api.post<{ data: VehicleType } | VehicleType>('/vehicle-types', data);
      await fetchVehicleTypes();
      return res;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchVehicleTypes]);

  const updateVehicleType = useCallback(async (id: number, data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
    try {
      const res = await api.put<{ data: VehicleType } | VehicleType>(`/vehicle-types/${id}`, data);
      await fetchVehicleTypes();
      return res;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchVehicleTypes]);

  const deleteVehicleType = useCallback(async (id: number) => {
    try {
      await api.delete(`/vehicle-types/${id}`);
      await fetchVehicleTypes();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchVehicleTypes]);

  return {
    vehicleTypes,
    isLoading,
    error,
    fetchVehicleTypes,
    getVehicleTypeById,
    createVehicleType,
    updateVehicleType,
    deleteVehicleType,
  };
}
