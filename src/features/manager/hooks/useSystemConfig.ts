/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useSystemConfig.ts - HOOK QUẢN LÝ CẤU HÌNH HỆ THỐNG
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State và thao tác cập nhật cấu hình tham số hệ thống bãi xe.
 * Gọi API thông qua Tầng Service: `managerService.systemConfig.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { managerService, SystemConfigDto as SystemConfig } from '../services/manager.service';

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại.';
};

export function useSystemConfig() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gọi Service lấy danh sách cấu hình hệ thống
   */
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await managerService.systemConfig.getAll();
      setConfigs(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /**
   * Gọi Service lấy cấu hình theo Key
   */
  const getConfigByKey = useCallback(async (key: string) => {
    try {
      return await managerService.systemConfig.getByKey(key);
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  /**
   * Gọi Service cập nhật cấu hình hệ thống
   */
  const updateConfig = useCallback(async (data: { key: string; value: string; description?: string }) => {
    try {
      await managerService.systemConfig.update(data);
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
    getConfigByKey,
    updateConfig,
  };
}
