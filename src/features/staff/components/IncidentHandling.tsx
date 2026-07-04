'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useIncidents } from '@/features/incident';
import { penaltyConfigService } from '@/features/incident-type/services/incident-type.service';
import type { PenaltyConfig } from '@/features/incident-type/types';
import type {
  BlacklistTargetType,
  Incident,
  IncidentSessionOption,
  IncidentStatus,
} from '@/features/incident';

const STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; badge: string; icon: string }
> = {
  OPEN: {
    label: 'Open',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    icon: 'report_problem',
  },
  PROCESSING: {
    label: 'Processing',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: 'pending',
  },
  RESOLVED: {
    label: 'Resolved',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'task_alt',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'border-slate-200 bg-slate-100 text-slate-500',
    icon: 'cancel',
  },
};

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getAllowedNextStatuses = (status: IncidentStatus): IncidentStatus[] => {
  if (status === 'OPEN') return ['PROCESSING', 'RESOLVED', 'CANCELLED'];
  if (status === 'PROCESSING') return ['RESOLVED', 'CANCELLED'];
  return [];
};

const findIncidentSession = (
  incident: Incident | null,
  sessions: IncidentSessionOption[]
) => {
  if (!incident) return null;
  return sessions.find((session) => session.sessionId === incident.sessionId) ?? null;
};

