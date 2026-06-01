import { SlotStatus, VehicleType } from '@/constants/parking.constants';

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
