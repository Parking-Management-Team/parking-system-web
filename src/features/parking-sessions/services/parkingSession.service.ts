/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: parkingSession.service.ts - TẦNG DỊCH VỤ QUẢN LÝ PHIÊN GỬI XE (PARKING SESSIONS SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Chịu trách nhiệm khai báo tập trung các Endpoint API quản lý và tra cứu phiên gửi xe:
 * 1. 🚗 Get Sessions API: Lấy danh sách lượt gửi xe (Tất cả hoặc các phiên đang Active).
 * 2. 📇 Support Data API: Tải đồng thời dữ liệu bổ trợ (Thẻ RFID `/cards`, Khu vực `/Zones`, Ô đỗ `/ParkingSlots`).
 * 3. 🔍 Tra cứu nâng cao: Tìm lịch sử phiên đỗ theo Xe (`/by-vehicle/{id}`) hoặc Tài khoản (`/by-account/{id}`).
 * 4. 🏢 Building List API: Tải danh sách tòa nhà bãi xe cho bộ lọc.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';
import { BaseResponse, PagedResult } from '@/lib/types/building.types';

export interface BuildingItemDto {
  id: number;
  name: string;
  code: string;
}

export const parkingSessionService = {
  /**
   * 🚗 1. Lấy danh sách các phiên đỗ xe (Tất cả hoặc các phiên Active)
   * @endpoint GET /parking-sessions hoặc GET /parking-sessions/active
   */
  getSessions: async (isActiveOnly: boolean = false): Promise<any> => {
    const endpoint = isActiveOnly ? '/parking-sessions/active' : '/parking-sessions';
    return await api.get<any>(endpoint);
  },

  /**
   * 📇 2. Tải song song dữ liệu bổ trợ (Thẻ RFID, Khu vực, Ô đỗ xe)
   * @endpoints GET /cards, GET /Zones, GET /ParkingSlots
   */
  getSupportData: async (): Promise<{ cards: any[]; zones: any[]; slots: any[] }> => {
    try {
      const [cardsRes, zonesRes, slotsRes] = await Promise.all([
        api.get<any>('/cards').catch(() => null),
        api.get<any>('/Zones').catch(() => null),
        api.get<any>('/ParkingSlots').catch(() => null),
      ]);

      const cards = cardsRes?.success && cardsRes.data ? cardsRes.data : (Array.isArray(cardsRes) ? cardsRes : []);
      const zones = zonesRes?.success && zonesRes.data ? zonesRes.data : (Array.isArray(zonesRes) ? zonesRes : []);
      const slots = slotsRes?.success && slotsRes.data ? slotsRes.data : (Array.isArray(slotsRes) ? slotsRes : []);

      return { cards, zones, slots };
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bổ trợ (Cards, Zones, Slots):', err);
      return { cards: [], zones: [], slots: [] };
    }
  },

  /**
   * 🔍 3. Tra cứu lịch sử phiên gửi xe theo Phương tiện (Vehicle ID)
   * @endpoint GET /parking-sessions/by-vehicle/{vehicleId}
   */
  getByVehicle: async (vehicleId: number): Promise<any[]> => {
    const res = await api.get<any>(`/parking-sessions/by-vehicle/${vehicleId}`);
    if (Array.isArray(res)) return res;
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * 👤 4. Tra cứu lịch sử phiên gửi xe theo Tài khoản (Account ID)
   * @endpoint GET /parking-sessions/by-account/{accountId}
   */
  getByAccount: async (accountId: number): Promise<any[]> => {
    const res = await api.get<any>(`/parking-sessions/by-account/${accountId}`);
    if (Array.isArray(res)) return res;
    if (res && res.success && Array.isArray(res.data)) return res.data;
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * 🏢 5. Lấy danh sách Tòa nhà bãi xe phục vụ Dropdown lọc
   * @endpoint GET /Buildings/paged
   */
  getBuildingsPaged: async (pageIndex: number = 1, pageSize: number = 100): Promise<BuildingItemDto[]> => {
    const res = await api.get<BaseResponse<PagedResult<BuildingItemDto>>>(
      `/Buildings/paged?pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
    if (res.success && res.data?.items) {
      return res.data.items;
    }
    return [];
  },
};
