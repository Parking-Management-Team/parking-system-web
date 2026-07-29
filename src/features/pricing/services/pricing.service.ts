/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: pricing.service.ts - TẦNG DỊCH VỤ QUẢN LÝ BẢNG GIÁ VÀ PHẠT (PRICING SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Chịu trách nhiệm khai báo tập trung các Endpoint API quản lý bảng giá, mức phạt và loại sự cố:
 * 1. 💵 Policies Service: Khung giá vé gửi xe (Lấy danh sách, tạo mới, sửa, kích hoạt, dọn dẹp, thêm/sửa/xóa khung giờ window).
 * 2. ⚠️ Penalty Configs Service: Cấu hình mức phạt quá hạn / phạt đỗ sai quy định.
 * 3. 🚨 Incident Types Service: Quản lý danh mục loại sự cố (CRUD Loại sự cố + Phạt kèm theo).
 * 4. 🚗 Vehicle Types Service: Lấy danh sách loại phương tiện.
 * 5. ⚙️ System Config Service: Cấu hình tham số bật/tắt tính giá phân đoạn (Segmented Pricing).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';

export const pricingService = {
  // ────────── 💵 1. NHÓM API BẢNG GIÁ & KHUNG GIỜ (PRICING POLICIES & WINDOWS) ──────────
  policies: {
    /**
     * Lấy danh sách tất cả các chính sách giá
     * @endpoint GET /pricing-policies
     */
    getAll: async (): Promise<{ data: any[]; success: boolean }> => {
      return await api.get<{ data: any[]; success: boolean }>('/pricing-policies');
    },

    /**
     * Tạo mới chính sách giá (Policy)
     * @endpoint POST /pricing-policies
     */
    create: async (data: Record<string, unknown>): Promise<{ success: boolean; message?: string }> => {
      return await api.post<{ success: boolean; message?: string }>('/pricing-policies', data);
    },

    /**
     * Cập nhật chính sách giá
     * @endpoint PUT /pricing-policies/{policyId}
     */
    update: async (policyId: number, data: Record<string, unknown>): Promise<{ success: boolean }> => {
      return await api.put<{ success: boolean }>(`/pricing-policies/${policyId}`, data);
    },

    /**
     * Kích hoạt một chính sách giá (Active Policy)
     * @endpoint POST /pricing-policies/{policyId}/activate
     */
    activate: async (policyId: number): Promise<{ success: boolean }> => {
      return await api.post<{ success: boolean }>(`/pricing-policies/${policyId}/activate`, {});
    },

    /**
     * Dọn dẹp/Làm sạch các bảng giá thừa/hết hạn
     * @endpoint POST /pricing-policies/cleanup
     */
    cleanup: async (): Promise<{ success: boolean; message?: string }> => {
      return await api.post<{ success: boolean; message?: string }>('/pricing-policies/cleanup', {});
    },

    /**
     * Thêm khung giờ (Window) vào chính sách giá
     * @endpoint POST /pricing-policies/{policyId}/windows
     */
    addWindow: async (policyId: number, data: Record<string, unknown>): Promise<{ success: boolean }> => {
      return await api.post<{ success: boolean }>(`/pricing-policies/${policyId}/windows`, data);
    },

    /**
     * Cập nhật thông tin khung giờ (Window)
     * @endpoint PUT /pricing-policies/windows/{windowId}
     */
    updateWindow: async (windowId: number, data: Record<string, unknown>): Promise<{ success: boolean }> => {
      return await api.put<{ success: boolean }>(`/pricing-policies/windows/${windowId}`, data);
    },

    /**
     * Xóa một khung giờ (Window)
     * @endpoint DELETE /pricing-policies/windows/{windowId}
     */
    deleteWindow: async (windowId: number): Promise<{ success: boolean }> => {
      return await api.delete<{ success: boolean }>(`/pricing-policies/windows/${windowId}`);
    },
  },

  // ────────── ⚠️ 2. NHÓM API CẤU HÌNH MỨC PHẠT (PENALTY CONFIGS) ──────────
  penaltyConfigs: {
    /**
     * Lấy danh sách cấu hình mức phạt (chỉ lấy loại đang Active nếu set onlyActive = true)
     * @endpoint GET /penalty-configs?onlyActive=true
     */
    getAll: async (onlyActive: boolean = true): Promise<{ data?: any[]; success?: boolean }> => {
      const url = onlyActive ? '/penalty-configs?onlyActive=true' : '/penalty-configs';
      return await api.get<{ data?: any[]; success?: boolean }>(url);
    },

    /**
     * Tạo mới cấu hình mức phạt
     * @endpoint POST /penalty-configs
     */
    create: async (data: Record<string, unknown>): Promise<{ success: boolean }> => {
      return await api.post<{ success: boolean }>('/penalty-configs', data);
    },

    /**
     * Vô hiệu hóa một cấu hình mức phạt
     * @endpoint PUT /penalty-configs/{configId}/deactivate
     */
    deactivate: async (configId: number): Promise<{ success: boolean }> => {
      return await api.put<{ success: boolean }>(`/penalty-configs/${configId}/deactivate`, {});
    },
  },

  // ────────── 🚨 3. NHÓM API DẠNG SỰ CỐ (INCIDENT TYPES) ──────────
  incidentTypes: {
    /**
     * Lấy danh sách tất cả các loại sự cố
     * @endpoint GET /IncidentType
     */
    getAll: async (): Promise<{ data?: any[]; success?: boolean }> => {
      return await api.get<{ data?: any[]; success?: boolean }>('/IncidentType');
    },

    /**
     * Tạo mới loại sự cố
     * @endpoint POST /IncidentType
     */
    create: async (data: Record<string, unknown>): Promise<{ success: boolean; data?: any }> => {
      return await api.post<{ success: boolean; data?: any }>('/IncidentType', data);
    },

    /**
     * Cập nhật thông tin loại sự cố
     * @endpoint PUT /IncidentType/{id}
     */
    update: async (id: number, data: Record<string, unknown>): Promise<{ success: boolean; data?: any }> => {
      return await api.put<{ success: boolean; data?: any }>(`/IncidentType/${id}`, data);
    },

    /**
     * Xóa loại sự cố theo ID
     * @endpoint DELETE /IncidentType/{id}
     */
    delete: async (id: number): Promise<{ success: boolean }> => {
      return await api.delete<{ success: boolean }>(`/IncidentType/${id}`);
    },
  },

  // ────────── 🚗 4. NHÓM API LOẠI PHƯƠNG TIỆN (VEHICLE TYPES) ──────────
  vehicleTypes: {
    /**
     * Lấy danh sách loại phương tiện
     * @endpoint GET /vehicle-types
     */
    getAll: async (): Promise<{ data?: any[]; success?: boolean }> => {
      return await api.get<{ data?: any[]; success?: boolean }>('/vehicle-types');
    },
  },

  // ────────── ⚙️ 5. NHÓM API CẤU HÌNH THAM SỐ GIÁ (SYSTEM CONFIG) ──────────
  systemConfig: {
    /**
     * Lấy cấu hình tính giá phân đoạn (Segmented Pricing)
     * @endpoint GET /parkingsystemconfig/APPLY_SEGMENTED_PRICING
     */
    getSegmentedPricingConfig: async (): Promise<any> => {
      return await api.get<any>('/parkingsystemconfig/APPLY_SEGMENTED_PRICING');
    },

    /**
     * Cập nhật cấu hình tham số hệ thống
     * @endpoint PUT /parkingsystemconfig
     */
    update: async (data: { key: string; value: string; description?: string }): Promise<any> => {
      return await api.put('/parkingsystemconfig', data);
    },
  },
};
