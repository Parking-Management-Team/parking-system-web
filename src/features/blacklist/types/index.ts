export interface AddToBlacklistRequest {
  vehicleId?: number | null;
  cardId?: number | null;
  incidentId?: number | null;
  licensePlate?: string | null;
  cardCode?: string | null;
  reason: string;
}

export interface BlacklistDto {
  id: number;
  vehicleId: number | null;
  licensePlate: string | null;
  cardId: number | null;
  cardCode: string | null;
  incidentId: number | null;
  reason: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface BlacklistApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
