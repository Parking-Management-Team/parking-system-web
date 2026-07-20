'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle
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
  maintenance: number;
  total: number;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [mapSlots, setMapSlots] = useState<SlotItem[]>([]);
  const [buildingsList, setBuildingsList] = useState<BuildingItem[]>([]);
  const [building, setBuilding] = useState<BuildingItem | null>(null);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<number>(2); // Default to Car (2)
  const [slotSummary, setSlotSummary] = useState<SlotSummary>({ available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 });
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  // KPI states
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [activeVehiclePlate, setActiveVehiclePlate] = useState<string>('—');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeBookingDetails, setActiveBookingDetails] = useState<any>(null);

  const getSlotStatus = (status: string | number): 'available' | 'occupied' | 'reserved' | 'maintenance' => {
    if (status === 0 || status === 'Available') return 'available';
    if (status === 1 || status === 'Occupied') return 'occupied';
    if (status === 2 || status === 'Blocked' || status === 4 || status === 'Reserved') return 'reserved';
    if (status === 3 || status === 'Maintenance') return 'maintenance';
    return 'available';
  };

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
      setSlotSummary({ available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 });
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingMap(true);
      try {
        // Load zones of floor
        const zoneRes = await api.get<any>(`/Zones/floor/${selectedFloorId}`);
        if (!zoneRes.success || !zoneRes.data || zoneRes.data.length === 0) {
          setMapSlots([]);
          setSlotSummary({ available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 });
          setIsLoadingMap(false);
          return;
        }

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
        const summary: SlotSummary = { available: 0, occupied: 0, reserved: 0, maintenance: 0, total: mergedSlots.length };
        mergedSlots.forEach(slot => {
          const s = slot.isReserved ? 'reserved' : getSlotStatus(slot.status);
          summary[s]++;
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
  const hasMotorbikeZone = selectedFloor?.vehicleTypeIds?.includes(1);
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

    let bgClass = '';
    let borderClass = 'border-slate-300';

    if (statusKey === 'available') {
      bgClass = 'bg-emerald-50 hover:bg-[#00a86b] hover:text-white transition-all cursor-pointer';
      borderClass = 'border-emerald-500/40 border-dashed';
    } else if (statusKey === 'occupied') {
      bgClass = 'bg-rose-50 border-rose-300 cursor-not-allowed';
      borderClass = 'border-rose-300';
    } else if (statusKey === 'reserved') {
      bgClass = 'bg-amber-50 border-amber-300 cursor-not-allowed';
      borderClass = 'border-amber-300';
    } else {
      bgClass = 'bg-slate-100 border-slate-300 cursor-not-allowed';
      borderClass = 'border-slate-300';
    }

    return (
      <div
        key={slot.id}
        onClick={() => isClickable && router.push(`/dashboard/driver/parking-utils?slot=${slot.code}&vehicleTypeId=${selectedVehicleTypeId}`)}
        className={`border-2 border-t-0 flex flex-col justify-between text-center relative select-none rounded-none shrink-0 ${slotSizeClass} ${bgClass} ${borderClass} transition-all duration-200 group`}
        title={`${slot.code} — ${statusKey}`}
      >
        {/* Top: Zone Code Prefix */}
        <div className="text-[8px] opacity-65 font-bold uppercase tracking-wider select-none pt-1">
          {zonePart}
        </div>

        {/* Middle: Prominent Slot Number in the center */}
        <div className="flex-1 flex items-center justify-center">
          {numberPart && (
            <span className={isLargeMap ? 'text-lg font-black text-slate-800' : 'text-3xl font-black text-slate-900'}>
              {numberPart}
            </span>
          )}
        </div>

        {/* Bottom: Action or status */}
        <div className={`font-bold uppercase tracking-widest opacity-60 ${bottomTextClass} pb-1`}>
          {statusKey === 'available' ? 'Book' : statusKey === 'occupied' ? 'Full' : statusKey === 'reserved' ? 'Hold' : 'Maint'}
        </div>
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

      {/* KPI SUMMARY */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI 1 — Parking Rate */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parking Rate</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Motorbike:</span>
              <span className="font-bold text-slate-800">5.000 đ/h</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-1">
              <span className="font-semibold text-slate-600">Car:</span>
              <span className="font-bold text-slate-800">20.000 đ/h</span>
            </div>
          </div>
        </div>

        {/* KPI 2 — My Vehicle */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col justify-between h-32 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Vehicle</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              {selectedVehicleTypeId === 1 ? (
                <Bike className="w-5 h-5" />
              ) : (
                <Car className="w-5 h-5" />
              )}
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
        <div className={`${isInteractiveMap ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>

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
                  <span className="w-2.5 h-2.5 rounded bg-[#00a86b]"></span> AVAILABLE ({slotSummary.available})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> RESERVED ({slotSummary.reserved})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-slate-300"></span> OCCUPIED ({slotSummary.occupied})
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-rose-300"></span> MAINTENANCE ({slotSummary.maintenance})
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
                      if (b) setBuilding(b);
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
                      onClick={() => setSelectedVehicleTypeId(t.value)}
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
                <div className="w-full py-8">
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

                      {/* Optional Motorbike Zone Area (if floor has it) */}
                      {hasMotorbikeZone && (
                        <div className="w-36 px-4 py-2 flex flex-col select-none text-slate-500 font-bold text-[10px] text-center">
                          <div className="flex-1 border-2 border-indigo-400 bg-indigo-50/50 rounded-none flex flex-col items-center justify-center p-3 text-center uppercase tracking-wide text-indigo-800 gap-2">
                            <span className="font-black text-xs">Motorbike Zone</span>
                            <span className="text-[9px] bg-indigo-200 text-indigo-900 px-2 py-0.5 font-bold">ZM01</span>
                            <div className="border-t border-indigo-200/60 pt-2 mt-1 w-full space-y-1 text-[8px] normal-case text-indigo-700 font-medium">
                              <p>General Parking</p>
                              <p>Capacity: 25 slots</p>
                              <p className="text-emerald-700 font-bold">● Active Zone</p>
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

                      {/* Right Parking Slot Layout Area */}
                      <div className="flex-1 flex flex-col justify-between pl-4">
                        {!isLargeMap ? (
                          /* CASE A: 2-Row Layout (Floor 1 & Floor 3) */
                          <>
                            {/* Row 1 Slots (Top Row) */}
                            <div className="flex gap-2 items-start flex-wrap pb-2">
                              {topRowSlots.map(slot => renderMapSlot(slot))}
                              {/* Exit Gate 1 (Top-Right) */}
                              <div className="flex flex-col items-center justify-end px-3 shrink-0 select-none pb-1 relative border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 w-[56px] h-[112px]">
                                <div className="bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 w-5 h-16 py-1.5">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                </div>
                                <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                                  <span>← EXIT</span>
                                  <span className="text-[6px] text-slate-400 mt-0.5">GATE 1</span>
                                </div>
                              </div>
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
                                    
                                    {/* Exit Gate 2 (Bottom-Right) */}
                                    <div className="flex flex-col items-center justify-end px-3 shrink-0 select-none pb-1 relative border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 w-[56px] h-[112px]">
                                      <div className="bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 w-5 h-16 py-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                      </div>
                                      <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                                        <span>← EXIT</span>
                                        <span className="text-[6px] text-slate-400 mt-0.5">GATE 2</span>
                                      </div>
                                    </div>
                                    
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
                              {/* Exit Gate 1 (Top-Right) */}
                              <div className="flex flex-col items-center justify-end px-3 shrink-0 select-none pb-1 relative border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 w-[36px] h-[88px]">
                                <div className="bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 w-4 h-12 py-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                </div>
                                <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                                  <span>← EXIT</span>
                                  <span className="text-[6px] text-slate-400 mt-0.5">GATE 1</span>
                                </div>
                              </div>
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
                                    
                                    {/* Exit Gate 2 (Bottom-Right) */}
                                    <div className="flex flex-col items-center justify-end px-3 shrink-0 select-none pb-1 relative border-l-2 border-r-2 border-slate-200 border-dashed bg-slate-50/40 w-[36px] h-[88px]">
                                      <div className="bg-white border-2 border-slate-400 rounded-full flex flex-col items-center justify-around shadow-sm shrink-0 w-4 h-12 py-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                      </div>
                                      <div className="text-[8px] font-black text-emerald-600 mt-1 flex flex-col items-center leading-none">
                                        <span>← EXIT</span>
                                        <span className="text-[6px] text-slate-400 mt-0.5">GATE 2</span>
                                      </div>
                                    </div>
                                    
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
              )}
            </div>

            {selectedVehicleTypeId !== 1 && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-800">
                <Info className="w-5 h-5 shrink-0 text-emerald-600" />
                <p className="text-xs font-semibold">Tip: Click on an available (green) slot to start booking immediately.</p>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className={`${isInteractiveMap ? 'lg:col-span-12 md:max-w-xl md:mx-auto w-full' : 'lg:col-span-4'} space-y-6`}>

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
            {hasActiveSession && activeSession && (() => {
              const isOverdue = activeBookingDetails && new Date(activeBookingDetails.plannedCheckoutTime) < new Date();
              return (
                <div className="w-full bg-[#f8f9ff] border border-slate-100 rounded-xl p-4 text-left space-y-3 mb-6">
                  {isOverdue && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold flex items-start gap-2">
                      <span className="text-sm mt-0.5 text-amber-600">⚠️</span>
                      <div>
                        <p className="font-bold text-amber-950">Overstay Alert</p>
                        <p className="mt-0.5 leading-relaxed text-amber-900">
                          You have exceeded your planned checkout time ({new Date(activeBookingDetails.plannedCheckoutTime).toLocaleTimeString('vi-VN')}). Please extend your booking or check out immediately to avoid penalties.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">License Plate:</span>
                    <span className="font-bold text-slate-800">{activeSession.licensePlateIn}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Card Code:</span>
                    <span className="font-bold text-slate-800">{activeSession.cardCode || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Zone / Slot:</span>
                    <span className="font-bold text-slate-800">{activeSession.slotCode ? `${activeSession.zoneCode || 'Zone'} - ${activeSession.slotCode}` : (activeSession.zoneCode || '—')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Check-in:</span>
                    <span className="font-bold text-slate-800">{new Date(activeSession.checkInTime).toLocaleString('vi-VN')}</span>
                  </div>
                  {activeBookingDetails && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">Planned Checkout:</span>
                      <span className={`font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-800'}`}>
                        {new Date(activeBookingDetails.plannedCheckoutTime).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Duration:</span>
                    <span className={`font-bold ${isOverdue ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {(() => {
                        const diffMs = Date.now() - new Date(activeSession.checkInTime).getTime();
                        const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        return `${hours}h ${mins}m${isOverdue ? ' (Overdue)' : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              );
            })()}
            {hasActiveSession ? (
              <button
                onClick={() => router.push('/dashboard/driver/parking-utils')}
                className="w-full py-3.5 rounded-xl bg-[#00a86b] text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:bg-[#00905b] active:scale-[0.98] transition-all"
              >
                View Active Session
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/driver/parking-utils')}
                className="w-full py-3.5 rounded-xl bg-[#00a86b] text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:bg-[#00905b] active:scale-[0.98] transition-all mb-4"
              >
                Book a Slot
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/driver/parking-utils')}
              className="text-[#00a86b] text-sm font-bold hover:underline mt-2"
            >
              Scan QR code to check-out
            </button>
          </section>



        </div>
      </div>
    </div>
  );
}
