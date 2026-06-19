export type CardType = 'NORMAL' | 'MONTHLY';

export type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'INACTIVE' | 'LOST';

export interface ParkingCard {
  id: number;
  cardCode: string;
  cardType: CardType;
  cardStatus: CardStatus;
  currentSessionId: number | null;
  monthlySubscriptionId: number | null;
  subscriptionCode: string | null;
  vehiclePlate: string | null;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

export interface CreateCardInput {
  cardCode: string;
  cardType: CardType;
}

export interface AssignSessionInput {
  currentSessionId: number;
  vehiclePlate?: string;
}

export interface AssignMonthlySubscriptionInput {
  monthlySubscriptionId?: number;
  subscriptionCode?: string;
  vehiclePlate?: string;
  validFrom?: string;
  validTo?: string;
}

export interface CardOperationResult {
  success: boolean;
  message: string;
  tone?: 'success' | 'error' | 'warning';
}
