'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse, PagedResult } from '@/lib/types/building.types';

// ─── API Response Types ───────────────────────────────────────────────
interface BuildingItem {
  id: number;
  name: string;
  code: string;
  totalFloor: number;
}

interface FloorItem {
  id: number;
  buildingId: number;
  floorNumber: number;
  name?: string;
}

interface ZoneItem {
  id: number;
  floorId: number;
  name: string;
  vehicleTypeId: number;
  capacity?: number;
  accessType?: number;
}

interface SlotDto {
  id: number;
  zoneId: number;
  code: string;
  name?: string;
  status: number | string; // 0=AVAILABLE, 1=MAINTENANCE, 2=OCCUPIED, 3=BLOCKED or "Available", "Occupied", "Blocked", "Maintenance"
  occupiedLicensePlate?: string | null;
  subscription?: {
    subscriptionId: number;
    accountId: number;
    accountName: string;
    vehicleId: number;
    licensePlate: string;
    status: string;
    monthlyPrice: number;
    activatedAt?: string | null;
    expiredAt?: string | null;
  } | null;
}

interface SessionDto {
  id: number;
  slotId?: number;
  zoneId?: number;
  checkInTime: string;
  licensePlateIn: string;
  monthlySubscriptionId?: number;
}

// ─── Local Slot View Model ────────────────────────────────────────────
interface SlotView {
  id: number;
  code: string;
  zoneId: number;
  zoneName: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';
  licensePlate?: string;
  checkInTime?: string;
  subscriptionInfo?: SlotDto['subscription'];
}

function mapStatus(statusVal: number | string): SlotView['status'] {
  if (typeof statusVal === 'string') {
    switch (statusVal.toLowerCase()) {
      case 'available': return 'AVAILABLE';
      case 'occupied': return 'OCCUPIED';
      case 'blocked': return 'BLOCKED';
      case 'maintenance': return 'MAINTENANCE';
      default: return 'AVAILABLE';
    }
  }
  switch (statusVal) {
    case 0: return 'AVAILABLE';
    case 1: return 'MAINTENANCE';
    case 2: return 'OCCUPIED';
    case 3: return 'BLOCKED';
    default: return 'AVAILABLE';
  }
}

const POLL_MS = 10_000;

/**
 * SlotMonitoring – Giám sát real-time trạng thái ô đỗ theo Floor → Zone
 * Hiển thị biển số xe (LicensePlateIn) và giờ check-in cho slot đang có xe.
 */
