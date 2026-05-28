import { SessionStatus, VehicleType } from '@/constants/parking.constants';

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
