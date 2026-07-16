'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth';
import {
  incidentTypeService,
  penaltyConfigService,
} from '@/features/incident-type/services/incident-type.service';
import type { IncidentType, PenaltyConfig } from '@/features/incident-type/types';

type FormState = {
  incidentCode: string;
  incidentName: string;
  description: string;
  penaltyFee: string;
};

const emptyForm: FormState = {
  incidentCode: '',
  incidentName: '',
  description: '',
  penaltyFee: '',
};

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const getApiMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      const body = data as {
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
  }

  return error instanceof Error ? error.message : fallback;
};

export default function IncidentTypeWorkspace() {
  const { showToast } = useAuth();
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [penaltyConfigs, setPenaltyConfigs] = useState<PenaltyConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingType, setEditingType] = useState<IncidentType | null>(null);
  const [deletingType, setDeletingType] = useState<IncidentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const penaltyByTypeId = useMemo(() => {
    const map = new Map<number, PenaltyConfig>();
    penaltyConfigs.forEach((config) => {
      if (config.isActive) {
        map.set(config.incidentTypeId, config);
      }
    });
    return map;
  }, [penaltyConfigs]);

  const visibleIncidentTypes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return incidentTypes;

    return incidentTypes.filter((type) =>
      [type.incidentCode, type.incidentName, type.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [incidentTypes, searchTerm]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [typeData, penaltyData] = await Promise.all([
        incidentTypeService.getAll(),
        penaltyConfigService.getAllActive().catch((error) => {
          console.warn('Penalty config API is not ready or returned empty data.', error);
          return [];
        }),
      ]);

      setIncidentTypes(typeData);
      setPenaltyConfigs(penaltyData);
    } catch (error) {
      showToast(getApiMessage(error, 'Could not load incident types.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingType(null);
  };

  const openEdit = (type: IncidentType) => {
    const activePenalty = penaltyByTypeId.get(type.id);
    setEditingType(type);
    setForm({
      incidentCode: type.incidentCode,
      incidentName: type.incidentName,
      description: type.description ?? '',
      penaltyFee: String(activePenalty?.penaltyFee ?? type.defaultPenaltyFee ?? ''),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const incidentName = form.incidentName.trim();
    const description = form.description.trim();
    const incidentCode = form.incidentCode.trim().toUpperCase();
    const penaltyFee = form.penaltyFee.trim() ? Number(form.penaltyFee) : null;

    if (!editingType && !incidentCode) {
      showToast('Incident code is required.', 'error');
      return;
    }

    if (!incidentName) {
      showToast('Incident name is required.', 'error');
      return;
    }

    if (penaltyFee != null && (!Number.isFinite(penaltyFee) || penaltyFee < 0)) {
      showToast('Default penalty must be a valid non-negative number.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const savedType = editingType
        ? await incidentTypeService.update(editingType.id, {
            incidentName,
            description: description || undefined,
          }).then(() => editingType)
        : await incidentTypeService.create({
            incidentCode,
            incidentName,
            description: description || undefined,
          });

      if (!savedType) {
        showToast('Could not save incident type.', 'error');
        return;
      }

      const currentPenalty = penaltyByTypeId.get(savedType.id)?.penaltyFee ?? null;
      if (penaltyFee != null && penaltyFee !== currentPenalty) {
        await penaltyConfigService.create({
          incidentTypeId: savedType.id,
          penaltyFee,
        });
      }

      showToast(
        editingType ? 'Incident type updated successfully.' : 'Incident type created successfully.',
        'success'
      );
      resetForm();
      await loadData();
    } catch (error) {
      showToast(getApiMessage(error, 'Could not save incident type.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    setIsDeleting(true);

    try {
      await incidentTypeService.delete(deletingType.id);
      showToast('Incident type deleted successfully.', 'success');
      setDeletingType(null);
      await loadData();
    } catch (error) {
      showToast(
        getApiMessage(
          error,
          'Could not delete this incident type. It may already be used by incidents.'
        ),
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
            Manager Configuration
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Incident Types</h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
            Define the incident categories Staff can select when reporting gate issues.
            Default penalty is applied automatically when Staff leaves penalty empty.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-slate-700 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg">
            {isLoading ? 'progress_activity' : 'refresh'}
          </span>
          Refresh
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">
              {editingType ? 'Edit incident type' : 'Create incident type'}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Code is only set when creating because BE update DTO does not accept code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Incident code
              </span>
              <input
                value={form.incidentCode}
                disabled={Boolean(editingType)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    incidentCode: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="LOST_CARD"
                maxLength={20}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm font-black uppercase outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:text-slate-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Incident name
              </span>
              <input
                value={form.incidentName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, incidentName: event.target.value }))
                }
                placeholder="Lost card"
                maxLength={100}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Default penalty
              </span>
              <input
                type="number"
                min={0}
                value={form.penaltyFee}
                onChange={(event) =>
                  setForm((current) => ({ ...current, penaltyFee: event.target.value }))
                }
                placeholder="0"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Short explanation for Staff..."
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="flex gap-3">
              {editingType && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : editingType ? 'Save changes' : 'Create type'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Configured incident types</h2>
              <p className="text-xs font-semibold text-slate-500">
                These options appear in Staff Incident Handling.
              </p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search code or name"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-500 lg:w-72"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            {isLoading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined animate-spin text-5xl">
                  progress_activity
                </span>
                <p className="mt-2 text-sm font-semibold">Loading incident types...</p>
              </div>
            ) : visibleIncidentTypes.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-5xl">category</span>
                <p className="mt-2 text-sm font-semibold">No incident types found.</p>
              </div>
            ) : (
              <div className="max-h-[620px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Code</th>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Default penalty</th>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {visibleIncidentTypes.map((type) => {
                      const activePenalty = penaltyByTypeId.get(type.id);
                      return (
                        <tr key={type.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-mono text-xs font-black text-slate-800">
                            {type.incidentCode}
                          </td>
                          <td className="px-5 py-4 font-black text-slate-800">
                            {type.incidentName}
                          </td>
                          <td className="px-5 py-4 font-black text-red-600">
                            {formatCurrency(activePenalty?.penaltyFee ?? type.defaultPenaltyFee)}
                          </td>
                          <td className="max-w-sm px-5 py-4 text-xs font-semibold text-slate-500">
                            {type.description || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(type)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingType(type)}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {deletingType && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Delete incident type?</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              You are deleting <span className="font-black">{deletingType.incidentName}</span>.
              BE may reject this if the type is already used by incidents.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingType(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
