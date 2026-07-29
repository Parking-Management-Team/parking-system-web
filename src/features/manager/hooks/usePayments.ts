/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: usePayments.ts - HOOK QUẢN LÝ VÀ TRA CỨU THANH TOÁN
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State cho danh sách giao dịch thanh toán và hỗ trợ tra cứu theo phiên/tài khoản.
 * Gọi API thông qua Tầng Service: `managerService.payments.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { managerService, PaymentDto as Payment } from '../services/manager.service';

type PaymentFilter = {
  pageIndex?: number;
  pageSize?: number;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại.';
};

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Gọi Service lấy danh sách thanh toán có phân trang
   */
  const fetchPayments = useCallback(async (filter?: PaymentFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await managerService.payments.getAll(filter?.pageIndex, filter?.pageSize);
      setPayments(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Gọi Service tra cứu thanh toán theo Mã phiên gửi xe
   */
  const fetchPaymentsBySession = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await managerService.payments.getBySession(sessionId);
    } catch (err) {
      setError(getApiErrorMessage(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Gọi Service tra cứu thanh toán theo Mã tài khoản
   */
  const fetchPaymentsByAccount = useCallback(async (accountId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await managerService.payments.getByAccount(accountId);
    } catch (err) {
      setError(getApiErrorMessage(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    payments,
    isLoading,
    error,
    totalCount,
    fetchPayments,
    fetchPaymentsBySession,
    fetchPaymentsByAccount,
  };
}
