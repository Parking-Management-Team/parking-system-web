import { api, apiClient } from '@/lib/api/client';
import { BaseResponse, PagedResult, Building } from '@/lib/types/building.types';
import {
  Floor,
  FloorResponse,
  Zone,
  ZoneResponse,
  Slot,
  ParkingSlotDto,
  ParkingSessionDto,
  FloorSlotSummary,
} from '../types';

/**
 * Hàm hỗ trợ ánh xạ (map) dữ liệu tóm tắt vị trí đỗ xe theo tầng từ API response về định dạng FloorSlotSummary
 * @param data Mảng dữ liệu trả về từ API /Floors/building/{id}/slot-summary
 */
export function mapFloorSlotSummary(data: any[]): FloorSlotSummary[] {
  return data.map((item) => ({
    floorId: item.floorId,
    floorNumber: item.floorNumber,
    totalSlots: item.totalSlots,
    vehicleTypeSummaries: (item.vehicleTypeSummaries || []).map((vt: any) => {
      const statusCounts: Record<string, number> = {};
      if (Array.isArray(vt.statusCounts)) {
        vt.statusCounts.forEach((sc: any) => {
          if (sc.status !== undefined && sc.status !== null) {
            const statusStr = sc.status.toString();
            const count = sc.count;

            // Lưu trực tiếp dạng string nhận từ API
            statusCounts[statusStr] = count;
            statusCounts[statusStr.toUpperCase()] = count;
            statusCounts[statusStr.toLowerCase()] = count;

            // Ánh xạ chuẩn hóa chữ hoa/thường và giá trị enum số
            const normalizedStatus = statusStr.toUpperCase();
            if (normalizedStatus === 'AVAILABLE' || normalizedStatus === '0') {
              statusCounts['Available'] = count;
              statusCounts['AVAILABLE'] = count;
            } else if (normalizedStatus === 'OCCUPIED' || normalizedStatus === '1') {
              statusCounts['Occupied'] = count;
              statusCounts['OCCUPIED'] = count;
            } else if (normalizedStatus === 'BLOCKED' || normalizedStatus === '2') {
              statusCounts['Blocked'] = count;
              statusCounts['BLOCKED'] = count;
            } else if (normalizedStatus === 'MAINTENANCE' || normalizedStatus === '3') {
              statusCounts['Maintenance'] = count;
              statusCounts['MAINTENANCE'] = count;
            } else if (normalizedStatus === 'RESERVED' || normalizedStatus === '4') {
              statusCounts['Reserved'] = count;
              statusCounts['RESERVED'] = count;
            }
          }
        });
      }
      return {
        vehicleTypeId: vt.vehicleTypeId,
        vehicleTypeName: vt.vehicleTypeName,
        totalSlots: vt.totalSlots,
        statusCounts,
      };
    }),
  }));
}

/**
 * Service tập trung xử lý tất cả lệnh gọi API và ánh xạ dữ liệu liên quan đến Parking Map
 */
