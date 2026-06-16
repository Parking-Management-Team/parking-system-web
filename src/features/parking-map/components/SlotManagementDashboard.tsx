'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import Image from 'next/image';
import { api, apiClient } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';

// ─── Interfaces ────────────────────────────────────────────────────

interface ParkingSlotDto {
  id: number;
  zoneId: number;
  vehicleTypeId: number;
  code: string;
  name?: string;
  status: number;
}

interface ParkingSessionDto {
  id: number;
  vehicleId: number;
  buildingId: number;
  cardId: number;
  zoneId?: number;
  slotId?: number;
  bookingId?: number;
  monthlySubscriptionId?: number;
  inStaffId?: number;
  outStaffId?: number;
  checkInTime: string;
  checkOutTime?: string;
  licensePlateIn: string;
  licensePlateOut?: string;
  sessionStatus: string;
}

interface CardDto {
  id: number;
  cardCode: string;
  rfidCode?: string;
  cardType: string;
  cardStatus: string;
  createdAt: string;
}

interface VehicleDto {
  id: number;
  accountId?: number;
  vehicleTypeId: number;
  vehicleTypeName?: string;
  licensePlate: string;
  registeredDay?: string;
  vehicleStatus: string;
}

interface FloorResponse {
  id: number;
  buildingId: number;
  floorNumber: number;
  name?: string;
  status: number | string;
}

interface ZoneResponse {
  id: number;
  floorId: number;
  name: string;
  vehicleTypeId: number;
  capacity?: number;
  status: number | string;
}

interface Floor {
  id: number;
  buildingId: number;
  floorNumber: number;
  name: string;
  status: 'Active' | 'Inactive';
}

interface Zone {
  id: number;
  floorId: number;
  name: string;
  vehicleType: 'Standard' | 'EV Charging' | 'Motorbike';
  slotCapacity: number;
  status: 'Active' | 'Inactive';
}

