import type { IncidentCode } from '@/features/incident/types';

export interface IncidentType {
  id: number;
  incidentCode: IncidentCode;
  incidentName: string;
  description?: string | null;
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
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
}

export interface PenaltyConfig {
  id: number;
  incidentTypeId: number;
  incidentTypeName: string;
  penaltyFee: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface CreatePenaltyConfigRequest {
  incidentTypeId: number;
  penaltyFee: number;
}