export const parkingMapService = {
  /**
   * Lấy danh sách loại phương tiện (Ô tô, Xe máy, XE điện...)
   */
  async getVehicleTypes(): Promise<any[]> {
    const res = await api.get<BaseResponse<any[]>>('/vehicle-types');
    return res.success && res.data ? res.data : [];
  },

  /**
   * Lấy danh sách tòa nhà theo trang
   */
  async getBuildings(): Promise<Building[]> {
    const res = await api.get<BaseResponse<PagedResult<Building>>>(
      '/Buildings/paged?pageIndex=1&pageSize=100'
    );
    return res.success && res.data?.items ? res.data.items : [];
  },

  /**
   * Lấy danh sách tất cả các tầng
   */
  async getFloors(): Promise<Floor[]> {
    const res = await api.get<BaseResponse<FloorResponse[]>>('/Floors');
    if (res.success && res.data) {
      return res.data.map((item) => ({
        id: item.id,
        buildingId: item.buildingId,
        floorNumber: item.floorNumber,
        name: item.name || `Floor ${item.floorNumber}`,
        status:
          item.status === 3 || item.status === 'OutOfService' || item.status === 'Inactive'
            ? 'Inactive'
            : 'Active',
      }));
    }
    return [];
  },

  /**
   * Lấy danh sách khu vực (Zones) và ánh xạ loại phương tiện (Car / Motorbike / Standard)
   */
  async getZones(loadedVehicleTypes: any[]): Promise<Zone[]> {
    const res = await api.get<BaseResponse<ZoneResponse[]>>('/Zones');
    if (res.success && res.data) {
      const mapVehicleTypeIdToType = (id: number): 'Standard' | 'EV Charging' | 'Motorbike' => {
        const vt = loadedVehicleTypes.find((v) => v.id === id);
        if (vt) {
          const name = (vt.name || vt.typeName || '').toUpperCase();
          const code = (vt.vehicleTypeCode || vt.code || '').toUpperCase();
          if (name.includes('MOTOR') || name.includes('BIKE') || code.includes('MOTOR') || code.includes('BIKE')) {
            return 'Motorbike';
          }
        }
        return 'Standard';
      };

      return res.data.map((item) => ({
        id: item.id,
        floorId: item.floorId,
        name: item.name,
        vehicleType: mapVehicleTypeIdToType(item.vehicleTypeId),
        zoneAccessType: 'GENERAL' as const,
        slotCapacity: item.capacity || 0,
        status:
          item.status === 3 || item.status === 'OutOfService' || item.status === 'Inactive'
            ? 'Inactive'
            : 'Active',
        bookingLimitRate: item.bookingLimitRate ?? 80,
      }));
    }
    return [];
  },

  /**
   * Lấy tổng quan số lượng slot theo tầng cho một tòa nhà
   */
  async getSlotSummary(buildingId: number): Promise<FloorSlotSummary[]> {
    const res = await api.get<BaseResponse<any[]>>(`/Floors/building/${buildingId}/slot-summary`);
    if (res.success && res.data) {
      return mapFloorSlotSummary(res.data);
    }
    return [];
  },

  /**
   * Lấy danh sách các phiên đỗ xe đang hoạt động (active sessions)
   */
  async getActiveSessions(): Promise<ParkingSessionDto[]> {
    const res = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active').catch(() => null);
    return res?.success && res.data ? res.data : [];
  },

  /**
   * Lấy danh sách các ô đỗ xe thuộc về một khu vực (Zone) cụ thể
   */
  async getSlotsForZone(
    zone: Zone,
    floorId: number,
    buildingId: number,
    activeSessions: ParkingSessionDto[]
  ): Promise<Slot[]> {
    const res = await api.get<BaseResponse<ParkingSlotDto[]>>(`/ParkingSlots/zone/${zone.id}`);
    if (res.success && res.data) {
      return res.data.map((item) => {
        // Tìm xem ô đỗ xe này có phương tiện nào đang gửi không
        const session = activeSessions.find((s) => s.slotId === item.id);

        let assignedVehicle: Slot['assignedVehicle'] = undefined;
        if (session) {
          assignedVehicle = {
            plate: session.licensePlateIn,
            startDate: session.checkInTime,
            endDate: session.checkOutTime || undefined,
          };
        } else if (item.occupiedLicensePlate) {
          assignedVehicle = {
            plate: item.occupiedLicensePlate,
          };
        }

        // Chuyển đổi trạng thái từ dạng số/chữ sang chuẩn chữ hoa 'AVAILABLE' | 'OCCUPIED' ...
        const mapStatus = (statusVal: number | string): Slot['status'] => {
          if (typeof statusVal === 'string') {
            switch (statusVal.toLowerCase()) {
              case 'available':
                return 'AVAILABLE';
              case 'occupied':
                return 'OCCUPIED';
              case 'blocked':
                return 'BLOCKED';
              case 'maintenance':
                return 'MAINTENANCE';
              case 'reserved':
                return 'RESERVED';
              default:
                return 'AVAILABLE';
            }
          }
          switch (statusVal) {
            case 0:
              return 'AVAILABLE';
            case 1:
              return 'OCCUPIED';
            case 2:
              return 'BLOCKED';
            case 3:
              return 'MAINTENANCE';
            case 4:
              return 'RESERVED';
            default:
              return 'AVAILABLE';
          }
        };

        return {
          id: item.id,
          slotCode: item.code,
          slotName: item.name,
          zoneId: item.zoneId,
          zoneName: zone.name,
          floorId: floorId,
          buildingId: buildingId,
          slotType:
            zone.vehicleType === 'EV Charging'
              ? 'EV Charging'
              : zone.vehicleType === 'Motorbike'
              ? 'Motorbike'
              : 'Standard',
          status: assignedVehicle ? 'OCCUPIED' : mapStatus(item.status),
          vehicleTypeId: item.vehicleTypeId,
          assignedVehicle,
        };
      });
    }
    return [];
  },

  /**
   * Lấy lịch đặt trước trong tương lai của một ô đỗ xe
   */
  async getFutureBookings(slotId: number): Promise<any> {
    const res = await api.get<BaseResponse<any>>(`/ParkingSlots/${slotId}/future-bookings`);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },

  /**
   * Lấy chi tiết thông tin một ô đỗ xe theo ID
   */
  async getSlotById(slotId: number): Promise<Slot | null> {
    const res = await api.get<BaseResponse<any>>(`/ParkingSlots/${slotId}`);
    if (res.success && res.data) {
      const s = res.data;
      const mapStatus = (statusVal: number | string): Slot['status'] => {
        if (statusVal === 0 || statusVal === 'Available') return 'AVAILABLE';
        if (statusVal === 1 || statusVal === 'Occupied') return 'OCCUPIED';
        if (statusVal === 2 || statusVal === 'Blocked') return 'BLOCKED';
        if (statusVal === 3 || statusVal === 'Maintenance') return 'MAINTENANCE';
        return 'AVAILABLE';
      };

      return {
        id: s.id,
        slotCode: s.code || `SLOT-${s.id}`,
        slotName: s.name,
        status: mapStatus(s.status),
        zoneId: s.zoneId,
        vehicleTypeId: s.vehicleTypeId,
        zoneName: '',
        slotType: 'Standard',
        floorId: 0,
        buildingId: 0,
      };
    }
    return null;
  },

  /**
   * Cập nhật trạng thái ô đỗ xe (Khoá slot, Bảo trì, hoặc Hoạt động lại)
   */
  async updateSlotStatus(
    slotId: number,
    newStatus: 'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE',
    currentStatus?: Slot['status'],
    slotData?: { code: string; name?: string; vehicleTypeId: number }
  ): Promise<any> {
    let res: any = null;
    if (newStatus === 'BLOCKED') {
      res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/block`, {
        reason: 'Blocked by staff',
      });
    } else if (newStatus === 'MAINTENANCE') {
      res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/maintenance`, {
        reason: 'Maintenance by staff',
      });
    } else if (newStatus === 'AVAILABLE') {
      if (currentStatus === 'BLOCKED') {
        res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/unblock`, {
          reason: 'Unblocked by staff',
        });
      } else if (currentStatus === 'MAINTENANCE' && slotData) {
        res = await api.put<BaseResponse<any>>(`/ParkingSlots/${slotId}`, {
          code: slotData.code,
          name: slotData.name || slotData.code,
          vehicleTypeId: slotData.vehicleTypeId,
          status: 0, // Trạng thái trống (Available)
        });
      }
    }
    return res;
  },

  /**
   * Ép hoàn thành phiên đỗ xe và giải phóng vị trí đỗ khẩn cấp
   */
  async forceCompleteSession(sessionId: number): Promise<void> {
    await apiClient(`/parking-sessions/${sessionId}/complete`, { method: 'PATCH' });
  },
};
