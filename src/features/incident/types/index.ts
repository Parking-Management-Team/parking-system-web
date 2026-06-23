export interface Incident {
  id: number;
  sessionId: number;
  licensePlate: string;
  incidentTypeId: number;
  incidentName: string;
  description?: string;
  penaltyFee: number;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export type IncidentStatus = 'Open' | 'Processing' | 'Resolved' | 'Cancelled';

export interface CreateIncidentRequest {
  sessionId: number;
  licensePlate: string;
  incidentTypeId: number;
  description?: string;
  penaltyFee: number;
}

export interface UpdateIncidentRequest {
  description?: string;
  penaltyFee?: number;
}

export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
}

export interface IncidentApiResponse<T> {
  status: number;
  message: string;
  data: T;
}