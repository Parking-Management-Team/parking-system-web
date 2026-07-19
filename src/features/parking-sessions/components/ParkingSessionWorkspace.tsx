'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParkingSessions } from '../hooks/useParkingSessions';
import { api } from '@/lib/api/client';
import { BaseResponse, PagedResult } from '@/lib/types/building.types';
import {
  Search,
  Building as BuildingIcon,
  Filter,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CreditCard,
  Hash
} from 'lucide-react';

interface BuildingItem {
  id: number;
  name: string;
  code: string;
}

export default function ParkingSessionWorkspace() {
  const {
    sessions,
    totalCount,
    totalPages,
    pageIndex,
    isLoading,
    error,
    fetchSessions,
  } = useParkingSessions();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);



  // Load buildings
  useEffect(() => {
    api.get<BaseResponse<PagedResult<BuildingItem>>>('/Buildings/paged?pageIndex=1&pageSize=100')
      .then(res => {
        if (res.success && res.data?.items) {
          setBuildings(res.data.items);
        }
      })
      .catch(err => console.error('Error fetching buildings:', err));
  }, []);

  const triggerFetch = useCallback((page = 1) => {
    fetchSessions({
      pageIndex: page,
      pageSize: 10,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      buildingId: selectedBuildingId === 'ALL' ? undefined : selectedBuildingId,
      status: statusFilter,
      search: searchTerm || undefined
    });
  }, [fetchSessions, fromDate, toDate, selectedBuildingId, statusFilter, searchTerm]);

  useEffect(() => {
    triggerFetch(1);
  }, [triggerFetch]);

  // Stats / metrics compilation
  const stats = useMemo(() => {
    let active = 0;
    let completed = 0;
    let totalRevenue = 0;
    sessions.forEach(s => {
      if (s.sessionStatus.toUpperCase() === 'ACTIVE') active++;
      else if (s.sessionStatus.toUpperCase() === 'COMPLETED') completed++;
      totalRevenue += s.amountDue ?? s.totalFee ?? 0;
    });
    return { active, completed, totalRevenue, avgFee: sessions.length ? Math.round(totalRevenue / sessions.length) : 0 };
  }, [sessions]);

  const formatDate = (raw: string) => {
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return raw;
    }
  };

  const formatSlot = (slotCode?: string | null, zoneCode?: string | null, vehicleType?: string | null) => {
    if (vehicleType?.toUpperCase() === 'MOTORBIKE') {
      return 'Motorbike Area';
    }
    const s = (slotCode || '').trim();
    const z = (zoneCode || '').trim();
    if (!s && !z) return '—';
    if (s && z) {
      if (s.toLowerCase().startsWith(z.toLowerCase())) return s;
      return `${z}-${s}`;
    }
    return s || `Zone ${z}`;
  };



  const getBuildingDisplayName = (buildingName?: string | null, buildingId?: number | null) => {
    if (buildingName && buildingName !== 'Building') {
      return buildingName;
    }
    if (buildingId) {
      const b = buildings.find(item => item.id === buildingId);
      if (b) return `${b.name} (${b.code})`;
    }
    return '—';
  };



  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parking Session History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse complete log records of vehicle arrivals, parking zone occupancies, and checkout fees.
          </p>
        </div>
        <button
          onClick={() => triggerFetch(pageIndex)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records Loaded</span>
            <h3 className="text-3xl font-black text-slate-800 mt-2">{totalCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>Search match count</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-[#006d43] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Currently Parked</span>
            <h3 className="text-3xl font-black text-[#006d43] mt-2">{stats.active}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checked in vehicles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Completed Sessions</span>
            <h3 className="text-3xl font-black text-slate-700 mt-2">{stats.completed}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Departed vehicles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fees Collected (Set)</span>
            <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.totalRevenue.toLocaleString()} đ</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>Avg fee: {stats.avgFee.toLocaleString()} đ</span>
          </div>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Plate / Card / Slot code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl"
            />
          </div>

          {/* Building */}
          <div className="relative">
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBuildingId(val === 'ALL' ? 'ALL' : Number(val));
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600 appearance-none cursor-pointer"
            >
              <option value="ALL">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
              <BuildingIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600 appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Currently Parked</option>
              <option value="COMPLETED">Completed Session</option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* From Date */}
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading session history...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={() => triggerFetch(pageIndex)}
                className="mt-3 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              No parking sessions records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">License Plate</th>
                  <th className="px-6 py-4">Card Code</th>
                  <th className="px-6 py-4">Facility</th>
                  <th className="px-6 py-4">Slot</th>
                  <th className="px-6 py-4">Check-in / Check-out</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sessions.map((session) => {
                  const status = (session.sessionStatus || '').toUpperCase();
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        #{session.id}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {session.licensePlateIn}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {session.cardCode || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {getBuildingDisplayName(session.buildingName, session.buildingId)}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {formatSlot(session.slotCode, session.zoneCode, session.vehicleType)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 leading-relaxed">
                        <div className="flex flex-col">
                          <span>In: {formatDate(session.checkInTime)}</span>
                          {session.checkOutTime && <span className="text-[10px] text-slate-400">Out: {formatDate(session.checkOutTime)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                          }`} />
                          {session.sessionStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && sessions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs rounded-xl">
            <span className="text-slate-400">
              Showing Page {pageIndex} of {totalPages} (Total {totalCount} sessions)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => triggerFetch(Math.max(1, pageIndex - 1))}
                disabled={pageIndex === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => triggerFetch(p)}
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${pageIndex === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => triggerFetch(Math.min(totalPages, pageIndex + 1))}
                disabled={pageIndex === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
