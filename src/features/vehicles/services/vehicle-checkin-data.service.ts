import { api, ApiError } from '@/lib/api/client';

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errors?: Record<string, string[]> | null;
};

type BuildingDto = {
  id?: number | null;
  name?: string | null;
  code?: string | null;
  totalFloor?: number | null;
};

type FloorDto = {
  id?: number | null;
  buildingId?: number | null;
  floorNumber?: number | null;
  name?: string | null;
  status?: number | string | null;
};

type ZoneDto = {
  id?: number | null;
  floorId?: number | null;
  code?: string | null;
  name?: string | null;
  vehicleTypeId?: number | null;
  accessType?: number | string | null;
  capacity?: number | null;
  status?: number | string | null;
};

type SlotSubscriptionDto = {
  subscriptionId?: number | null;
  accountId?: number | null;
  accountName?: string | null;
  vehicleId?: number | null;
  licensePlate?: string | null;
  status?: string | null;
  monthlyPrice?: number | null;
  activatedAt?: string | null;
  expiredAt?: string | null;
};

type SlotDto = {
  id?: number | null;
  code?: string | null;
  zoneId?: number | null;
  vehicleTypeId?: number | null;
  accessType?: number | string | null;
  status?: number | string | null;
  // Backend field names (correct)
  occupiedLicensePlate?: string | null;
  subscription?: SlotSubscriptionDto | null;
};

type BookingDto = {
  id?: number | null;
  code?: string | null;
  licensePlate?: string | null;
  vehicleType?: string | null;
  vehicleTypeName?: string | null;
  bookingStatus?: string | null;
  depositAmount?: number | null;
  buildingName?: string | null;
  checkinGraceUntil?: string | null;
};

export type CheckinParkingSlot = {
  id: number;
  code: string;
  zoneId: number;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  accessType: 'GENERAL' | 'MONTHLY';
  status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE';
  assignedVehiclePlate: string | null;
};

export type CheckinParkingZone = {
  id: number;
  code: string;
  name: string;
  buildingName: string;
  floorName: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  accessType: 'GENERAL' | 'MONTHLY';
  status: 'ACTIVE' | 'MAINTENANCE' | 'LOCKED';
  capacity: number;
  occupied: number;
};

export type CheckinBooking = {
  id: number;
  code: string;
  vehiclePlate: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  status: 'CONFIRMED' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  depositPaid: boolean;
  isWithinGrace: boolean;
  buildingName: string;
};

export type CheckinMonthlySubscription = {
  id: number;
  cardCode: string;
  vehiclePlate: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  buildingName: string;
  assignedZoneId: number | null;
  assignedSlotCode: string | null;
  validTo: string;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as { message?: unknown; title?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }
  return error instanceof Error ? error.message : 'Request failed.';
};

const getResponseData = <T>(response: BaseResponse<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const baseResponse = response as BaseResponse<T>;
    if (baseResponse.success === false) throw new Error(baseResponse.message || 'Request failed.');
    if (baseResponse.data == null) throw new Error(baseResponse.message || 'Request failed.');
    return baseResponse.data;
  }
  return response as T;
};

const mapVehicleType = (id?: number | null): 'CAR' | 'MOTORCYCLE' => {
  // vehicleTypeId: 1=Standard(Car), 3=EV Charging(Car), 4=Motorbike
  if (id === 4) return 'MOTORCYCLE';
  return 'CAR';
};

const mapAccessType = (value?: number | string | null): 'GENERAL' | 'MONTHLY' => {
  if (value === 1 || value === '1' || String(value ?? '').toUpperCase() === 'MONTHLY') return 'MONTHLY';
  return 'GENERAL';
};

const mapZoneStatus = (value?: number | string | null): 'ACTIVE' | 'MAINTENANCE' | 'LOCKED' => {
  const s = String(value ?? '').trim().toUpperCase();
  if (s === '3' || s === 'INACTIVE' || s === 'MAINTENANCE') return 'MAINTENANCE';
  if (s === 'LOCKED') return 'LOCKED';
  return 'ACTIVE';
};

const mapSlotStatus = (value?: number | string | null): CheckinParkingSlot['status'] => {
  // Backend: 0=Available, 1=Occupied, 2=Blocked, 3=Maintenance
  const s = String(value ?? '').trim().toUpperCase();
  if (s === '1' || s === 'OCCUPIED') return 'OCCUPIED';
  if (s === '2' || s === 'BLOCKED') return 'BLOCKED';
  if (s === '3' || s === 'MAINTENANCE') return 'MAINTENANCE';
  return 'AVAILABLE';
};

const mapBookingStatus = (value?: string | null): CheckinBooking['status'] => {
  const s = String(value ?? '').trim().toUpperCase();
  if (s === 'CONFIRMED') return 'CONFIRMED';
  if (s === 'PENDING') return 'PENDING';
  if (s === 'EXPIRED') return 'EXPIRED';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'CONFIRMED';
};

