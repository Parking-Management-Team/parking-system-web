'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { PaymentTransaction, PaymentFilter } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters: PaymentFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pageIndex', filters.pageIndex.toString());
      params.append('pageSize', filters.pageSize.toString());
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.method && filters.method !== 'ALL') params.append('method', filters.method);

      let rawData: any = null;
      let isFallback = false;

      try {
        const response = await api.get<any>(`/payments?${params.toString()}`);
        if (response && response.success && response.data) {
          rawData = response.data;
        } else if (response && response.items) {
          rawData = response;
        } else if (Array.isArray(response)) {
          rawData = { items: response, totalCount: response.length };
        } else if (response && response.data && Array.isArray(response.data)) {
          rawData = { items: response.data, totalCount: response.data.length };
        }
      } catch (err) {
        console.warn('Advanced payment query failed, falling back to /payments list:', err);
        isFallback = true;
      }

      if (isFallback || !rawData) {
        const fallbackRes = await api.get<any>('/payments');
        const items = Array.isArray(fallbackRes) ? fallbackRes : fallbackRes.data || [];
        
        let filtered = items;
        if (filters.method && filters.method !== 'ALL') {
          filtered = filtered.filter((p: any) => (p.paymentMethod || p.method || '').toUpperCase() === filters.method?.toUpperCase());
        }

        const count = filtered.length;
        const pageIdx = filters.pageIndex;
        const pSize = filters.pageSize;
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

      const mappedItems: PaymentTransaction[] = (rawData.items || []).map((item: any) => ({
        id: item.id,
        amount: item.amount || 0,
        paymentDate: item.paymentDate || item.createdAt || '',
        paymentMethod: item.paymentMethod || item.method || 'CASH',
        status: item.status || 'SUCCESS',
        licensePlate: item.licensePlate || item.vehiclePlate || '—',
        referenceCode: item.referenceCode || item.txnRef || `TXN-${item.id}`,
        sessionId: item.sessionId,
        accountId: item.accountId || item.userId,
        fullName: item.fullName || item.userName || 'Customer',
      }));

      setPayments(mappedItems);
      setTotalCount(rawData.totalCount || mappedItems.length);
      setTotalPages(rawData.totalPages || Math.ceil(mappedItems.length / filters.pageSize));
      setPageIndex(rawData.pageIndex || filters.pageIndex);
      setPageSize(rawData.pageSize || filters.pageSize);

    } catch (err: any) {
      console.error('Error loading payments:', err);
      setError(err?.message || 'Failed to retrieve payment records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentsBySession = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/payments/by-session/${sessionId}`);
      const items = Array.isArray(res) ? res : res.data || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        amount: item.amount || 0,
        paymentDate: item.paymentDate || item.createdAt || '',
        paymentMethod: item.paymentMethod || 'ONLINE_BANKING',
        status: item.status || 'SUCCESS',
        licensePlate: item.licensePlate || '—',
        referenceCode: item.referenceCode || `TXN-${item.id}`,
        sessionId: item.sessionId,
        accountId: item.accountId,
        fullName: item.fullName || 'Customer',
      }));
      setPayments(mapped);
      setTotalCount(mapped.length);
      setTotalPages(1);
      setPageIndex(1);
    } catch (err: any) {
      console.error('Error fetching payments by session:', err);
      setError(err?.message || 'Failed to fetch payments for the specified session.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentsByAccount = useCallback(async (accountId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/payments/by-account/${accountId}`);
      const items = Array.isArray(res) ? res : res.data || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        amount: item.amount || 0,
        paymentDate: item.paymentDate || item.createdAt || '',
        paymentMethod: item.paymentMethod || 'ONLINE_BANKING',
        status: item.status || 'SUCCESS',
        licensePlate: item.licensePlate || '—',
        referenceCode: item.referenceCode || `TXN-${item.id}`,
        sessionId: item.sessionId,
        accountId: item.accountId,
        fullName: item.fullName || 'Customer',
      }));
      setPayments(mapped);
      setTotalCount(mapped.length);
      setTotalPages(1);
      setPageIndex(1);
    } catch (err: any) {
      console.error('Error fetching payments by account:', err);
      setError(err?.message || 'Failed to fetch payments for the specified customer account.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    payments,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    isLoading,
    error,
    fetchPayments,
    fetchPaymentsBySession,
    fetchPaymentsByAccount,
  };
}
