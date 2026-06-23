'use client';

import React, { useState } from 'react';
import { useIncidentTypes } from '@/features/incident-type';
import { useIncidents } from '@/features/incident';
import type { Incident, IncidentStatus } from '@/features/incident';

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; bg: string }> = {
  Open: { label: 'Open', color: 'text-red-700', bg: 'bg-red-100' },
  Processing: { label: 'Processing', color: 'text-amber-700', bg: 'bg-amber-100' },
  Resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  Cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export default function IncidentHandling() {
  const { incidentTypes, loading: loadingIncidentTypes } = useIncidentTypes();
  const {
    incidents,
    loading: loadingIncidents,
    updateIncidentStatus,
  } = useIncidents();

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [notes, setNotes] = useState('');

  const handleStatusChange = async (id: number, status: IncidentStatus) => {
    const success = await updateIncidentStatus(id, status);
    if (success) {
      setSelectedIncident(null);
      setNotes('');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Cancelled');

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Incident Handling Center</h1>
        <p className="text-slate-500 text-sm mt-1">Resolve parking discrepancies, issue fines for lost tickets, and record incident logs.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-600 mb-3">Available Incident Types</h3>
        {loadingIncidentTypes ? (
          <p className="text-xs text-slate-400">Loading incident types...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {incidentTypes.map((type) => (
              <span key={type.id} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {type.incidentName}
                {type.defaultPenaltyFee != null && (
                  <span className="text-red-500 ml-1">({type.defaultPenaltyFee.toLocaleString()} VND)</span>
                )}
              </span>
            ))}
            {incidentTypes.length === 0 && (
              <p className="text-xs text-slate-400">No incident types configured</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100 font-sans">Active Incidents</h3>

          {loadingIncidents ? (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
              <p className="text-sm mt-2">Loading incidents...</p>
            </div>
          ) : activeIncidents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
              <p className="text-sm mt-2">No active incidents</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map((incident) => {
                const config = STATUS_CONFIG[incident.status];
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-sm transition-all ${
                      selectedIncident?.id === incident.id ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined p-2 rounded-lg text-lg ${
                        incident.status === 'Resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                      }`}>
                        {incident.status === 'Resolved' ? 'check_circle' : 'report_problem'}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          #{incident.id}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Type: <span className="font-semibold text-slate-600">{incident.incidentName}</span> | Plate: <span className="font-mono font-bold">{incident.licensePlate}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 self-end sm:self-center font-medium">{formatTime(incident.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedIncident ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-800">Incident #{selectedIncident.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Review discrepancy details and verify checklist.</p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Incident Type:</span>
                  <span className="font-bold text-slate-700">{selectedIncident.incidentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Plate:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedIncident.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-mono font-bold text-slate-700">#{selectedIncident.sessionId}</span>
                </div>
                {selectedIncident.description && (
                  <div className="flex justify-between">
                    <span>Description:</span>
                    <span className="font-bold text-slate-700 text-right max-w-[60%]">{selectedIncident.description}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                  <span className="font-bold text-red-500">Penalty Fee:</span>
                  <span className="font-bold text-red-500">{selectedIncident.penaltyFee.toLocaleString()} VND</span>
                </div>
              </div>

              {selectedIncident.status === 'Open' || selectedIncident.status === 'Processing' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Operational Notes / Reason</label>
                    <textarea
                      placeholder="Enter resolution notes or proof verified (e.g. driver license checked)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex gap-2">
                    {selectedIncident.status === 'Open' && (
                      <button
                        onClick={() => handleStatusChange(selectedIncident.id, 'Processing')}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">pending</span>
                        Processing
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(selectedIncident.id, 'Resolved')}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      Resolve
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedIncident.id, 'Cancelled')}
                      className="py-3 px-4 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border text-center text-xs font-bold flex items-center justify-center gap-1.5 ${
                  selectedIncident.status === 'Resolved'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {selectedIncident.status === 'Resolved' ? 'check_circle' : 'cancel'}
                  </span>
                  {selectedIncident.status === 'Resolved'
                    ? 'This incident has been fully resolved.'
                    : 'This incident has been cancelled.'}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl">gpp_maybe</span>
              <p className="text-sm mt-2">Select an incident from the list to view resolution workflow.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}