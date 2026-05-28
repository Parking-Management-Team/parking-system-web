import { BookingStatus, VehicleType } from '@/constants/parking.constants';

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
