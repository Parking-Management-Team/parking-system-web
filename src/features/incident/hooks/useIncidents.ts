import { useCallback, useEffect, useMemo, useState } from 'react';
import { incidentService } from '../services/incident.service';
import type {
  CreateBlacklistRequest,
  CreateIncidentRequest,
  Incident,
  IncidentFilters,
  IncidentSessionOption,
  IncidentStatus,
  IncidentType,
  UpdateIncidentRequest,
} from '../types';

const initialFilters: IncidentFilters = {
  search: '',
  status: 'ALL',
  incidentTypeId: 'ALL',
  createdDate: '',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [activeSessions, setActiveSessions] = useState<IncidentSessionOption[]>([]);
  const [filters, setFilters] = useState<IncidentFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incidentData, typeData, sessionData] = await Promise.all([
        incidentService.getAll(),
        incidentService.getIncidentTypes(),
        incidentService.getActiveSessions(),
      ]);

      setIncidents(incidentData);
      setIncidentTypes(typeData);
      setActiveSessions(sessionData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load incident data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredIncidents = useMemo(() => {
    const search = filters.search.trim().toUpperCase();

    return incidents.filter((incident) => {
      const matchesSearch =
        !search ||
        [
          incident.licensePlate,
          incident.cardCode,
          incident.sessionCode,
          incident.incidentName,
          String(incident.id),
        ].some((value) => String(value ?? '').toUpperCase().includes(search));

      const matchesStatus =
        filters.status === 'ALL' || incident.status === filters.status;

      const matchesType =
        filters.incidentTypeId === 'ALL' ||
        incident.incidentTypeId === filters.incidentTypeId;

      const matchesDate =
        !filters.createdDate ||
        incident.createdAt.slice(0, 10) === filters.createdDate;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [filters, incidents]);

  const fetchIncidents = refresh;

  const fetchIncidentById = async (id: number): Promise<Incident | null> => {
    try {
      return await incidentService.getById(id);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load incident details.'));
      return null;
    }
  };

  const fetchIncidentsBySession = async (sessionId: number): Promise<Incident[]> => {
    try {
      return await incidentService.getBySessionId(sessionId);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load incidents by session.'));
      return [];
    }
  };

  const createIncident = async (
    data: CreateIncidentRequest
  ): Promise<{ success: boolean; message: string; incident?: Incident | null }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const incident = await incidentService.create(data);
      await refresh();
      return {
        success: true,
        message: 'Incident was created successfully.',
        incident,
      };
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create incident.');
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateIncident = async (
    id: number,
    data: UpdateIncidentRequest
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const success = await incidentService.update(id, data);
      if (success) await refresh();
      return success;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update incident.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateIncidentStatus = async (
    id: number,
    status: IncidentStatus,
    note?: string
  ): Promise<{ success: boolean; message: string }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      await incidentService.updateStatus(id, { status, note });
      await refresh();
      return { success: true, message: `Incident was updated to ${status}.` };
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to update incident status.');
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const createBlacklist = async (
    data: CreateBlacklistRequest
  ): Promise<{ success: boolean; message: string }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      await incidentService.createBlacklistRecord(data);
      await refresh();
      return { success: true, message: 'Blacklist record was created successfully.' };
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create blacklist record.');
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteIncident = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const success = await incidentService.delete(id);
      if (success) await refresh();
      return success;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete incident.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    incidents,
    filteredIncidents,
    incidentTypes,
    activeSessions,
    loading,
    isLoading: loading,
    isSubmitting,
    error,
    filters,
    setFilters,
    refresh,
    fetchIncidents,
    fetchIncidentById,
    fetchIncidentsBySession,
    createIncident,
    updateIncident,
    updateIncidentStatus,
    createBlacklist,
    deleteIncident,
  };
}
