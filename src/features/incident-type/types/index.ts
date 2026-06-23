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
  status: number;
  message: string;
  data: T;
}