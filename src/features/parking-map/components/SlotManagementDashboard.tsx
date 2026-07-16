'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { api, apiClient } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { Floor, FloorResponse, Zone, ZoneResponse, Slot, ParkingSlotDto, ParkingSessionDto, FloorSlotSummary } from '../types';
import { SlotActionModal } from './SlotActionModal';

function mapFloorSlotSummary(data: any[]): FloorSlotSummary[] {
  return data.map(item => ({
    floorId: item.floorId,
    floorNumber: item.floorNumber,
    totalSlots: item.totalSlots,
    vehicleTypeSummaries: (item.vehicleTypeSummaries || []).map((vt: any) => {
      const statusCounts: any = {};
      if (Array.isArray(vt.statusCounts)) {
        vt.statusCounts.forEach((sc: any) => {
          if (sc.status !== undefined && sc.status !== null) {
            const statusStr = sc.status.toString();
            const count = sc.count;
            
            // Map exact response key
            statusCounts[statusStr] = count;
            statusCounts[statusStr.toUpperCase()] = count;
            statusCounts[statusStr.toLowerCase()] = count;

            // Map standard keys case-insensitively and handle potential numeric enums
            const normalizedStatus = statusStr.toUpperCase();
            if (normalizedStatus === 'AVAILABLE' || normalizedStatus === '0') {
              statusCounts['Available'] = count;
              statusCounts['AVAILABLE'] = count;
            } else if (normalizedStatus === 'OCCUPIED' || normalizedStatus === '1') {
              statusCounts['Occupied'] = count;
              statusCounts['OCCUPIED'] = count;
            } else if (normalizedStatus === 'BLOCKED' || normalizedStatus === '2') {
              statusCounts['Blocked'] = count;
              statusCounts['BLOCKED'] = count;
            } else if (normalizedStatus === 'MAINTENANCE' || normalizedStatus === '3') {
              statusCounts['Maintenance'] = count;
              statusCounts['MAINTENANCE'] = count;
            } else if (normalizedStatus === 'RESERVED' || normalizedStatus === '4') {
              statusCounts['Reserved'] = count;
              statusCounts['RESERVED'] = count;
            }
          }
        });
      }
      return {
        vehicleTypeId: vt.vehicleTypeId,
        vehicleTypeName: vt.vehicleTypeName,
        totalSlots: vt.totalSlots,
        statusCounts
      };
    })
  }));
}

