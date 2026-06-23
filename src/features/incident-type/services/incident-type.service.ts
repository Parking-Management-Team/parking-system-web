import { api } from '@/lib/api/client';
import { IncidentType, CreateIncidentTypeRequest, UpdateIncidentTypeRequest, IncidentTypeApiResponse } from '../types';

const BASE_URL = '/IncidentType';

export const incidentTypeService = {
  getAll: async (): Promise<IncidentType[]> => {
    const res = await api.get<IncidentTypeApiResponse<IncidentType[]>>(BASE_URL);
    return res.data || [];
  },

  getById: async (id: number): Promise<IncidentType | null> => {
    const res = await api.get<IncidentTypeApiResponse<IncidentType>>(`${BASE_URL}/${id}`);
    return res.data || null;
  },

  create: async (data: CreateIncidentTypeRequest): Promise<IncidentType | null> => {
    const res = await api.post<IncidentTypeApiResponse<IncidentType>>(BASE_URL, data);
    return res.data || null;
  },

  update: async (id: number, data: UpdateIncidentTypeRequest): Promise<boolean> => {
    const res = await api.put<IncidentTypeApiResponse<void>>(`${BASE_URL}/${id}`, data);
    return res.success === true;
  },

  delete: async (id: number): Promise<boolean> => {
    const res = await api.delete<IncidentTypeApiResponse<void>>(`${BASE_URL}/${id}`);
    return res.success === true;
  }
};