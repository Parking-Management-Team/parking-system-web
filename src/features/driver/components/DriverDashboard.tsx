'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import {
  History,
  CreditCard,
  Car,
  Bike,
  MapPin,
  QrCode,
  FileText,
  Calendar,
  Clock,
  Phone,
  Mail,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle as HelpIcon,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';

interface SlotItem {
  id: number;
  code: string;
  name?: string;
  status: string | number;
  vehicleTypeId?: number;
  isReserved?: boolean;
}

interface BuildingItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  totalFloor: number;
}

interface FloorItem {
  id: number;
  buildingId: number;
  floorNumber: number;
  name: string;
  status: number | string;
  vehicleTypeIds?: number[];
}

interface SlotSummary {
  available: number;
  occupied: number;
  reserved: number;
  blocked: number;
  maintenance: number;
  total: number;
}

interface PricingWindow {
  id: number;
  windowName: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  baseDurationMinutes: number;
  incrementBlockMinutes?: number;
  incrementPrice?: number;
}

export default function DriverDashboard() {
  const { user, showToast } = useAuth();
  const router = useRouter();

  const [mapSlots, setMapSlots] = useState<SlotItem[]>([]);
  const [buildingsList, setBuildingsList] = useState<BuildingItem[]>([]);
  const [building, setBuilding] = useState<BuildingItem | null>(null);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [floorZones, setFloorZones] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<number>(2); // Default to Car (2)
  const [slotSummary, setSlotSummary] = useState<SlotSummary>({ available: 0, occupied: 0, reserved: 0, blocked: 0, maintenance: 0, total: 0 });
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  // KPI states
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [activeVehiclePlate, setActiveVehiclePlate] = useState<string>('—');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeBookingDetails, setActiveBookingDetails] = useState<any>(null);

  // Custom client-side temporary state variables
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [allActivePolicies, setAllActivePolicies] = useState<any[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Determine if a pricing window is currently active (Vietnam GMT+7)
  const isWindowActive = (startTime: string, endTime: string): boolean => {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const cur = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    return s <= e ? (cur >= s && cur < e) : (cur >= s || cur < e);
  };

  const fmtTime = (t: string) => t.substring(0, 5);

  const getSlotStatus = (status: string | number): 'available' | 'occupied' | 'blocked' | 'reserved' | 'maintenance' => {
    if (status === 0 || status === 'Available') return 'available';
    if (status === 1 || status === 'Occupied') return 'occupied';
    if (status === 2 || status === 'Blocked') return 'blocked';
    if (status === 4 || status === 'Reserved') return 'reserved';
    if (status === 3 || status === 'Maintenance') return 'maintenance';
    return 'available';
  };

  // Fetch ALL active pricing policies + vehicle types once on mount
  useEffect(() => {
    const fetchAllPricing = async () => {
      setPricingLoading(true);
      try {
        const [vtRes, pRes] = await Promise.all([
          api.get<any>('/vehicle-types'),
          api.get<any>('/pricing-policies?status=Active'),
        ]);
        if (vtRes.success && Array.isArray(vtRes.data)) setVehicleTypes(vtRes.data);
        if (pRes.success && Array.isArray(pRes.data)) setAllActivePolicies(pRes.data);
      } catch {
        // silent
      } finally {
        setPricingLoading(false);
      }
    };
    fetchAllPricing();
  }, []);

  // Load building list once on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const buildRes = await api.get<any>('/Buildings');
        if (buildRes.success && buildRes.data && buildRes.data.length > 0) {
          setBuildingsList(buildRes.data);
          setBuilding(buildRes.data[0]);
        }
      } catch (err) {
        console.error('Error initializing buildings:', err);
      }
    };
    initData();
  }, []);

  // Load floors whenever selected building changes
  useEffect(() => {
    if (!building?.id) {
      setFloors([]);
      setSelectedFloorId(null);
      return;
    }

    const fetchFloors = async () => {
      setIsLoadingMap(true);
      try {
        const floorRes = await api.get<any>(`/Floors/building/${building.id}`);
        if (floorRes.success && floorRes.data && floorRes.data.length > 0) {
          const fetchedFloors = floorRes.data;
          
          // Fetch zones and slots for each floor to identify supported vehicleTypeIds
          const floorsWithTypes = await Promise.all(
            fetchedFloors.map(async (floor: any) => {
              try {
                const zoneRes = await api.get<any>(`/Zones/floor/${floor.id}`);
                if (zoneRes.success && zoneRes.data) {
                  // Only count floors containing General zones for driver bookings
                  const generalZones = zoneRes.data.filter((z: any) =>
                    z.accessType === 'General' || z.accessType === 0 || z.accessType === '0'
                  );
                  
                  if (generalZones.length > 0) {
                    const allSlotsPromises = generalZones.map((zone: any) =>
                      api.get<any>(`/ParkingSlots/zone/${zone.id}`)
                        .then(r => r.success ? (r.data || []) : [])
                        .catch(() => [])
                    );
                    const results = await Promise.all(allSlotsPromises);
                    const mergedSlots = results.flat();
                    const typeIds = mergedSlots.map((s: any) => s.vehicleTypeId);
                    return { ...floor, vehicleTypeIds: Array.from(new Set(typeIds)) as number[] };
                  } else {
                    return { ...floor, vehicleTypeIds: [] };
                  }
                }
              } catch (err) {
                console.error(`Error loading zones/slots for floor ${floor.id}`, err);
              }
              // Fallback based on floor number
              return { ...floor, vehicleTypeIds: floor.floorNumber === 1 ? [1] : [2] };
            })
          );
          setFloors(floorsWithTypes);
        } else {
          setFloors([]);
          setSelectedFloorId(null);
        }
      } catch (err) {
        console.error('Error loading floors:', err);
      } finally {
        setIsLoadingMap(false);
      }
    };
    fetchFloors();
  }, [building?.id]);

  // Filter visible floors based on selected vehicle type and active status
  const visibleFloors = floors.filter(floor =>
    (floor.status === 1 || floor.status === 'Active') &&
    (!floor.vehicleTypeIds || floor.vehicleTypeIds.includes(selectedVehicleTypeId))
  );

  // Sync selectedFloorId when selectedVehicleTypeId or visibleFloors changes
  useEffect(() => {
    if (visibleFloors.length > 0) {
      const isCurrentValid = visibleFloors.some(f => f.id === selectedFloorId);
      if (!isCurrentValid) {
        setSelectedFloorId(visibleFloors[0].id);
      }
    } else {
      setSelectedFloorId(null);
    }
  }, [selectedVehicleTypeId, visibleFloors, selectedFloorId]);

  // Fetch slots whenever selected floor changes
  useEffect(() => {
    if (!selectedFloorId) {
      setMapSlots([]);
      setSlotSummary({ available: 0, occupied: 0, reserved: 0, blocked: 0, maintenance: 0, total: 0 });
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingMap(true);
      try {
        // Load zones of floor
        const zoneRes = await api.get<any>(`/Zones/floor/${selectedFloorId}`);
        if (!zoneRes.success || !zoneRes.data || zoneRes.data.length === 0) {
          setFloorZones([]);
          setMapSlots([]);
          setSlotSummary({ available: 0, occupied: 0, reserved: 0, blocked: 0, maintenance: 0, total: 0 });
          setIsLoadingMap(false);
          return;
        }

        setFloorZones(zoneRes.data || []);

        // Load slots from all zones
        const allSlotsPromises = zoneRes.data.map((zone: any) =>
          api.get<any>(`/ParkingSlots/zone/${zone.id}`)
            .then(r => r.success ? (r.data || []) : [])
            .catch(() => [])
        );
        const results = await Promise.all(allSlotsPromises);
        let mergedSlots: SlotItem[] = results.flat();

        // Apply vehicle type filtering
        mergedSlots = mergedSlots.filter(s => s.vehicleTypeId === selectedVehicleTypeId);

        setMapSlots(mergedSlots);

        // Compute summary
        const summary: SlotSummary = { available: 0, occupied: 0, reserved: 0, blocked: 0, maintenance: 0, total: mergedSlots.length };
        mergedSlots.forEach(slot => {
          const s = slot.isReserved ? 'reserved' : getSlotStatus(slot.status);
          if (s === 'available') summary.available++;
          else if (s === 'occupied') summary.occupied++;
          else if (s === 'reserved') summary.reserved++;
          else if (s === 'blocked') summary.blocked++;
          else if (s === 'maintenance') summary.maintenance++;
        });
        setSlotSummary(summary);
      } catch (err) {
        console.error('Error fetching slots for selected floor:', err);
      } finally {
        setIsLoadingMap(false);
      }
    };

    fetchSlots();
  }, [selectedFloorId, selectedVehicleTypeId]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Load vehicles
      const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
      if (vehRes.success && vehRes.data && vehRes.data.length > 0) {
        const allVehicles: any[] = vehRes.data;
        setVehicles(allVehicles);

        // Check localStorage for a default vehicle preference
        const storedDefaultId = localStorage.getItem(`default_vehicle_${user.id}`);
        const defaultVehicle = storedDefaultId
          ? allVehicles.find((v: any) => v.id === Number(storedDefaultId))
          : null;

        // Use default vehicle's license plate if set, otherwise fall back to first vehicle
        const targetPlate = defaultVehicle?.licensePlate ?? allVehicles[0].licensePlate;
        setActiveVehiclePlate(targetPlate);

        // Use default vehicle's type if set, otherwise fall back to first vehicle's type
        const targetTypeId = defaultVehicle?.vehicleTypeId ?? allVehicles[0].vehicleTypeId;
        if (targetTypeId) {
          setSelectedVehicleTypeId(targetTypeId);
        }

        // Check active session
        const userPlates = allVehicles.map((v: any) => v.licensePlate);
        try {
          const sessRes = await api.get<any>('/parking-sessions/active');
          if (sessRes.success && sessRes.data) {
            const matched = sessRes.data.find((s: any) => userPlates.includes(s.licensePlateIn));
            setHasActiveSession(!!matched);
            setActiveSession(matched || null);
            if (matched && matched.bookingId) {
              try {
                const bookRes = await api.get<any>(`/bookings/${matched.bookingId}`);
                if (bookRes.success && bookRes.data) {
                  setActiveBookingDetails(bookRes.data);
                } else {
                  setActiveBookingDetails(null);
                }
              } catch {
                setActiveBookingDetails(null);
              }
            } else {
              setActiveBookingDetails(null);
            }
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
    loadUserData();
  }, [loadUserData]);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const selectedFloorName = selectedFloor ? selectedFloor.name : '';
  const isInteractiveMap = building?.name === 'Building A' && selectedVehicleTypeId !== 1;

  const motorbikeZoneData = useMemo(() => {
    if (!floorZones || floorZones.length === 0) return null;
    return floorZones.find((z: any) =>
      z.vehicleTypeId === 1 ||
      z.vehicleTypeName?.toLowerCase().includes('motor') ||
      z.name?.toLowerCase().includes('motor') ||
      z.name?.toLowerCase().includes('xe máy') ||
      z.code?.toUpperCase().startsWith('ZM')
    );
  }, [floorZones]);

  const hasMotorbikeZone = Boolean(motorbikeZoneData || selectedFloor?.vehicleTypeIds?.includes(1));
  const isLargeMap = mapSlots.length > 30;

  const halfLength = Math.ceil(mapSlots.length / 2);
  const topRowSlots = mapSlots.slice(0, halfLength);
  const bottomRowSlots = mapSlots.slice(halfLength);

  const renderMapSlot = (slot: SlotItem) => {
    const statusKey = slot.isReserved ? 'reserved' : getSlotStatus(slot.status);
    const isClickable = statusKey === 'available';

    // Split the slot code into two parts: Zone and Slot Number
    const parts = slot.code.split('-');
    const zonePart = parts[0] || slot.code;
    const numberPart = parts[1] || '';

    const isLargeMap = mapSlots.length > 30;
    const slotSizeClass = isLargeMap ? 'w-[36px] h-[88px] p-1 text-[9px]' : 'w-[56px] h-[112px] p-1.5';
    const codeTextClass = isLargeMap ? 'text-[8px]' : 'text-[10px]';
    const bottomTextClass = isLargeMap ? 'text-[6px]' : 'text-[8px]';
    const carIconClass = isLargeMap ? 'w-4 h-4' : 'w-5 h-5';

    const isSelected = selectedSlotCode === slot.code;

    // ── Colour palette identical to manager/admin SlotManagementDashboard ──
    let bgClass = '';
    let borderClass = '';
    let textClass = 'text-white';

    if (isSelected) {
      bgClass = 'bg-[#00a86b] cursor-pointer shadow-md shadow-emerald-500/20';
      borderClass = 'border-[#00a86b]';
    } else if (statusKey === 'available') {
      bgClass = 'bg-[#006d43] hover:brightness-110 cursor-pointer';
      borderClass = 'border-[#006d43]';
    } else if (statusKey === 'occupied') {
      bgClass = 'bg-[#263143] cursor-not-allowed';
      borderClass = 'border-[#263143]';
    } else if (statusKey === 'reserved') {
      bgClass = 'bg-amber-400 cursor-not-allowed';
      borderClass = 'border-amber-400';
    } else if (statusKey === 'maintenance') {
      bgClass = 'bg-[#d97706] cursor-not-allowed';
      borderClass = 'border-[#d97706]';
    } else {
      // blocked
      bgClass = 'bg-[#ba1a1a] cursor-not-allowed';
      borderClass = 'border-[#ba1a1a]';
    }

    // Bottom label — matches manager labels
    const bottomLabel = isSelected
      ? 'Confirm'
      : statusKey === 'available'
        ? 'Park'
        : statusKey === 'occupied'
          ? 'Occupied'
          : statusKey === 'reserved'
            ? 'Booked'
            : statusKey === 'maintenance'
              ? 'Maint.'
              : 'Blocked';

    return (
      <div
        key={slot.id}
        onClick={() => {
          if (!isClickable) return;
          if (selectedSlotCode === slot.code) {
            router.push(`/dashboard/driver/parking-utils?slot=${slot.code}&vehicleTypeId=${selectedVehicleTypeId}`);
          } else {
            setSelectedSlotCode(slot.code);
          }
        }}
        className={`border-2 border-t-0 flex flex-col justify-between text-center relative select-none rounded-none shrink-0 ${slotSizeClass} ${bgClass} ${borderClass} ${textClass} transition-all duration-200`}
        title={`${slot.code} — ${statusKey}`}
      >
        {/* Top: Zone Code Prefix */}
        <div className="text-[8px] opacity-70 font-bold uppercase tracking-wider select-none pt-1">
          {zonePart}
        </div>

        {/* Middle: Prominent Slot Number */}
        <div className="flex-1 flex items-center justify-center">
          {numberPart && (
            <span className={isLargeMap ? 'text-lg font-black' : 'text-3xl font-black'}>
              {numberPart}
            </span>
          )}
        </div>

        {/* Bottom: show Confirm only when selected */}
        {isSelected && (
          <div className={`font-bold uppercase tracking-widest opacity-90 ${bottomTextClass} pb-1`}>
            Confirm
          </div>
        )}
      </div>
    );
  };

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
          onClick={() => router.push('/dashboard/driver/parking-utils')}
          className="relative z-10 px-6 py-3 rounded-xl bg-[#00a86b] text-white font-semibold text-sm hover:bg-[#00905b] active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10"
        >
          Book Parking Space
        </button>
      </section>

      {/* TOP ROW: MY VEHICLE & RATES + ACTIVE SESSION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: MY VEHICLE & PARKING RATES — Compact (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
          {/* My Vehicle Picker */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/30 sm:bg-transparent">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              {selectedVehicleTypeId === 1 ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">My Vehicle</span>
              {vehicles.length > 0 ? (
                <select
                  value={vehicles.find(v => v.licensePlate === activeVehiclePlate)?.id ?? ''}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const selectedVeh = vehicles.find(v => v.id === selectedId);
                    if (selectedVeh) {
                      const prevType = selectedVehicleTypeId;
                      setActiveVehiclePlate(selectedVeh.licensePlate);
                      setSelectedVehicleTypeId(selectedVeh.vehicleTypeId);
                      if (selectedVeh.vehicleTypeId !== prevType && selectedSlotCode) {
                        setSelectedSlotCode(null);
                        if (showToast) showToast('Vehicle type changed. Temporary slot selection has been reset.', 'info');
                      }
                    }
                  }}
                  className="text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none cursor-pointer appearance-none pr-4 max-w-[170px] truncate"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%234a5568' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.1rem center',
                    backgroundSize: '1em 1em',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate} ({v.vehicleType?.name || 'Vehicle'})</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-slate-800">{activeVehiclePlate}</span>
              )}
            </div>
          </div>

          {/* Right: Parking Rates — Active Policies */}
          <div className="flex-1 min-w-0 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parking Rates — Active Policies</span>
              {pricingLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>

            {pricingLoading ? (
              <div className="text-[11px] text-slate-400">Loading rates...</div>
            ) : allActivePolicies.filter(p => p.vehicleTypeId === selectedVehicleTypeId).length === 0 ? (
              <div className="text-[11px] text-slate-400 italic">No active pricing policy for this vehicle type.</div>
            ) : (
              /* Scrollable horizontal container */
              <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-2.5 min-w-max">
                  {(() => {
                    const vtInfo = vehicleTypes.find(vt => vt.id === selectedVehicleTypeId);
                    const vtName = vtInfo?.name || vtInfo?.typeName || `Type ${selectedVehicleTypeId}`;
                    const isMotorbike = vtName.toLowerCase().includes('motor') || vtName.toLowerCase().includes('bike');

                    const filtered = allActivePolicies
                      .filter(p => p.vehicleTypeId === selectedVehicleTypeId)
                      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

                    return filtered.map(policy => (
                      <div
                        key={policy.id}
                        className="flex-shrink-0 rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 py-2 min-w-[200px] max-w-[260px]"
                      >
                        {/* Policy header */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {isMotorbike
                              ? <Bike className="w-3.5 h-3.5 text-violet-500" />
                              : <Car className="w-3.5 h-3.5 text-blue-500" />}
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">
                              {vtName}
                            </span>
                          </div>
                          {policy.priority > 0 && (
                            <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full leading-none">P{policy.priority}</span>
                          )}
                        </div>

                        {/* Policy name */}
                        <div className="text-[10px] text-slate-400 font-medium mb-1.5 truncate" title={policy.policyName}>
                          {policy.policyName}
                        </div>

                        {/* Pricing windows */}
                        <div className="flex flex-col gap-1">
                          {(policy.pricingWindows || []).map((w: any) => {
                            const active = isWindowActive(w.startTime, w.endTime);
                            const isNight = w.windowName.toLowerCase().includes('đêm') || w.windowName.toLowerCase().includes('night');
                            return (
                              <div
                                key={w.id}
                                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-[10px] ${
                                  active
                                    ? isNight
                                      ? 'bg-slate-800 text-white ring-1 ring-slate-600'
                                      : 'bg-[#006d43] text-white ring-1 ring-emerald-600/40'
                                    : isNight
                                      ? 'bg-slate-100 text-slate-500'
                                      : 'bg-white border border-slate-200 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {active && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
                                  )}
                                  <span className="font-bold truncate">{w.windowName}</span>
                                  <span className="opacity-60 shrink-0">{fmtTime(w.startTime)}–{fmtTime(w.endTime)}</span>
                                </div>
                                <span className="font-extrabold shrink-0 whitespace-nowrap">
                                  {w.basePrice.toLocaleString('vi-VN')}đ<span className="font-normal opacity-70">/{w.baseDurationMinutes}ph</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Effective date */}
                        {policy.effectiveStart && (
                          <div className="text-[9px] text-slate-400 mt-1.5 truncate">
                            From {new Date(policy.effectiveStart).toLocaleDateString('vi-VN')}
                            {policy.effectiveEnd ? ` → ${new Date(policy.effectiveEnd).toLocaleDateString('vi-VN')}` : ' (ongoing)'}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ACTIVE SESSION CARD — Top Right (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${hasActiveSession ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="text-xs font-bold text-[#1B2A41] uppercase tracking-wider">
                {hasActiveSession ? 'Active Parking Session' : 'No Active Session'}
              </span>
            </div>
            {hasActiveSession ? (
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">TRACKING</span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 uppercase">NORMAL MODE</span>
            )}
          </div>

          {hasActiveSession && activeSession ? (() => {
            const isOverdue = activeBookingDetails && new Date(activeBookingDetails.plannedCheckoutTime) < new Date();
            return (
              <div className="space-y-2">
                {isOverdue && (
                  <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
                    <span className="text-amber-600">⚠️</span>
                    <span className="font-bold">Overstay Alert:</span> Exceeded planned checkout time!
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 bg-[#f8f9ff] border border-slate-100 rounded-xl p-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-tight">Plate</span>
                    <span className="font-extrabold text-slate-800">{activeSession.licensePlateIn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-tight">Zone / Slot</span>
                    <span className="font-extrabold text-slate-800">{activeSession.slotCode ? `${activeSession.zoneCode || 'Zone'} - ${activeSession.slotCode}` : (activeSession.zoneCode || '—')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-tight">Check-in</span>
                    <span className="font-bold text-slate-700">{new Date(activeSession.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-tight">Duration</span>
                    <span className={`font-extrabold ${isOverdue ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {(() => {
                        const diffMs = Date.now() - new Date(activeSession.checkInTime).getTime();
                        const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        return `${hours}h ${mins}m`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => router.push('/dashboard/driver/parking-utils')}
                    className="flex-1 py-2 rounded-xl bg-[#00a86b] text-white font-bold text-xs shadow-sm hover:bg-[#00905b] active:scale-[0.98] transition-all text-center"
                  >
                    View Session Details
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/driver/parking-utils')}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                  >
                    QR Check-out
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-400">
                Your vehicle is currently not tracked in any parking facility.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/dashboard/driver/parking-utils')}
                  className="flex-1 py-2 rounded-xl bg-[#00a86b] text-white font-bold text-xs shadow-sm hover:bg-[#00905b] active:scale-[0.98] transition-all text-center"
                >
                  Book a Slot Now
                </button>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* PARKING MAP OVERVIEW */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-0.5">
            <h4 className="text-lg font-bold text-[#1B2A41]">
              {building ? `${building.name} — Map Overview` : 'Parking Map Overview'}
            </h4>
            <p className="text-xs text-slate-400">
              {building ? `${building.address || 'Smart City Zone'} · ${selectedFloorName || 'Loading Floor...'} live slot status` : 'Loading building data...'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-[#006d43]"></span> AVAILABLE ({slotSummary.available})
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> RESERVED ({slotSummary.reserved})
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-[#263143]"></span> OCCUPIED ({slotSummary.occupied})
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-[#d97706]"></span> MAINTENANCE ({slotSummary.maintenance})
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-[#ba1a1a]"></span> BLOCKED ({slotSummary.blocked})
            </div>
          </div>
        </div>

        {/* SELECTORS FOR FLOOR AND VEHICLE TYPE */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Building Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Building:</span>
              <select
                value={building?.id ?? ''}
                onChange={(e) => {
                  const b = buildingsList.find(x => x.id === Number(e.target.value));
                  if (b) {
                    setBuilding(b);
                    if (selectedSlotCode) {
                      setSelectedSlotCode(null);
                      if (showToast) {
                        showToast('Building changed. Temporary slot selection has been reset.', 'info');
                      }
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 hover:border-slate-300 transition-all cursor-pointer font-sans"
              >
                {buildingsList.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Floor Selector */}
            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Floor:</span>
              <div className="flex flex-wrap gap-1.5">
                {visibleFloors.map((fl) => (
                  <button
                    key={fl.id}
                    onClick={() => setSelectedFloorId(fl.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      selectedFloorId === fl.id
                        ? 'bg-[#00a86b] border-[#00a86b] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {fl.name}
                  </button>
                ))}
                {visibleFloors.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No floors available</span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Type:</span>
            <div className="flex gap-1.5">
              {[
                { label: 'CAR', value: 2 },
                { label: 'MOTORBIKE', value: 1 }
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    const prevType = selectedVehicleTypeId;
                    setSelectedVehicleTypeId(t.value);
                    if (t.value !== prevType && selectedSlotCode) {
                      setSelectedSlotCode(null);
                      if (showToast) {
                        showToast('Vehicle type changed. Temporary slot selection has been reset.', 'info');
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedVehicleTypeId === t.value
                      ? 'bg-[#1B2A41] border-[#1B2A41] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#f8f9ff] border border-[#e2e8f0] rounded-2xl p-6">
          {selectedVehicleTypeId === 1 ? (
            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Hourly Motorbike Parking Registration</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Motorcycles are parked in the general Motorbike Zone on Floor 1. The system does not require selecting a specific parking slot. You only need to choose your planned parking duration in the Reservation Summary section.
              </p>
            </div>
          ) : isLoadingMap ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-[#006d43] animate-spin" />
              <p className="text-xs text-slate-400">Loading real-time slot data...</p>
            </div>
          ) : mapSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-xs text-slate-400">No slot data available. Please check back later.</p>
            </div>
          ) : (
            /* Interactive Floor Plan Map for all Buildings */
            <div className="w-full overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="py-8 min-w-[900px]">
                <div className="w-full max-w-[1250px] mx-auto space-y-2">
                {/* Cams Top */}
                <div className="flex justify-around px-20">
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span>Cam1</span>
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span>Cam2</span>
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span>Cam3</span>
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                  </div>
                </div>

                {/* Floor Plan Border */}
                <div className="border-4 border-slate-400 rounded-none bg-white flex p-4 shadow-sm min-h-[350px]">
                  {/* Left Mechanical / Restroom Area */}
                  <div className="w-36 flex flex-col justify-between text-slate-500 font-bold text-[10px] select-none py-2 gap-4">
                    <div className="h-1/2 border-2 border-slate-300 bg-slate-50 rounded-none flex items-center justify-center p-2 text-center uppercase tracking-wide">
                      Mechanical
                    </div>
                    <div className="h-1/2 border-2 border-slate-300 bg-slate-50 rounded-none flex items-center justify-center p-2 text-center uppercase tracking-wide">
                      Restrooms
                    </div>
                  </div>

                  {/* Real Motorbike Zone Area from DB (if floor has it) */}
                  {hasMotorbikeZone && (
                    <div className="w-36 px-4 py-2 flex flex-col select-none text-slate-500 font-bold text-[10px] text-center">
                      <div className="flex-1 border-2 border-indigo-400 bg-indigo-50/50 rounded-none flex flex-col items-center justify-center p-3 text-center uppercase tracking-wide text-indigo-800 gap-2">
                        <span className="font-black text-xs">{motorbikeZoneData?.name || 'Motorbike Zone'}</span>
                        <span className="text-[9px] bg-indigo-200 text-indigo-900 px-2 py-0.5 font-bold">
                          {motorbikeZoneData?.code || 'ZM01'}
                        </span>
                        <div className="border-t border-indigo-200/60 pt-2 mt-1 w-full space-y-1 text-[8px] normal-case text-indigo-700 font-medium">
                          <p>{motorbikeZoneData?.accessType === 0 || motorbikeZoneData?.accessType === 'General' ? 'General Parking' : 'Reserved Parking'}</p>
                          <p>Capacity: {motorbikeZoneData?.capacity ?? 25} slots</p>
                          <p className={`font-bold ${
                            motorbikeZoneData?.status === 'Maintenance' || motorbikeZoneData?.status === 2
                              ? 'text-amber-600'
                              : motorbikeZoneData?.status === 'Closed' || motorbikeZoneData?.status === 3
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                          }`}>
                            ● {motorbikeZoneData?.status === 'Maintenance' || motorbikeZoneData?.status === 2
                                ? 'Maintenance'
                                : motorbikeZoneData?.status === 'Closed' || motorbikeZoneData?.status === 3
                                  ? 'Closed'
                                  : 'Active Zone'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vertical Driveway */}
                  <div className="w-12 border-l-2 border-r-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-100/30 select-none py-12 shrink-0 mx-2">
                    <span className="transform -rotate-90 inline-block font-extrabold text-[10px] tracking-widest text-slate-500 whitespace-nowrap">
                      ↑ DRIVEWAY ↓
                    </span>
                  </div>

                  {/* Right Parking Slot Layout Area + fixed Exit Gate column */}
                  <div className="flex-1 flex gap-0 overflow-hidden pl-4">

                    {/* SLOTS AREA — takes all remaining space */}
                    <div className="flex-1 flex flex-col justify-between">
                      {!isLargeMap ? (
                        /* CASE A: 2-Row Layout (Floor 1 & Floor 3) */
                        <>
                          {/* Row 1 Slots (Top Row) */}
                          <div className="flex gap-2 items-start flex-wrap pb-2">
                            {topRowSlots.map(slot => renderMapSlot(slot))}
                          </div>

                          {/* 2-Way Driveway */}
                          <div className="h-14 border-t-2 border-b-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100/30 text-slate-500 font-black text-xs tracking-widest my-4 select-none rounded-none w-full">
                            <span>← DRIVEWAY →</span>
                          </div>

                          {/* Row 2 Slots (Bottom Row) */}
                          <div className="flex gap-2 items-end flex-wrap pt-2">
                            {(() => {
                              const mainSlots = bottomRowSlots.slice(0, -4);
                              const wheelchairGroup1 = bottomRowSlots.slice(-4, -2);
                              const wheelchairGroup2 = bottomRowSlots.slice(-2);
                              return (
                                <>
                                  {mainSlots.map(slot => renderMapSlot(slot))}
                                  <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[56px] h-[112px] text-[8px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                                    COL
                                  </div>
                                  {wheelchairGroup1.map(slot => renderMapSlot(slot))}
                                  {wheelchairGroup2.map(slot => renderMapSlot(slot))}
                                  <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[56px] h-[112px] text-[8px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                                    COL
                                  </div>
                                  <div className="border border-slate-300 bg-slate-50 flex items-center justify-center font-bold text-slate-500 uppercase tracking-wide shrink-0 w-[56px] h-[112px] text-[9px]">
                                    Stairs
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        /* CASE B: 4-Row Layout (Floor 2 / Many Slots) */
                        <>
                          {/* Row 1 Slots */}
                          <div className="flex gap-2 items-start flex-wrap pb-2">
                            {mapSlots.slice(0, Math.ceil(mapSlots.length / 4)).map(slot => renderMapSlot(slot))}
                          </div>

                          {/* Driveway 1 */}
                          <div className="h-12 border-t-2 border-b-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100/30 text-slate-500 font-extrabold text-[10px] tracking-widest my-2 select-none rounded-none w-full">
                            <span>← DRIVEWAY →</span>
                          </div>

                          {/* Row 2 Slots */}
                          <div className="flex gap-2 items-start flex-wrap pb-2">
                            {mapSlots.slice(Math.ceil(mapSlots.length / 4), 2 * Math.ceil(mapSlots.length / 4)).map(slot => renderMapSlot(slot))}
                            <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[36px] h-[88px] text-[7px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                              COL
                            </div>
                          </div>

                          {/* Driveway 2 (Middle) */}
                          <div className="h-12 border-t-2 border-b-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100/30 text-slate-500 font-extrabold text-[10px] tracking-widest my-2 select-none rounded-none w-full">
                            <span>← DRIVEWAY →</span>
                          </div>

                          {/* Row 3 Slots */}
                          <div className="flex gap-2 items-end flex-wrap pt-2">
                            {mapSlots.slice(2 * Math.ceil(mapSlots.length / 4), 3 * Math.ceil(mapSlots.length / 4)).map(slot => renderMapSlot(slot))}
                            <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[36px] h-[88px] text-[7px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                              COL
                            </div>
                          </div>

                          {/* Driveway 3 */}
                          <div className="h-12 border-t-2 border-b-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100/30 text-slate-500 font-extrabold text-[10px] tracking-widest my-2 select-none rounded-none w-full">
                            <span>← DRIVEWAY →</span>
                          </div>

                          {/* Row 4 Slots */}
                          <div className="flex gap-2 items-end flex-wrap pt-2">
                            {(() => {
                              const row4All = mapSlots.slice(3 * Math.ceil(mapSlots.length / 4));
                              if (row4All.length < 4) {
                                return row4All.map(slot => renderMapSlot(slot));
                              }
                              const mainSlots = row4All.slice(0, -4);
                              const wheelchairGroup1 = row4All.slice(-4, -2);
                              const wheelchairGroup2 = row4All.slice(-2);
                              return (
                                <>
                                  {mainSlots.map(slot => renderMapSlot(slot))}
                                  <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[36px] h-[88px] text-[7px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                                    COL
                                  </div>
                                  {wheelchairGroup1.map(slot => renderMapSlot(slot))}
                                  {wheelchairGroup2.map(slot => renderMapSlot(slot))}
                                  <div className="border border-slate-300 flex items-center justify-center opacity-60 select-none font-bold text-slate-400 rounded-none shrink-0 w-[36px] h-[88px] text-[7px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)' }}>
                                    COL
                                  </div>
                                  <div className="border border-slate-300 bg-slate-50 flex items-center justify-center font-bold text-slate-500 uppercase tracking-wide shrink-0 w-[36px] h-[88px] text-[8px]">
                                    Stairs
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>

                    {/* FIXED RIGHT COLUMN — Exit Gate 1 (top) + Exit Gate 2 (bottom) */}
                    <div className="flex flex-col justify-between items-center ml-3 shrink-0 py-1" style={{ minHeight: isLargeMap ? 360 : 280 }}>
                      {/* Exit Gate 1 — Top-Right Corner */}
                      <div className={`flex flex-col items-center justify-end shrink-0 select-none pb-1 border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 ${isLargeMap ? 'w-[36px] h-[88px] px-1' : 'w-[56px] h-[112px] px-3'}`}>
                        <div className={`bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 py-1 ${isLargeMap ? 'w-4 h-12' : 'w-5 h-16 py-1.5'}`}>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        </div>
                        <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                          <span>← EXIT</span>
                          <span className="text-[6px] text-[#006d43] mt-0.5">GATE 1</span>
                        </div>
                      </div>

                      {/* Exit Gate 2 — Bottom-Right Corner */}
                      <div className={`flex flex-col items-center justify-end shrink-0 select-none pb-1 border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 ${isLargeMap ? 'w-[36px] h-[88px] px-1' : 'w-[56px] h-[112px] px-3'}`}>
                        <div className={`bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 py-1 ${isLargeMap ? 'w-4 h-12' : 'w-5 h-16 py-1.5'}`}>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        </div>
                        <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                          <span>← EXIT</span>
                          <span className="text-[6px] text-slate-400 mt-0.5">GATE 2</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Cams Bottom */}
                <div className="flex justify-around px-20">
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                    <span>Cam4</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                    <span>Cam5</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400 font-bold text-[9px]">
                    <span className="h-2 w-0.5 bg-slate-300"></span>
                    <span>Cam6</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedSlotCode && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00a86b] text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
                {selectedSlotCode}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Temporary Slot Selection</h4>
                <p className="text-xs text-slate-500">Selected vehicle: <span className="font-semibold text-slate-700">{activeVehiclePlate}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/driver/parking-utils?slot=${selectedSlotCode}&vehicleTypeId=${selectedVehicleTypeId}`)}
                className="px-4 py-2 rounded-lg bg-[#00a86b] text-white font-semibold text-xs hover:bg-[#00905b] active:scale-[0.98] transition-all shadow-sm shadow-emerald-500/10"
              >
                Proceed to Booking
              </button>
              <button
                onClick={() => setSelectedSlotCode(null)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                title="Cancel selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {selectedVehicleTypeId !== 1 && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-800">
            <Info className="w-5 h-5 shrink-0 text-emerald-600" />
            <p className="text-xs font-semibold">Tip: Click on an available (green) slot to select it temporarily, then click it again or click 'Proceed to Booking' to book it.</p>
          </div>
        )}
      </section>
    </div>
  );
}
