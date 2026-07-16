import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type Payment = {
  id: number;
  bookingId?: number;
  sessionId?: number;
  monthlySubscriptionId?: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderCode?: number;
  paymentTime?: string;
  createdAt?: string;
};

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
  return error instanceof Error ? error.message : 'Request failed.';
};

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayments = useCallback(async (filter?: PaymentFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter?.pageIndex) params.append('pageIndex', filter.pageIndex.toString());
      if (filter?.pageSize) params.append('pageSize', filter.pageSize.toString());
      const queryString = params.toString();
      const url = `/payments${queryString ? `?${queryString}` : ''}`;

      const res = await api.get<{ data: { items: Payment[]; totalCount: number } } | Payment[]>(url);
      if (Array.isArray(res)) {
        setPayments(res);
        setTotalCount(res.length);
      } else if (res && typeof res === 'object' && 'data' in res) {
        const data = res.data as { items: Payment[]; totalCount: number };
        setPayments(data.items ?? []);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentsBySession = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Payment[] } | Payment[]>(`/payments/by-session/${sessionId}`);
      if (Array.isArray(res)) {
        return res;
      } else if (res && typeof res === 'object' && 'data' in res) {
        return res.data as Payment[];
      }
      return [];
    } catch (err) {
      setError(getApiErrorMessage(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentsByAccount = useCallback(async (accountId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Payment[] } | Payment[]>(`/payments/by-account/${accountId}`);
      if (Array.isArray(res)) {
        return res;
      } else if (res && typeof res === 'object' && 'data' in res) {
        return res.data as Payment[];
      }
      return [];
    } catch (err) {
      setError(getApiErrorMessage(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean }>(`/payments/${id}/refund`, {});
      return res;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
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
    refundPayment,
  };
}
