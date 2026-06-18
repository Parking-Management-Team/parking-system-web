import type {
  AssignMonthlySubscriptionInput,
  AssignSessionInput,
  CardStatus,
  CreateCardInput,
  ParkingCard,
} from '../types/card';

// API-ready service boundary. The mock UI does not call these functions yet.

export const fetchCards = async (): Promise<ParkingCard[]> => {
  // TODO: Replace with API call: GET /api/cards
  return [];
};

export const createCard = async (
  _input: CreateCardInput
): Promise<ParkingCard | null> => {
  // TODO: Replace with API call: POST /api/cards
  return null;
};

export const updateCardStatus = async (
  _cardId: number,
  _status: CardStatus
): Promise<void> => {
  // TODO: Replace with API call: PATCH /api/cards/:cardId/status
};

export const assignCardToSession = async (
  _cardId: number,
  _input: AssignSessionInput
): Promise<void> => {
  // TODO: Replace with API call: POST /api/cards/:cardId/assign-session
};

export const assignCardToMonthlySubscription = async (
  _cardId: number,
  _input: AssignMonthlySubscriptionInput
): Promise<void> => {
  // TODO: Replace with API call: POST /api/cards/:cardId/assign-subscription
};

export const releaseCard = async (_cardId: number): Promise<void> => {
  // TODO: Replace with API call: POST /api/cards/:cardId/release
};

export const markCardLost = async (_cardId: number): Promise<void> => {
  // TODO: Replace with API call: POST /api/cards/:cardId/lost
};
