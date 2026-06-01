/**
 * Parking Types - Kiểu dữ liệu bãi đỗ xe
 *
 * ParkingSlot: Một chỗ đỗ xe cụ thể (A01, B02...)
 * ParkingZone: Khu vực đỗ xe (Zone A, Zone B...)
 *
 * Trạng thái slot: AVAILABLE → OCCUPIED → AVAILABLE (hoặc RESERVED, INACTIVE)
 */

import { SlotStatus, VehicleType } from '@/constants/parking.constants';

/** Một chỗ đỗ xe */
export interface ParkingSlot {
  id: string;
  code: string;
  zone: string;
  status: SlotStatus;
  vehicleType: VehicleType;
  occupiedBy?: string | null;
}

export interface ParkingZone {
  id: string;
  name: string;
  totalSlots: number;
  availableSlots: number;
  vehicleType: VehicleType;
}
