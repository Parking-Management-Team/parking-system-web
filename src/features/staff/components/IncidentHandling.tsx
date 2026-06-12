'use client';

import React, { useState } from 'react';

const MOCK_INCIDENTS = [
  { id: 'INC-2026-001', type: 'LOST_TICKET', status: 'PENDING', plate: '51A-987.65', time: '10m ago' },
  { id: 'INC-2026-002', type: 'OVERTIME', status: 'RESOLVED', plate: '29B-432.10', time: '1h ago' },
  { id: 'INC-2026-003', type: 'WRONG_AREA', status: 'PENDING', plate: '72C-888.88', time: '2h ago' },
];

/**
 * IncidentHandling Component - Module xử lý sự cố tại bãi đỗ
 * Cho phép nhân viên giải quyết mất vé xe, phạt đỗ sai vị trí, và báo cáo sự cố lên Manager.
 */
export default function IncidentHandling() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<typeof MOCK_INCIDENTS[0] | null>(null);
  const fineAmount = '200,000 VND';
  const [notes, setNotes] = useState('');

  const handleResolve = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'RESOLVED' } : inc));
    alert(`Incident ${id} marked as RESOLVED`);
    setSelectedIncident(null);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Incident Handling Center</h1>
        <p className="text-slate-500 text-sm mt-1">Resolve parking discrepancies, issue fines for lost tickets, and record incident logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Danh sách các sự cố hiện có */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100 font-sans">Active Incidents</h3>

          <div className="space-y-3">
            {incidents.map((incident) => {
              const isResolved = incident.status === 'RESOLVED';
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
                      isResolved ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                    }`}>
                      {isResolved ? 'check_circle' : 'report_problem'}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {incident.id}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Type: <span className="font-semibold text-slate-600">{incident.type}</span> | Plate: <span className="font-mono font-bold">{incident.plate}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 self-end sm:self-center font-medium">{incident.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Control Panel giải quyết */}
        <div className="space-y-6">
          {selectedIncident ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-800">Resolve: {selectedIncident.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Review discrepancy details and verify checklist.</p>
              </div>

              {/* Chi tiết sự cố */}
              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Violation Type:</span>
                  <span className="font-bold text-slate-700">{selectedIncident.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Associated Plate:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedIncident.plate}</span>
                </div>
                {selectedIncident.type === 'LOST_TICKET' && (
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                    <span className="font-bold text-red-500">Standard Ticket Fine:</span>
                    <span className="font-bold text-red-500">{fineAmount}</span>
                  </div>
                )}
              </div>

              {selectedIncident.status === 'PENDING' ? (
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

                  <button
                    onClick={() => handleResolve(selectedIncident.id)}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                    Mark as Resolved
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  This incident has been fully resolved.
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
