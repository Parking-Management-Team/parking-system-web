/**
 * ===================================================================================
 * 🎣 FE CUSTOM HOOK: usePayments.ts (Logic Quản Lý Thanh Toán & Doanh Thu / Payment Logic)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & NHIỆM VỤ:
 * - Quản lý state danh sách doanh thu, lịch sử giao dịch và chi tiết từng hóa đơn thanh toán.
 * - Hỗ trợ lọc giao dịch theo bãi đỗ (BuildingId), khoảng thời gian (StartDate, EndDate) và phân trang.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - GET /Revenue          --> Lấy thống kê danh sách doanh thu & thanh toán (RevenueController.cs)
 * - GET /Revenue/{id}     --> Lấy chi tiết lịch sử thanh toán cụ thể (RevenueController.cs)
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - Payments              (Id, Amount, PaymentMethod, PaymentTime, SourceType, LicensePlate)
 * - RevenueStatistics     (Id, BuildingId, TotalRevenue, TotalBookings, TotalSessions)
 * ===================================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { RevenueItem, RevenueDetail, RevenueFilter } from '../types';

export function usePayments() {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [revenueDetail, setRevenueDetail] = useState<RevenueDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchRevenue = useCallback(async (filters: RevenueFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pageIndex', filters.pageIndex.toString());
      params.append('pageSize', filters.pageSize.toString());
      
      if (filters.buildingId) {
        params.append('BuildingId', filters.buildingId.toString());
      }
      if (filters.startDate) {
        params.append('StartDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('EndDate', filters.endDate);
      }
      if (filters.periodType) {
        params.append('PeriodType', filters.periodType);
      }

      const response = await api.get<any>(`/Revenue?${params.toString()}`);
      
      let data: any = null;
      if (response && response.success && response.data) {
        data = response.data;
      } else if (response && response.items) {
        data = response;
      } else {
        data = { items: [], totalCount: 0, totalPages: 0, pageIndex: 1, pageSize: 10 };
      }

      const mappedItems: RevenueItem[] = (data.items || []).map((item: any) => ({
        id: item.id,
        buildingId: item.buildingId,
        buildingName: item.buildingName,
        startDate: item.startDate,
        endDate: item.endDate,
        periodType: item.periodType,
        vehicleTypeId: item.vehicleTypeId,
        vehicleTypeName: item.vehicleTypeName || 'N/A',
        totalRevenue: item.totalRevenue || 0,
        totalBookings: item.totalBookings || 0,
        totalSessions: item.totalSessions || 0,
        totalSubscriptions: 0, // monthly subscription is completely removed
      }));

      setRevenueItems(mappedItems);
      setTotalCount(data.totalCount || mappedItems.length);
      setTotalPages(data.totalPages || Math.ceil(mappedItems.length / filters.pageSize));
      setPageIndex(data.pageIndex || filters.pageIndex);
      setPageSize(data.pageSize || filters.pageSize);

    } catch (err: any) {
      console.error('Error loading revenue statistics:', err);
      setError(err?.message || 'Failed to retrieve revenue records.');
      setRevenueItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRevenueDetail = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    setError(null);
    try {
      const response = await api.get<any>(`/Revenue/${id}`);
      let detailData: any = null;
      if (response && response.success && response.data) {
        detailData = response.data;
      } else {
        detailData = response;
      }

      if (detailData) {
        const mappedDetail: RevenueDetail = {
          id: detailData.id,
          buildingId: detailData.buildingId,
          buildingName: detailData.buildingName,
          startDate: detailData.startDate,
          endDate: detailData.endDate,
          periodType: detailData.periodType,
          vehicleTypeId: detailData.vehicleTypeId,
          vehicleTypeName: detailData.vehicleTypeName || 'N/A',
          totalRevenue: detailData.totalRevenue || 0,
          totalBookings: detailData.totalBookings || 0,
          totalSessions: detailData.totalSessions || 0,
          totalSubscriptions: 0,
          payments: (detailData.payments || []).map((p: any) => ({
            paymentId: p.paymentId,
            amount: p.amount || 0,
            paymentMethod: p.paymentMethod || 'N/A',
            paymentTime: p.paymentTime || '',
            sourceType: p.sourceType || 'N/A',
            licensePlate: p.licensePlate || 'N/A'
          }))
        };
        setRevenueDetail(mappedDetail);
      } else {
        setRevenueDetail(null);
      }
    } catch (err: any) {
      console.error('Error loading revenue detail:', err);
      setError(err?.message || 'Failed to retrieve revenue details.');
      setRevenueDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  return {
    revenueItems,
    revenueDetail,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    isLoading,
    isDetailLoading,
    error,
    fetchRevenue,
    fetchRevenueDetail,
  };
}