export function SlotManagementDashboard() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase();
  const backLink = userRole === 'STAFF' ? '/dashboard/staff' : '/dashboard/manager/facilities';

  // ─── Core States ──────────────────────────────────────────────────
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Dialog States
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Session details modal states
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<ParkingSessionDto | null>(null);
  const [completingSessionId, setCompletingSessionId] = useState<number | null>(null);

  // Real-time polling
  const POLL_INTERVAL_MS = 10_000;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slot Summary Data from API
  const [floorSlotSummary, setFloorSlotSummary] = useState<FloorSlotSummary | null>(null);

  // Show Toast Helper
  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Fetch Data from API ──────────────────────────────────────────
  
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 0. Fetch Vehicle Types
      const resVt = await api.get<BaseResponse<any[]>>('/vehicle-types');
      const loadedVehicleTypes = resVt.success && resVt.data ? resVt.data : [];
      setVehicleTypes(loadedVehicleTypes);

      // 1. Fetch Buildings
      const resBld = await api.get<BaseResponse<PagedResult<Building>>>('/Buildings/paged?pageIndex=1&pageSize=100');
      let loadedBuildings: Building[] = [];
      if (resBld.success && resBld.data?.items) {
        loadedBuildings = resBld.data.items;
        setBuildings(loadedBuildings);
      }

      // 2. Fetch Floors
      const resFloors = await api.get<BaseResponse<FloorResponse[]>>('/Floors');
      let loadedFloors: Floor[] = [];
      if (resFloors.success && resFloors.data) {
        loadedFloors = resFloors.data.map(item => ({
          id: item.id,
          buildingId: item.buildingId,
          floorNumber: item.floorNumber,
          name: item.name || `Floor ${item.floorNumber}`,
          status: item.status === 3 || item.status === 'OutOfService' || item.status === 'Inactive' ? 'Inactive' : 'Active'
        }));
        setFloors(loadedFloors);
      }

      // 3. Fetch Zones
      const resZones = await api.get<BaseResponse<ZoneResponse[]>>('/Zones');
      let loadedZones: Zone[] = [];
      if (resZones.success && resZones.data) {
        const mapVehicleTypeIdToType = (id: number): 'Standard' | 'EV Charging' | 'Motorbike' => {
          const vt = loadedVehicleTypes.find(v => v.id === id);
          if (vt) {
            const name = (vt.name || vt.typeName || '').toUpperCase();
            const code = (vt.vehicleTypeCode || vt.code || '').toUpperCase();
            if (name.includes('MOTOR') || name.includes('BIKE') || code.includes('MOTOR') || code.includes('BIKE')) {
              return 'Motorbike';
            }
          }
          return 'Standard';
        };
        const mapAccessTypeToZone = (accessType?: number): 'GENERAL' | 'MONTHLY' => {
          return 'GENERAL';
        };
        loadedZones = resZones.data.map(item => ({
          id: item.id,
          floorId: item.floorId,
          name: item.name,
          vehicleType: mapVehicleTypeIdToType(item.vehicleTypeId),
          zoneAccessType: mapAccessTypeToZone(item.accessType),
          slotCapacity: item.capacity || 0,
          status: item.status === 3 || item.status === 'OutOfService' || item.status === 'Inactive' ? 'Inactive' : 'Active',
          bookingLimitRate: item.bookingLimitRate ?? 80
        }));
        setZones(loadedZones);
      }

      // Set default selected building and floor
      if (loadedBuildings.length > 0) {
        const firstBld = loadedBuildings[0];
        setSelectedBuildingId(firstBld.id);
        
        const bldFloors = loadedFloors.filter(f => f.buildingId === firstBld.id);
        if (bldFloors.length > 0) {
          setSelectedFloorId(bldFloors[0].id);
        }
      }

    } catch (err) {
      console.error('Failed to load parking infrastructure:', err);
      showToastMessage('Could not load infrastructure from server.', 'error');
      setBuildings([]);
      setFloors([]);
      setZones([]);
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
    } finally {
      setLoading(false);
    }
  }, [showToastMessage]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch Slot Summary from API
  const fetchSlotSummary = useCallback(async () => {
    if (!selectedBuildingId || !selectedFloorId) return;
    try {
      const res = await api.get<BaseResponse<any[]>>(`/Floors/building/${selectedBuildingId}/slot-summary`);
      if (res.success && res.data) {
        const mappedData = mapFloorSlotSummary(res.data);
        const summary = mappedData.find(s => s.floorId === selectedFloorId);
        setFloorSlotSummary(summary || null);
      }
    } catch (err) {
      console.error('Failed to load slot summary:', err);
      setFloorSlotSummary(null);
    }
  }, [selectedBuildingId, selectedFloorId]);

  useEffect(() => {
    fetchSlotSummary();
  }, [fetchSlotSummary]);

  // Fetch Slots and active sessions when selectedFloorId changes
  const fetchSlotsForFloor = useCallback(async () => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const floorZones = zones.filter(z => z.floorId === selectedFloorId);
      
      // Fetch active parking sessions to match license plates and details
      const sessionRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active').catch(() => null);
      const activeSess = sessionRes?.success && sessionRes.data ? sessionRes.data : [];
      setActiveSessions(activeSess);

      // Fetch slots for each zone on the floor in parallel
      const zoneSlotsPromises = floorZones.map(async (zone) => {
        try {
          const res = await api.get<BaseResponse<ParkingSlotDto[]>>(`/ParkingSlots/zone/${zone.id}`);
          if (res.success && res.data) {
            return res.data.map(item => {
              // Find active session for this slot
              const session = activeSess.find(s => s.slotId === item.id);
              
              let assignedVehicle = undefined;
              if (session) {
                assignedVehicle = {
                  plate: session.licensePlateIn,
                  startDate: session.checkInTime,
                  endDate: session.checkOutTime || undefined
                };
              } else if (item.occupiedLicensePlate) {
                assignedVehicle = {
                  plate: item.occupiedLicensePlate
                };
              }

              const mapStatus = (statusVal: number | string): Slot['status'] => {
                if (typeof statusVal === 'string') {
                  switch (statusVal.toLowerCase()) {
                    case 'available': return 'AVAILABLE';
                    case 'occupied': return 'OCCUPIED';
                    case 'blocked': return 'BLOCKED';
                    case 'maintenance': return 'MAINTENANCE';
                    case 'reserved': return 'RESERVED';
                    default: return 'AVAILABLE';
                  }
                }
                switch (statusVal) {
                  case 0: return 'AVAILABLE';
                  case 1: return 'OCCUPIED';
                  case 2: return 'BLOCKED';
                  case 3: return 'MAINTENANCE';
                  case 4: return 'RESERVED';
                  default: return 'AVAILABLE';
                }
              };

              return {
                id: item.id,
                slotCode: item.code,
                slotName: item.name,
                zoneId: item.zoneId,
                zoneName: zone.name,
                floorId: selectedFloorId,
                buildingId: selectedBuildingId || 0,
                slotType: zone.vehicleType === 'EV Charging' ? 'EV Charging' as const : (zone.vehicleType === 'Motorbike' ? 'Motorbike' as const : 'Standard' as const),
                status: assignedVehicle ? 'OCCUPIED' : mapStatus(item.status),
                vehicleTypeId: item.vehicleTypeId,
                assignedVehicle
              };
            });
          }
        } catch (slotErr) {
          console.error(`Error loading slots for zone ${zone.id}:`, slotErr);
        }
        return [];
      });

      const results = await Promise.all(zoneSlotsPromises);
      const allSlots = results.flat();

      setSlots(allSlots);
    } catch (err) {
      console.error('Failed to load slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFloorId, zones, selectedBuildingId]);

  useEffect(() => {
    fetchSlotsForFloor();
  }, [fetchSlotsForFloor]);

  // ─── Auto-polling: refresh slots + sessions every 10s ─────────────
  const refreshSlotsAndSessions = useCallback(async () => {
    if (!selectedFloorId) return;
    try {
      const floorZones = zones.filter(z => z.floorId === selectedFloorId);

      const sessionRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active').catch(() => null);
      const activeSess = sessionRes?.success && sessionRes.data ? sessionRes.data : [];
      setActiveSessions(activeSess);

      const zoneSlotsPromises = floorZones.map(async (zone) => {
        try {
          const res = await api.get<BaseResponse<ParkingSlotDto[]>>(`/ParkingSlots/zone/${zone.id}`);
          if (res.success && res.data) {
            return res.data.map(item => {
              const session = activeSess.find(s => s.slotId === item.id);
              let assignedVehicle = undefined;
              if (session) {
                assignedVehicle = {
                  plate: session.licensePlateIn,
                  startDate: session.checkInTime,
                  endDate: session.checkOutTime || undefined
                };
              } else if (item.occupiedLicensePlate) {
                assignedVehicle = {
                  plate: item.occupiedLicensePlate
                };
              }

              const mapStatus = (statusVal: number | string): Slot['status'] => {
                if (typeof statusVal === 'string') {
                  switch (statusVal.toLowerCase()) {
                    case 'available': return 'AVAILABLE';
                    case 'occupied': return 'OCCUPIED';
                    case 'blocked': return 'BLOCKED';
                    case 'maintenance': return 'MAINTENANCE';
                    case 'reserved': return 'RESERVED';
                    default: return 'AVAILABLE';
                  }
                }
                switch (statusVal) {
                  case 0: return 'AVAILABLE';
                  case 1: return 'OCCUPIED';
                  case 2: return 'BLOCKED';
                  case 3: return 'MAINTENANCE';
                  case 4: return 'RESERVED';
                  default: return 'AVAILABLE';
                }
              };

              return {
                id: item.id,
                slotCode: item.code,
                slotName: item.name,
                zoneId: item.zoneId,
                zoneName: zone.name,
                floorId: selectedFloorId,
                buildingId: selectedBuildingId || 0,
                slotType: zone.vehicleType === 'EV Charging' ? 'EV Charging' as const : (zone.vehicleType === 'Motorbike' ? 'Motorbike' as const : 'Standard' as const),
                status: assignedVehicle ? 'OCCUPIED' : mapStatus(item.status),
                vehicleTypeId: item.vehicleTypeId,
                assignedVehicle
              };
            });
          }
        } catch { return []; }
        return [];
      });

      const results = await Promise.all(zoneSlotsPromises);
      setSlots(results.flat());
      setLastUpdated(new Date());

      // Refresh slot summary
      if (selectedBuildingId) {
        const summaryRes = await api.get<BaseResponse<any[]>>(`/Floors/building/${selectedBuildingId}/slot-summary`).catch(() => null);
        if (summaryRes?.success && summaryRes.data) {
          const mappedData = mapFloorSlotSummary(summaryRes.data);
          const summary = mappedData.find(s => s.floorId === selectedFloorId);
          setFloorSlotSummary(summary || null);
        }
      }
    } catch { /* silent polling failure */ }
  }, [selectedFloorId, zones, selectedBuildingId]);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedFloorId) return;
    pollingRef.current = setInterval(refreshSlotsAndSessions, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [refreshSlotsAndSessions, selectedFloorId]);

  // Derived filterings
  const activeFloors = useMemo(() => {
    if (!selectedBuildingId) return [];
    return floors.filter(f => f.buildingId === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  const activeCarZones = useMemo(() => {
    if (!selectedFloorId) return [];
    return zones.filter(z => z.floorId === selectedFloorId && z.vehicleType !== 'Motorbike');
  }, [zones, selectedFloorId]);

  const activeMotorbikeZones = useMemo(() => {
    if (!selectedFloorId) return [];
    return zones.filter(z => z.floorId === selectedFloorId && z.vehicleType === 'Motorbike');
  }, [zones, selectedFloorId]);

  // Find motorbike slot summary for the current floor
  const motorSummary = useMemo(() => {
    if (!floorSlotSummary) return null;
    return floorSlotSummary.vehicleTypeSummaries.find(vt => {
      const name = (vt.vehicleTypeName || '').toUpperCase();
      return name.includes('MOTOR') || name.includes('BIKE');
    }) || null;
  }, [floorSlotSummary]);

  // Calculate effective total motorbike capacity on the current floor
  const effectiveMotorTotal = useMemo(() => {
    // Filter slots on this floor belonging to motorbike zones
    const floorMotorSlots = slots.filter(s => {
      const zone = zones.find(z => z.id === s.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    });

    if (floorMotorSlots.length > 0) {
      return floorMotorSlots.length;
    }

    if (motorSummary) {
      return motorSummary.totalSlots ?? 0;
    }

    // Fallback: sum of slot capacities of motorbike zones on this floor
    return activeMotorbikeZones.reduce((sum, z) => sum + (z.slotCapacity || 0), 0);
  }, [slots, zones, selectedFloorId, motorSummary, activeMotorbikeZones]);

  // Calculate effective occupied motorbike count on the current floor
  const effectiveMotorOccupied = useMemo(() => {
    // Filter slots on this floor belonging to motorbike zones
    const floorMotorSlots = slots.filter(s => {
      const zone = zones.find(z => z.id === s.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    });

    const occupiedSlotsCount = floorMotorSlots.filter(s => s.status === 'OCCUPIED').length;

    // Count active sessions on this floor in motorbike zones
    const activeSessionsCount = activeSessions.filter(session => {
      const zone = zones.find(z => z.id === session.zoneId);
      return zone && zone.floorId === selectedFloorId && zone.vehicleType === 'Motorbike';
    }).length;

    const count = Math.max(occupiedSlotsCount, activeSessionsCount);

    if (count > 0) {
      return count;
    }

    if (motorSummary) {
      return motorSummary.statusCounts?.Occupied ?? 0;
    }

    return 0;
  }, [slots, zones, selectedFloorId, motorSummary, activeSessions]);

  // Calculate effective available motorbike count on the current floor
  const effectiveMotorAvailable = useMemo(() => {
    return Math.max(0, effectiveMotorTotal - effectiveMotorOccupied);
  }, [effectiveMotorTotal, effectiveMotorOccupied]);

  // Handlers
  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bldId = parseInt(e.target.value);
    setSelectedBuildingId(bldId);
    
    const bldFloors = floors.filter(f => f.buildingId === bldId);
    if (bldFloors.length > 0) {
      setSelectedFloorId(bldFloors[0].id);
    } else {
      setSelectedFloorId(null);
    }
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFloorId(parseInt(e.target.value));
  };

  // Open modal dialog on click
  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  // Callback to handle updates inside modal
  const handleSlotUpdated = useCallback((
    slotId: number,
    newStatus: Slot['status'],
    assignedVehicle?: Slot['assignedVehicle']
  ) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          status: newStatus,
          assignedVehicle
        };
      }
      return s;
    }));
    fetchSlotSummary();
    setTimeout(() => fetchSlotsForFloor(), 500);
  }, [fetchSlotsForFloor, fetchSlotSummary]);

  // Active Sessions list filtering for the current floor
  const filteredSessions = useMemo(() => {
    return activeSessions.filter(session => {
      const zone = zones.find(z => z.id === session.zoneId);
      if (!zone || zone.floorId !== selectedFloorId) return false;

      const slot = slots.find(s => s.id === session.slotId);
      const slotCode = slot ? slot.slotCode : '';
      const plate = session.licensePlateIn || '';
      const subText = session.bookingId ? `BOOKING-${session.bookingId}` : 'WALK-IN';
      
      const searchMatch = 
        slotCode.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        plate.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        subText.toLowerCase().includes(tableSearchQuery.toLowerCase());

      if (tableTypeFilter === 'All') return searchMatch;
      if (tableTypeFilter === 'Motorbike') return searchMatch && zone.vehicleType === 'Motorbike';
      return searchMatch && slot?.slotType === tableTypeFilter;
    });
  }, [activeSessions, zones, selectedFloorId, slots, tableSearchQuery, tableTypeFilter]);

  // Action to complete a session (release spot)
  const handleForceCompleteSession = async (sessionId: number) => {
    const isConfirmed = window.confirm(
      "WARNING: Are you sure you want to force release this parking session?\n\n" +
      "This action will immediately terminate the parking session and release the parking slot in the system, bypassing the standard checkout payment process at the exit gate. Please ensure the vehicle has physically departed or payment has been settled directly."
    );
    if (!isConfirmed) return;

    setCompletingSessionId(sessionId);
    try {
      await apiClient(`/parking-sessions/${sessionId}/complete`, { method: 'PATCH' });
      showToastMessage('Parking session completed and slot/space released successfully.');
      setSelectedSessionDetails(null);
      await fetchSlotsForFloor();
    } catch (err) {
      console.error(err);
      showToastMessage('Failed to complete parking session.', 'error');
    } finally {
      setCompletingSessionId(null);
    }
  };

  // Color Coding maps
  const getSlotColorClass = (status: Slot['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-[#006d43] border-[#006d43] text-white hover:brightness-110';
      case 'OCCUPIED':
        return 'bg-[#263143] border-[#263143] text-white hover:brightness-110';
      case 'BLOCKED':
        return 'bg-[#ba1a1a] border-[#ba1a1a] text-white hover:brightness-110';
      case 'MAINTENANCE':
        return 'bg-[#d97706] border-[#d97706] text-white hover:brightness-110';
      case 'RESERVED':
        return 'bg-amber-400 border-amber-400 text-white hover:brightness-110';
      default:
        return 'bg-slate-300 border-slate-300 text-slate-700';
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative bg-slate-50/50">

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3.5 text-white px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 transform scale-100 border border-white/10 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' ? 'bg-[#ba1a1a] shadow-red-600/30' : 'bg-[#006d43] shadow-[#006d43]/30'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="text-base font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* ===== HEADER & INFRASTRUCTURE FILTERS ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={backLink}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] align-middle">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-slate-855 tracking-tight">Slot Management</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1 ml-8">Configure, allocate, and monitor parking bays for Cars and Motorbike capacity.</p>
          </div>

          {/* Infrastructure selector (Building -> Floor) */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm ml-8 md:ml-0">
            <div className="flex flex-col min-w-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Building</span>
              <select
                value={selectedBuildingId || ''}
                onChange={handleBuildingChange}
                className="bg-transparent border-0 py-0.5 pl-1 pr-6 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none"
              >
                {buildings.map(bld => (
                  <option key={bld.id} value={bld.id}>{bld.name}</option>
                ))}
              </select>
            </div>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Floor</span>
              <select
                value={selectedFloorId || ''}
                onChange={handleFloorChange}
                disabled={activeFloors.length === 0}
                className="bg-transparent border-0 py-0.5 pl-1 pr-6 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none disabled:opacity-50"
              >
                {activeFloors.map(fl => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ===== TAB BAR NAVIGATION ===== */}
        <div className="mb-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('map')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'map'
                  ? 'text-[#006d43] border-[#006d43]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              Visual Layout Map
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'list'
                  ? 'text-[#006d43] border-[#006d43]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              Session Allocations ({activeSessions.filter(s => zones.find(z => z.id === s.zoneId)?.floorId === selectedFloorId).length})
            </button>
          </div>

          <div className="flex items-center gap-3 pb-3">
            {loading && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <div className="w-3.5 h-3.5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
                Syncing...
              </div>
            )}
            {lastUpdated && !loading && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006d43] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006d43]"></span>
                </span>
                LIVE · Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={refreshSlotsAndSessions}
              title="Refresh now"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#006d43] hover:bg-emerald-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] align-middle">refresh</span>
            </button>
          </div>
        </div>

        {/* ===== FLOOR CAPACITY SUMMARY BAR ===== */}
        {selectedFloorId && floorSlotSummary && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorSlotSummary.vehicleTypeSummaries
              .filter(vt => {
                const name = (vt.vehicleTypeName || '').toUpperCase();
                return name.includes('MOTOR') || name.includes('BIKE') || name.includes('STANDARD') || name.includes('CAR');
              })
              .map((vehicleType) => {
                const { vehicleTypeName, totalSlots, statusCounts } = vehicleType;
                const occupied = statusCounts?.Occupied ?? 0;
                const blocked = statusCounts?.Blocked ?? 0;
                const maintenance = statusCounts?.Maintenance ?? 0;
                const available = statusCounts?.Available ?? 0;
                const isMotorbike = vehicleTypeName?.toUpperCase().includes('MOTOR') || vehicleTypeName?.toUpperCase().includes('BIKE');

                let effectiveOccupied = occupied;
                let effectiveAvailable = available;
                let effectiveTotal = totalSlots ?? 0;
                if (isMotorbike) {
                  effectiveOccupied = effectiveMotorOccupied;
                  effectiveAvailable = effectiveMotorAvailable;
                  effectiveTotal = effectiveMotorTotal;
                }

                const effectiveOccupiedPct = effectiveTotal > 0 ? Math.round((effectiveOccupied / effectiveTotal) * 100) : 0;
                const effectiveAvailablePct = effectiveTotal > 0 ? Math.round((effectiveAvailable / effectiveTotal) * 100) : 0;
                const blockedPct = effectiveTotal > 0 ? Math.round((blocked / effectiveTotal) * 100) : 0;
                const maintenancePct = effectiveTotal > 0 ? Math.round((maintenance / effectiveTotal) * 100) : 0;

                return (
                  <div key={vehicleType.vehicleTypeId} className="bg-white border-2 border-slate-200 shadow-md rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isMotorbike ? 'bg-slate-100' : 'bg-emerald-50'}`}>
                          <span className={`material-symbols-outlined text-[20px] ${isMotorbike ? 'text-slate-600' : 'text-[#006d43]'}`}>
                            {isMotorbike ? 'motorcycle' : 'directions_car'}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">{isMotorbike ? 'Motorbike' : 'Car'} · Floor {floorSlotSummary.floorNumber}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#006d43]">{effectiveAvailable}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Available</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#263143]">{effectiveOccupied}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Occupied</p>
                      </div>
                      {!isMotorbike && (
                        <>
                          <div className="h-8 w-px bg-slate-100"></div>
                          <div className="text-center min-w-[50px]">
                            <p className="text-2xl font-black text-[#ba1a1a]">{blocked}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Blocked</p>
                          </div>
                          <div className="h-8 w-px bg-slate-100"></div>
                          <div className="text-center min-w-[50px]">
                            <p className="text-2xl font-black text-[#d97706]">{maintenance}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Maintenance</p>
                          </div>
                        </>
                      )}
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-slate-600">{effectiveTotal}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar with Percentage */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-wider">Capacity Usage</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#006d43]">{effectiveAvailablePct}% free</span>
                          <span className="text-[#263143]">{effectiveOccupiedPct}% occupied</span>
                          {!isMotorbike && blocked > 0 && <span className="text-[#ba1a1a]">{blockedPct}% blocked</span>}
                          {!isMotorbike && maintenance > 0 && <span className="text-[#d97706]">{maintenancePct}% maintaining</span>}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#006d43] transition-all duration-700" style={{ width: `${effectiveAvailablePct}%` }} />
                        <div className="h-full bg-[#263143] transition-all duration-700" style={{ width: `${effectiveOccupiedPct}%` }} />
                        {!isMotorbike && <div className="h-full bg-[#ba1a1a] transition-all duration-700" style={{ width: `${blockedPct}%` }} />}
                        {!isMotorbike && <div className="h-full bg-[#d97706] transition-all duration-700" style={{ width: `${maintenancePct}%` }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== TAB CONTENT 1: VISUAL LAYOUT MAP ===== */}
        {activeTab === 'map' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-6 bg-white px-6 py-3.5 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-2">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#006d43]"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#263143]"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#ba1a1a]"></div>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#d97706]"></div>
                <span>Maintenance</span>
              </div>
            </div>

            {/* Car Slots Layout grids (rendered per zone) */}
            {activeCarZones.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">grid_view</span>
                <h3 className="text-sm font-bold text-slate-600">No Car Zones Configured</h3>
                <p className="text-xs text-slate-400 mt-1">Configure your zones and slots under Facilities Management first.</p>
              </div>
            ) : (
              activeCarZones.map(zone => {
                const zoneSlots = slots.filter(s => s.zoneId === zone.id);
                const availableCount = zoneSlots.filter(s => s.status === 'AVAILABLE').length;

                return (
                  <div key={zone.id} className="bg-[#fcfdfc] p-6 rounded-2xl border border-emerald-500/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-[#006d43]">
                            directions_car
                          </span>
                          {zone.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-[#006d43] border border-emerald-500/10">
                            Car
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        {availableCount} / {zoneSlots.length} Available
                      </span>
                    </div>

                        {zoneSlots.length === 0 ? (
                          <p className="text-xs text-slate-400 font-semibold italic text-center py-6 col-span-full">No slots configured in this zone.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3.5">
                            {zoneSlots.map(slot => (
                              <button
                                key={slot.id}
                                onClick={() => handleSlotClick(slot)}
                                title={slot.status === 'RESERVED' ? 'Reserved for booking' : undefined}
                                className={`h-24 border rounded-xl flex flex-col items-center justify-between py-3 px-3.5 shadow-sm transition-all hover:scale-[1.03] active:scale-95 group font-bold text-sm ${getSlotColorClass(
                                  slot.status
                                )}`}
                              >
                                <span className="truncate w-full text-center px-1">{slot.slotCode}</span>
                                {slot.status === 'OCCUPIED' && slot.assignedVehicle ? (
                                  <div className="w-full text-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                      directions_car
                                    </span>
                                    <span className="block text-[9px] font-extrabold mt-0.5 opacity-90 truncate leading-tight">
                                      {slot.assignedVehicle.plate}
                                    </span>
                                  </div>
                                ) : slot.status === 'RESERVED' ? (
                                  <div className="w-full text-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                      event
                                    </span>
                                    <span className="block text-[8px] font-extrabold mt-0.5 opacity-80 uppercase">
                                      Booked
                                    </span>
                                  </div>
                                ) : (
                                  <span className="material-symbols-outlined text-[18px]">
                                    {slot.status === 'AVAILABLE' ? 'check_circle' :
                                     slot.status === 'BLOCKED' ? 'block' :
                                     slot.status === 'MAINTENANCE' ? 'build' :
                                     'directions_car'}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                  </div>
                );
              })
            )}

            {/* Motorbike Capacity Monitoring Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100">
                    <span className="material-symbols-outlined text-slate-600 text-xl">motorcycle</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Motorbike Capacity Monitoring</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time occupancy of motorbike parking zones</p>
                  </div>
                </div>
              </div>

              {activeMotorbikeZones.length === 0 ? (
                motorSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1">
                      <h4 className="text-sm font-extrabold text-slate-700">General Motorbike Area</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">No individual motorbike zones configured, showing aggregated floor metrics.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                      <div className="bg-emerald-50/40 border border-emerald-500/10 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider mb-1">Available</span>
                        <span className="text-2xl font-black text-[#006d43]">{effectiveMotorAvailable}</span>
                      </div>
                      
                      <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-1">Occupied</span>
                        <span className="text-2xl font-black text-[#263143]">{effectiveMotorOccupied}</span>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-1">Total Capacity</span>
                        <span className="text-2xl font-black text-slate-600">{(motorSummary.totalSlots || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No motorbike capacity data available.
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-extrabold">Zone Name</th>
                        <th className="pb-3 font-extrabold text-center">Available</th>
                        <th className="pb-3 font-extrabold text-center">Occupied</th>
                        <th className="pb-3 font-extrabold text-center">Total Capacity</th>
                        <th className="pb-3 font-extrabold text-right w-1/3">Occupancy Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeMotorbikeZones.map((zone) => {
                        const zoneSlots = slots.filter(s => s.zoneId === zone.id);
                        const capacity = zone.slotCapacity || zoneSlots.length || 0;
                        const occupiedSlotsCount = zoneSlots.filter(s => s.status === 'OCCUPIED').length;
                        const activeSessionsCount = activeSessions.filter(s => s.zoneId === zone.id).length;
                        const occupied = Math.max(occupiedSlotsCount, activeSessionsCount);
                        const available = Math.max(0, capacity - occupied);
                        const percentage = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                        
                        let progressColorClass = 'bg-[#00a86b]';
                        if (percentage >= 90) {
                          progressColorClass = 'bg-[#ba1a1a]';
                        } else if (percentage >= 75) {
                          progressColorClass = 'bg-[#d97706]';
                        }

                        return (
                          <tr key={zone.id} className="text-sm font-semibold text-slate-700">
                            <td className="py-3.5 font-extrabold text-slate-800 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">motorcycle</span>
                              {zone.name}
                            </td>
                            <td className="py-3.5 text-center font-black text-[#006d43]">{available}</td>
                            <td className="py-3.5 text-center font-black text-[#263143]">{occupied}</td>
                            <td className="py-3.5 text-center font-bold text-slate-500">{capacity}</td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-xs font-extrabold text-slate-600">{percentage}%</span>
                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${progressColorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB CONTENT 2: SESSION ALLOCATIONS LIST ===== */}
        {activeTab === 'list' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Table Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Search by Slot, Plate, or Subscriber..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <select
                  value={tableTypeFilter}
                  onChange={(e) => setTableTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Standard">Standard (Car)</option>
                  <option value="EV Charging">EV Charging (Car)</option>
                  <option value="Motorbike">Motorbike</option>
                </select>
              </div>

            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Slot / Space</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Plate</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Card ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Allocation Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check-In Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                          No active parking sessions found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map(session => {
                        const zone = zones.find(z => z.id === session.zoneId);
                        const slot = slots.find(s => s.id === session.slotId);
                        return (
                          <tr key={session.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4 font-extrabold text-slate-800">
                              {slot ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-[#006d43]">
                                    directions_car
                                  </span>
                                  {slot.slotCode}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold italic flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">motorcycle</span>
                                  Motorbike Area
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">{zone?.name || 'N/A'}</td>
                            <td className="px-6 py-4 font-mono text-sm font-bold text-[#006d43]">
                              <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-50/50 rounded-lg">
                                {session.licensePlateIn}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-600 font-mono">#{session.cardId}</td>
                            <td className="px-6 py-4">
                              {session.bookingId ? (
                                <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                  Booking (#{session.bookingId})
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                  Walk-in / Guest
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                              {new Date(session.checkInTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => setSelectedSessionDetails(session)}
                                className="text-[#006d43] font-bold text-xs hover:underline"
                              >
                                Details
                              </button>
                              {userRole === 'MANAGER' && (
                                <button
                                  onClick={() => handleForceCompleteSession(session.id)}
                                  disabled={completingSessionId === session.id}
                                  className="text-[#ba1a1a] font-bold text-xs hover:underline disabled:opacity-50"
                                >
                                  {completingSessionId === session.id ? 'Releasing...' : 'Force Release'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== ACTION MODAL WINDOW ===== */}
      <SlotActionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        slot={selectedSlot}
        selectedBuildingId={selectedBuildingId}
        userRole={userRole}
        onSlotUpdated={handleSlotUpdated}
        showToastMessage={showToastMessage}
      />

      {/* ===== TEXT-BASED SESSION DETAILS MODAL ===== */}
      {selectedSessionDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Active Session Details</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Session ID: #{selectedSessionDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] align-middle">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Monospaced License Plate representation */}
              <div className="flex flex-col items-center py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="border-[2px] border-slate-800 rounded-lg bg-white px-6 py-2.5 shadow-sm text-center min-w-[200px]">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-0.5 block mb-1">
                    NexPark Session
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-800 tracking-wide">
                    {selectedSessionDetails.licensePlateIn}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                  Text-Based Vehicle Record
                </span>
              </div>

              {/* Grid of Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone / Space</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {zones.find(z => z.id === selectedSessionDetails.zoneId)?.name || 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slot Number</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {slots.find(s => s.id === selectedSessionDetails.slotId)?.slotCode || 'Motorbike Area (No Slot)'}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFID Card Code</p>
                  <p className="font-extrabold font-mono text-emerald-600 mt-1">
                    #{selectedSessionDetails.cardId}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Classification</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {selectedSessionDetails.bookingId ? 'Booking Customer' : 'Visitor / Walk-in'}
                  </p>
                </div>

                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-In Timestamp</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {new Date(selectedSessionDetails.checkInTime).toLocaleString()}
                  </p>
                </div>

                {selectedSessionDetails.bookingId && (
                  <div className="col-span-2 bg-emerald-50/20 p-3 rounded-xl border border-emerald-500/10">
                    <p className="text-[10px] font-bold text-[#006d43] uppercase tracking-wider">Booking Reference</p>
                    <p className="font-extrabold text-[#006d43] mt-1">
                      Booking ID #{selectedSessionDetails.bookingId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors shadow-sm"
              >
                Close Details
              </button>
              {userRole === 'MANAGER' && (
                <button
                  onClick={() => handleForceCompleteSession(selectedSessionDetails.id)}
                  disabled={completingSessionId === selectedSessionDetails.id}
                  className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
                >
                  {completingSessionId === selectedSessionDetails.id ? 'Releasing...' : 'Force Release'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
