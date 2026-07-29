import { api, ApiError } from '@/lib/api/client';
import type {
  CreateBlacklistRequest,
  CreateIncidentRequest,
  Incident,
  IncidentApiResponse,
  IncidentSessionOption,
  IncidentStatus,
  IncidentType,
  PaginatedApiResponse,
  UpdateIncidentRequest,
  UpdateIncidentStatusRequest,
} from '../types';

type IncidentDto = {
  id?: number | null;
  incidentId?: number | null;
  sessionId?: number | null;
  sessionCode?: string | null;
  incidentTypeId?: number | null;
  incidentCode?: string | null;
  incidentName?: string | null;
  licensePlate?: string | null;
  licensePlateIn?: string | null;
  cardCode?: string | null;
  vehicleType?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  vehicleId?: number | null;
  cardId?: number | null;
  description?: string | null;
  penaltyFee?: number | null;
  status?: unknown;
  incidentStatus?: unknown;
  createdAt?: string | null;
  resolvedAt?: string | null;
};

type IncidentTypeDto = {
  id?: number | null;
  incidentTypeId?: number | null;
  incidentCode?: string | null;
  incidentName?: string | null;
  description?: string | null;
  defaultPenaltyFee?: number | null;
};

type ActiveSessionDto = {
  id?: number | null;
  sessionId?: number | null;
  sessionCode?: string | null;
  vehicleId?: number | null;
  cardId?: number | null;
  licensePlateIn?: string | null;
  licensePlate?: string | null;
  cardCode?: string | null;
  vehicleType?: string | null;
  vehicleTypeId?: number | null;
  vehicleTypeName?: string | null;
  checkInTime?: string | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  slotCode?: string | null;
};

const STATUS_TO_BE: Record<IncidentStatus, number> = {
  OPEN: 0,
  PROCESSING: 1,
  RESOLVED: 2,
  CANCELLED: 3,
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as {
      message?: unknown;
      title?: unknown;
      errors?: Record<string, unknown>;
    };

    const validationMessages = body.errors
      ? Object.values(body.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string')
      : [];

    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (validationMessages.length > 0) return validationMessages.join('\n');
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }

  return error instanceof Error ? error.message : 'Incident request failed.';
};

const unwrap = <T>(response: IncidentApiResponse<T> | T, fallback: string): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const baseResponse = response as IncidentApiResponse<T>;

    if (baseResponse.success === false) {
      throw new Error(baseResponse.message || fallback);
    }

    if (baseResponse.data == null) {
      throw new Error(baseResponse.message || fallback);
    }

    return baseResponse.data;
  }

  return response as T;
};

const unwrapList = <T>(response: IncidentApiResponse<PaginatedApiResponse<T> | T[]> | T[]): T[] => {
  const data = Array.isArray(response)
    ? response
    : unwrap(response, 'Could not load incident data.');

  if (Array.isArray(data)) return data;
  return data.items ?? [];
};

const mapIncidentStatus = (value: unknown): IncidentStatus => {
  if (typeof value === 'number') {
    const statuses: IncidentStatus[] = ['OPEN', 'PROCESSING', 'RESOLVED', 'CANCELLED'];
    return statuses[value] ?? 'OPEN';
  }

  switch (String(value ?? '').trim().toUpperCase()) {
    case '0':
    case 'OPEN':
      return 'OPEN';
    case '1':
    case 'PROCESSING':
      return 'PROCESSING';
    case '2':
    case 'RESOLVED':
      return 'RESOLVED';
    case '3':
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    default:
      return 'OPEN';
  }
};

