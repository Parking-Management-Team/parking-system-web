export interface Booking {
  id: number;
  code?: string | null;
  licensePlate: string;
  vehiclePlate?: string | null;
  vehicleType?: string | null;
  buildingId?: number | null;
  buildingName?: string | null;
  plannedCheckinTime: string;
  plannedCheckoutTime: string;
  depositAmount: number;
  bookingStatus: string;
  depositPaid?: boolean | null;
  isWithinGrace?: boolean | null;
  createdAt: string;
}

export interface BookingFilter {
  page: number;
  pageSize: number;
  status?: string;
  buildingId?: number;
  licensePlate?: string;
}
