/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useVehicleTypes.ts - HOOK QUẢN LÝ LOẠI PHƯƠNG TIỆN
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State và các thao tác CRUD Loại xe (Ô tô, Xe máy, Xe điện...).
 * Gọi API thông qua Tầng Service: `managerService.vehicleTypes.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { managerService, VehicleTypeDto as VehicleType } from '../services/manager.service';

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại.';
};

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gọi Service lấy danh sách các loại xe
   */
  const fetchVehicleTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await managerService.vehicleTypes.getAll();
      setVehicleTypes(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  /**
   * Gọi Service lấy chi tiết 1 loại xe theo ID
   */
  const getVehicleTypeById = useCallback(async (id: number) => {
    try {
      return await managerService.vehicleTypes.getById(id);
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  /**
   * Gọi Service tạo loại xe mới
   */
  const createVehicleType = useCallback(async (data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
    try {
      const res = await managerService.vehicleTypes.create(data);
      await fetchVehicleTypes();
      return res;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchVehicleTypes]);

  /**
   * Gọi Service cập nhật thông tin loại xe
   */
  const updateVehicleType = useCallback(async (id: number, data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
    try {
      const res = await managerService.vehicleTypes.update(id, data);
      await fetchVehicleTypes();
      return res;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchVehicleTypes]);

  /**
   * Gọi Service xóa loại xe theo ID
   */
  const deleteVehicleType = useCallback(async (id: number) => {
    try {
      await managerService.vehicleTypes.delete(id);
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
