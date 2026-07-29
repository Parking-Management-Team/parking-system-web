/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: manager.service.ts - TẦNG DỊCH VỤ GỌI API CHO DÀNH CHO QUẢN LÝ (MANAGER SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Đóng vai trò là Tầng Service trung gian giao tiếp API cho toàn bộ module Manager.
 * Tách biệt hoàn toàn việc khai báo Endpoint và gọi `client.ts` ra khỏi các Custom Hooks.
 * 
 * 🛠️ CÁC NHÓM CHỨC NĂNG API:
 * 1. 👥 Accounts Service: Quản lý tài khoản (Xem danh sách, vô hiệu hóa, xóa).
 * 2. 🚗 Vehicle Types Service: Quản lý loại phương tiện (CRUD loại xe).
 * 3. ⚙️ System Config Service: Cấu hình tham số hệ thống bãi xe.
 * 4. 💳 Payments Service: Quản lý và tra cứu lịch sử giao dịch thanh toán.
 * 5. 💰 Pricing Engine Service: Công cụ tính toán giá vé gửi xe.
 * 6. 📊 Dashboard Service: Tải dữ liệu realtime tổng quan bãi xe, tầng, zone, doanh thu.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { FloorResponse, ZoneResponse, ParkingSessionDto } from '@/features/parking-map/types';

// ── 1. CÁC ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ──────────────────────────────────

/** Kiểu dữ liệu Tài khoản */
export type ManagerAccountDto = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

/** Kiểu dữ liệu Loại phương tiện */
export type VehicleTypeDto = {
  id: number;
  name: string;
  description?: string;
  vehicleTypeStatus: string;
  bufferRatio?: number;
};

/** Kiểu dữ liệu Cấu hình hệ thống */
export type SystemConfigDto = {
  key: string;
  value: string;
  description?: string;
};

/** Kiểu dữ liệu Giao dịch thanh toán */
export type PaymentDto = {
  id: number;
  bookingId?: number;
  sessionId?: number;
  monthlySubscriptionId?: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderCode?: number;
  paymentTime?: string;
  createdAt?: string;
};

/** Kiểu tham số đầu vào tính giá vé */
export type PricingCalculationParams = {
  vehicleTypeId: number;
  checkInTime: string;
  checkOutTime: string;
};

/** Kiểu tham số đầu vào tính giá vé và ghi log */
export type PricingCalculationWithLogParams = PricingCalculationParams & {
  parkingSessionId?: number;
  bookingId?: number;
};

/** Kiểu dữ liệu kết quả tính giá vé */
export type PricingResultDto = {
  vehicleTypeId: number;
  durationMinutes: number;
  basePrice: number;
  totalAmount: number;
  applicableWindow?: string;
  message?: string;
};

/** Kiểu dữ liệu thống kê doanh thu */
export interface RevenueStatisticDto {
  id: number;
  buildingId: number;
  buildingName: string;
  startDate: string;
  endDate: string;
  periodType: string;
  vehicleTypeId?: number;
  vehicleTypeName: string;
  totalRevenue: number;
  totalBookings: number;
  totalSessions: number;
  totalSubscriptions: number;
}

// ── 2. MANAGER SERVICE IMPLEMENTATION ─────────────────────────────────────────

export const managerService = {

  // ────────── 👥 1. NHÓM API QUẢN LÝ TÀI KHOẢN (ACCOUNTS) ──────────
  accounts: {
    /**
     * Lấy danh sách tất cả tài khoản trong hệ thống
     * @endpoint GET /accounts
     */
    getAll: async (): Promise<ManagerAccountDto[]> => {
      const res = await api.get<{ data: ManagerAccountDto[] } | ManagerAccountDto[]>('/accounts');
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    },

    /**
     * Vô hiệu hóa (Deactivate) một tài khoản theo ID
     * @endpoint POST /accounts/{id}/deactivate
     */
    deactivate: async (id: number): Promise<boolean> => {
      await api.post(`/accounts/${id}/deactivate`, {});
      return true;
    },

    /**
     * Xóa tài khoản theo ID
     * @endpoint DELETE /accounts/{id}
     */
    delete: async (id: number): Promise<boolean> => {
      await api.delete(`/accounts/${id}`);
      return true;
    },
  },

  // ────────── 🚗 2. NHÓM API QUẢN LÝ LOẠI PHƯƠNG TIỆN (VEHICLE TYPES) ──────────
  vehicleTypes: {
    /**
     * Lấy danh sách các loại xe (Ô tô, Xe máy, Xe điện...)
     * @endpoint GET /vehicle-types
     */
    getAll: async (): Promise<VehicleTypeDto[]> => {
      const res = await api.get<{ data: VehicleTypeDto[] } | VehicleTypeDto[]>('/vehicle-types');
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    },

    /**
     * Lấy chi tiết 1 loại xe theo ID
     * @endpoint GET /vehicle-types/{id}
     */
    getById: async (id: number): Promise<VehicleTypeDto> => {
      const res = await api.get<{ data: VehicleTypeDto } | VehicleTypeDto>(`/vehicle-types/${id}`);
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as VehicleTypeDto;
      }
      return res as VehicleTypeDto;
    },

    /**
     * Thêm mới loại xe
     * @endpoint POST /vehicle-types
     */
    create: async (data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
      return await api.post<{ data: VehicleTypeDto } | VehicleTypeDto>('/vehicle-types', data);
    },

    /**
     * Cập nhật thông tin loại xe
     * @endpoint PUT /vehicle-types/{id}
     */
    update: async (id: number, data: { name: string; description?: string; vehicleTypeStatus?: string; bufferRatio?: number }) => {
      return await api.put<{ data: VehicleTypeDto } | VehicleTypeDto>(`/vehicle-types/${id}`, data);
    },

    /**
     * Xóa loại xe theo ID
     * @endpoint DELETE /vehicle-types/{id}
     */
    delete: async (id: number): Promise<boolean> => {
      await api.delete(`/vehicle-types/${id}`);
      return true;
    },
  },

  // ────────── ⚙️ 3. NHÓM API CẤU HÌNH HỆ THỐNG (SYSTEM CONFIG) ──────────
  systemConfig: {
    /**
     * Lấy danh sách tất cả tham số cấu hình bãi xe
     * @endpoint GET /parkingsystemconfig
     */
    getAll: async (): Promise<SystemConfigDto[]> => {
      const res = await api.get<{ data: SystemConfigDto[] } | SystemConfigDto[]>('/parkingsystemconfig');
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    },

    /**
     * Lấy thông tin cấu hình theo Key
     * @endpoint GET /parkingsystemconfig/{key}
     */
    getByKey: async (key: string): Promise<SystemConfigDto> => {
      const res = await api.get<{ data: SystemConfigDto } | SystemConfigDto>(`/parkingsystemconfig/${key}`);
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as SystemConfigDto;
      }
      return res as SystemConfigDto;
    },

    /**
     * Cập nhật thông tin cấu hình hệ thống
     * @endpoint PUT /parkingsystemconfig
     */
    update: async (data: { key: string; value: string; description?: string }): Promise<boolean> => {
      await api.put('/parkingsystemconfig', data);
      return true;
    },
  },

  // ────────── 💳 4. NHÓM API THANH TOÁN (PAYMENTS) ──────────
  payments: {
    /**
     * Lấy danh sách giao dịch thanh toán (có phân trang)
     * @endpoint GET /payments
     */
    getAll: async (pageIndex?: number, pageSize?: number): Promise<{ items: PaymentDto[]; totalCount: number }> => {
      const params = new URLSearchParams();
      if (pageIndex) params.append('pageIndex', pageIndex.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      const queryString = params.toString();
      const url = `/payments${queryString ? `?${queryString}` : ''}`;

      const res = await api.get<{ data: { items: PaymentDto[]; totalCount: number } } | PaymentDto[]>(url);
      if (Array.isArray(res)) {
        return { items: res, totalCount: res.length };
      }
      if (res && typeof res === 'object' && 'data' in res) {
        const data = res.data as { items: PaymentDto[]; totalCount: number };
        return { items: data.items ?? [], totalCount: data.totalCount ?? 0 };
      }
      return { items: [], totalCount: 0 };
    },

    /**
     * Tra cứu lịch sử thanh toán theo Mã phiên gửi xe (Session ID)
     * @endpoint GET /payments/by-session/{sessionId}
     */
    getBySession: async (sessionId: number): Promise<PaymentDto[]> => {
      const res = await api.get<{ data: PaymentDto[] } | PaymentDto[]>(`/payments/by-session/${sessionId}`);
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PaymentDto[];
      }
      return [];
    },

    /**
     * Tra cứu lịch sử thanh toán theo Mã tài khoản (Account ID)
     * @endpoint GET /payments/by-account/{accountId}
     */
    getByAccount: async (accountId: number): Promise<PaymentDto[]> => {
      const res = await api.get<{ data: PaymentDto[] } | PaymentDto[]>(`/payments/by-account/${accountId}`);
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PaymentDto[];
      }
      return [];
    },
  },

  // ────────── 💰 5. NHÓM API CÔNG CỤ TÍNH GIÁ (PRICING ENGINE) ──────────
  pricingEngine: {
    /**
     * Tính toán giá vé gửi xe dự kiến
     * @endpoint GET /pricing-engine/calculate
     */
    calculate: async (params: PricingCalculationParams): Promise<PricingResultDto> => {
      const queryParams = new URLSearchParams({
        vehicleTypeId: params.vehicleTypeId.toString(),
        checkIn: params.checkInTime,
        checkOut: params.checkOutTime,
      });
      const res = await api.get<{ data: PricingResultDto } | PricingResultDto>(
        `/pricing-engine/calculate?${queryParams.toString()}`
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PricingResultDto;
      }
      return res as PricingResultDto;
    },

    /**
     * Tính toán giá vé và ghi nhật ký hệ thống (Log)
     * @endpoint POST /pricing-engine/calculate-and-log
     */
    calculateAndLog: async (params: PricingCalculationWithLogParams): Promise<PricingResultDto> => {
      const queryParams = new URLSearchParams({
        vehicleTypeId: params.vehicleTypeId.toString(),
        checkIn: params.checkInTime,
        checkOut: params.checkOutTime,
      });
      if (params.bookingId) queryParams.append('bookingId', params.bookingId.toString());
      if (params.parkingSessionId) queryParams.append('parkingSessionId', params.parkingSessionId.toString());

      const res = await api.post<{ data: PricingResultDto } | PricingResultDto>(
        `/pricing-engine/calculate-and-log?${queryParams.toString()}`,
        null
      );
      if (res && typeof res === 'object' && 'data' in res) {
        return res.data as PricingResultDto;
      }
      return res as PricingResultDto;
    },
  },

  // ────────── 📊 6. NHÓM API DASHBOARD THỐNG KÊ (DASHBOARD REALTIME) ──────────
  dashboard: {
    /**
     * Lấy danh sách các phiên đỗ xe đang active
     * @endpoint GET /parking-sessions/active
     */
    getActiveSessions: async (): Promise<ParkingSessionDto[]> => {
      const sessionRes = await api.get<any>('/parking-sessions/active').catch(() => null);
      if (!sessionRes) return [];
      if (sessionRes.success && Array.isArray(sessionRes.data)) return sessionRes.data;
      if (Array.isArray(sessionRes)) return sessionRes;
      if (sessionRes.data && Array.isArray(sessionRes.data)) return sessionRes.data;
      return [];
    },

    /**
     * Lấy thống kê doanh thu theo ngày của Tòa nhà
     * @endpoint GET /Revenue
     */
    getRevenue: async (buildingId: number): Promise<RevenueStatisticDto[]> => {
      const res = await api.get<any>(
        `/Revenue?BuildingId=${buildingId}&PeriodType=DAILY&pageIndex=1&pageSize=30`
      );
      let data: any = null;
      if (res && res.success && res.data) data = res.data;
      else if (res && res.items) data = res;

      if (data && data.items) return data.items;
      return [];
    },

    /**
     * Lấy danh sách tất cả Tòa nhà trong hệ thống
     * @endpoint GET /Buildings/paged
     */
    getBuildings: async (): Promise<Building[]> => {
      const resBld = await api.get<BaseResponse<PagedResult<Building>>>('/Buildings/paged?pageIndex=1&pageSize=100');
      if (resBld.success && resBld.data?.items) {
        return resBld.data.items;
      }
      return [];
    },

    /**
     * Lấy danh sách tất cả các Tầng
     * @endpoint GET /Floors
     */
    getFloors: async (): Promise<FloorResponse[]> => {
      const resFloors = await api.get<BaseResponse<FloorResponse[]>>('/Floors');
      if (resFloors.success && resFloors.data) {
        return resFloors.data;
      }
      return [];
    },

    /**
     * Lấy danh sách tất cả các Khu vực đỗ xe (Zones)
     * @endpoint GET /Zones
     */
    getZones: async (): Promise<ZoneResponse[]> => {
      const resZones = await api.get<BaseResponse<ZoneResponse[]>>('/Zones');
      if (resZones.success && resZones.data) {
        return resZones.data;
      }
      return [];
    },
  },
};
