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
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncidentById = async (id: number): Promise<Incident | null> => {
    try {
      return await incidentService.getById(id);
    } catch (err) {
      console.error('Error fetching incident:', err);
      setError('Failed to load incident details');
      return null;
    }
  };

  const fetchIncidentsBySession = async (sessionId: number): Promise<Incident[]> => {
    try {
      return await incidentService.getBySessionId(sessionId);
    } catch (err) {
      console.error('Error fetching incidents by session:', err);
      setError('Failed to load incidents by session');
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
      setError('Failed to create incident');
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
      setError('Failed to update incident');
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
      setError('Failed to update incident status');
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
      setError('Failed to delete incident');
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