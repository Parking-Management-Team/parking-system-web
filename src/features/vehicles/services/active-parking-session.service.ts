import { api, ApiError } from '@/lib/api/client';

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errors?: Record<string, string[]> | null;
};

export type ActiveParkingSessionDto = {
  id?: number | null;
  vehicleId?: number | null;
  accountId?: number | null;
  buildingId?: number | null;
  cardId?: number | null;
  zoneId?: number | null;
  slotId?: number | null;
  bookingId?: number | null;
  bookingCode?: string | null;
  monthlySubscriptionId?: number | null;
  subscriptionCode?: string | null;
  monthlyValidTo?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  licensePlateIn?: string | null;
  licensePlateOut?: string | null;
  sessionStatus?: string | null;
  cardCode?: string | null;
  zoneCode?: string | null;
  slotCode?: string | null;
  vehicleType?: string | null;
  customerType?: string | null;
  imageIn?: string | null;
  imageOut?: string | null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }

  return error instanceof Error ? error.message : 'Could not load active parking sessions.';
};

const unwrap = <T>(response: BaseResponse<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const wrapped = response as BaseResponse<T>;
    if (wrapped.success === false || wrapped.data == null) {
      throw new Error(wrapped.message || 'Could not load active parking sessions.');
    }
    return wrapped.data;
  }

  return response as T;
};

export const fetchActiveParkingSessionDtos = async (): Promise<
  ActiveParkingSessionDto[]
> => {
  try {
    const response = await api.get<
      BaseResponse<ActiveParkingSessionDto[]> | ActiveParkingSessionDto[]
    >('/parking-sessions/active');
    return Array.isArray(response) ? response : unwrap(response);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
