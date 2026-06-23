import { api, ApiError } from '@/lib/api/client';
import type {
  AssignMonthlySubscriptionInput,
  AssignSessionInput,
  CreateCardInput,
  ParkingCard,
  UpdatableCardStatus,
} from '../types/card';

type BaseResponse<T> = {
  success?: boolean;
  message?: string | null;
  data?: T | null;
  errors?: Record<string, unknown> | null;
};

type CardDto = {
  id?: number | null;
  cardCode?: string | null;
  rfidCode?: string | null;
  cardType?: string | null;
  cardStatus?: string | null;
  createdAt?: string | null;
};

const CARD_STATUS_OVERRIDES_KEY = 'nexpark_card_status_overrides';

type CardStatusOverride = {
  cardStatus: ParkingCard['cardStatus'];
  vehiclePlate?: string | null;
  currentSessionId?: number | null;
};

const getLocalCardStatusOverrides = (): Record<string, CardStatusOverride> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(CARD_STATUS_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setLocalCardStatusOverride = (
  cardCode: string,
  override: CardStatusOverride
) => {
  if (typeof window === 'undefined') return;

  const normalizedCardCode = cardCode.trim().toUpperCase();
  if (!normalizedCardCode) return;

  const current = getLocalCardStatusOverrides();

  localStorage.setItem(
    CARD_STATUS_OVERRIDES_KEY,
    JSON.stringify({
      ...current,
      [normalizedCardCode]: override,
    })
  );
};

export const clearLocalCardStatusOverride = (cardCode: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCardCode = cardCode.trim().toUpperCase();
  const current = getLocalCardStatusOverrides();

  delete current[normalizedCardCode];

  localStorage.setItem(CARD_STATUS_OVERRIDES_KEY, JSON.stringify(current));
};

const mapCardType = (value: unknown): ParkingCard['cardType'] => {
  switch (String(value ?? '').trim().toUpperCase()) {
    case 'PARKING_CARD':
      return 'PARKING_CARD';
    case 'MONTHLY':
      return 'MONTHLY';
    default:
      return 'UNKNOWN';
  }
};

const mapCardStatus = (value: unknown): ParkingCard['cardStatus'] => {
  switch (String(value ?? '').trim().toUpperCase()) {
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'ACTIVE':
      return 'ACTIVE';
    case 'ASSIGNED':
      return 'ASSIGNED';
    case 'LOST':
      return 'LOST';
    case 'BLOCKED':
      return 'BLOCKED';
    default:
      return 'UNKNOWN';
  }
};

const mapCardDto = (card: CardDto): ParkingCard => ({
  id: Number(card.id ?? 0),
  cardCode: String(card.cardCode ?? ''),
  cardType: mapCardType(card.cardType),
  cardStatus: mapCardStatus(card.cardStatus),
  currentSessionId: null,
  monthlySubscriptionId: null,
  subscriptionCode: null,
  vehiclePlate: null,
  validFrom: null,
  validTo: null,
  createdAt: String(card.createdAt ?? new Date().toISOString()),
});

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as {
      message?: unknown;
      title?: unknown;
      errors?: Record<string, unknown>;
    };

    const validationMessages = body.errors
      ? Object.values(body.errors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((value): value is string => typeof value === 'string')
      : [];

    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    if (validationMessages.length > 0) {
      return validationMessages.join('\n');
    }

    if (typeof body.title === 'string' && body.title.trim()) {
      return body.title;
    }
  }

  return error instanceof Error ? error.message : 'Card operation failed.';
};

const getResponseData = <T>(response: BaseResponse<T> | T): T => {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response
  ) {
    const baseResponse = response as BaseResponse<T>;

    if (baseResponse.success === false) {
      throw new Error(baseResponse.message || 'Card operation failed.');
    }

    if (baseResponse.data == null) {
      throw new Error(baseResponse.message || 'Card operation failed.');
    }

    return baseResponse.data;
  }

  return response as T;
};

export const fetchCards = async (): Promise<ParkingCard[]> => {
  try {
    const response = await api.get<BaseResponse<CardDto[]> | CardDto[]>('/cards');
    const data = Array.isArray(response) ? response : getResponseData(response);

    const cards = data.map(mapCardDto);
    const overrides = getLocalCardStatusOverrides();

    return cards.map((card) => {
      const override = overrides[card.cardCode.toUpperCase()];
      if (!override) return card;

      return {
        ...card,
        cardStatus: override.cardStatus,
        vehiclePlate: override.vehiclePlate ?? card.vehiclePlate,
        currentSessionId: override.currentSessionId ?? card.currentSessionId,
      };
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createCard = async (
  input: CreateCardInput
): Promise<ParkingCard> => {
  try {
    const response = await api.post<BaseResponse<CardDto> | CardDto>('/cards', {
      cardCode: input.cardCode.trim().toUpperCase(),
      rfidCode: null,
      cardType: input.cardType,
    });

    return mapCardDto(getResponseData(response));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const updateCardStatus = async (
  cardId: number,
  status: UpdatableCardStatus
): Promise<ParkingCard> => {
  try {
    const response = await api.put<BaseResponse<CardDto> | CardDto>(
      `/cards/${cardId}/status`,
      {
        status:
          status === 'AVAILABLE'
            ? 'Available'
            : status === 'BLOCKED'
              ? 'Blocked'
              : 'Lost',
      }
    );

    return mapCardDto(getResponseData(response));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const markCardLost = async (cardId: number): Promise<ParkingCard> => {
  return updateCardStatus(cardId, 'LOST');
};

export const assignCardToSession = async (
  _cardId: number,
  _input: AssignSessionInput
): Promise<void> => {
  void _cardId;
  void _input;
  // TODO: Add API later if BE supports assigning card to session directly.
};

export const assignCardToMonthlySubscription = async (
  _cardId: number,
  _input: AssignMonthlySubscriptionInput
): Promise<void> => {
  void _cardId;
  void _input;
  // TODO: Add API later if BE supports assigning card to subscription directly.
};

export const releaseCard = async (_cardId: number): Promise<void> => {
  void _cardId;
  // TODO: Add API later if BE supports releasing card directly.
};
