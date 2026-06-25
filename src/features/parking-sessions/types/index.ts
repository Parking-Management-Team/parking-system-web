export interface ParkingSession {
  id: number;
  licensePlateIn: string;
  licensePlateOut?: string | null;
  checkInTime: string;
  checkOutTime?: string | null;
  slotCode?: string | null;
  zoneCode?: string | null;
  sessionStatus: string; // ACTIVE, COMPLETED, etc.
  buildingName?: string | null;
  buildingId?: number | null;
  totalFee?: number | null;
  cardCode?: string | null;
  vehicleType?: string | null;
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
