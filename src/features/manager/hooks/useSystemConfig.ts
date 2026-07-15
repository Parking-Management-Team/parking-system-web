import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type SystemConfig = {
  key: string;
  value: string;
  description?: string;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useSystemConfig() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: SystemConfig[] } | SystemConfig[]>('/parkingsystemconfig');
      if (Array.isArray(res)) {
        setConfigs(res);
      } else if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        setConfigs(res.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getConfigByKey = useCallback(async (key: string) => {
    try {
      const res = await api.get<{ data: SystemConfig } | SystemConfig>(`/parkingsystemconfig/${key}`);
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as SystemConfig;
      }
      return res as SystemConfig;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, []);

  const updateConfig = useCallback(async (data: { key: string; value: string; description?: string }) => {
    try {
      await api.put('/parkingsystemconfig', data);
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
