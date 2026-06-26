export interface Booking {
  id: number;
  code?: string | null;
  accountId?: number | null;
  accountName?: string | null;
  vehicleId?: number | null;
  licensePlate: string;
  vehiclePlate?: string | null;
  vehicleType?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  buildingId?: number | null;
  buildingName?: string | null;
  plannedCheckinTime: string;
  plannedCheckoutTime?: string | null;
  depositAmount: number;
  bookingStatus: string;
  depositPaid?: boolean | null;
  paymentDeadline?: string | null;
  checkinGraceUntil?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  isWithinGrace?: boolean | null;
  slotId?: number | null;
  slotCode?: string | null;
  createdAt: string;
}

export interface BookingFilter {
  page: number;
  pageSize: number;
  status?: string;
  buildingId?: number;
  licensePlate?: string;
}
