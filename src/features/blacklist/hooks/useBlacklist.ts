import { useState, useEffect, useCallback } from 'react';
import { BlacklistDto, AddToBlacklistRequest } from '../types';
import { blacklistService } from '../services/blacklist.service';

export function useBlacklist(initialPage: number = 1, initialPageSize: number = 10) {
  const [items, setItems] = useState<BlacklistDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlacklist = useCallback(async (page: number = pageIndex, size: number = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await blacklistService.getAll(page, size);
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
      setPageIndex(data.pageIndex || page);
      setPageSize(data.pageSize || size);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blacklist data');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  const addToBlacklist = async (data: AddToBlacklistRequest): Promise<BlacklistDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await blacklistService.addToBlacklist(data);
      if (newItem) {
        await fetchBlacklist(1, pageSize); // reload and go to first page
      }
      return newItem;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to add item to blacklist');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromBlacklist = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const success = await blacklistService.removeFromBlacklist(id);
      if (success) {
        await fetchBlacklist(pageIndex, pageSize);
      }
      return success;
    } catch (err) {
      console.error(err);
      setError('Failed to remove item from blacklist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist(1, pageSize);
  }, []);

  return {
    items,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    loading,
    error,
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
  };
}
