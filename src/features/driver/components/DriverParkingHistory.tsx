'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { 
  Search, 
  Download, 
  MapPin, 
  Clock, 
  Plus, 
  Loader2, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  BarChart2
} from 'lucide-react';

interface ParkingSessionRecord {
  id: string | number;
  licensePlate?: string;
  licensePlateIn?: string;
  vehicleTypeName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  slotCode?: string;
  zoneCode?: string;
  buildingName?: string;
  totalFee?: number;
  fee?: number;
  sessionStatus?: string;
  status?: string;
}

function normalizeSession(raw: any): ParkingSessionRecord & {
  plate: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  zone: string;
  fee: number;
  status: 'completed' | 'cancelled' | 'active';
} {
  const plate = raw.licensePlateIn || raw.licensePlate || '—';
  const checkInTime = raw.checkInTime || raw.checkIn || '';
  const checkOutTime = raw.checkOutTime || raw.checkOut || '';
  
  let duration = '—';
  if (checkInTime && checkOutTime) {
    const diffMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
    if (diffMs > 0) {
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }

  const zone = raw.zoneCode || raw.buildingName || raw.slotCode ? 
    [raw.zoneCode, raw.slotCode].filter(Boolean).join(' / ') : 
    (raw.buildingName || 'Smart City Plaza');

  const fee = raw.totalFee ?? raw.fee ?? 0;

  const rawStatus = (raw.sessionStatus || raw.status || '').toLowerCase();
  let status: 'completed' | 'cancelled' | 'active' = 'active';
  if (rawStatus === 'completed' || rawStatus === 'checkout' || rawStatus === 'done' || rawStatus === 'finished') status = 'completed';
  else if (rawStatus === 'cancelled' || rawStatus === 'canceled') status = 'cancelled';

  const formatDt = (dt: string) => {
    if (!dt) return '—';
    try { return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return dt; }
  };

  return {
    ...raw,
    plate,
    checkIn: formatDt(checkInTime),
    checkOut: formatDt(checkOutTime),
    duration,
    zone,
    fee: typeof fee === 'number' ? fee : parseFloat(fee) || 0,
    status
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function DriverParkingHistory() {
  const { user, showToast } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [sessions, setSessions] = useState<ReturnType<typeof normalizeSession>[]>([
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDurationHours, setTotalDurationHours] = useState(0);
  const [mostUsedZone, setMostUsedZone] = useState('—');

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Get user vehicles first
      let userPlates: string[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          userPlates = vehRes.data.map((v: any) => v.licensePlate);
        }
      } catch { /* ignore */ }

      // Try to get parking sessions by account
      let rawSessions: any[] = [];
      try {
        const res = await api.get<any>(`/parking-sessions/by-account/${user.id}`);
        if (res.success && Array.isArray(res.data)) {
          rawSessions = res.data;
        }
      } catch {
        // Try filtering all sessions by plate
        try {
          const res2 = await api.get<any>(`/parking-sessions?accountId=${user.id}`);
          if (res2.success && Array.isArray(res2.data)) {
            rawSessions = res2.data;
          }
        } catch {
          if (userPlates.length > 0) {
            try {
              const res3 = await api.get<any>(`/parking-sessions?licensePlate=${userPlates[0]}`);
              if (res3.success && Array.isArray(res3.data)) {
                rawSessions = res3.data;
              }
            } catch { /* no data available */ }
          }
        }
      }

      // Normalise and filter only completed/cancelled
      const normalized = rawSessions
        .map(normalizeSession)
        .filter(s => s.status === 'completed' || s.status === 'cancelled');

      // Sort newest first
      normalized.sort((a, b) => {
        const da = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const db = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return db - da;
      });

      setSessions(normalized);

      // Stats: total duration
      let totalHours = 0;
      const zoneCount: Record<string, number> = {};
      normalized.forEach(s => {
        if (s.duration && s.duration !== '—') {
          const parts = s.duration.match(/(\d+)h\s*(\d+)m/);
          if (parts) totalHours += parseInt(parts[1]) + parseInt(parts[2]) / 60;
          else {
            const mParts = s.duration.match(/(\d+)m/);
            if (mParts) totalHours += parseInt(mParts[1]) / 60;
          }
        }
        if (s.zone && s.zone !== '—') {
          zoneCount[s.zone] = (zoneCount[s.zone] || 0) + 1;
        }
      });
      setTotalDurationHours(totalHours);

      const topZone = Object.entries(zoneCount).sort((a, b) => b[1] - a[1])[0];
      setMostUsedZone(topZone ? topZone[0] : '—');
    } catch (err) {
      console.error('Error loading parking history:', err);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportPDF = () => {
    const safeFullName = escapeHtml(user?.fullName || 'Driver');

    // Build print-friendly content
    const printContent = `
      <html>
        <head>
          <title>Parking History - ${safeFullName}</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { color: #666; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f9f4; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            .badge-completed { color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 999px; font-size: 10px; }
            .badge-cancelled { color: #e11d48; background: #fff1f2; padding: 2px 8px; border-radius: 999px; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Parking History</h1>
          <p>Exported for: ${safeFullName} &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Plate</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Zone / Slot</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSessions.map(s => {
                const safeId = escapeHtml(String(s.id).slice(0, 8));
                const safePlate = escapeHtml(s.plate);
                const safeCheckIn = escapeHtml(s.checkIn);
                const safeCheckOut = escapeHtml(s.checkOut);
                const safeDuration = escapeHtml(s.duration);
                const safeZone = escapeHtml(s.zone);
                const safeStatus = s.status === 'completed' || s.status === 'cancelled' || s.status === 'active' ? s.status : 'cancelled';
                const safeStatusText = escapeHtml(safeStatus);
                return `
                <tr>
                  <td>#${safeId}</td>
                  <td>${safePlate}</td>
                  <td>${safeCheckIn}</td>
                  <td>${safeCheckOut}</td>
                  <td>${safeDuration}</td>
                  <td>${safeZone}</td>
                  <td>${Math.round(s.fee).toLocaleString('en-US')} VND</td>
                  <td><span class="badge-${safeStatus}">${safeStatusText}</span></td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 300);
    } else {
      showToast('Please allow popups to export PDF.', 'error');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch = String(s.id).includes(q) ||
                        s.plate.toLowerCase().includes(q) ||
                        s.zone.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const paginated = filteredSessions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parking History</h1>
          <p className="text-sm text-slate-400 mt-1">Review your complete parking session records.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchHistory()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={() => router.push('/dashboard/driver/booking')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sessions</p>
            <h3 className="text-2xl font-extrabold text-[#1B2A41] mt-1">
              {isLoading ? '—' : sessions.length}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Most Used Zone</p>
            <h3 className="text-lg font-extrabold text-[#1B2A41] mt-1 truncate">
              {isLoading ? '—' : mostUsedZone}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Duration</p>
            <h3 className="text-2xl font-extrabold text-[#1B2A41] mt-1">
              {isLoading ? '—' : `${Math.round(totalDurationHours)} hrs`}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {isLoading ? '—' : sessions.filter(s => s.status === 'completed').length}
            </h3>
          </div>
        </div>
      </section>

      {/* TABLE */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* FILTERS */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/30">
          <div className="flex flex-wrap gap-2 items-center flex-1 max-w-lg">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search session ID, plate, zone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium rounded-xl"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
          >
            Clear Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading parking history...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Session ID</th>
                  <th className="px-6 py-4">Plate</th>
                  <th className="px-6 py-4">Check-in / Check-out</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Zone / Slot</th>
                  <th className="px-6 py-4">Fee Paid</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">#{String(s.id).slice(0, 8)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{s.plate}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{s.checkIn}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Out: {s.checkOut}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{s.duration}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{s.zone}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {s.fee > 0 ? `${Math.round(s.fee).toLocaleString('en-US')} VND` : '0 VND'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        s.status === 'completed' 
                           ? 'bg-emerald-50 text-emerald-700' 
                          : s.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          s.status === 'completed' ? 'bg-emerald-600' : s.status === 'cancelled' ? 'bg-rose-600' : 'bg-amber-600'
                        }`}></span>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-slate-300" />
                        <p className="text-slate-400 text-xs font-medium">
                          {searchTerm || statusFilter !== 'all' ? 'No matching sessions.' : 'No parking history found.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredSessions.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredSessions.length)} of {filteredSessions.length}
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
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${currentPage === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
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
      </div>

    </div>
  );
}