const mapIncident = (incident: IncidentDto): Incident => {
  const id = Number(incident.id ?? incident.incidentId ?? 0);
  const sessionId = Number(incident.sessionId ?? 0);
  const incidentTypeId = Number(incident.incidentTypeId ?? 0);

  return {
    id,
    sessionId,
    sessionCode: incident.sessionCode ?? `SS-${sessionId}`,
    incidentTypeId,
    incidentCode: String(incident.incidentCode ?? ''),
    incidentName: String(incident.incidentName ?? `Incident type #${incidentTypeId}`),
    licensePlate: incident.licensePlate ?? incident.licensePlateIn ?? null,
    cardCode: incident.cardCode ?? null,
    vehicleType: incident.vehicleTypeName ?? incident.vehicleType ?? null,
    vehicleTypeId: incident.vehicleTypeId ?? null,
    vehicleTypeName: incident.vehicleTypeName ?? null,
    vehicleId: incident.vehicleId ?? null,
    cardId: incident.cardId ?? null,
    description: incident.description ?? null,
    penaltyFee: incident.penaltyFee ?? null,
    status: mapIncidentStatus(incident.status ?? incident.incidentStatus),
    createdAt: String(incident.createdAt ?? new Date().toISOString()),
    resolvedAt: incident.resolvedAt ?? null,
  };
};

const mapIncidentType = (type: IncidentTypeDto): IncidentType => {
  const id = Number(type.id ?? type.incidentTypeId ?? 0);

  return {
    id,
    incidentCode: String(type.incidentCode ?? ''),
    incidentName: String(type.incidentName ?? `Incident type #${id}`),
    description: type.description ?? null,
    defaultPenaltyFee: type.defaultPenaltyFee ?? null,
  };
};

const mapActiveSession = (session: ActiveSessionDto): IncidentSessionOption => {
  const sessionId = Number(session.id ?? session.sessionId ?? 0);

  return {
    sessionId,
    sessionCode: session.sessionCode ?? `SS-${sessionId}`,
    licensePlate: String(session.licensePlateIn ?? session.licensePlate ?? '-'),
    cardCode: session.cardCode ?? (session.cardId ? `#${session.cardId}` : null),
    vehicleType: session.vehicleTypeName ?? session.vehicleType ?? null,
    vehicleTypeId: session.vehicleTypeId ?? null,
    vehicleTypeName: session.vehicleTypeName ?? null,
    checkInTime: session.checkInTime ?? null,
    zoneCode: session.zoneName ?? session.zoneCode ?? null,
    slotCode: session.slotCode ?? null,
    vehicleId: session.vehicleId ?? null,
    cardId: session.cardId ?? null,
  };
};

