'use client';

import React, { useState, useEffect } from 'react';
import { useIncidents } from '@/features/incident/hooks/useIncidents';
import { useIncidentTypes } from '@/features/incident-type/hooks/useIncidentTypes';
import { incidentService } from '@/features/incident/services/incident.service';
import { useAuth } from '@/features/auth';
import {
  Search,
  Filter,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  X,
  FileText,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface IncidentTrackingProps {
  role: 'MANAGER' | 'ADMIN';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Open: { label: 'Open', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  Processing: { label: 'Processing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  Resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  Cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export default function IncidentTracking({ role }: IncidentTrackingProps) {
  const { showToast } = useAuth();
  const { incidentTypes } = useIncidentTypes();
  const {
    incidents,
    loading: loadingIncidents,
    fetchIncidents,
    updateIncidentStatus,
  } = useIncidents();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Selected Incident for Detail Modal
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [editedFee, setEditedFee] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Stats derivation
  const totalCount = incidents.length;
  const openCount = incidents.filter(i => i.status === 'OPEN' || (i.status as any) === 0).length;
  const processingCount = incidents.filter(i => i.status === 'PROCESSING' || (i.status as any) === 1).length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED' || (i.status as any) === 2).length;
  
  const totalPenaltiesCollected = incidents
    .filter(i => i.status === 'RESOLVED' || (i.status as any) === 2)
    .reduce((sum, i) => sum + (i.penaltyFee || 0), 0);

  // Normalize backend status representation to UI status string
  const getNormalizedStatus = (status: any): 'Open' | 'Processing' | 'Resolved' | 'Cancelled' => {
    if (status === 0 || status === 'Open' || status === 'OPEN') return 'Open';
    if (status === 1 || status === 'Processing' || status === 'PROCESSING') return 'Processing';
    if (status === 2 || status === 'Resolved' || status === 'RESOLVED') return 'Resolved';
    if (status === 3 || status === 'Cancelled' || status === 'CANCELLED') return 'Cancelled';
    return 'Open';
  };

  // Filter & Search Incidents
  const filteredIncidents = incidents.filter(inc => {
    const normStatus = getNormalizedStatus(inc.status);
    const matchStatus = statusFilter === 'all' || normStatus === statusFilter;
    
    const matchType = typeFilter === 'all' || String(inc.incidentTypeId) === typeFilter;
    
    const query = searchTerm.toLowerCase();
    const matchSearch = 
      String(inc.id).includes(query) ||
      String(inc.sessionId).includes(query) ||
      (inc.licensePlate && inc.licensePlate.toLowerCase().includes(query)) ||
      (inc.incidentName && inc.incidentName.toLowerCase().includes(query)) ||
      (inc.description && inc.description.toLowerCase().includes(query));

    return matchStatus && matchType && matchSearch;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE));
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenDetail = (incident: any) => {
    setSelectedIncident(incident);
    setNotes(incident.description || '');
    setEditedFee(incident.penaltyFee || 0);
  };

  const handleStatusUpdate = async (status: 'Processing' | 'Resolved' | 'Cancelled') => {
    if (!selectedIncident) return;
    setIsUpdating(true);
    try {
      const apiStatus = 
        status === 'Processing'
          ? 'PROCESSING'
          : status === 'Resolved'
            ? 'RESOLVED'
            : 'CANCELLED';
      const success = await updateIncidentStatus(selectedIncident.id, apiStatus, notes);
      if (success.success) {
        // Also update description & fee if changed
        if (editedFee !== selectedIncident.penaltyFee || notes !== selectedIncident.description) {
          await incidentService.update(selectedIncident.id, {
            description: notes,
            penaltyFee: editedFee
          });
        }
        showToast(`Incident status set to ${status}.`, 'success');
        setSelectedIncident(null);
        fetchIncidents();
      } else {
        showToast(success.message || 'Failed to update incident. Please try again.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating incident status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedIncident) return;
    setIsUpdating(true);
    try {
      const success = await incidentService.update(selectedIncident.id, {
        description: notes,
        penaltyFee: editedFee
      });
      if (success) {
        showToast('Incident updated successfully.', 'success');
        setSelectedIncident(null);
        fetchIncidents();
      } else {
        showToast('Failed to save changes.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving changes.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset page index on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fadeIn">
      {/* HEADER SECTION */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incident & Penalty Tracking</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor reported facility issues, parking violations, and track penalties/fines in real time ({role} mode).
          </p>
        </div>
        <button
          onClick={() => fetchIncidents()}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </section>

      {/* STATISTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Incidents */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Reports</p>
            <h3 className="text-2xl font-extrabold text-slate-700 mt-1">
              {loadingIncidents ? '—' : totalCount}
            </h3>
          </div>
        </div>

        {/* Open Incidents */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all border-l-rose-500 border-l-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Open Tickets</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1 animate-pulse">
              {loadingIncidents ? '—' : openCount}
            </h3>
          </div>
        </div>

        {/* Processing Incidents */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all border-l-amber-500 border-l-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Processing</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {loadingIncidents ? '—' : processingCount}
            </h3>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all border-l-emerald-500 border-l-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {loadingIncidents ? '—' : resolvedCount}
            </h3>
          </div>
        </div>

        {/* Penalty Revenue */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Penalties Collected</p>
            <h3 className="text-lg font-extrabold text-emerald-700 mt-1 truncate">
              {loadingIncidents ? '—' : `${totalPenaltiesCollected.toLocaleString()} VND`}
            </h3>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH PANEL */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:max-w-3xl">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search plate, type, session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-semibold rounded-xl"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:max-w-[160px] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-600"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Processing">Processing</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Incident Type filter */}
          <div className="w-full sm:max-w-[200px] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-600"
            >
              <option value="all">All Incident Types</option>
              {incidentTypes.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {type.incidentName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
          }}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
        >
          Clear All Filters
        </button>
      </section>

      {/* TABLE / LIST OF INCIDENTS */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loadingIncidents ? (
            <div className="py-24 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-xs font-semibold">Synchronizing incidents from server...</p>
            </div>
          ) : paginatedIncidents.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">No Incidents Found</h3>
              <p className="text-xs text-slate-400 max-w-[280px]">
                No incident logs match your current filters or searching parameters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Plate / Session</th>
                  <th className="px-6 py-4">Incident Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Penalty Fee</th>
                  <th className="px-6 py-4">Reported Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedIncidents.map((inc) => {
                  const normStatus = getNormalizedStatus(inc.status);
                  const statusConf = STATUS_CONFIG[normStatus] || STATUS_CONFIG.Open;
                  
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold">#INC-{inc.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            {inc.licensePlate || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Session: #{inc.sessionId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{inc.incidentName || `Type #${inc.incidentTypeId}`}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={inc.description || undefined}>
                        {inc.description || 'No description provided'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-red-500">
                        {(inc.penaltyFee ?? 0) > 0 ? `${(inc.penaltyFee ?? 0).toLocaleString()} VND` : '0 VND'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inc.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>
                          <span className={`w-1 h-1 rounded-full ${
                            normStatus === 'Resolved' ? 'bg-emerald-500' : normStatus === 'Open' ? 'bg-rose-500' : normStatus === 'Processing' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}></span>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(inc)}
                          className="px-3 py-1.5 hover:bg-slate-50 border border-slate-200 text-[#1B2A41] text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1 hover:border-slate-300"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION BAR */}
        {!loadingIncidents && filteredIncidents.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredIncidents.length)}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredIncidents.length)} of {filteredIncidents.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* DETAIL MODAL DRAWER */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Incident Review #INC-{selectedIncident.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Review reported ticket details and adjust status or penalties.</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Incident Details Summary */}
              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Incident Name:</span>
                  <span className="font-bold text-slate-700">{selectedIncident.incidentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Plate:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedIncident.licensePlate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Linked Session ID:</span>
                  <span className="font-mono font-bold text-slate-700">#{selectedIncident.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reported On:</span>
                  <span className="font-bold text-slate-700">
                    {new Date(selectedIncident.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedIncident.resolvedAt && (
                  <div className="flex justify-between">
                    <span>Resolved On:</span>
                    <span className="font-bold text-emerald-600">
                      {new Date(selectedIncident.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Penalty Fee */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Penalty Fee (VND)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">VND</span>
                  <input
                    type="number"
                    value={editedFee}
                    onChange={(e) => setEditedFee(Number(e.target.value))}
                    disabled={getNormalizedStatus(selectedIncident.status) === 'Resolved'}
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-mono font-bold rounded-xl disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Default rate: {(selectedIncident.penaltyFee || 0).toLocaleString()} VND</p>
              </div>

              {/* Description / Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Operational Notes / Reason</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter detailed description of the incident resolution..."
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium rounded-xl resize-none"
                ></textarea>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                disabled={isUpdating}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>

              {getNormalizedStatus(selectedIncident.status) !== 'Resolved' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('Cancelled')}
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel Ticket
                  </button>
                  
                  {getNormalizedStatus(selectedIncident.status) === 'Open' && (
                    <button
                      onClick={() => handleStatusUpdate('Processing')}
                      disabled={isUpdating}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Set Processing'}
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusUpdate('Resolved')}
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Resolve & Close'}
                  </button>
                </>
              )}

              {getNormalizedStatus(selectedIncident.status) === 'Resolved' && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Notes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
