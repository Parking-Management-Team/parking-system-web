'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api.types';
import { useAuth } from '@/features/auth';

/**
 * Interface cấu trúc dữ liệu Tài khoản người dùng (Account DTO)
 */
export interface AccountDto {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  roleId: number;
  roleName: string;
  accountStatus: string;
  createdAt: string;
}

/**
 * Interface dữ liệu đầu vào khi Admin khởi tạo tài khoản mới
 */
export interface CreateAccountPayload {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phone?: string | null;
  roleId: number;
}

/**
 * Custom Hook: useAccounts
 *
 * Chức năng:
 * - Quản lý toàn bộ danh sách tài khoản người dùng cho Quản trị viên (Admin).
 * - Cung cấp các tính năng: Lấy danh sách, Lọc theo từ khóa/vai trò/trạng thái, 
 *   Tạo tài khoản mới, Cập nhật thông tin, Vô hiệu hóa (Block) và Kích hoạt lại (Unblock).
 */
export function useAccounts() {
  const { showToast } = useAuth();
  // Trạng thái lưu danh sách tất cả tài khoản
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  // Trạng thái đang tải dữ liệu
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Trạng thái lưu thông báo lỗi
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc & Từ khóa tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  /**
   * Gọi API lấy danh sách tài khoản người dùng từ máy chủ
   */
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<AccountDto[]>>('/accounts');
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError(response.message || 'Failed to load account list.');
      }
    } catch (err: unknown) {
      console.error('Error loading account list:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while connecting to the server.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tự động lấy danh sách tài khoản khi hook được khởi tạo
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  /**
   * Tính toán lọc danh sách tài khoản dựa trên từ khóa tìm kiếm, vai trò và trạng thái
   */
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        (acc.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.roleName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || acc.roleName === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || acc.accountStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  /**
   * Tính toán các chỉ số thống kê tài khoản (Tổng số, Đang hoạt động, Ngưng hoạt động, Bị khóa)
   */
  const stats = useMemo(() => {
    return {
      total: accounts.length,
      active: accounts.filter((a) => a.accountStatus === 'Active').length,
      inactive: accounts.filter((a) => a.accountStatus === 'Inactive').length,
      blocked: accounts.filter((a) => a.accountStatus === 'Blocked').length,
    };
  }, [accounts]);

  /**
   * Thao tác tạo tài khoản mới (POST /accounts)
   */
  const createAccount = useCallback(async (payload: CreateAccountPayload): Promise<boolean> => {
    try {
      const response = await api.post<ApiResponse<AccountDto>>('/accounts', payload);
      if (response.success || response.data) {
        showToast('Account created successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to create account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error creating account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while creating the account.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  /**
   * Thao tác cập nhật thông tin tài khoản (PUT /accounts/{id})
   */
  const updateAccount = useCallback(async (
    id: number,
    payload: { fullName: string; phone: string | null; roleId: number; accountStatus: string }
  ): Promise<boolean> => {
    try {
      const response = await api.put<ApiResponse<string>>(`/accounts/${id}`, payload);
      if (response.success) {
        showToast('Account updated successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to update account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error updating account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while updating the account.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  /**
   * Thao tác khóa/vô hiệu hóa tài khoản (DELETE /accounts/{id})
   */
  const blockAccount = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete<ApiResponse<string>>(`/accounts/${id}`);
      if (response.success) {
        showToast('Account locked successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to lock account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error locking account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while locking the account.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  /**
   * Thao tác mở khóa tài khoản và đặt trạng thái về Active (PUT /accounts/{id})
   */
  const unblockAccount = useCallback(async (
    id: number,
    currentData: { fullName: string | null; phone: string | null; roleId: number }
  ): Promise<boolean> => {
    try {
      const payload = {
        fullName: currentData.fullName || '',
        phone: currentData.phone,
        roleId: currentData.roleId,
        accountStatus: 'Active',
      };
      const response = await api.put<ApiResponse<string>>(`/accounts/${id}`, payload);
      if (response.success) {
        showToast('Account unlocked successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to unlock account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error unlocking account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while unlocking the account.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  return {
    accounts,
    filteredAccounts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    stats,
    fetchAccounts,
    createAccount,
    updateAccount,
    blockAccount,
    unblockAccount,
  };
}
