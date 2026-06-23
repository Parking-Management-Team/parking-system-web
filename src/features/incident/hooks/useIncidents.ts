import { useState, useEffect, useCallback } from 'react';
import { incidentService } from '../services/incident.service';
import {
  Incident,
  IncidentStatus,
  CreateIncidentRequest,
  UpdateIncidentRequest,
} from '../types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentService.getAll();
      setIncidents(data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Không thể tải danh sách sự cố');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncidentById = async (id: number): Promise<Incident | null> => {
    try {
      return await incidentService.getById(id);
    } catch (err) {
      console.error('Error fetching incident:', err);
      setError('Không thể tải thông tin sự cố');
      return null;
    }
  };

  const fetchIncidentsBySession = async (sessionId: number): Promise<Incident[]> => {
    try {
      return await incidentService.getBySessionId(sessionId);
    } catch (err) {
      console.error('Error fetching incidents by session:', err);
      setError('Không thể tải sự cố theo phiên');
      return [];
    }
  };

  const createIncident = async (data: CreateIncidentRequest): Promise<boolean> => {
    try {
      const result = await incidentService.create(data);
      if (result) {
        await fetchIncidents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating incident:', err);
      setError('Không thể tạo sự cố');
      return false;
    }
  };

  const updateIncident = async (id: number, data: UpdateIncidentRequest): Promise<boolean> => {
    try {
      const success = await incidentService.update(id, data);
      if (success) {
        await fetchIncidents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating incident:', err);
      setError('Không thể cập nhật sự cố');
      return false;
    }
  };

  const updateIncidentStatus = async (id: number, status: IncidentStatus): Promise<boolean> => {
    try {
      const success = await incidentService.updateStatus(id, { request: { status: String(status) } });
      if (success) {
        await fetchIncidents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating incident status:', err);
      setError('Không thể cập nhật trạng thái sự cố');
      return false;
    }
  };

  const deleteIncident = async (id: number): Promise<boolean> => {
    try {
      const success = await incidentService.delete(id);
      if (success) {
        await fetchIncidents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting incident:', err);
      setError('Không thể xóa sự cố');
      return false;
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    fetchIncidentById,
    fetchIncidentsBySession,
    createIncident,
    updateIncident,
    updateIncidentStatus,
    deleteIncident,
  };
}