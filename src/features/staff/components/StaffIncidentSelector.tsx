'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { incidentService } from '@/features/incident/services/incident.service';
import type { Incident, IncidentType } from '@/features/incident/types';

type StaffIncidentSelectorProps = {
  sessionId: number;
  licensePlate: string;
  cardCode?: string | null;
  compact?: boolean;
  onChanged?: () => void;
};

const formatCurrency = (value?: number | null) =>
  `${Math.round(Number(value ?? 0)).toLocaleString('vi-VN')} ₫`;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export default function StaffIncidentSelector({
  sessionId,
  licensePlate,
  cardCode,
  compact = false,
  onChanged,
}: StaffIncidentSelectorProps) {
  const { showToast } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [sessionIncidents, setSessionIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingTypeId, setSubmittingTypeId] = useState<number | null>(null);
  const [deletingIncidentId, setDeletingIncidentId] = useState<number | null>(null);

  const activeIncidents = useMemo(
    () => sessionIncidents.filter((incident) => incident.status !== 'CANCELLED'),
    [sessionIncidents]
  );

  const activeIncidentTypeIds = useMemo(
    () => new Set(activeIncidents.map((incident) => incident.incidentTypeId)),
    [activeIncidents]
  );

  const loadIncidentData = async () => {
    setLoading(true);
    try {
      const [types, incidents] = await Promise.all([
        incidentService.getIncidentTypes(),
        incidentService.getBySessionId(sessionId),
      ]);
      setIncidentTypes(types);
      setSessionIncidents(incidents);
    } catch (error) {
      showToast(getErrorMessage(error, 'Không tải được incident.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadIncidentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleToggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) void loadIncidentData();
  };

  const handleAddIncident = async (type: IncidentType) => {
    if (activeIncidentTypeIds.has(type.id)) {
      showToast('Incident này đã được chọn cho session hiện tại.', 'info');
      return;
    }

    setSubmittingTypeId(type.id);
    try {
      await incidentService.create({
        sessionId,
        incidentTypeId: type.id,
        penaltyFee: type.defaultPenaltyFee ?? null,
        description: `${type.incidentName} - ${licensePlate}${cardCode ? ` - ${cardCode}` : ''}`,
      });

      showToast(`Đã thêm incident: ${type.incidentName}`, 'success');
      await loadIncidentData();
      onChanged?.();
    } catch (error) {
      showToast(getErrorMessage(error, 'Không tạo được incident.'), 'error');
    } finally {
      setSubmittingTypeId(null);
    }
  };

  const handleDeleteIncident = async (incident: Incident) => {
    setDeletingIncidentId(incident.id);
    try {
      await incidentService.delete(incident.id);
      showToast(`Đã xóa incident: ${incident.incidentName}`, 'success');
      await loadIncidentData();
      onChanged?.();
    } catch (error) {
      showToast(getErrorMessage(error, 'Không xóa được incident.'), 'error');
    } finally {
      setDeletingIncidentId(null);
    }
  };

  return (
    <div className={`rounded-3xl border border-orange-100 bg-orange-50/70 ${compact ? 'p-3' : 'p-4'}`}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700">
          <span className="material-symbols-outlined text-lg">warning</span>
          Incidents
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs">
            {activeIncidents.length}
          </span>
        </span>
        <span className="material-symbols-outlined text-orange-700">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {activeIncidents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeIncidents.map((incident) => (
            <span
              key={incident.id}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm"
            >
              {incident.incidentName}
              <span className="text-red-600">{formatCurrency(incident.penaltyFee)}</span>
              <button
                type="button"
                onClick={() => void handleDeleteIncident(incident)}
                disabled={deletingIncidentId === incident.id}
                className="rounded-full text-slate-400 hover:text-red-600 disabled:opacity-40"
                title="Remove incident"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
          {loading ? (
            <p className="text-sm font-bold text-slate-400">Loading incidents...</p>
          ) : incidentTypes.length === 0 ? (
            <p className="text-sm font-bold text-slate-400">
              Chưa có incident type từ BE để chọn.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {incidentTypes.map((type) => {
                const selected = activeIncidentTypeIds.has(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => void handleAddIncident(type)}
                    disabled={selected || submittingTypeId === type.id}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black">{type.incidentName}</p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase text-slate-400">
                          {type.incidentCode || 'NO_CODE'}
                        </p>
                      </div>
                      {selected && (
                        <span className="material-symbols-outlined text-lg text-emerald-600">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-black text-red-600">
                      {formatCurrency(type.defaultPenaltyFee)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
