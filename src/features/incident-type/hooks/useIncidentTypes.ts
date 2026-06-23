import { useState, useEffect } from 'react';
import { incidentTypeService } from '../services/incident-type.service';
import { IncidentType, CreateIncidentTypeRequest, UpdateIncidentTypeRequest } from '../types';

export function useIncidentTypes() {
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidentTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentTypeService.getAll();
      setIncidentTypes(data);
    } catch (err) {
      console.error('Error fetching incident types:', err);
      setError('Không thể tải danh sách loại sự cố');
    } finally {
      setLoading(false);
    }
  };

  const createIncidentType = async (data: CreateIncidentTypeRequest): Promise<boolean> => {
    try {
      const result = await incidentTypeService.create(data);
      if (result) {
        await fetchIncidentTypes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating incident type:', err);
      setError('Không thể tạo loại sự cố');
      return false;
    }
  };

  const updateIncidentType = async (id: number, data: UpdateIncidentTypeRequest): Promise<boolean> => {
    try {
      const success = await incidentTypeService.update(id, data);
      if (success) {
        await fetchIncidentTypes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating incident type:', err);
      setError('Không thể cập nhật loại sự cố');
      return false;
    }
  };

  const deleteIncidentType = async (id: number): Promise<boolean> => {
    try {
      const success = await incidentTypeService.delete(id);
      if (success) {
        await fetchIncidentTypes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting incident type:', err);
      setError('Không thể xóa loại sự cố');
      return false;
    }
  };

  useEffect(() => {
    fetchIncidentTypes();
  }, []);

  return {
    incidentTypes,
    loading,
    error,
    fetchIncidentTypes,
    createIncidentType,
    updateIncidentType,
    deleteIncidentType
  };
}