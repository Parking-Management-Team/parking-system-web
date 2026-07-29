/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: usePricingEngine.ts - HOOK CÔNG CỤ TÍNH GIÁ VÉ GỬI XE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State tính toán thử nghiệm giá vé gửi xe và ghi nhật ký hệ thống.
 * Gọi API thông qua Tầng Service: `managerService.pricingEngine.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  managerService,
  PricingCalculationParams as PricingCalculation,
  PricingResultDto as PricingResult,
  PricingCalculationWithLogParams as PricingCalculationWithLog,
} from '../services/manager.service';

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại.';
};

export function usePricingEngine() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gọi Service tính toán thử nghiệm giá vé gửi xe
   */
  const calculatePrice = useCallback(async (params: PricingCalculation): Promise<PricingResult | null> => {
    setIsCalculating(true);
    setError(null);
    try {
      return await managerService.pricingEngine.calculate(params);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Gọi Service tính toán giá vé và ghi log hệ thống
   */
  const calculateAndLog = useCallback(async (params: PricingCalculationWithLog): Promise<PricingResult | null> => {
    setIsCalculating(true);
    setError(null);
    try {
      return await managerService.pricingEngine.calculateAndLog(params);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    isCalculating,
    error,
    calculatePrice,
    calculateAndLog,
  };
}
