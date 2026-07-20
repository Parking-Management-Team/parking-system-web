'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api.types';
import { useAuth } from '@/features/auth';

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

export interface CreateAccountPayload {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phone?: string | null;
  roleId: number;
}

export function useAccounts() {
  const { showToast } = useAuth();
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Load accounts from API
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<AccountDto[]>>('/accounts');
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError(response.message || 'Failed to fetch accounts.');
      }
    } catch (err: unknown) {
      console.error('Error fetching accounts:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while connecting to the server.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts
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

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: accounts.length,
      active: accounts.filter((a) => a.accountStatus === 'Active').length,
      inactive: accounts.filter((a) => a.accountStatus === 'Inactive').length,
      blocked: accounts.filter((a) => a.accountStatus === 'Blocked').length,
    };
  }, [accounts]);

  // Create account mutation
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
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during account creation.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  // Edit mutation
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
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during update.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  // Block account mutation
  const blockAccount = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete<ApiResponse<string>>(`/accounts/${id}`);
      if (response.success) {
        showToast('Account blocked successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to block account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error blocking account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred.';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchAccounts, showToast]);

  // Unblock account mutation (via PUT to set status back to Active)
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
        showToast('Account unblocked and set to Active successfully!', 'success');
        fetchAccounts();
        return true;
      } else {
        showToast(response.message || 'Failed to unblock account.', 'error');
        return false;
      }
    } catch (err: unknown) {
      console.error('Error unblocking account:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred.';
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
