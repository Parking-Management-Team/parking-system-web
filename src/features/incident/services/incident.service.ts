import { api } from '@/lib/api/client';
import {
  Incident,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  UpdateIncidentStatusRequest,
  IncidentApiResponse,
} from '../types';

const BASE_URL = '/api/Incident';

export const incidentService = {
  getAll: async (): Promise<Incident[]> => {
    const res = await api.get<IncidentApiResponse<Incident[]>>(BASE_URL);
    return res.data || [];
  },

  getById: async (id: number): Promise<Incident | null> => {
    const res = await api.get<IncidentApiResponse<Incident>>(`${BASE_URL}/${id}`);
    return res.data || null;
  },

  getBySessionId: async (sessionId: number): Promise<Incident[]> => {
    const res = await api.get<IncidentApiResponse<Incident[]>>(
      `${BASE_URL}/session/${sessionId}`
    );
    return res.data || [];
  },

  create: async (data: CreateIncidentRequest): Promise<Incident | null> => {
    const res = await api.post<IncidentApiResponse<Incident>>(BASE_URL, data);
    return res.data || null;
  },

  update: async (id: number, data: UpdateIncidentRequest): Promise<boolean> => {
    const res = await api.put<IncidentApiResponse<void>>(`${BASE_URL}/${id}`, data);
    return res.status === 200;
  },

  updateStatus: async (id: number, data: UpdateIncidentStatusRequest): Promise<boolean> => {
    const res = await api.patch<IncidentApiResponse<void>>(`${BASE_URL}/${id}/status`, data);
    return res.status === 200;
  },

  delete: async (id: number): Promise<boolean> => {
    const res = await api.delete<IncidentApiResponse<void>>(`${BASE_URL}/${id}`);
    return res.status === 200;
  },
};