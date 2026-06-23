import { api } from '@/lib/api/client';
import {
  Incident,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  UpdateIncidentStatusRequest,
  IncidentApiResponse,
} from '../types';

const BASE_URL = '/Incident';

export const incidentService = {
  getAll: async (pageIndex?: number, pageSize?: number): Promise<Incident[]> => {
    const url = pageIndex !== undefined && pageSize !== undefined
      ? `${BASE_URL}?pageIndex=${pageIndex}&pageSize=${pageSize}`
      : `${BASE_URL}?pageIndex=1&pageSize=9999`;
    const res = await api.get<IncidentApiResponse<any>>(url);
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && res.data.items && Array.isArray(res.data.items)) {
      return res.data.items;
    }
    return [];
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
    return res.success === true;
  },

  updateStatus: async (id: number, data: UpdateIncidentStatusRequest): Promise<boolean> => {
    const res = await api.patch<IncidentApiResponse<void>>(`${BASE_URL}/${id}/status`, data);
    return res.success === true;
  },

  delete: async (id: number): Promise<boolean> => {
    const res = await api.delete<IncidentApiResponse<void>>(`${BASE_URL}/${id}`);
    return res.success === true;
  },
};