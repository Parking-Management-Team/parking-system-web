export interface ParkingSession {
  id: number;
  vehicleId?: number | null;
  accountId?: number | null;
  buildingId?: number | null;
  cardId?: number | null;
  zoneId?: number | null;
  slotId?: number | null;
  bookingId?: number | null;
  bookingCode?: string | null;
  monthlySubscriptionId?: number | null;
  inStaffId?: number | null;
  outStaffId?: number | null;
  checkInTime: string;
  checkOutTime?: string | null;
  licensePlateIn: string;
  licensePlateOut?: string | null;
  sessionStatus: string; // ACTIVE, COMPLETED, STARTED_CHECKOUT
  cardCode?: string | null;
  zoneCode?: string | null;
  slotCode?: string | null;
  totalFee?: number | null;
  penaltyFee?: number | null;
  amountDue?: number | null;
  imageIn?: string | null;
  imageOut?: string | null;
  vehicleType?: string | null; // CAR, MOTORBIKE, TRUCK
  customerType?: string | null; // BOOKING, WALK_IN
  buildingName?: string | null;
}

export interface SessionFilter {
  pageIndex: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
  buildingId?: number;
  status?: string;
  search?: string;
}
