/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: facility.service.ts - TẦNG DỊCH VỤ QUẢN LÝ CƠ SỞ VẬT CHẤT (FACILITIES SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Chịu trách nhiệm giao tiếp API cho hạ tầng bãi đỗ xe theo 3 cấp phân tầng:
 * 1. 🏢 Buildings Service: CRUD Tòa nhà bãi xe (Danh sách phân trang, Thêm, Sửa, Xóa).
 * 2. 🛗 Floors Service: CRUD Tầng đỗ xe thuộc tòa nhà.
 * 3. 🅿️ Zones Service: CRUD Khu vực/Phân khu đỗ xe (Zone) thuộc tầng.
 * 4. 🚗 Vehicle Types Service: Lấy danh sách loại phương tiện được phép đỗ.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { VehicleType } from '../types';

// ── 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU PHẢN HỒI NỘI BỘ (RESPONSE DTOs) ─────────────────

export interface FloorResponseDto {
  id: number;
  buildingId: number;
  floorNumber: number;
  name?: string;
  type?: string;
  floorType?: string;
  status: number | string;
}

export interface ZoneResponseDto {
  id: number;
  floorId: number;
  name: string;
  code?: string;
  vehicleTypeId: number;
  accessType?: number;  // Backend: 0 = GENERAL, 1 = MONTHLY
  capacity?: number;
  status: number | string;
  bookingLimitRate?: number;
}

// ── 2. FACILITY SERVICE IMPLEMENTATION ────────────────────────────────────────

export const facilityService = {
  // ────────── 🏢 1. NHÓM API QUẢN LÝ TÒA NHÀ (BUILDINGS) ──────────
  buildings: {
    /**
     * Lấy danh sách Tòa nhà có phân trang và tìm kiếm
     * @endpoint GET /Buildings/paged
     */
    getPaged: async (
      pageIndex: number = 1,
      pageSize: number = 10,
      search?: string
    ): Promise<BaseResponse<PagedResult<Building>>> => {
      let url = `/Buildings/paged?pageIndex=${pageIndex}&pageSize=${pageSize}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      return await api.get<BaseResponse<PagedResult<Building>>>(url);
    },

    /**
     * Lấy thông tin chi tiết Tòa nhà theo ID
     * @endpoint GET /Buildings/{id}
     */
    getById: async (id: number): Promise<BaseResponse<Building>> => {
      return await api.get<BaseResponse<Building>>(`/Buildings/${id}`);
    },

    /**
     * Tạo mới Tòa nhà bãi xe
     * @endpoint POST /Buildings
     */
    create: async (data: Record<string, unknown>): Promise<BaseResponse<Building>> => {
      return await api.post<BaseResponse<Building>>('/Buildings', data);
    },

    /**
     * Cập nhật thông tin Tòa nhà
     * @endpoint PUT /Buildings/{id}
     */
    update: async (id: number, data: Record<string, unknown>): Promise<BaseResponse<Building>> => {
      return await api.put<BaseResponse<Building>>(`/Buildings/${id}`, data);
    },

    /**
     * Xóa Tòa nhà theo ID
     * @endpoint DELETE /Buildings/{id}
     */
    delete: async (id: number): Promise<BaseResponse<unknown>> => {
      return await api.delete<BaseResponse<unknown>>(`/Buildings/${id}`);
    },
  },

  // ────────── 🛗 2. NHÓM API QUẢN LÝ TẦNG ĐỖ XE (FLOORS) ──────────
  floors: {
    /**
     * Lấy danh sách tất cả các Tầng
     * @endpoint GET /Floors
     */
    getAll: async (): Promise<BaseResponse<FloorResponseDto[]>> => {
      return await api.get<BaseResponse<FloorResponseDto[]>>('/Floors');
    },

    /**
     * Tạo mới Tầng đỗ xe trong Tòa nhà
     * @endpoint POST /Floors
     */
    create: async (data: Record<string, unknown>): Promise<BaseResponse<unknown>> => {
      return await api.post<BaseResponse<unknown>>('/Floors', data);
    },

    /**
     * Cập nhật thông tin Tầng
     * @endpoint PUT /Floors/{id}
     */
    update: async (id: number, data: Record<string, unknown>): Promise<BaseResponse<unknown>> => {
      return await api.put<BaseResponse<unknown>>(`/Floors/${id}`, data);
    },

    /**
     * Xóa Tầng đỗ xe theo ID
     * @endpoint DELETE /Floors/{id}
     */
    delete: async (id: number): Promise<BaseResponse<unknown>> => {
      return await api.delete<BaseResponse<unknown>>(`/Floors/${id}`);
    },
  },

  // ────────── 🅿️ 3. NHÓM API QUẢN LÝ KHU VỰC ĐỖ XE (ZONES) ──────────
  zones: {
    /**
     * Lấy danh sách tất cả các Khu vực (Zones)
     * @endpoint GET /Zones
     */
    getAll: async (): Promise<BaseResponse<ZoneResponseDto[]>> => {
      return await api.get<BaseResponse<ZoneResponseDto[]>>('/Zones');
    },

    /**
     * Tạo mới Khu vực đỗ xe thuộc Tầng
     * @endpoint POST /Zones
     */
    create: async (data: Record<string, unknown>): Promise<BaseResponse<unknown>> => {
      return await api.post<BaseResponse<unknown>>('/Zones', data);
    },

    /**
     * Cập nhật thông tin Khu vực đỗ xe
     * @endpoint PUT /Zones/{id}
     */
    update: async (id: number, data: Record<string, unknown>): Promise<BaseResponse<unknown>> => {
      return await api.put<BaseResponse<unknown>>(`/Zones/${id}`, data);
    },

    /**
     * Xóa Khu vực đỗ xe theo ID
     * @endpoint DELETE /Zones/{id}
     */
    delete: async (id: number): Promise<BaseResponse<unknown>> => {
      return await api.delete<BaseResponse<unknown>>(`/Zones/${id}`);
    },
  },

  // ────────── 🚗 4. NHÓM API LOẠI PHƯƠNG TIỆN (VEHICLE TYPES) ──────────
  vehicleTypes: {
    /**
     * Lấy danh sách loại phương tiện
     * @endpoint GET /vehicle-types
     */
    getAll: async (): Promise<BaseResponse<VehicleType[]>> => {
      return await api.get<BaseResponse<VehicleType[]>>('/vehicle-types');
    },
  },
};