interface Slot {
  id: number;
  slotCode: string;
  slotName?: string;
  zoneId: number;
  zoneName: string;
  floorId: number;
  buildingId: number;
  slotType: 'Standard' | 'EV Charging';
  status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE';
  assignedVehicle?: {
    plate: string;
    model: string;
    ownerName: string;
    memberId: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
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
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Drawer / Side Panel States
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Form Allocation States
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [searchedVehicle, setSearchedVehicle] = useState<{
    id?: number;
    plate: string;
    model: string;
    ownerName: string;
    memberId: string;
    vehicleTypeId?: number;
  } | null>(null);
  
  const [allocationType, setAllocationType] = useState<'monthly' | 'short'>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [allocationNotes, setAllocationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        loadedZones = resZones.data.map(item => ({
          id: item.id,
          floorId: item.floorId,
          name: item.name,
          vehicleType: mapVehicleTypeIdToType(item.vehicleTypeId),
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
      showToastMessage('Could not load infrastructure from server. Using mock structures.', 'error');
      
      // Fallback local structures if server API is down
      const mockBlds: Building[] = [
        { id: 1, code: 'BLD01', name: 'Grand Plaza Tower', address: '123 Tran Hung Dao', totalFloor: 4, status: 0 },
        { id: 2, code: 'BLD02', name: 'West Side Mall', address: '456 Le Loi', totalFloor: 2, status: 0 }
      ];
      setBuildings(mockBlds);
      setSelectedBuildingId(1);

      const mockFloors: Floor[] = [
        { id: 10, buildingId: 1, floorNumber: -1, name: 'Basement 1', status: 'Active' },
        { id: 11, buildingId: 1, floorNumber: -2, name: 'Basement 2', status: 'Active' },
        { id: 12, buildingId: 1, floorNumber: 1, name: 'Ground Floor', status: 'Active' },
        { id: 20, buildingId: 2, floorNumber: 1, name: 'Ground Floor', status: 'Active' }
      ];
      setFloors(mockFloors);
      setSelectedFloorId(10);

      const mockZones: Zone[] = [
        { id: 101, floorId: 10, name: 'Section A - Standard', vehicleType: 'Standard', slotCapacity: 24, status: 'Active' },
        { id: 103, floorId: 10, name: 'Section C - EV Charge', vehicleType: 'EV Charging', slotCapacity: 8, status: 'Active' },
        { id: 104, floorId: 10, name: 'Motorbike Zone A', vehicleType: 'Motorbike', slotCapacity: 50, status: 'Active' },
        { id: 105, floorId: 10, name: 'Motorbike Zone B', vehicleType: 'Motorbike', slotCapacity: 30, status: 'Active' },
        
        { id: 111, floorId: 11, name: 'Section D - Standard', vehicleType: 'Standard', slotCapacity: 24, status: 'Active' }
      ];
      setZones(mockZones);
    } finally {
      setLoading(false);
    }
  }, [showToastMessage]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch Slots when selectedFloorId changes
  useEffect(() => {
    if (!selectedFloorId) return;

    const fetchSlotsForFloor = async () => {
      setLoading(true);
      try {
        const floorZones = zones.filter(z => z.floorId === selectedFloorId && z.vehicleType !== 'Motorbike');
        
        // Fetch active parking sessions to match license plates and details
        const sessionRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active').catch(() => null);
        const activeSessions = sessionRes?.success ? sessionRes.data : [];

        // Fetch slots for each zone on the floor in parallel
        const zoneSlotsPromises = floorZones.map(async (zone) => {
          try {
            const res = await api.get<BaseResponse<ParkingSlotDto[]>>(`/ParkingSlots/zone/${zone.id}`);
            if (res.success && res.data) {
              return res.data.map(item => {
                // Find active session for this slot
                const session = activeSessions?.find(s => s.slotId === item.id);
                
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

                // Map numeric status: Available (0), Reserved (1), Occupied (2), Blocked (3)
                let mappedStatus: Slot['status'] = 'AVAILABLE';
                if (item.status === 2 || session) {
                  mappedStatus = 'OCCUPIED';
                } else if (item.status === 3) {
                  mappedStatus = 'BLOCKED';
                } else if (item.status === 1) {
                  mappedStatus = 'MAINTENANCE';
                }

                return {
                  id: item.id,
                  slotCode: item.code,
                  slotName: item.name || `Slot ${item.code}`,
                  zoneId: item.zoneId,
                  zoneName: zone.name,
                  floorId: selectedFloorId,
                  buildingId: selectedBuildingId || 0,
                  slotType: zone.vehicleType as Slot['slotType'],
                  status: mappedStatus,
                  assignedVehicle
                } as Slot;
              });
            }
          } catch (err) {
            console.warn(`Could not fetch slots for zone ${zone.id}, using fallback`, err);
          }
          return null;
        });

        const results = await Promise.all(zoneSlotsPromises);
        const loadedSlots = results.filter((r): r is Slot[] => r !== null).flat();

        if (loadedSlots.length > 0) {
          setSlots(loadedSlots);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Failed to fetch from real API, falling back to mock slots.', err);
      }

      // Fallback / Default Mock Slots generation based on the zones on this floor
      const floorZones = zones.filter(z => z.floorId === selectedFloorId && z.vehicleType !== 'Motorbike');
      const generatedSlots: Slot[] = [];

      floorZones.forEach(z => {
        const capacity = z.slotCapacity;
        for (let i = 1; i <= capacity; i++) {
          const numStr = i < 10 ? `0${i}` : `${i}`;
          let sectionLetter = 'A';
          const sectionMatch = z.name.match(/Section\s+([A-Z])/i);
          if (sectionMatch && sectionMatch[1]) {
            sectionLetter = sectionMatch[1];
          } else {
            sectionLetter = z.name.charAt(0);
          }
          const code = `${sectionLetter}-${numStr}`; // e.g. A-01, C-02
          
          // Determine status randomly or mock fixed data
          let status: Slot['status'] = 'AVAILABLE';
          let assignedVehicle = undefined;
          
          if (i === 2) {
            status = 'OCCUPIED';
            assignedVehicle = {
              plate: '29A-123.45',
              model: 'Toyota Camry • Premium Black',
              ownerName: 'Nguyen Van A',
              memberId: 'MEM-2026-001',
              startDate: '2026-01-01T08:00',
              endDate: '2026-12-31T23:59',
              notes: 'Regular customer'
            };
          } else if (i === 4) {
            status = 'BLOCKED';
          } else if (i === 5) {
            status = 'MAINTENANCE';
          }

          generatedSlots.push({
            id: z.id * 100 + i,
            slotCode: code,
            slotName: `Slot ${code}`,
            zoneId: z.id,
            zoneName: z.name,
            floorId: selectedFloorId,
            buildingId: selectedBuildingId || 0,
            slotType: z.vehicleType as Slot['slotType'],
            status,
            assignedVehicle
          });
        }
      });

      setSlots(generatedSlots);
      setLoading(false);
    };

    fetchSlotsForFloor();
  }, [selectedFloorId, selectedBuildingId, zones]);

  // ─── Filter Calculations ──────────────────────────────────────────

  const activeFloors = useMemo(() => {
    if (!selectedBuildingId) return [];
    return floors.filter(f => f.buildingId === selectedBuildingId);
  }, [selectedBuildingId, floors]);

  const activeZones = useMemo(() => {
    if (!selectedFloorId) return [];
    return zones.filter(z => z.floorId === selectedFloorId);
  }, [selectedFloorId, zones]);

  const activeCarZones = useMemo(() => {
    return activeZones.filter(z => z.vehicleType !== 'Motorbike');
  }, [activeZones]);

  const activeMotorbikeZones = useMemo(() => {
    return activeZones.filter(z => z.vehicleType === 'Motorbike');
  }, [activeZones]);

  // ─── Handlers ─────────────────────────────────────────────────────

  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bldId = parseInt(e.target.value);
    setSelectedBuildingId(bldId);
    
    // Auto-select first floor of this building
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

  // Open Drawer panel when clicking a car slot
  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsDrawerOpen(true);

    // Populate form if occupied or available
    if (slot.status === 'AVAILABLE') {
      setSearchedVehicle(null);
      setVehicleSearchQuery('');
      setAllocationNotes('');
    } else if (slot.status === 'OCCUPIED' && slot.assignedVehicle) {
      setSearchedVehicle({
        plate: slot.assignedVehicle.plate,
        model: slot.assignedVehicle.model,
        ownerName: slot.assignedVehicle.ownerName,
        memberId: slot.assignedVehicle.memberId
      });
      setAllocationNotes(slot.assignedVehicle.notes || '');
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedSlot(null);
  };

  // Search vehicle helper in Drawer
  const handleVehicleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleSearchQuery.trim()) return;

    try {
      const query = vehicleSearchQuery.toUpperCase().replace(/[\s\.-]/g, '');
      const res = await api.get<BaseResponse<VehicleDto[]>>('/vehicles');
      
      let foundVehicle: VehicleDto | undefined;
      if (res.success && res.data) {
        foundVehicle = res.data.find(
          v => v.licensePlate.toUpperCase().replace(/[\s\.-]/g, '') === query
        );
      }

      if (foundVehicle) {
        setSearchedVehicle({
          id: foundVehicle.id,
          plate: foundVehicle.licensePlate,
          model: foundVehicle.vehicleTypeName || 'Registered Vehicle',
          ownerName: foundVehicle.accountId ? `Member #${foundVehicle.accountId}` : 'Registered Guest',
          memberId: foundVehicle.accountId ? `MEM-${foundVehicle.accountId}` : 'WALK-IN',
          vehicleTypeId: foundVehicle.vehicleTypeId
        });
        showToastMessage('Vehicle found successfully!');
      } else {
        // Create vehicle on-the-fly if not found
        const typeId = selectedSlot?.slotType === 'EV Charging' ? 3 : 1;
        const newVehicleRes = await api.post<BaseResponse<VehicleDto>>('/vehicles', {
          vehicleTypeId: typeId,
          licensePlate: vehicleSearchQuery.toUpperCase(),
          vehicleStatus: 'ACTIVE'
        });

        if (newVehicleRes.success && newVehicleRes.data) {
          const created = newVehicleRes.data;
          setSearchedVehicle({
            id: created.id,
            plate: created.licensePlate,
            model: created.vehicleTypeName || 'Pre-Registered Vehicle',
            ownerName: 'Walk-in Customer',
            memberId: 'WALK-IN',
            vehicleTypeId: created.vehicleTypeId
          });
          showToastMessage('Vehicle not in database. Auto-registered walk-in vehicle.', 'success');
        } else {
          showToastMessage('Vehicle not found and could not register.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToastMessage('Error during vehicle lookup.', 'error');
    }
  };

  // Confirm Allocation Action
  const handleConfirmAllocation = async () => {
    if (!selectedSlot || !searchedVehicle || !searchedVehicle.id) {
      showToastMessage('Please search and select a vehicle first.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get or create an available parking card
      let cardId = 1;
      try {
        const cardsRes = await api.get<BaseResponse<CardDto[]>>('/cards');
        if (cardsRes.success && cardsRes.data) {
          const availableCard = cardsRes.data.find(c => c.cardStatus === 'Available');
          if (availableCard) {
            cardId = availableCard.id;
          } else {
            // Create a new card on-the-fly
            const newCode = `CARD-${Date.now().toString().slice(-4)}`;
            const createCardRes = await api.post<BaseResponse<CardDto>>('/cards', {
              cardCode: newCode,
              cardType: 'PARKING_CARD',
              cardStatus: 'Available'
            });
            if (createCardRes.success && createCardRes.data) {
              cardId = createCardRes.data.id;
            }
          }
        }
      } catch (cardErr) {
        console.warn('Could not query cards from API, using default cardId = 1', cardErr);
      }

      // 2. Start a parking session on the backend
      await api.post<BaseResponse<ParkingSessionDto>>('/parking-sessions', {
        vehicleId: searchedVehicle.id,
        buildingId: selectedBuildingId,
        cardId: cardId,
        zoneId: selectedSlot.zoneId,
        slotId: selectedSlot.id,
        licensePlateIn: searchedVehicle.plate,
        checkInTime: new Date().toISOString()
      });

      // 3. Update the slot status to Occupied (2)
      await api.put(`/ParkingSlots/${selectedSlot.id}`, {
        code: selectedSlot.slotCode,
        name: selectedSlot.slotName || `Slot ${selectedSlot.slotCode}`,
        vehicleTypeId: selectedSlot.slotType === 'EV Charging' ? 3 : 1,
        status: 2 // Occupied
      });

      // Update Local State
      const updatedSlots = slots.map(s => {
        if (s.id === selectedSlot.id) {
          return {
            ...s,
            status: 'OCCUPIED' as const,
            assignedVehicle: {
              plate: searchedVehicle.plate,
              model: searchedVehicle.model,
              ownerName: searchedVehicle.ownerName,
              memberId: searchedVehicle.memberId,
              startDate,
              endDate,
              notes: allocationNotes
            }
          };
        }
        return s;
      });
      setSlots(updatedSlots);
      showToastMessage(`Successfully allocated slot ${selectedSlot.slotCode}!`);
      handleCloseDrawer();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not save allocation to backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Release Slot / Mark Available Action
  const handleReleaseSlot = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      // 1. Fetch active session for this slot and complete it
      try {
        const activeRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active');
        if (activeRes.success && activeRes.data) {
          const session = activeRes.data.find(s => s.slotId === selectedSlot.id);
          if (session) {
            await apiClient(`/parking-sessions/${session.id}/complete`, { method: 'PATCH' });
          }
        }
      } catch (sessErr) {
        console.warn('Could not complete parking session in backend', sessErr);
      }

      // 2. Update slot status to Available (0)
      await api.put(`/ParkingSlots/${selectedSlot.id}`, {
        code: selectedSlot.slotCode,
        name: selectedSlot.slotName || `Slot ${selectedSlot.slotCode}`,
        vehicleTypeId: selectedSlot.slotType === 'EV Charging' ? 3 : 1,
        status: 0 // Available
      });

      const updatedSlots = slots.map(s => {
        if (s.id === selectedSlot.id) {
          return {
            ...s,
            status: 'AVAILABLE' as const,
            assignedVehicle: undefined
          };
        }
        return s;
      });
      setSlots(updatedSlots);
      showToastMessage(`Slot ${selectedSlot.slotCode} is now Available.`);
      handleCloseDrawer();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not release slot on backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle maintenance or block status
  const handleSetStatus = async (newStatus: 'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE') => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      let statusVal = 0; // Available
      if (newStatus === 'BLOCKED') statusVal = 3;
      else if (newStatus === 'MAINTENANCE') statusVal = 1;

      await api.put(`/ParkingSlots/${selectedSlot.id}`, {
        code: selectedSlot.slotCode,
        name: selectedSlot.slotName || `Slot ${selectedSlot.slotCode}`,
        vehicleTypeId: selectedSlot.slotType === 'EV Charging' ? 3 : 1,
        status: statusVal
      });

      const updatedSlots = slots.map(s => {
        if (s.id === selectedSlot.id) {
          return {
            ...s,
            status: newStatus,
            assignedVehicle: newStatus === 'AVAILABLE' ? undefined : s.assignedVehicle
          };
        }
        return s;
      });
      setSlots(updatedSlots);
      showToastMessage(`Slot ${selectedSlot.slotCode} status updated to ${newStatus}.`);
      handleCloseDrawer();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not update status on backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Allocations list filtering
  const filteredActiveAllocations = useMemo(() => {
    return slots.filter(s => {
      // Must be occupied or have assigned vehicle details
      if (!s.assignedVehicle) return false;
      
      const searchMatch = 
        s.slotCode.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        s.assignedVehicle.plate.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        s.assignedVehicle.ownerName.toLowerCase().includes(tableSearchQuery.toLowerCase());
        
      if (tableTypeFilter === 'All') return searchMatch;
      return searchMatch;
    });
  }, [slots, tableSearchQuery, tableTypeFilter]);

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
              <h1 className="text-2xl font-bold text-slate-850 tracking-tight">Slot Management</h1>
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
              Active Allocations ({slots.filter(s => s.status === 'OCCUPIED').length})
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
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                          Type: {zone.vehicleType}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        {availableCount} / {zoneSlots.length} Available
                      </span>
                    </div>

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
                  </div>
                );
              })
            )}

            {/* Motorbike Zones Section */}
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600">two_wheeler</span>
                Motorbike Capacity Monitoring
              </h3>

              {activeMotorbikeZones.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-400 font-medium">No Motorbike Zones configured on this Floor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activeMotorbikeZones.map((zone, idx) => {
                    // Dynamic occupancy percentage based on zone index to show different states
                    let percentage = 60; // green default (<75%)
                    let statusLabel = 'Normal';
                    let statusColorText = 'text-[#00a86b] bg-[#00a86b]/10';

                    if (idx % 3 === 0) {
                      percentage = 92; // red (>=90%)
                      statusLabel = 'Critical / Full';
                      statusColorText = 'text-[#ba1a1a] bg-[#ba1a1a]/10';
                    } else if (idx % 2 === 0) {
                      percentage = 80; // amber (75%-90%)
                      statusLabel = 'High Occupancy';
                      statusColorText = 'text-[#d97706] bg-[#d97706]/10';
                    }

                    const occupied = Math.round((zone.slotCapacity * percentage) / 100);
                    
                    let progressColorClass = 'bg-[#00a86b]'; // Green
                    if (percentage >= 90) {
                      progressColorClass = 'bg-[#ba1a1a]'; // Red
                    } else if (percentage >= 75) {
                      progressColorClass = 'bg-[#d97706]'; // Amber
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

        {/* ===== TAB CONTENT 2: ACTIVE ALLOCATIONS LIST ===== */}
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
                    placeholder="Search by Slot, Plate, or Owner..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <select
                  value={tableTypeFilter}
                  onChange={(e) => setTableTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Standard">Standard</option>
                  <option value="EV Charging">EV Charging</option>
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
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Slot Code</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Plate</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Owner Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Member ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActiveAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                          No active allocations found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredActiveAllocations.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4 font-extrabold text-slate-800">{s.slotCode}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">{s.zoneName}</td>
                          <td className="px-6 py-4 font-mono text-sm font-bold text-[#006d43]">{s.assignedVehicle?.plate}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">{s.assignedVehicle?.ownerName}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{s.assignedVehicle?.memberId}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2.5 py-1 bg-slate-800 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
                              OCCUPIED
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSlotClick(s)}
                              className="text-red-650 font-bold text-xs hover:underline"
                            >
                              Release
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== CENTER POPUP MODAL (SLOT ACTION DETAILS) ===== */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${
          isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Backdrop Overlay */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={handleCloseDrawer}
        ></div>

        {/* Modal content */}
        <div
          className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${
            isDrawerOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          } max-h-[90vh]`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                Slot {selectedSlot?.slotCode}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {selectedSlot?.zoneName} • {selectedSlot?.slotType}
              </p>
            </div>
            <button
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"
              onClick={handleCloseDrawer}
            >
              <span className="material-symbols-outlined text-[20px] align-middle">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-grow overflow-y-auto space-y-6">
            
            {/* Drawer Mode: AVAILABLE -> New Allocation Form */}
            {selectedSlot?.status === 'AVAILABLE' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 mt-0.5">add_circle</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#006d43]">New Allocation</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Fill in vehicle details to assign this bay.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Search vehicle input */}
                  <form onSubmit={handleVehicleSearch} className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Search Vehicle License Plate
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                          directions_car
                        </span>
                        <input
                          type="text"
                          value={vehicleSearchQuery}
                          onChange={(e) => setVehicleSearchQuery(e.target.value)}
                          placeholder="e.g. 29A-123.45"
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                      >
                        Search
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Tip: Type plate containing &quot;29A&quot; to fetch test vehicle.</p>
                  </form>

                  {/* Selected Vehicle Card */}
                  {searchedVehicle ? (
                    <div className="bg-emerald-50/10 border border-emerald-500/20 rounded-xl p-4 space-y-2.5 relative">
                      <button
                        onClick={() => setSearchedVehicle(null)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-650"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Target Vehicle</p>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">{searchedVehicle.plate}</h4>
                        <p className="text-xs text-slate-500">{searchedVehicle.model}</p>
                      </div>
                      <div className="flex gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span>Owner: <strong>{searchedVehicle.ownerName}</strong></span>
                        <span>ID: <strong>{searchedVehicle.memberId}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <span className="material-symbols-outlined text-slate-350 text-3xl mb-1.5">directions_car_filled</span>
                      <p className="text-xs text-slate-400 font-medium">Please search a vehicle to assign this slot.</p>
                    </div>
                  )}

                  {/* Allocation parameters */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocation Type</label>
                      <select
                        value={allocationType}
                        onChange={(e) => setAllocationType(e.target.value as 'monthly' | 'short')}
                        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none"
                      >
                        <option value="monthly">Monthly Pass</option>
                        <option value="short">Short stay</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority</label>
                      <select className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none">
                        <option>Normal</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date Range</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none text-slate-600"
                      />
                      <span className="text-slate-400 text-xs font-bold">to</span>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Operational Notes</label>
                    <textarea
                      value={allocationNotes}
                      onChange={(e) => setAllocationNotes(e.target.value)}
                      placeholder="Add any specific requirements or remarks..."
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none resize-none text-slate-700"
                    />
                  </div>
                  
                  {/* Administrative Actions */}
                  {userRole === 'MANAGER' && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Administrative Controls
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSetStatus('MAINTENANCE')}
                          disabled={isSubmitting}
                          className="flex-1 py-2.5 px-3 text-white bg-[#d97706] hover:bg-amber-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">build</span>
                          Set Maintenance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus('BLOCKED')}
                          disabled={isSubmitting}
                          className="flex-1 py-2.5 px-3 text-white bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          Block Slot
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Drawer Mode: OCCUPIED -> Details and Actions */}
            {selectedSlot?.status === 'OCCUPIED' && selectedSlot.assignedVehicle && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="relative h-48 rounded-xl overflow-hidden shadow-sm">
                  <Image
                    src="https://images.unsplash.com/photo-1506521788701-1e13a4e33c10?q=80&w=600&auto=format&fit=crop"
                    alt="Occupying Vehicle Details"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <span className="text-white font-mono font-extrabold text-xl tracking-wide">
                      {selectedSlot.assignedVehicle.plate}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Owner Name</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{selectedSlot.assignedVehicle.ownerName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Member ID</p>
                    <p className="font-mono text-slate-800 text-xs mt-0.5">{selectedSlot.assignedVehicle.memberId}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Model</p>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">{selectedSlot.assignedVehicle.model}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Checked In At</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">08:45 AM Today</p>
                  </div>
                </div>

                <div className="border border-slate-100 p-4 rounded-xl space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Allocation Validity Period</h4>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Start:</span>
                    <span className="text-slate-800">
                      {selectedSlot.assignedVehicle.startDate ? new Date(selectedSlot.assignedVehicle.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>End:</span>
                    <span className="text-slate-800">
                      {selectedSlot.assignedVehicle.endDate ? new Date(selectedSlot.assignedVehicle.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedSlot.assignedVehicle.notes && (
                  <div className="bg-amber-50/30 border border-amber-200/20 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Staff Note</p>
                    <p className="text-xs text-slate-600 mt-1 italic">{selectedSlot.assignedVehicle.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Mode: BLOCKED or MAINTENANCE -> Action Panel */}
            {(selectedSlot?.status === 'BLOCKED' || selectedSlot?.status === 'MAINTENANCE') && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-red-50/30 p-5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                  <span className={`material-symbols-outlined text-2xl mt-0.5 ${selectedSlot.status === 'BLOCKED' ? 'text-red-650' : 'text-amber-500'}`}>
                    {selectedSlot.status === 'BLOCKED' ? 'block' : 'lock_clock'}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                      Slot currently {selectedSlot.status}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      This parking bay has been marked out of service for operations/maintenance. It cannot be assigned or utilized by check-in sessions.
                    </p>
                  </div>
                </div>
                
                {/* Administrative Actions */}
                {userRole === 'MANAGER' && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Switch Status
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSetStatus(selectedSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED')}
                      disabled={isSubmitting}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white hover:brightness-110 shadow-md disabled:opacity-50 ${
                        selectedSlot.status === 'BLOCKED'
                          ? 'bg-[#d97706] hover:bg-amber-700 shadow-amber-500/10'
                          : 'bg-[#ba1a1a] hover:bg-red-700 shadow-red-500/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {selectedSlot.status === 'BLOCKED' ? 'build' : 'block'}
                      </span>
                      Change to {selectedSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/70 flex gap-3">
            {selectedSlot?.status === 'AVAILABLE' && (
              <>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-500 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllocation}
                  disabled={isSubmitting || !searchedVehicle}
                  className="flex-1 py-3 bg-[#006d43] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </>
            )}

            {selectedSlot?.status === 'OCCUPIED' && (
              <>
                <button
                  onClick={() => handleSetStatus('MAINTENANCE')}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-slate-200 hover:bg-white text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  Maintain
                </button>
                <button
                  onClick={handleReleaseSlot}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Release Slot
                    </>
                  )}
                </button>
              </>
            )}

            {(selectedSlot?.status === 'BLOCKED' || selectedSlot?.status === 'MAINTENANCE') && (
              <>
                <button
                  onClick={() => handleCloseDrawer()}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-500 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSetStatus('AVAILABLE')}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-[#006d43] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Set Available
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
