import { api, ApiError } from '@/lib/api/client';

type BaseResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string | null;
  errors?: Record<string, string[]> | null;
};

type ParkingSessionDto = {
  id?: number | null;
  vehicleId?: number | null;
  buildingId?: number | null;
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
  imageIn?: string | null;
  imageOut?: string | null;
  vehicleType?: string | null;
};

type BookingDto = {
  id?: number | null;
  licensePlate?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  buildingId?: number | null;
  buildingName?: string | null;
  plannedCheckinTime?: string | null;
  plannedCheckoutTime?: string | null;
  depositAmount?: number | null;
  bookingStatus?: string | null;
  checkinGraceUntil?: string | null;
};

export type CheckInVehiclePayload = {
  licensePlate: string;
  vehicleTypeId: number;
  cardCode: string;
  buildingId: number;
  staffId: number;
  bookingId?: number;
  randomizeSlot?: boolean;
  overrideSlotId?: number;
  imageIn?: string;
};

export type VehicleCheckinSession = {
  id: number;
  sessionCode: string;
  licensePlate: string;
  vehicleType: string;
  customerType: 'WALK_IN' | 'BOOKING' | 'MONTHLY';
  vehicleId: number | null;
  buildingId: number | null;
  cardId: number;
  cardCode: string;
  zoneId: number | null;
  zoneName: string;
  actualSlotId: number | null;
  actualSlotCode: string | null;
  checkInTime: string;
  status: 'ACTIVE' | 'LOST_CARD_REPORTED';
  imageIn?: string | null;
  imageOut?: string | null;
};

export type VehicleCheckinBooking = {
  id: number;
  bookingCode: string;
  licensePlate: string;
  vehicleTypeId: number | null;
  vehicleTypeName: string;
  buildingId: number | null;
  buildingName: string;
  plannedCheckinTime: string | null;
  plannedCheckoutTime: string | null;
  checkinGraceUntil: string | null;
  depositAmount: number;
  bookingStatus: string;
};

export type CheckEntryPayload = {
  licensePlate: string;
  vehicleTypeId: number;
  cardCode: string;
  buildingId: number;
};

export type CheckEntryResult = {
  allowed: boolean;
  reason?: string;
  pricingPolicyValid: boolean;
  zoneAvailable: boolean;
  cardAvailable: boolean;
  notBlacklisted: boolean;
  notAlreadyParked: boolean;
};

export type UpdateCheckinPayload = {
  licensePlate?: string;
  vehicleTypeId?: number;
  cardCode?: string;
  zoneId?: number;
  slotId?: number | null;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const isApiError =
      error instanceof ApiError ||
      ('name' in error && (error as any).name === 'ApiError') ||
      ('status' in error && 'data' in error);

    if (isApiError && 'data' in error && error.data && typeof error.data === 'object') {
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

    if ('message' in error && typeof (error as any).message === 'string' && (error as any).message.trim()) {
      return (error as any).message;
    }
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
    vehicleType: session.vehicleType ? String(session.vehicleType) : 'UNKNOWN',
    customerType: session.monthlySubscriptionId
      ? 'MONTHLY'
      : session.bookingId
        ? 'BOOKING'
        : 'WALK_IN',
    vehicleId: session.vehicleId ?? null,
    buildingId: session.buildingId ?? null,
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
    imageIn: session.imageIn ?? null,
    imageOut: session.imageOut ?? null,
  };
};

