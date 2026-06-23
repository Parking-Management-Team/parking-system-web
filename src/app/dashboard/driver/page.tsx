'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { 
  History, 
  TrendingUp, 
  CreditCard, 
  Car, 
  MapPin, 
  QrCode, 
  FileText, 
  Calendar, 
  Bell,
  Clock,
  Phone,
  Mail,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle as HelpIcon,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface SlotItem {
  id: number;
  code: string;
  name?: string;
  status: string | number;
  vehicleTypeId?: number;
}

interface BuildingItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  totalFloor: number;
}

interface SlotSummary {
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  total: number;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [mapSlots, setMapSlots] = useState<SlotItem[]>([]);
  const [building, setBuilding] = useState<BuildingItem | null>(null);
  const [slotSummary, setSlotSummary] = useState<SlotSummary>({ available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 });
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  // KPI states
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [activeVehiclePlate, setActiveVehiclePlate] = useState<string>('—');
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const getSlotStatus = (status: string | number): 'available' | 'occupied' | 'reserved' | 'maintenance' => {
    if (status === 0 || status === 'Available') return 'available';
    if (status === 1 || status === 'Occupied') return 'occupied';
    if (status === 2 || status === 'Blocked' || status === 'Reserved') return 'reserved';
    if (status === 3 || status === 'Maintenance') return 'maintenance';
    return 'available';
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoadingMap(true);
    try {
      // 1. Load buildings
      const buildRes = await api.get<any>('/Buildings');
      let targetBuilding: BuildingItem | null = null;
      if (buildRes.success && buildRes.data && buildRes.data.length > 0) {
        targetBuilding = buildRes.data[0];
        setBuilding(targetBuilding);
      }

      if (!targetBuilding) {
        setIsLoadingMap(false);
        return;
      }

      // 2. Load floors of building
      const floorRes = await api.get<any>(`/Floors/building/${targetBuilding.id}`);
      if (!floorRes.success || !floorRes.data || floorRes.data.length === 0) {
        setIsLoadingMap(false);
        return;
      }

      const firstFloor = floorRes.data[0];

      // 3. Load zones of floor
      const zoneRes = await api.get<any>(`/Zones/floor/${firstFloor.id}`);
      if (!zoneRes.success || !zoneRes.data || zoneRes.data.length === 0) {
        setIsLoadingMap(false);
        return;
      }

      // 4. Load slots from all zones
      const allSlotsPromises = zoneRes.data.map((zone: any) =>
        api.get<any>(`/ParkingSlots/zone/${zone.id}`)
          .then(r => r.success ? (r.data || []) : [])
          .catch(() => [])
      );
      const results = await Promise.all(allSlotsPromises);
      const mergedSlots: SlotItem[] = results.flat();

      setMapSlots(mergedSlots);

      // Compute summary
      const summary: SlotSummary = { available: 0, occupied: 0, reserved: 0, maintenance: 0, total: mergedSlots.length };
      mergedSlots.forEach(slot => {
        const s = getSlotStatus(slot.status);
        summary[s]++;
      });
      setSlotSummary(summary);
    } catch (err) {
      console.error('Error loading dashboard map data:', err);
    } finally {
      setIsLoadingMap(false);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Load vehicles
      const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
      if (vehRes.success && vehRes.data && vehRes.data.length > 0) {
        setActiveVehiclePlate(vehRes.data[0].licensePlate);

        // Check active session
        const userPlates = vehRes.data.map((v: any) => v.licensePlate);
        try {
          const sessRes = await api.get<any>('/parking-sessions/active');
          if (sessRes.success && sessRes.data) {
            const matched = sessRes.data.find((s: any) => userPlates.includes(s.licensePlateIn));
            setHasActiveSession(!!matched);
          }
        } catch { /* no active session */ }
      }

      // Load parking history count
      try {
        const histRes = await api.get<any>(`/parking-sessions?accountId=${user.id}`);
        if (histRes.success && Array.isArray(histRes.data)) {
          setTotalSessions(histRes.data.length);
        }
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* WELCOME BANNER */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#00a86b 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px'
        }}></div>
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.fullName || 'Driver'}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Session Mode: {hasActiveSession ? 'Active' : 'Normal'}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-semibold ${hasActiveSession ? 'text-emerald-600' : 'text-rose-500'}`}>
              <Info className="w-4 h-4" />
              <span>{hasActiveSession ? 'You have an active parking session.' : 'You have no active parking session.'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => router.push('/dashboard/driver/booking')}
          className="relative z-10 px-6 py-3 rounded-xl bg-[#00a86b] text-white font-semibold text-sm hover:bg-[#00905b] active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10"
        >
          Book Parking Space
        </button>
      </section>

      {/* KPI SUMMARY */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sessions</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {totalSessions !== null ? totalSessions : '—'}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold mt-1">
              <span>All time parking sessions</span>
            </div>
          </div>
        </div>

        {/* KPI 2 — Slot Summary */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Slots</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {isLoadingMap ? '—' : `${slotSummary.available}/${slotSummary.total}`}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
              <span>{building?.name || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parking Rate</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">$3.00<span className="text-sm font-medium text-slate-400">/hr</span></h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold mt-1">
              <span>Daily cap: $20.00</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Vehicle</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">{activeVehiclePlate}</h3>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Registered Plate</span>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PARKING MAP OVERVIEW */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-0.5">
                <h4 className="text-lg font-bold text-[#1B2A41]">
                  {building ? `${building.name} — Map Overview` : 'Parking Map Overview'}
                </h4>
                <p className="text-xs text-slate-400">
                  {building ? `${building.address || 'Smart City Zone'} · Floor 1 live slot status` : 'Loading building data...'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> AVAILABLE ({slotSummary.available})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> OCCUPIED ({slotSummary.occupied})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> RESERVED ({slotSummary.reserved})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-slate-300"></span> MAINT. ({slotSummary.maintenance})
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9ff] border border-[#e2e8f0] rounded-2xl p-6">
              {isLoadingMap ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading real-time slot data...</p>
                </div>
              ) : mapSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <p className="text-xs text-slate-400">No slot data available. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {mapSlots.map((slot) => {
                    const statusKey = getSlotStatus(slot.status);
                    let statusBg = 'bg-emerald-500 border-emerald-600/10';
                    if (statusKey === 'occupied') statusBg = 'bg-rose-500 border-rose-600/10';
                    else if (statusKey === 'reserved') statusBg = 'bg-amber-500 border-amber-600/10';
                    else if (statusKey === 'maintenance') statusBg = 'bg-slate-300 border-slate-400/10';

                    const isClickable = statusKey === 'available';

                    return (
                      <div
                        key={slot.id}
                        className={`aspect-square ${statusBg} rounded-xl shadow-sm transition-all border font-bold flex flex-col items-center justify-center text-white ${isClickable ? 'hover:scale-[1.05] cursor-pointer' : 'cursor-not-allowed opacity-90'}`}
                        onClick={() => isClickable && router.push(`/dashboard/driver/booking?slot=${slot.code}`)}
                        title={`${slot.code} — ${statusKey}`}
                      >
                        <span className="text-[10px] font-bold leading-tight">{slot.code}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-800">
              <Info className="w-5 h-5 shrink-0 text-emerald-600" />
              <p className="text-xs font-semibold">Tip: Click on an available (green) slot to start booking immediately.</p>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ACTIVE STATUS CARD */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${hasActiveSession ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-[#e2e8f0]'}`}>
              {hasActiveSession
                ? <CheckCircle className="w-8 h-8 text-emerald-500" />
                : <XCircle className="w-8 h-8 text-slate-300" />
              }
            </div>
            <h4 className="font-bold text-[#1B2A41] text-lg">
              {hasActiveSession ? 'Session Active' : 'No Active Session'}
            </h4>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              {hasActiveSession
                ? 'Your vehicle is currently being tracked. View session details below.'
                : 'Your vehicle is currently not tracked in any parking facility.'
              }
            </p>
            {hasActiveSession ? (
              <button 
                onClick={() => router.push('/dashboard/driver/sessions')}
                className="w-full py-3.5 rounded-xl bg-[#00a86b] text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:bg-[#00905b] active:scale-[0.98] transition-all"
              >
                View Active Session
              </button>
            ) : (
              <button 
                onClick={() => router.push('/dashboard/driver/booking')}
                className="w-full py-3.5 rounded-xl bg-[#00a86b] text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:bg-[#00905b] active:scale-[0.98] transition-all mb-4"
              >
                Book a Slot
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/driver/sessions')}
              className="text-[#00a86b] text-sm font-bold hover:underline mt-2"
            >
              Scan QR code to check-out
            </button>
          </section>

          {/* SLOT STATS */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-[#1B2A41]">Slot Status Summary</h4>
            </div>
            {isLoadingMap ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Available', count: slotSummary.available, color: 'bg-emerald-500' },
                  { label: 'Occupied', count: slotSummary.occupied, color: 'bg-rose-500' },
                  { label: 'Reserved', count: slotSummary.reserved, color: 'bg-amber-500' },
                  { label: 'Maintenance', count: slotSummary.maintenance, color: 'bg-slate-300' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded ${color}`}></span>
                      <span className="text-slate-500 font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-slate-700">{count} slots</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="font-black text-slate-800">{slotSummary.total} slots</span>
                </div>
              </div>
            )}
          </section>

          {/* QUICK ACTIONS */}
          <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-[#1B2A41] mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/dashboard/driver/sessions')}
                className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl flex flex-col items-center gap-2 hover:border-[#00a86b]/40 hover:bg-emerald-50/10 transition-all group"
              >
                <QrCode className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Scan QR</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/driver/payment-history')}
                className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl flex flex-col items-center gap-2 hover:border-[#00a86b]/40 hover:bg-emerald-50/10 transition-all group"
              >
                <FileText className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Invoice</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/driver/booking')}
                className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl flex flex-col items-center gap-2 hover:border-[#00a86b]/40 hover:bg-emerald-50/10 transition-all group"
              >
                <Calendar className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Book</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard/driver/parking-history')}
                className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl flex flex-col items-center gap-2 hover:border-[#00a86b]/40 hover:bg-emerald-50/10 transition-all group"
              >
                <History className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">History</span>
              </button>
            </div>
          </section>

          {/* SUPPORT */}
          <section className="bg-[#1B2A41] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(#00a86b 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px'
            }}></div>
            <div className="relative z-10 space-y-4">
              <h4 className="font-bold text-white text-lg">Need Help?</h4>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-200">+84 (028) 3838 3838</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-200">support@pbms.smartcity.vn</span>
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/driver/help')}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <HelpIcon className="w-4 h-4" />
                <span>Access FAQ Portal</span>
              </button>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