export const fetchAllZones = async (): Promise<CheckinParkingZone[]> => {
  try {
    const buildingRes = await api.get<BaseResponse<PagedResult<BuildingDto>> | PagedResult<BuildingDto>>(
      '/Buildings/paged?pageIndex=1&pageSize=100'
    );
    const buildingsData = getResponseData(buildingRes);
    const buildings = Array.isArray(buildingsData) ? buildingsData : (buildingsData.items ?? []);

    const allZones: CheckinParkingZone[] = [];

    for (const building of buildings) {
      const buildingId = Number(building.id ?? 0);
      if (buildingId <= 0) continue;

      const floorRes = await api.get<BaseResponse<FloorDto[]> | FloorDto[]>('/Floors');
      const floorsData = getResponseData(floorRes);
      const floors = Array.isArray(floorsData) ? floorsData : [];

      const buildingFloors = floors.filter((f) => Number(f.buildingId ?? 0) === buildingId);

      for (const floor of buildingFloors) {
        const floorId = Number(floor.id ?? 0);
        if (floorId <= 0) continue;

        try {
          const zoneRes = await api.get<BaseResponse<ZoneDto[]> | ZoneDto[]>(`/Zones/floor/${floorId}`);
          const zonesData = getResponseData(zoneRes);
          const zones = Array.isArray(zonesData) ? zonesData : [];

          for (const zone of zones) {
            const zoneId = Number(zone.id ?? 0);
            if (zoneId <= 0) continue;

            let occupied = 0;
            try {
              const slotRes = await api.get<BaseResponse<SlotDto[]> | SlotDto[]>(`/ParkingSlots/zone/${zoneId}`);
              const slotsData = getResponseData(slotRes);
              const slots = Array.isArray(slotsData) ? slotsData : [];
              occupied = slots.filter((s) => mapSlotStatus(s.status) === 'OCCUPIED').length;
            } catch {
              // ignore slot count errors
            }

            allZones.push({
              id: zoneId,
              code: String(zone.code ?? `ZN-${zoneId}`),
              name: String(zone.name ?? `Zone ${zoneId}`),
              buildingName: String(building.name ?? 'Building'),
              floorName: String(floor.name ?? `Floor ${floor.floorNumber ?? ''}`),
              vehicleType: mapVehicleType(zone.vehicleTypeId),
              accessType: mapAccessType(zone.accessType),
              status: mapZoneStatus(zone.status),
              capacity: Number(zone.capacity ?? 0),
              occupied,
            });
          }
        } catch {
          // skip floor if zone fetch fails
        }
      }
    }

    return allZones;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchAllSlots = async (): Promise<CheckinParkingSlot[]> => {
  try {
    const buildingRes = await api.get<BaseResponse<PagedResult<BuildingDto>> | PagedResult<BuildingDto>>(
      '/Buildings/paged?pageIndex=1&pageSize=100'
    );
    const buildingsData = getResponseData(buildingRes);
    const buildings = Array.isArray(buildingsData) ? buildingsData : (buildingsData.items ?? []);

    const allSlots: CheckinParkingSlot[] = [];

    for (const building of buildings) {
      const buildingId = Number(building.id ?? 0);
      if (buildingId <= 0) continue;

      const floorRes = await api.get<BaseResponse<FloorDto[]> | FloorDto[]>('/Floors');
      const floorsData = getResponseData(floorRes);
      const floors = Array.isArray(floorsData) ? floorsData : [];
      const buildingFloors = floors.filter((f) => Number(f.buildingId ?? 0) === buildingId);

      for (const floor of buildingFloors) {
        const floorId = Number(floor.id ?? 0);
        if (floorId <= 0) continue;

        try {
          const zoneRes = await api.get<BaseResponse<ZoneDto[]> | ZoneDto[]>(`/Zones/floor/${floorId}`);
          const zonesData = getResponseData(zoneRes);
          const zones = Array.isArray(zonesData) ? zonesData : [];

          for (const zone of zones) {
            const zoneId = Number(zone.id ?? 0);
            if (zoneId <= 0) continue;

            try {
              const slotRes = await api.get<BaseResponse<SlotDto[]> | SlotDto[]>(`/ParkingSlots/zone/${zoneId}`);
              const slotsData = getResponseData(slotRes);
              const slots = Array.isArray(slotsData) ? slotsData : [];

              for (const slot of slots) {
                // Resolve plate: subscription takes priority, then occupiedLicensePlate
                const assignedPlate =
                  slot.subscription?.licensePlate ??
                  slot.occupiedLicensePlate ??
                  null;
                allSlots.push({
                  id: Number(slot.id ?? 0),
                  code: String(slot.code ?? ''),
                  zoneId,
                  vehicleType: mapVehicleType(slot.vehicleTypeId),
                  accessType: mapAccessType(slot.accessType),
                  status: mapSlotStatus(slot.status),
                  assignedVehiclePlate: assignedPlate,
                });
              }
            } catch {
              // skip slot fetch errors
            }
          }
        } catch {
          // skip zone fetch errors
        }
      }
    }

    return allSlots;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchActiveBookings = async (): Promise<CheckinBooking[]> => {
  try {
    const response = await api.get<BaseResponse<BookingDto[]> | BookingDto[]>('/bookings?status=Confirmed');
    const data = getResponseData(response);
    const bookings = Array.isArray(data) ? data : [];

    return bookings.map((b) => ({
      id: Number(b.id ?? 0),
      code: String(b.code ?? ''),
      vehiclePlate: String(b.licensePlate ?? ''),
      vehicleType: String(b.vehicleTypeName ?? b.vehicleType ?? '').toUpperCase() === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR',
      status: mapBookingStatus(b.bookingStatus),
      depositPaid: Boolean(b.depositAmount && b.depositAmount > 0),
      isWithinGrace: new Date(b.checkinGraceUntil ?? 0) > new Date(),
      buildingName: String(b.buildingName ?? ''),
    }));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

type PagedResult<T> = {
  items?: T[];
  totalCount?: number;
  totalPages?: number;
  pageIndex?: number;
  pageSize?: number;
};
