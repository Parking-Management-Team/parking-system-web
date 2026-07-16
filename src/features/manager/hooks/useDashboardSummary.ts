import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type DashboardSummary = {
  totalActiveSessions: number;
  expectedBookingsToday: number;
  occupancyRate: number;
  activeIncidentsCount: number;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: DashboardSummary } | DashboardSummary>('/dashboard/summary');
      if (res && typeof res === 'object' && 'data' in res) {
        setSummary(res.data as DashboardSummary);
      } else {
        setSummary(res as DashboardSummary);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}
