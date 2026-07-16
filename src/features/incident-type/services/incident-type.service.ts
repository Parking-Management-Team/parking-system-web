import { api } from '@/lib/api/client';
import {
  CreateIncidentTypeRequest,
  CreatePenaltyConfigRequest,
  IncidentType,
  IncidentTypeApiResponse,
  PenaltyConfig,
  UpdateIncidentTypeRequest,
} from '../types';

const BASE_URL = '/IncidentType';
const PENALTY_CONFIG_URL = '/penalty-configs';

const unwrap = <T>(response: IncidentTypeApiResponse<T> | T, fallback: string): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const base = response as IncidentTypeApiResponse<T>;
    if (base.success === false) {
      throw new Error(base.message || fallback);
    }
    if (base.data == null) {
      throw new Error(base.message || fallback);
    }
    return base.data;
  }

  return response as T;
};

export const incidentTypeService = {
  getAll: async (): Promise<IncidentType[]> => {
    const res = await api.get<IncidentTypeApiResponse<IncidentType[]> | IncidentType[]>(BASE_URL);
    return Array.isArray(res) ? res : unwrap(res, 'Could not load incident types.');
  },

  getById: async (id: number): Promise<IncidentType | null> => {
    const res = await api.get<IncidentTypeApiResponse<IncidentType>>(`${BASE_URL}/${id}`);
    return res.data || null;
  },

  create: async (data: CreateIncidentTypeRequest): Promise<IncidentType | null> => {
    const res = await api.post<IncidentTypeApiResponse<IncidentType>>(BASE_URL, data);
    return unwrap(res, 'Could not create incident type.');
  },

  update: async (id: number, data: UpdateIncidentTypeRequest): Promise<boolean> => {
    const res = await api.put<IncidentTypeApiResponse<IncidentType>>(`${BASE_URL}/${id}`, data);
    return res.success !== false;
  },

  delete: async (id: number): Promise<boolean> => {
    const res = await api.delete<IncidentTypeApiResponse<void>>(`${BASE_URL}/${id}`);
    return res.success !== false;
  }
};

export const penaltyConfigService = {
  getAllActive: async (): Promise<PenaltyConfig[]> => {
    const res = await api.get<IncidentTypeApiResponse<PenaltyConfig[]> | PenaltyConfig[]>(
      `${PENALTY_CONFIG_URL}?onlyActive=true`
    );
    return Array.isArray(res) ? res : unwrap(res, 'Could not load penalty configs.');
  },

  create: async (data: CreatePenaltyConfigRequest): Promise<PenaltyConfig> => {
    const res = await api.post<IncidentTypeApiResponse<PenaltyConfig>>(
      PENALTY_CONFIG_URL,
      data
    );
    return unwrap(res, 'Could not create penalty config.');
  },
};
