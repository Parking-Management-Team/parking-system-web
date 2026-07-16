export type IncidentStatus = 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CANCELLED';

export type IncidentCode =
  | 'LOST_TICKET'
  | 'WRONG_LICENSE_PLATE'
  | 'OVERTIME_PARKING'
  | 'WRONG_AREA'
  | 'UNPAID_VEHICLE'
  | string;

export type BlacklistTargetType = 'VEHICLE' | 'CARD' | 'BOTH';

export interface IncidentType {
  id: number;
  incidentCode: IncidentCode;
  incidentName: string;
  description?: string | null;
  defaultPenaltyFee?: number | null;
}

export interface Incident {
  id: number;
  sessionId: number;
  sessionCode?: string | null;
  incidentTypeId: number;
  incidentCode: IncidentCode;
  incidentName: string;
  licensePlate?: string | null;
  cardCode?: string | null;
  vehicleType?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  vehicleId?: number | null;
  cardId?: number | null;
  description?: string | null;
  penaltyFee?: number | null;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentSessionOption {
  sessionId: number;
  sessionCode?: string | null;
  licensePlate: string;
  cardCode?: string | null;
  vehicleType?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  checkInTime?: string | null;
  zoneCode?: string | null;
  slotCode?: string | null;
  vehicleId?: number | null;
  cardId?: number | null;
}

export interface CreateIncidentRequest {
  sessionId: number;
  incidentTypeId: number;
  description?: string;
  penaltyFee?: number | null;
}

export interface UpdateIncidentRequest {
  description?: string;
  penaltyFee?: number | null;
  incidentTypeId?: number | null;
}

export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
  note?: string;
}

export interface CreateBlacklistRequest {
  vehicleId?: number | null;
  cardId?: number | null;
  incidentId?: number | null;
  reason: string;
}

export interface IncidentFilters {
  search: string;
  status: 'ALL' | IncidentStatus;
  incidentTypeId: 'ALL' | number;
  createdDate: string;
}

export interface IncidentApiResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
}

export interface PaginatedApiResponse<T> {
  items?: T[];
  totalCount?: number;
  totalPages?: number;
  pageIndex?: number;
  pageSize?: number;
  success?: boolean;
  message?: string | null;
}
