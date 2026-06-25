export interface PaymentTransaction {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string; // CASH, ONLINE_BANKING, etc.
  status: string; // SUCCESS, PENDING, FAILED
  licensePlate?: string | null;
  referenceCode?: string | null;
  sessionId?: number | null;
  accountId?: number | null;
  fullName?: string | null;
}

export interface PaymentFilter {
  pageIndex: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
  method?: string; // CASH, ONLINE_BANKING
}
