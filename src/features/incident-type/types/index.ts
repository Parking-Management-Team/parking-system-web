export interface IncidentType {
  id: number;
  incidentCode: string;
  incidentName: string;
  description?: string;
  defaultPenaltyFee?: number | null;
}

export interface CreateIncidentTypeRequest {
  incidentCode: string;
  incidentName: string;
  description?: string;
}

export interface UpdateIncidentTypeRequest {
  incidentName: string;
  description?: string;
}

export interface IncidentTypeApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
}