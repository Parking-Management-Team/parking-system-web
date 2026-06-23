import { api, ApiError } from '@/lib/api/client';

type BaseResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string | null;
  errors?: Record<string, string[]> | null;
};

type ParkingSessionDto = {
  id?: number | null;
  cardId?: number | null;
  zoneId?: number | null;
  slotId?: number | null;
  bookingId?: number | null;
  monthlySubscriptionId?: number | null;
  checkInTime?: string | null;
  licensePlateIn?: string | null;
  sessionStatus?: string | null;
  cardCode?: string | null;
  zoneCode?: string | null;
  slotCode?: string | null;
};

export type CheckInVehiclePayload = {
  licensePlate: string;
  vehicleTypeId: number;
  cardCode: string;
  buildingId: number;
  staffId: number;
};

export type VehicleCheckinSession = {
  id: number;
  sessionCode: string;
  licensePlate: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'UNKNOWN';
  customerType: 'WALK_IN' | 'BOOKING' | 'MONTHLY';
  cardId: number;
  cardCode: string;
  zoneId: number | null;
  zoneName: string;
  actualSlotId: number | null;
  actualSlotCode: string | null;
  checkInTime: string;
  status: 'ACTIVE' | 'LOST_CARD_REPORTED';
};

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

    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (validationMessages.length > 0) return validationMessages.join('\n');
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }

  return error instanceof Error ? error.message : 'Vehicle check-in request failed.';
};

const unwrap = <T>(response: BaseResponse<T>, fallbackMessage: string): T => {
  if (!response.success || response.data == null) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.data;
};

export const mapActiveParkingSession = (
  session: ParkingSessionDto
): VehicleCheckinSession => {
  const sessionId = Number(session.id ?? 0);
  const cardId = Number(session.cardId ?? 0);

  return {
  id: sessionId,
  sessionCode: `SS-${sessionId}`,
  licensePlate: String(session.licensePlateIn ?? '-'),
  // The current active-session DTO does not expose VehicleTypeId.
  vehicleType: 'UNKNOWN',
  customerType: session.monthlySubscriptionId
    ? 'MONTHLY'
    : session.bookingId
      ? 'BOOKING'
      : 'WALK_IN',
  cardId,
  cardCode: String(session.cardCode ?? `#${cardId}`),
  zoneId: session.zoneId ?? null,
  zoneName: session.zoneCode ?? '-',
  actualSlotId: session.slotId ?? null,
  actualSlotCode: session.slotCode ?? null,
  checkInTime: String(session.checkInTime ?? ''),
  status:
    String(session.sessionStatus ?? 'ACTIVE').trim().toUpperCase() ===
    'LOST_CARD_REPORTED'
      ? 'LOST_CARD_REPORTED'
      : 'ACTIVE',
  };
};

export const fetchActiveParkingSessions = async (): Promise<VehicleCheckinSession[]> => {
  try {
    const response = await api.get<BaseResponse<ParkingSessionDto[]>>(
      '/parking-sessions/active'
    );
    return unwrap(response, 'Could not load active parking sessions.').map(
      mapActiveParkingSession
    );
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const checkInVehicle = async (
  payload: CheckInVehiclePayload
): Promise<VehicleCheckinSession> => {
  try {
    const response = await api.post<BaseResponse<ParkingSessionDto>>(
      '/parking-sessions/check-in',
      payload
    );
    return mapActiveParkingSession(unwrap(response, 'Vehicle check-in failed.'));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
