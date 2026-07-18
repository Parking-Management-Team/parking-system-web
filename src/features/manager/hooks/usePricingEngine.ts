import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type PricingCalculation = {
  vehicleTypeId: number;
  checkInTime: string;
  checkOutTime: string;
};

type PricingResult = {
  vehicleTypeId: number;
  durationMinutes: number;
  basePrice: number;
  totalAmount: number;
  applicableWindow?: string;
  message?: string;
};

type PricingCalculationWithLog = PricingCalculation & {
  parkingSessionId?: number;
  bookingId?: number;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function usePricingEngine() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (params: PricingCalculation): Promise<PricingResult | null> => {
    setIsCalculating(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        vehicleTypeId: params.vehicleTypeId.toString(),
        checkIn: params.checkInTime,
        checkOut: params.checkOutTime,
      });
      const res = await api.get<{ data: PricingResult } | PricingResult>(
        `/pricing-engine/calculate?${queryParams.toString()}`
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PricingResult;
      }
      return res as PricingResult;
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const calculateAndLog = useCallback(async (params: PricingCalculationWithLog): Promise<PricingResult | null> => {
    setIsCalculating(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        vehicleTypeId: params.vehicleTypeId.toString(),
        checkIn: params.checkInTime,
        checkOut: params.checkOutTime,
      });
      if (params.bookingId) queryParams.append('bookingId', params.bookingId.toString());
      if (params.parkingSessionId) queryParams.append('parkingSessionId', params.parkingSessionId.toString());

      const res = await api.post<{ data: PricingResult } | PricingResult>(
        `/pricing-engine/calculate-and-log?${queryParams.toString()}`,
        null
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PricingResult;
      }
      return res as PricingResult;
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
