import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

type Account = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

type AccountFilter = {
  search?: string;
  role?: string;
  isActive?: boolean;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccountFilter>({});

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Account[] } | Account[]>('/accounts');
      let data: Account[] = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        data = res.data;
      }

      // Apply filters
      let filtered = data;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.email?.toLowerCase().includes(searchLower) ||
            a.fullName?.toLowerCase().includes(searchLower)
        );
      }
      if (filter.role) {
        filtered = filtered.filter((a) => a.role === filter.role);
      }
      if (filter.isActive !== undefined) {
        filtered = filtered.filter((a) => a.isActive === filter.isActive);
      }

      setAccounts(filtered);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const deactivateAccount = useCallback(async (id: number) => {
    try {
      await api.post(`/accounts/${id}/deactivate`, {});
      await fetchAccounts();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: number) => {
    try {
      await api.delete(`/accounts/${id}`);
      await fetchAccounts();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    filter,
    setFilter,
    fetchAccounts,
    deactivateAccount,
    deleteAccount,
  };
}
