/**
 * Session Types - Kiểu dữ liệu phiên đỗ xe
 *
 * ParkingSession: Phiên đỗ xe (từ khi vào đến khi ra)
 *
 * Luồng: ACTIVE → COMPLETED / CANCELLED
 * Tính phí dựa trên: entryTime, exitTime, vehicleType
 */

import { SessionStatus, VehicleType } from '@/constants/parking.constants';

/** Phiên đỗ xe */
export interface ParkingSession {
  id: string;
  bookingCode?: string | null;
  plateNumber: string;
  vehicleType: VehicleType;
  slotCode: string;
  zoneName: string;
  entryTime: string; // ISO date string
  exitTime?: string | null; // ISO date string
  totalFee?: number | null;
  paidAmount?: number | null;
  status: SessionStatus;
  cardId?: string | null;
}