export default function SlotMonitoring() {
  // ─── Infrastructure State ─────────────────────────────────────────
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [slots, setSlots] = useState<SlotView[]>([]);

  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch buildings + floors + zones once ────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [resBld, resFloors, resZones] = await Promise.all([
          api.get<BaseResponse<PagedResult<BuildingItem>>>('/Buildings/paged?pageIndex=1&pageSize=100'),
          api.get<BaseResponse<FloorItem[]>>('/Floors'),
          api.get<BaseResponse<ZoneItem[]>>('/Zones'),
        ]);

        const blds = resBld.success && resBld.data?.items ? resBld.data.items : [];
        const fls  = resFloors.success && resFloors.data ? resFloors.data : [];
        const zns  = resZones.success && resZones.data ? resZones.data : [];

        setBuildings(blds);
        setFloors(fls);
        setZones(zns);

        if (blds.length > 0) {
          const firstBld = blds[0];
          setSelectedBuildingId(firstBld.id);
          const bldFloors = fls.filter(f => f.buildingId === firstBld.id);
          if (bldFloors.length > 0) setSelectedFloorId(bldFloors[0].id);
        }
      } catch (e) {
        console.error('SlotMonitoring: failed to init infrastructure', e);
      }
    };
    init();
  }, []);

  // ─── Fetch slots + sessions for selected floor ────────────────────
  const refreshSlots = useCallback(async () => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const floorZones = zones.filter(z => z.floorId === selectedFloorId);
      if (floorZones.length === 0) { setSlots([]); return; }

      const sessionRes = await api.get<BaseResponse<SessionDto[]>>('/parking-sessions/active').catch(() => null);
      const sessions: SessionDto[] = sessionRes?.success && sessionRes.data ? sessionRes.data : [];

      const allSlotViews: SlotView[] = [];
      await Promise.all(
        floorZones.map(async (zone) => {
          try {
            const res = await api.get<BaseResponse<SlotDto[]>>(`/ParkingSlots/zone/${zone.id}`);
            if (res.success && res.data) {
              res.data.forEach(item => {
                const session = sessions.find(s => s.slotId === item.id);
                allSlotViews.push({
                  id: item.id,
                  code: item.code,
                  zoneId: zone.id,
                  zoneName: zone.name,
                  status: mapStatus(item.status),
                  licensePlate: session?.licensePlateIn || item.subscription?.licensePlate || item.occupiedLicensePlate || undefined,
                  checkInTime: session?.checkInTime || item.subscription?.activatedAt || undefined,
                  subscriptionInfo: item.subscription || undefined,
                });
              });
            }
          } catch { /* skip failed zone */ }
        })
      );

      setSlots(allSlotViews);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [selectedFloorId, zones]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  // ─── Polling ──────────────────────────────────────────────────────
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedFloorId) return;
    pollingRef.current = setInterval(refreshSlots, POLL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [refreshSlots, selectedFloorId]);

  // ─── Derived ──────────────────────────────────────────────────────
  const activeFloors = floors.filter(f => f.buildingId === selectedBuildingId);
  const activeZones  = zones.filter(z => z.floorId === selectedFloorId);

  const totalSlots     = slots.length;
  const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
  const occupiedSlots  = slots.filter(s => s.status === 'OCCUPIED').length;
  const blockedSlots     = slots.filter(s => s.status === 'BLOCKED').length;
  const maintenanceSlots = slots.filter(s => s.status === 'MAINTENANCE').length;
  const pct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // ─── Slot card colors ────────────────────────────────────────────
  const getSlotStyle = (status: SlotView['status']) => {
    switch (status) {
      case 'AVAILABLE':   return 'bg-[#006d43] border-[#006d43] text-white';
      case 'OCCUPIED':    return 'bg-[#263143] border-[#263143] text-white';
      case 'BLOCKED':     return 'bg-[#ba1a1a] border-[#ba1a1a] text-white';
      case 'MAINTENANCE': return 'bg-amber-500 border-amber-500 text-white';
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Real-time Slot Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live occupancy view per floor. Occupied slots show vehicle plate and check-in time.
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
              Syncing...
            </div>
          )}
          {lastUpdated && !loading && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006d43] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006d43]" />
              </span>
              LIVE · {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={refreshSlots}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#006d43] hover:bg-emerald-50 transition-colors"
            title="Refresh now"
          >
            <span className="material-symbols-outlined text-[18px] align-middle">refresh</span>
          </button>
        </div>
      </div>

      {/* ── Infrastructure Selectors ──────────────────────────── */}
      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col min-w-[150px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Building</span>
          <select
            value={selectedBuildingId || ''}
            onChange={e => {
              const bldId = parseInt(e.target.value);
              setSelectedBuildingId(bldId);
              const bldFloors = floors.filter(f => f.buildingId === bldId);
              setSelectedFloorId(bldFloors.length > 0 ? bldFloors[0].id : null);
            }}
            className="bg-transparent border-0 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none"
          >
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="h-auto w-px bg-slate-200" />
        <div className="flex flex-col min-w-[130px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Floor</span>
          <select
            value={selectedFloorId || ''}
            onChange={e => setSelectedFloorId(parseInt(e.target.value))}
            disabled={activeFloors.length === 0}
            className="bg-transparent border-0 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none disabled:opacity-50"
          >
            {activeFloors.map(f => (
              <option key={f.id} value={f.id}>{f.name || `Floor ${f.floorNumber}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Capacity Summary ──────────────────────────────────── */}
      {selectedFloorId && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Slots', value: totalSlots, color: 'text-slate-700' },
            { label: 'Available',   value: availableSlots, color: 'text-[#006d43]' },
            { label: 'Occupied',    value: occupiedSlots,  color: 'text-[#263143]' },
            { label: 'Blocked',     value: blockedSlots,   color: 'text-[#ba1a1a]' },
            { label: 'Maintenance', value: maintenanceSlots, color: 'text-amber-600' },
            { label: 'Utilization', value: `${pct}%`,      color: pct >= 90 ? 'text-red-650' : pct >= 75 ? 'text-amber-650' : 'text-[#006d43]' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Legend:</span>
        {[
          { color: 'bg-[#006d43]', label: 'Available' },
          { color: 'bg-[#263143]', label: 'Occupied' },
          { color: 'bg-[#ba1a1a]', label: 'Blocked' },
          { color: 'bg-amber-500', label: 'Maintenance' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Slot Grid by Zone ─────────────────────────────────── */}
      {activeZones.length === 0 && selectedFloorId ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">grid_view</span>
          <p className="text-sm font-bold text-slate-500">No zones configured on this floor.</p>
        </div>
      ) : (
        activeZones.map(zone => {
          const zoneSlots = slots.filter(s => s.zoneId === zone.id);
          const zoneAvail = zoneSlots.filter(s => s.status === 'AVAILABLE').length;
          return (
            <div key={zone.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              {/* Zone Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">{zone.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {zone.vehicleTypeId === 4 ? 'Motorbike Zone' : zone.vehicleTypeId === 3 ? 'EV Charging' : 'Car Zone'}
                    {zone.accessType === 1 ? ' · Monthly' : ' · General'}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  {zoneAvail} / {zoneSlots.length} Available
                </span>
              </div>

              {/* Slot Cards */}
              {zoneSlots.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No slots in this zone.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {zoneSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`rounded-xl border p-2.5 flex flex-col gap-1 text-center transition-all ${getSlotStyle(slot.status)}`}
                    >
                      {/* Slot Code */}
                      <span className="text-xs font-extrabold truncate">{slot.code}</span>

                      {/* Status Icon */}
                      <span className="material-symbols-outlined text-[16px] mx-auto opacity-80">
                        {slot.status === 'AVAILABLE'   ? 'check_circle' :
                         slot.status === 'OCCUPIED'    ? 'directions_car' :
                         slot.status === 'MAINTENANCE' ? 'construction' :
                                                         'block'}
                      </span>

                      {/* Occupied: show plate + check-in */}
                      {slot.status === 'OCCUPIED' && slot.licensePlate ? (
                        <>
                          <span className="text-[9px] font-black tracking-widest leading-tight truncate opacity-90 flex items-center justify-center gap-0.5">
                            {slot.subscriptionInfo && (
                              <span className="material-symbols-outlined text-[10px] text-emerald-450" title="Monthly Subscriber">card_membership</span>
                            )}
                            {slot.licensePlate}
                          </span>
                          {slot.checkInTime && (
                            <span className="text-[8px] opacity-70 font-bold">
                              {slot.subscriptionInfo ? 'SUB ' : 'IN '}{formatTime(slot.checkInTime)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] font-bold opacity-75 uppercase tracking-wide">
                          {slot.status === 'AVAILABLE' ? 'Free' : slot.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── No Floor Selected Placeholder ─────────────────────── */}
      {!selectedFloorId && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">layers</span>
          <p className="text-sm font-bold text-slate-500">Select a building and floor to view slot occupancy.</p>
        </div>
      )}
    </div>
  );
}