export const incidentService = {
  getAll: async (): Promise<Incident[]> => {
    try {
      const response =
        await api.get<IncidentApiResponse<PaginatedApiResponse<IncidentDto> | IncidentDto[]>>(
          '/Incident?pageIndex=1&pageSize=100'
        );
      return unwrapList(response).map(mapIncident);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getById: async (id: number): Promise<Incident | null> => {
    try {
      const response = await api.get<IncidentApiResponse<IncidentDto>>(`/Incident/${id}`);
      return mapIncident(unwrap(response, 'Could not load incident detail.'));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getBySessionId: async (sessionId: number): Promise<Incident[]> => {
    try {
      const response = await api.get<IncidentApiResponse<IncidentDto[]>>(
        `/Incident/session/${sessionId}`
      );
      return unwrap(response, 'Could not load session incidents.').map(mapIncident);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getIncidentTypes: async (): Promise<IncidentType[]> => {
    try {
      const [itResponse, penResponse] = await Promise.all([
        api.get<IncidentApiResponse<IncidentTypeDto[]>>('/IncidentType'),
        api.get<{ data?: { incidentTypeId: number; penaltyFee: number; isActive: boolean }[]; success?: boolean }>('/penalty-configs?onlyActive=true').catch(() => ({ data: [] }))
      ]);
      const incidentTypes = unwrap(itResponse, 'Could not load incident types.').map(mapIncidentType);
      const activeConfigs = penResponse?.data ?? [];

      return incidentTypes.map((it) => {
        const activeConfig = activeConfigs.find((c) => c.incidentTypeId === it.id && c.isActive);
        return {
          ...it,
          defaultPenaltyFee: activeConfig ? activeConfig.penaltyFee : 0,
        };
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  getActiveSessions: async (): Promise<IncidentSessionOption[]> => {
    try {
      const response =
        await api.get<IncidentApiResponse<ActiveSessionDto[]> | ActiveSessionDto[]>(
          '/parking-sessions/active'
        );
      const data = Array.isArray(response)
        ? response
        : unwrap(response, 'Could not load active parking sessions.');
      return data.map(mapActiveSession);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  create: async (data: CreateIncidentRequest): Promise<(Incident & { autoBlacklisted?: boolean }) | null> => {
    try {
      const response = await api.post<IncidentApiResponse<IncidentDto>>('/Incident', {
        sessionId: data.sessionId,
        incidentTypeId: data.incidentTypeId,
        description: data.description?.trim() || null,
        penaltyFee: data.penaltyFee ?? null,
      });

      const createdIncident = mapIncident(unwrap(response, 'Could not create incident.'));
      let autoBlacklisted = false;

      // Auto-Blacklist Rule (BR-BLK-001): If vehicle reaches >= 3 accumulated incident violations
      try {
        const allIncidents = await incidentService.getAll();
        const vehicleIncidents = allIncidents.filter((inc) => {
          const sameSession = inc.sessionId === createdIncident.sessionId;
          const samePlate = createdIncident.licensePlate && inc.licensePlate &&
            inc.licensePlate.trim().toUpperCase() === createdIncident.licensePlate.trim().toUpperCase();
          const sameVehicleId = createdIncident.vehicleId && inc.vehicleId === createdIncident.vehicleId;
          return (sameSession || samePlate || sameVehicleId) && inc.status !== 'CANCELLED';
        });

        if (vehicleIncidents.length >= 3) {
          autoBlacklisted = true;
          await incidentService.createBlacklistRecord({
            vehicleId: createdIncident.vehicleId ?? null,
            cardId: createdIncident.cardId ?? null,
            incidentId: createdIncident.id,
            reason: `Auto-Blacklist Rule BR-BLK-001: Vehicle accumulated ${vehicleIncidents.length} incident violations (${createdIncident.licensePlate || 'N/A'}).`,
          });
        }
      } catch (autoErr) {
        console.warn('Auto-Blacklist rule check failed or record already exists:', autoErr);
      }

      return {
        ...createdIncident,
        autoBlacklisted,
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  update: async (id: number, data: UpdateIncidentRequest): Promise<boolean> => {
    try {
      const response = await api.put<IncidentApiResponse<unknown>>(`/Incident/${id}`, data);
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  updateStatus: async (
    id: number,
    data: UpdateIncidentStatusRequest
  ): Promise<boolean> => {
    try {
      const response = await api.patch<IncidentApiResponse<unknown>>(
        `/Incident/${id}/status`,
        {
          status: STATUS_TO_BE[data.status],
          description: data.note?.trim() || null,
        }
      );
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  createBlacklistRecord: async (data: CreateBlacklistRequest): Promise<boolean> => {
    try {
      const response = await api.post<IncidentApiResponse<unknown>>('/Blacklist', {
        vehicleId: data.vehicleId ?? null,
        cardId: data.cardId ?? null,
        incidentId: data.incidentId ?? null,
        reason: data.reason.trim(),
      });
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete<IncidentApiResponse<unknown>>(`/Incident/${id}`);
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  reportLostCard: async (
    sessionId: number,
    input: { staffId: number; description?: string }
  ): Promise<unknown> => {
    try {
      const response = await api.post<IncidentApiResponse<unknown>>(
        `/parking-sessions/${sessionId}/lost-card`,
        {
          staffId: input.staffId,
          description: input.description?.trim() || undefined,
        }
      );
      return unwrap(response, 'Could not report lost card.');
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  rollbackLostCard: async (sessionId: number): Promise<boolean> => {
    try {
      const response = await api.post<IncidentApiResponse<unknown>>(
        `/parking-sessions/${sessionId}/lost-card/rollback`,
        {}
      );
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  replaceSessionCard: async (sessionId: number, newCardCode: string): Promise<boolean> => {
    try {
      const response = await api.patch<IncidentApiResponse<unknown>>(
        `/parking-sessions/${sessionId}/replace-card?newCardCode=${encodeURIComponent(newCardCode.trim())}`,
        {}
      );
      return response.success !== false;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
