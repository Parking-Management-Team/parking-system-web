export interface Booking {
  id: number;
  accountId: number;
  accountName?: string | null;
  vehicleId?: number | null;
  licensePlate: string;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  buildingId: number;
  buildingName?: string | null;
  plannedCheckinTime: string;
  depositAmount: number;
  bookingStatus: string;
  paymentDeadline?: string | null;
  checkinGraceUntil?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  slotId?: number | null;
  slotCode?: string | null;
}

export interface BookingFilter {
  status?: string;
  buildingId?: number;
  licensePlate?: string;
}
