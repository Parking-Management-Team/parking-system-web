'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { api, apiClient } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { Floor, FloorResponse, Zone, ZoneResponse, Slot, ParkingSlotDto, ParkingSessionDto } from '../types';
import { SlotActionModal } from './SlotActionModal';

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

  // Show Toast Helper
  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Fetch Data from API ──────────────────────────────────────────
  
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
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
          switch (id) {
            case 1: return 'Standard';
            case 3: return 'EV Charging';
            case 4: return 'Motorbike';
            default: return 'Standard';
          }
        };
        const mapAccessTypeToZone = (accessType?: number): 'GENERAL' | 'MONTHLY' => {
          return accessType === 1 ? 'MONTHLY' : 'GENERAL';
        };
        loadedZones = resZones.data.map(item => ({
          id: item.id,
          floorId: item.floorId,
          name: item.name,
          vehicleType: mapVehicleTypeIdToType(item.vehicleTypeId),
          zoneAccessType: mapAccessTypeToZone(item.accessType),
          slotCapacity: item.capacity || 0,
          status: item.status === 3 || item.status === 'OutOfService' || item.status === 'Inactive' ? 'Inactive' : 'Active'
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

  // Fetch Slots and active sessions when selectedFloorId changes
  const fetchSlotsForFloor = useCallback(async () => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const floorZones = zones.filter(z => z.floorId === selectedFloorId && z.vehicleType !== 'Motorbike');
      
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
                  model: 'Registered Vehicle',
                  ownerName: session.monthlySubscriptionId ? `Subscriber (Sub ID: ${session.monthlySubscriptionId})` : 'Visitor / Short-term',
                  memberId: session.monthlySubscriptionId ? `SUB-${session.monthlySubscriptionId}` : 'WALK-IN',
                  startDate: session.checkInTime,
                  endDate: session.checkOutTime || undefined,
                  notes: session.bookingId ? `Booking #${session.bookingId}` : 'Check-in via staff'
                };
              }

              const mapStatus = (statusVal: number): Slot['status'] => {
                switch (statusVal) {
                  case 0: return 'AVAILABLE';
                  case 1: return 'MAINTENANCE';
                  case 2: return 'OCCUPIED';
                  case 3: return 'BLOCKED';
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
                slotType: zone.vehicleType === 'EV Charging' ? 'EV Charging' as const : 'Standard' as const,
                status: mapStatus(item.status),
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
    fetchSlotsForFloor();
  }, [fetchSlotsForFloor]);

  // Active Sessions list filtering for the current floor
  const filteredSessions = useMemo(() => {
    return activeSessions.filter(session => {
      const zone = zones.find(z => z.id === session.zoneId);
      if (!zone || zone.floorId !== selectedFloorId) return false;

      const slot = slots.find(s => s.id === session.slotId);
      const slotCode = slot ? slot.slotCode : '';
      const plate = session.licensePlateIn || '';
      const subText = session.monthlySubscriptionId ? `SUB-${session.monthlySubscriptionId}` : 'WALK-IN';
      
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
      default:
        return 'bg-slate-300 border-slate-300 text-slate-700';
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative bg-slate-50/50">

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' ? 'bg-red-605 shadow-red-600/20' : 'bg-[#006d43] shadow-[#006d43]/20'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="text-sm font-semibold">{toast.message}</span>
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
        <div className="mb-8 border-b border-slate-200 flex justify-between items-center">
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

          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pb-3">
              <div className="w-4 h-4 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
              Syncing status...
            </div>
          )}
        </div>

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
                          <span className="material-symbols-outlined text-[#006d43] text-[20px]">directions_car</span>
                          {zone.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                            Type: {zone.vehicleType}
                          </span>
                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            zone.zoneAccessType === 'MONTHLY' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {zone.zoneAccessType === 'MONTHLY' ? 'Monthly' : 'General'}
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
                            className={`h-24 border rounded-xl flex flex-col items-center justify-between py-4 px-3.5 shadow-sm transition-all hover:scale-[1.03] active:scale-95 group font-bold text-sm ${getSlotColorClass(
                              slot.status
                            )}`}
                          >
                            <span className="truncate w-full text-center px-1">{slot.slotCode}</span>
                            <span className="material-symbols-outlined text-[18px]">
                              {slot.slotType === 'EV Charging' ? 'ev_station' : 'directions_car'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Motorbike Zones Section */}
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600">two_wheeler</span>
                Motorbike Capacity Monitoring
              </h3>

              {activeMotorbikeZones.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-400 font-medium">No Motorbike Zones configured on this Floor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activeMotorbikeZones.map((zone) => {
                    const zoneSessions = activeSessions.filter(s => s.zoneId === zone.id);
                    const occupied = zoneSessions.length;
                    const percentage = zone.slotCapacity > 0 ? Math.min(100, Math.round((occupied / zone.slotCapacity) * 100)) : 0;
                    
                    let statusLabel = 'Normal';
                    let statusColorText = 'text-[#00a86b] bg-[#00a86b]/10';
                    let progressColorClass = 'bg-[#00a86b]';

                    if (percentage >= 90) {
                      statusLabel = 'Critical / Full';
                      statusColorText = 'text-[#ba1a1a] bg-[#ba1a1a]/10';
                      progressColorClass = 'bg-[#ba1a1a]';
                    } else if (percentage >= 75) {
                      statusLabel = 'High Occupancy';
                      statusColorText = 'text-[#d97706] bg-[#d97706]/10';
                      progressColorClass = 'bg-[#d97706]';
                    }

                    return (
                      <div key={zone.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motorbike Section</p>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${statusColorText}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <h4 className="text-base font-extrabold text-slate-800 mt-0.5">{zone.name}</h4>
                          </div>
                          <span className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-500 text-lg">two_wheeler</span>
                          </span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-50">
                          <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>Capacity Utilization</span>
                            <span className="font-extrabold text-slate-700">{occupied} / {zone.slotCapacity} vehicles ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                                className={`${progressColorClass} h-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>
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
                                    {slot.slotType === 'EV Charging' ? 'ev_station' : 'directions_car'}
                                  </span>
                                  {slot.slotCode}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold italic flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">two_wheeler</span>
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
                              {session.monthlySubscriptionId ? (
                                <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                  Member (Sub #{session.monthlySubscriptionId})
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
                              <button
                                onClick={() => handleForceCompleteSession(session.id)}
                                disabled={completingSessionId === session.id}
                                className="text-red-650 font-bold text-xs hover:underline disabled:opacity-50"
                              >
                                {completingSessionId === session.id ? 'Releasing...' : 'Force Release'}
                              </button>
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
                    {selectedSessionDetails.monthlySubscriptionId ? 'Monthly Subscriber' : 'Visitor / Walk-in'}
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
              <button
                onClick={() => handleForceCompleteSession(selectedSessionDetails.id)}
                disabled={completingSessionId === selectedSessionDetails.id}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 hover:brightness-110 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
              >
                {completingSessionId === selectedSessionDetails.id ? 'Releasing...' : 'Force Release'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
