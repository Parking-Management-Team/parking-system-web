export interface Incident {
  id: number;
  sessionId: number;
  licensePlate?: string | null;
  incidentTypeId: number;
  incidentName?: string | null;
  description?: string;
  penaltyFee: number;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export type IncidentStatus = 'Open' | 'Processing' | 'Resolved' | 'Cancelled' | number;

export interface CreateIncidentRequest {
  sessionId: number;
  licensePlate?: string;
  incidentTypeId: number;
  description?: string;
  penaltyFee: number;
}

export interface UpdateIncidentRequest {
  description?: string;
  penaltyFee?: number;
}

export interface UpdateIncidentStatusRequest {
  status: number;
  description?: string;
}

export interface IncidentApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
}