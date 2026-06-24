export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'DOWNGRADED' | 'CANCELLED';

export interface MonthlySubscription {
  id: number;
  accountId: number;
  accountName?: string; // Optional driver name if returned
  vehicleId: number;
  licensePlate?: string; // Added from licensePlate query param/backend response mapping
  assignedCardId?: number;
  cardCode?: string;
  assignedSlotId?: number;
  slotCode?: string;
  buildingId: number;
  buildingName?: string;
  monthlyPrice: number;
  activatedAt: string | null;
  expiredAt: string | null;
  monthlySubscriptionStatus: SubscriptionStatus;
  createdAt: string;
}

export interface SubscriptionFilter {
  page: number;
  pageSize: number;
  status?: SubscriptionStatus;
  buildingId?: number;
  accountId?: number;
  licensePlate?: string;
  cardCode?: string;
}

export interface RegisterSubscriptionRequest {
  accountId: number;
  vehicleId: number;
  assignedCardId: number;
  buildingId: number;
}

export interface UpdateCardRequest {
  assignedCardId: number;
}

export interface SubscriptionSummary {
  total: number;
  pending: number;
  active: number;
  expired: number;
}
