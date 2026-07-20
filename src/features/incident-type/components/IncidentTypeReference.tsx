'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import {
  incidentTypeService,
  penaltyConfigService,
} from '@/features/incident-type/services/incident-type.service';
import type { IncidentType, PenaltyConfig } from '@/features/incident-type/types';

const formatCurrency = (amount?: number | null) =>
  `${Math.round(Number(amount ?? 0)).toLocaleString('vi-VN')} đ`;

export default function IncidentTypeReference() {
  const { showToast } = useAuth();
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [penaltyConfigs, setPenaltyConfigs] = useState<PenaltyConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      const [types, penalties] = await Promise.all([
        incidentTypeService.getAll(),
        penaltyConfigService.getAllActive().catch((error) => {
          console.warn('Penalty config API is not ready or returned empty data.', error);
          return [];
        }),
      ]);
      setIncidentTypes(types);
      setPenaltyConfigs(penalties);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not load incident type reference.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
            Staff Reference
          </p>
          <h1 className="text-3xl font-black text-slate-950">Incident types</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Read-only list loaded from the system. Staff uses these types when reporting incidents.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/staff/incident"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Incident Handling
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-700"
          >
            <span className="material-symbols-outlined text-lg">
              {isLoading ? 'progress_activity' : 'refresh'}
            </span>
            Refresh
          </button>
        </div>
      </header>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Configured incident fees</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Active penalty config is shown when available; otherwise the type default is used.
            </p>
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search type/code..."
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 lg:w-80"
          />
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
            <span className="material-symbols-outlined animate-spin text-5xl">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-bold">Loading incident types...</p>
          </div>
        ) : visibleIncidentTypes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl">category</span>
            <p className="mt-3 text-sm font-bold">No incident types found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Incident type</th>
                  <th className="px-5 py-4">Penalty</th>
                  <th className="px-5 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleIncidentTypes.map((type) => {
                  const activePenalty =
                    penaltyByTypeId.get(type.id)?.penaltyFee ??
                    type.defaultPenaltyFee ??
                    0;

                  return (
                    <tr key={type.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-mono text-xs font-black text-slate-800">
                        {type.incidentCode || 'NO_CODE'}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {type.incidentName}
                      </td>
                      <td className="px-5 py-4 font-black text-red-600">
                        {formatCurrency(activePenalty)}
                      </td>
                      <td className="max-w-xl px-5 py-4 text-xs font-semibold text-slate-500">
                        {type.description || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
