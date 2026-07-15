import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type ShiftReport = {
  id: number;
  staffId: number;
  staffName?: string;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  totalRevenue?: number;
  totalSessions?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt?: string;
};

type ShiftReportPreview = {
  shiftDate: string;
  startTime: string;
  endTime?: string;
  totalRevenue: number;
  totalSessions: number;
  totalPayments: number;
  pendingPayments: number;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useShiftReports() {
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: ShiftReport[] } | ShiftReport[]>('/shift-reports');
      if (Array.isArray(res)) {
        setReports(res);
      } else if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        setReports(res.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getPreview = useCallback(async (date?: string) => {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const res = await api.get<{ data: ShiftReportPreview } | ShiftReportPreview>(
        `/shift-reports/preview${queryParams}`
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as ShiftReportPreview;
      }
      return res as ShiftReportPreview;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  const createReport = useCallback(async (data: {
    shiftDate: string;
    startTime: string;
    endTime?: string;
    notes?: string;
  }) => {
    try {
      const res = await api.post<{ data: ShiftReport } | ShiftReport>('/shift-reports', data);
      await fetchReports();
      return res;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchReports]);

  const approveReport = useCallback(async (id: number) => {
    try {
      await api.post(`/shift-reports/${id}/approve`, {});
      await fetchReports();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    getPreview,
    createReport,
    approveReport,
  };
}
