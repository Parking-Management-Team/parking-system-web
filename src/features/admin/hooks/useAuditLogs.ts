'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api.types';
import { AuditLogDto } from '../types/audit-log';

export function useAuditLogs(initialPage = 1, initialSize = 10) {
  const [items, setItems] = useState<AuditLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pageIndex', pageIndex.toString());
      params.append('pageSize', pageSize.toString());

      if (selectedAccountId !== undefined) {
        params.append('accountId', selectedAccountId.toString());
      }
      if (selectedAction) {
        params.append('action', selectedAction);
      }
      if (selectedTable) {
        params.append('targetTable', selectedTable);
      }

      const response = await api.get<ApiResponse<{
        items: AuditLogDto[];
        totalCount: number;
        totalPages: number;
        pageIndex: number;
        pageSize: number;
      }>>(`/auditlogs?${params.toString()}`);

      if (response.success && response.data) {
        setItems(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
        // Sync states in case server adjusted them
        setPageIndex(response.data.pageIndex);
        setPageSize(response.data.pageSize);
      } else {
        setError(response.message || 'Failed to fetch audit logs.');
      }
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err?.message || 'An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, selectedAccountId, selectedAction, selectedTable]);

  // Handle filter changes (which reset page index to 1)
  const setAccountIdFilter = useCallback((id: number | undefined) => {
    setSelectedAccountId(id);
    setPageIndex(1);
  }, []);

  const setActionFilter = useCallback((action: string) => {
    setSelectedAction(action);
    setPageIndex(1);
  }, []);

  const setTableFilter = useCallback((table: string) => {
    setSelectedTable(table);
    setPageIndex(1);
  }, []);

  // Fetch when page, size, or filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    items,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    loading,
    error,
    selectedAccountId,
    setSelectedAccountId: setAccountIdFilter,
    selectedAction,
    setSelectedAction: setActionFilter,
    selectedTable,
    setSelectedTable: setTableFilter,
    fetchLogs,
    setPageIndex,
    setPageSize,
  };
}
