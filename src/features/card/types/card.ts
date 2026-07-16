export type CardType = 'PARKING_CARD' | 'MONTHLY' | 'UNKNOWN';

export type CardStatus =
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'ASSIGNED'
  | 'LOST'
  | 'BLOCKED'
  | 'UNKNOWN';

export type CreatableCardType = 'PARKING_CARD' | 'MONTHLY';

export type UpdatableCardStatus = 'AVAILABLE' | 'ACTIVE' | 'BLOCKED' | 'LOST';

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
  cardType: CreatableCardType;
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