const mapBooking = (booking: BookingDto): VehicleCheckinBooking => {
  const id = Number(booking.id ?? 0);
  return {
    id,
    bookingCode: `BK-${String(id).padStart(4, '0')}`,
    licensePlate: String(booking.licensePlate ?? ''),
    vehicleTypeId: booking.vehicleTypeId ?? null,
    vehicleTypeName: String(booking.vehicleTypeName ?? 'Unknown'),
    buildingId: booking.buildingId ?? null,
    buildingName: String(booking.buildingName ?? ''),
    plannedCheckinTime: booking.plannedCheckinTime ?? null,
    plannedCheckoutTime: booking.plannedCheckoutTime ?? null,
    checkinGraceUntil: booking.checkinGraceUntil ?? null,
    depositAmount: Number(booking.depositAmount ?? 0),
    bookingStatus: String(booking.bookingStatus ?? ''),
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

export type OcrScanPayload = {
  image: string;
};

export type OcrScanResult = {
  licensePlate: string;
  confidence: number;
};

export const scanLicensePlate = async (
  payload: OcrScanPayload
): Promise<OcrScanResult> => {
  try {
    const response = await api.post<BaseResponse<OcrScanResult>>(
      '/parking-sessions/ocr',
      payload
    );
    return unwrap(response, 'License plate scanning failed.');
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

export const checkEntryConditions = async (
  payload: CheckEntryPayload
): Promise<CheckEntryResult> => {
  try {
    const response = await api.post<BaseResponse<CheckEntryResult>>(
      '/parking-sessions/check-entry',
      payload
    );
    return unwrap(response, 'Entry condition check failed.');
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const updateCheckinInfo = async (
  sessionId: number,
  payload: UpdateCheckinPayload
): Promise<VehicleCheckinSession> => {
  try {
    const response = await api.patch<BaseResponse<ParkingSessionDto>>(
      `/parking-sessions/${sessionId}/update`,
      payload
    );
    return mapActiveParkingSession(unwrap(response, 'Update check-in info failed.'));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchCheckinBookingsByBuilding = async (
  buildingId: number
): Promise<VehicleCheckinBooking[]> => {
  try {
    const response = await api.get<BaseResponse<BookingDto[]>>(
      `/bookings/by-building/${buildingId}`
    );
    return unwrap(response, 'Could not load bookings.').map(mapBooking);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchCheckinBookings = async (): Promise<VehicleCheckinBooking[]> => {
  try {
    const response = await api.get<BaseResponse<BookingDto[]>>('/bookings');
    return unwrap(response, 'Could not load bookings.').map(mapBooking);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export type ReallocateSlotDto = {
  id: number;
  code: string;
  zoneName: string;
  floorName: string;
};

export const fetchAvailableSlotsForReallocation = async (
  buildingId: number,
  vehicleTypeId: number,
  plannedCheckinTime: string,
  plannedCheckoutTime: string
): Promise<ReallocateSlotDto[]> => {
  try {
    const floorRes = await api.get<any>('/Floors');
    const floors = (floorRes && floorRes.success) ? floorRes.data : (Array.isArray(floorRes) ? floorRes : []);
    const buildingFloors = floors.filter((f: any) => Number(f.buildingId ?? 0) === buildingId);

    const availableSlots: ReallocateSlotDto[] = [];

    for (const floor of buildingFloors) {
      const zoneRes = await api.get<any>(`/Zones/floor/${floor.id}`);
      const zones = (zoneRes && zoneRes.success) ? zoneRes.data : (Array.isArray(zoneRes) ? zoneRes : []);
      const matchingZones = zones.filter((z: any) => Number(z.vehicleTypeId) === vehicleTypeId);

      for (const zone of matchingZones) {
        const slotRes = await api.get<any>(
          `/ParkingSlots/zone/${zone.id}?plannedCheckinTime=${plannedCheckinTime}&plannedCheckoutTime=${plannedCheckoutTime}`
        );
        const slots = (slotRes && slotRes.success) ? slotRes.data : (Array.isArray(slotRes) ? slotRes : []);

        for (const slot of slots) {
          const isAvailable = (slot.status === 0 || slot.status === 'Available') && !slot.isReserved;
          if (isAvailable) {
            availableSlots.push({
              id: slot.id,
              code: slot.code || '',
              zoneName: zone.name || '',
              floorName: floor.name || '',
            });
          }
        }
      }
    }

    return availableSlots;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
