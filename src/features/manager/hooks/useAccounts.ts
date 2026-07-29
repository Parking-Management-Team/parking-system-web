/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useAccounts.ts - HOOK QUẢN LÝ TÀI KHOẢN DÀNH CHO MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý React State và tương tác dữ liệu Tài khoản người dùng (Search, Filter, Deactivate, Delete).
 * Gọi API thông qua Tầng Service: `managerService.accounts.*`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import { managerService, ManagerAccountDto as Account } from '../services/manager.service';

/** Type bộ lọc tài khoản */
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
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccountFilter>({});

  /**
   * Gọi Service lấy danh sách tài khoản và áp dụng bộ lọc client-side
   */
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await managerService.accounts.getAll();

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
   * Thao tác ngưng hoạt động tài khoản
   */
  const deactivateAccount = useCallback(async (id: number) => {
    try {
      await managerService.accounts.deactivate(id);
      await fetchAccounts();
      return true;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [fetchAccounts]);

  /**
   * Thao tác xóa tài khoản
   */
  const deleteAccount = useCallback(async (id: number) => {
    try {
      await managerService.accounts.delete(id);
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