export default function IncidentHandling() {
  const { showToast } = useAuth();
  const {
    incidents,
    filteredIncidents,
    incidentTypes,
    activeSessions,
    isLoading,
    isSubmitting,
    error,
    filters,
    setFilters,
    refresh,
    createIncident,
    updateIncidentStatus,
    createBlacklist,
    deleteIncident,
  } = useIncidents();

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedIncidentTypeId, setSelectedIncidentTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [penaltyFee, setPenaltyFee] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [blacklistIncident, setBlacklistIncident] = useState<Incident | null>(null);
  const [blacklistTarget, setBlacklistTarget] =
    useState<BlacklistTargetType>('VEHICLE');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [penaltyConfigs, setPenaltyConfigs] = useState<PenaltyConfig[]>([]);

  const selectedIncidentType = incidentTypes.find(
    (type) => type.id === Number(selectedIncidentTypeId)
  );

  const selectedSession = activeSessions.find(
    (session) => session.sessionId === Number(selectedSessionId)
  );

  const penaltyByTypeId = useMemo(() => {
    const map = new Map<number, PenaltyConfig>();
    penaltyConfigs.forEach((config) => {
      if (config.isActive) {
        map.set(config.incidentTypeId, config);
      }
    });
    return map;
  }, [penaltyConfigs]);

  const selectedDefaultPenalty =
    selectedIncidentType != null
      ? penaltyByTypeId.get(selectedIncidentType.id)?.penaltyFee ??
        selectedIncidentType.defaultPenaltyFee ??
        0
      : 0;

  const selectedBlacklistSession = findIncidentSession(
    blacklistIncident,
    activeSessions
  );

  const blacklistVehicleId =
    blacklistIncident?.vehicleId ?? selectedBlacklistSession?.vehicleId ?? null;
  const blacklistCardId =
    blacklistIncident?.cardId ?? selectedBlacklistSession?.cardId ?? null;

  const statusCounts = useMemo(
    () =>
      incidents.reduce(
        (counts, incident) => ({
          ...counts,
          [incident.status]: counts[incident.status] + 1,
        }),
        { OPEN: 0, PROCESSING: 0, RESOLVED: 0, CANCELLED: 0 } as Record<
          IncidentStatus,
          number
        >
      ),
    [incidents]
  );

  const loadPenaltyConfigs = useCallback(async () => {
    try {
      setPenaltyConfigs(await penaltyConfigService.getAllActive());
    } catch (error) {
      console.warn('Could not load active penalty configs for Staff Incident.', error);
      setPenaltyConfigs([]);
    }
  }, []);

  useEffect(() => {
    void loadPenaltyConfigs();
  }, [loadPenaltyConfigs]);

  useEffect(() => {
    if (selectedIncidentType) {
      setPenaltyFee(String(selectedDefaultPenalty));
    }
  }, [selectedDefaultPenalty, selectedIncidentType]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const isUnpaidIncidentType = (type?: { incidentCode?: string | null; incidentName?: string | null }) => {
    const code = String(type?.incidentCode ?? '').trim().toUpperCase();
    const name = String(type?.incidentName ?? '').trim().toUpperCase();
    return (
      code === 'UNPAID_VEHICLE' ||
      code.includes('UNPAID') ||
      code.includes('PAYMENT') ||
      name.includes('UNPAID') ||
      name.includes('PAYMENT') ||
      name.includes('REFUSE') ||
      name.includes('KHONG THANH TOAN') ||
      name.includes('KHÔNG THANH TOÁN')
    );
  };

  const handleCreateIncident = async (event: React.FormEvent) => {
    event.preventDefault();

    const sessionId = Number(selectedSessionId);
    const incidentTypeId = Number(selectedIncidentTypeId);
    const fee = penaltyFee.trim() ? Number(penaltyFee) : null;
    const trimmedDescription = description.trim();

    if (!sessionId) {
      showToast('Please select an active parking session.', 'error');
      return;
    }

    if (!incidentTypeId) {
      showToast('Please select an incident type.', 'error');
      return;
    }

    if (trimmedDescription.length > 100) {
      showToast(
        'Description must be 100 characters or less because BE currently limits this field.',
        'error'
      );
      return;
    }

    if (fee != null && (Number.isNaN(fee) || fee < 0)) {
      showToast('Penalty fee must not be negative.', 'error');
      return;
    }

    const result = await createIncident({
      sessionId,
      incidentTypeId,
      description: trimmedDescription || undefined,
      penaltyFee: fee,
    });

    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      if (isUnpaidIncidentType(selectedIncidentType)) {
        const includeVehicle = selectedSession?.vehicleId ?? null;
        const includeCard = selectedSession?.cardId ?? null;

        if (includeVehicle || includeCard || result.incident?.id) {
          const blacklistResult = await createBlacklist({
            vehicleId: includeVehicle,
            cardId: includeCard,
            incidentId: result.incident?.id ?? null,
            reason: `Unpaid vehicle incident${selectedSession?.licensePlate ? ` - ${selectedSession.licensePlate}` : ''}`,
          });
          showToast(
            blacklistResult.success
              ? 'Unpaid incident was created and blacklisted.'
              : blacklistResult.message,
            blacklistResult.success ? 'success' : 'error'
          );
        } else {
          showToast(
            'Incident was created, but BE did not return vehicle/card/incident id for blacklist.',
            'info'
          );
        }
      }
      setSelectedSessionId('');
      setSelectedIncidentTypeId('');
      setDescription('');
      setPenaltyFee('');
    }
  };

  const handleStatusChange = async (
    incident: Incident,
    nextStatus: IncidentStatus
  ) => {
    const result = await updateIncidentStatus(
      incident.id,
      nextStatus,
      statusNote || undefined
    );

    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      if (nextStatus === 'PROCESSING') {
        showToast(
          'Incident moved to processing. Incident-level QR/payment API is not available yet; use checkout online payment when collecting fees.',
          'info'
        );
      }
      setSelectedIncident(null);
      setStatusNote('');
    }
  };

  const handleDeleteIncident = async (incident: Incident) => {
    const success = await deleteIncident(incident.id);
    showToast(
      success ? 'Incident was removed.' : 'Could not remove this incident.',
      success ? 'success' : 'error'
    );

    if (success && selectedIncident?.id === incident.id) {
      setSelectedIncident(null);
    }
  };

  const openBlacklistModal = (incident: Incident) => {
    setBlacklistIncident(incident);
    setBlacklistTarget('VEHICLE');
    setBlacklistReason(
      incident.licensePlate
        ? `Incident #${incident.id} - ${incident.licensePlate}`
        : `Incident #${incident.id}`
    );
  };

  const handleCreateBlacklist = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!blacklistIncident) return;

    const reason = blacklistReason.trim();
    if (!reason) {
      showToast('Blacklist reason is required.', 'error');
      return;
    }

    const includeVehicle =
      blacklistTarget === 'VEHICLE' || blacklistTarget === 'BOTH';
    const includeCard = blacklistTarget === 'CARD' || blacklistTarget === 'BOTH';

    if (includeVehicle && !blacklistVehicleId) {
      showToast('This incident does not have a vehicleId to blacklist.', 'error');
      return;
    }

    if (includeCard && !blacklistCardId) {
      showToast('This incident does not have a cardId to blacklist.', 'error');
      return;
    }

    const result = await createBlacklist({
      vehicleId: includeVehicle ? blacklistVehicleId : null,
      cardId: includeCard ? blacklistCardId : null,
      incidentId: blacklistIncident.id,
      reason,
    });

    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      setBlacklistIncident(null);
      setBlacklistReason('');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incident Handling</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Handle lost tickets, wrong license plates, overtime parking, wrong area
            parking, and unpaid vehicles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/staff/incident-types"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">category</span>
            Incident types
          </Link>
          <button
            type="button"
            onClick={() => {
              void refresh();
              void loadPenaltyConfigs();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{incidents.length}</p>
        </div>
        {(['OPEN', 'PROCESSING', 'RESOLVED', 'CANCELLED'] as IncidentStatus[]).map(
          (status) => (
            <div key={status} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {STATUS_CONFIG[status].label}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {statusCounts[status]}
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <form
          onSubmit={handleCreateIncident}
          className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-800">Create Incident</h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a record only. This does not checkout, release card, or relocate vehicle.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Active Parking Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select session</option>
              {activeSessions.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {session.licensePlate} · {session.cardCode ?? 'No card code'} ·{' '}
                  {session.sessionCode ?? `SS-${session.sessionId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Incident Type
            </label>
            <select
              value={selectedIncidentTypeId}
              onChange={(event) => setSelectedIncidentTypeId(event.target.value)}
              disabled={incidentTypes.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:text-slate-400"
            >
              <option value="">
                {incidentTypes.length === 0
                  ? 'No incident types from BE'
                  : 'Select incident type'}
              </option>
              {incidentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.incidentName} ({type.incidentCode || 'NO_CODE'})
                </option>
              ))}
            </select>
            {incidentTypes.length === 0 && (
              <p className="text-xs font-semibold text-amber-600">
                BE endpoint exists but currently returns no incident types. Ask BE to seed/create
                incident types before creating incidents.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Penalty Fee
            </label>
            <input
              type="number"
              min={0}
              value={penaltyFee}
              onChange={(event) => setPenaltyFee(event.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={100}
              placeholder="Describe the incident. Max 100 characters by current BE DTO."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-right text-xs text-slate-400">{description.length}/100</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || incidentTypes.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:bg-slate-300 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            {isSubmitting ? 'Creating...' : 'Create Incident'}
          </button>
        </form>

        <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Incident List</h2>
              <p className="mt-1 text-xs text-slate-500">
                Search and update status for existing incidents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Plate, card, session, type..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
            />
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as 'ALL' | IncidentStatus,
                }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <option value="ALL">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input
              type="date"
              value={filters.createdDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  createdDate: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            />
          </div>

          {isLoading ? (
            <div className="py-14 text-center text-slate-400">
              <span className="material-symbols-outlined animate-spin text-4xl">
                progress_activity
              </span>
              <p className="mt-2 text-sm">Loading incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">gpp_maybe</span>
              <p className="mt-2 text-sm">No incidents found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => {
                const config = STATUS_CONFIG[incident.status];
                const nextStatuses = getAllowedNextStatuses(incident.status);
                const isSelected = selectedIncident?.id === incident.id;

                return (
                  <article
                    key={incident.id}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-800">
                            #{incident.id}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.badge}`}>
                            <span className="material-symbols-outlined text-sm">{config.icon}</span>
                            {config.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                            {incident.incidentName}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs font-semibold text-slate-600 md:grid-cols-2">
                          <p>Plate: <span className="font-mono font-black text-slate-800">{incident.licensePlate ?? '—'}</span></p>
                          <p>Card: <span className="font-mono font-black text-slate-800">{incident.cardCode ?? '—'}</span></p>
                          <p>Session: <span className="font-mono font-black text-slate-800">{incident.sessionCode ?? `#${incident.sessionId}`}</span></p>
                          <p>Penalty: <span className="font-black text-red-600">{formatCurrency(incident.penaltyFee)}</span></p>
                          <p>Created: {formatDateTime(incident.createdAt)}</p>
                          <p>Resolved: {formatDateTime(incident.resolvedAt)}</p>
                        </div>
                        {incident.description && (
                          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            {incident.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedIncident(isSelected ? null : incident)}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                        >
                          {isSelected ? 'Close Actions' : 'Actions'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openBlacklistModal(incident)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Blacklist
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleDeleteIncident(incident)}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                          title="Remove incident"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <textarea
                          value={statusNote}
                          onChange={(event) => setStatusNote(event.target.value)}
                          rows={2}
                          placeholder="Optional status note / resolution proof"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {nextStatuses.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {nextStatuses.map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => void handleStatusChange(incident, status)}
                                className={`rounded-lg border px-3 py-2 text-xs font-bold ${STATUS_CONFIG[status].badge}`}
                              >
                                Move to {STATUS_CONFIG[status].label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-400">
                            Final status. No more status actions available.
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {blacklistIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateBlacklist}
            className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Create Blacklist Record
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Incident #{blacklistIncident.id} · {blacklistIncident.licensePlate ?? 'No plate'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlacklistIncident(null)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Target</label>
              <div className="grid grid-cols-3 gap-2">
                {(['VEHICLE', 'CARD', 'BOTH'] as BlacklistTargetType[]).map((target) => {
                  const disabled =
                    (target === 'VEHICLE' && !blacklistVehicleId) ||
                    (target === 'CARD' && !blacklistCardId) ||
                    (target === 'BOTH' && (!blacklistVehicleId || !blacklistCardId));

                  return (
                    <button
                      key={target}
                      type="button"
                      disabled={disabled}
                      onClick={() => setBlacklistTarget(target)}
                      className={`rounded-xl border px-3 py-3 text-xs font-bold ${
                        blacklistTarget === target
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {target}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                vehicleId: {blacklistVehicleId ?? '—'} · cardId: {blacklistCardId ?? '—'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500">Reason</label>
              <textarea
                value={blacklistReason}
                onChange={(event) => setBlacklistReason(event.target.value)}
                rows={3}
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-right text-xs text-slate-400">{blacklistReason.length}/100</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBlacklistIncident(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:bg-slate-300"
              >
                {isSubmitting ? 'Creating...' : 'Create Blacklist Record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
