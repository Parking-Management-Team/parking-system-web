/**
 * Booking Types - Kiểu dữ liệu đặt chỗ
 *
 * Booking: Đơn đặt chỗ đỗ xe trước
 * BookingInput: Dữ liệu đầu vào khi tạo booking mới
 *
 * Luồng: PENDING → CONFIRMED → CHECKED_IN → (hoàn thành) / EXPIRED / CANCELLED
 */

import { BookingStatus, VehicleType } from '@/constants/parking.constants';

/** Đơn đặt chỗ */
export interface Booking {
  id: string;
  code: string;
  plateNumber: string;
  vehicleType: VehicleType;
  slotId?: string | null;
  slotCode?: string | null;
  zoneName?: string | null;
  buildingName: string;
  checkInTime: string; // ISO date string expected check-in
  arrivalTime?: string | null; // Actual check-in time
  depositAmount: number;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingInput {
  plateNumber: string;
  vehicleType: VehicleType;
  buildingId: string;
  checkInTime: string;
}
