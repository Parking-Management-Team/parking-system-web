import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';

/**
 * Type đại diện cho Tài khoản người dùng trong Manager Feature
 */
type Account = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

/**
 * Type bộ lọc tài khoản
 */
type AccountFilter = {
  search?: string;
  role?: string;
  isActive?: boolean;
};

/**
 * Hàm hỗ trợ trích xuất thông báo lỗi từ ApiError
 */
const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại.';
};

/**
 * Custom Hook: useAccounts (Dành cho Quản lý)
 *
 * Chức năng: Lấy danh sách tài khoản, tìm kiếm/lọc, vô hiệu hóa (deactivate) và xóa tài khoản.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccountFilter>({});

  /**
   * Gọi API lấy danh sách tài khoản và áp dụng bộ lọc client-side
   */
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

      // Áp dụng các điều kiện lọc
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

  /**
   * Thao tác ngưng hoạt động tài khoản (POST /accounts/{id}/deactivate)
   */
  const deactivateAccount = useCallback(async (id: number) => {
    try {
      await api.post(`/accounts/${id}/deactivate`, {});
      await fetchAccounts();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchAccounts]);

  /**
   * Thao tác xóa tài khoản (DELETE /accounts/{id})
   */
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
