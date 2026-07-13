export interface RevenueItem {
  id: number;
  buildingId: number;
  buildingName: string;
  startDate: string;
  endDate: string;
  periodType: string; // DAILY, MONTHLY, YEARLY
  vehicleTypeId?: number | null;
  vehicleTypeName: string;
  totalRevenue: number;
  totalBookings: number;
  totalSessions: number;
  totalSubscriptions: number;
}

export interface RevenueDetailPayment {
  paymentId: number;
  amount: number;
  paymentMethod: string; // VNPAY, CASH, etc.
  paymentTime: string; // ISO date or local format
  sourceType: string; // Session, Booking
  licensePlate?: string | null;
}

export interface RevenueDetail extends RevenueItem {
  payments: RevenueDetailPayment[];
}

export interface RevenueFilter {
  pageIndex: number;
  pageSize: number;
  buildingId?: number | null;
  startDate?: string;
  endDate?: string;
  periodType?: string; // DAILY, MONTHLY, YEARLY
}

