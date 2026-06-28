'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';
import {
  Car,
  Building,
  Layers,
  Clock,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  QrCode,
  X
} from 'lucide-react';

interface VehicleItem {
  id: number;
  licensePlate: string;
  vehicleTypeId?: number;
  vehicleTypeName?: string;
  vehicleStatus?: string;
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
  floorNumber: number;
  name?: string;
  vehicleTypeIds?: number[];
  status: number | string;
}

interface SlotItem {
  id: number;
  code: string;
  name?: string;
  status: any;
  vehicleTypeId?: number;
}

export default function DriverBooking() {
  const { user, showToast } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mounting state for Portal
  const [mounted, setMounted] = useState(false);

  // Selected states
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedSlotCode, setSelectedSlotCode] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // Set initial date/time values using Asia/Ho_Chi_Minh locale to avoid SSR hydration mismatch
    const now = new Date();

    // Derive Vietnam local date string (YYYY-MM-DD) via Intl — works regardless of OS timezone
    const vnDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const vnDate = `${vnDateParts.find(p => p.type === 'year')?.value}-${vnDateParts.find(p => p.type === 'month')?.value}-${vnDateParts.find(p => p.type === 'day')?.value}`;

    // Start time = now + 30 min (buffer so user has time to fill the form)
    const startMs = now.getTime() + 30 * 60 * 1000;
    const startDate = new Date(startMs);
    const vnStartParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(startDate);
    const startH = vnStartParts.find(p => p.type === 'hour')?.value ?? '00';
    const startM = vnStartParts.find(p => p.type === 'minute')?.value ?? '00';

    // End time = start + 4 hours
    const endDate = new Date(startMs + 4 * 60 * 60 * 1000);
    const vnEndParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(endDate);
    const endH = vnEndParts.find(p => p.type === 'hour')?.value ?? '00';
    const endM = vnEndParts.find(p => p.type === 'minute')?.value ?? '00';

    // If end time crosses midnight, advance the date by 1 day
    const endDateStr = endDate > startDate && endH < startH
      ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(endDate)
      : vnDate;

    setBookingDate(vnDate);
    setStartTime(`${startH}:${startM}`);
    setEndTime(`${endH}:${endM}`);
    void endDateStr; // used implicitly — bookingDate stays the start date
  }, []);

  // API Data States
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [allFloors, setAllFloors] = useState<FloorItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [slotsList, setSlotsList] = useState<SlotItem[]>([]);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<number>(20000);

  // Default vehicle stored locally
  const [defaultVehicleId, setDefaultVehicleId] = useState<number | null>(null);

  // Identify active vehicle and its type ID
  const activeVehicle = vehicles.find(v => v.licensePlate === selectedVehicle);

  // Fall back to vehicleTypeId query param while vehicles are loading
  const vehicleTypeParam = searchParams.get('vehicleTypeId');
  const targetVehicleTypeId = vehicleTypeParam ? Number(vehicleTypeParam) : null;
  const selectedVehicleTypeId = activeVehicle?.vehicleTypeId || targetVehicleTypeId || 2; // Default to Car (2) if none selected

  // Booking cost estimation
  const calculateCost = () => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let durationHours = (endH + endM / 60) - (startH + startM / 60);

    // Support overnight duration
    if (durationHours < 0) {
      durationHours += 24;
    }

    if (durationHours <= 0) return 0;
    const rate = selectedVehicleTypeId === 1 ? 5000 : 20000;
    const cost = durationHours * rate;
    const cap = selectedVehicleTypeId === 1 ? 20000 : 150000;
    return Math.min(cost, cap);
  };

  const getEstimatedDeposit = () => {
    return selectedVehicleTypeId === 1 ? 5000 : 20000;
  };

  useEffect(() => {
    setDepositAmount(getEstimatedDeposit());
  }, [selectedVehicleTypeId, bookingDate, startTime, endTime]);

  // Load Vehicles & Buildings
  useEffect(() => {
    if (!user?.id) return;

    // Load default vehicle ID from localStorage
    const storedDefaultId = localStorage.getItem(`default_vehicle_${user.id}`);
    if (storedDefaultId) setDefaultVehicleId(Number(storedDefaultId));

    api.get<any>(`/vehicles?accountId=${user.id}`)
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const allVehicles: VehicleItem[] = res.data;
          setVehicles(allVehicles);

          const storedId = storedDefaultId ? Number(storedDefaultId) : null;
          const vehicleTypeFromParam = vehicleTypeParam ? Number(vehicleTypeParam) : null;

          // Priority: (1) default vehicle matching vehicleTypeParam, (2) default vehicle, (3) first vehicle matching vehicleTypeParam, (4) first vehicle
          let preSelected: VehicleItem | undefined;

          if (storedId && vehicleTypeFromParam) {
            const defaultVeh = allVehicles.find(v => v.id === storedId);
            preSelected = defaultVeh?.vehicleTypeId === vehicleTypeFromParam
              ? defaultVeh
              : allVehicles.find(v => v.vehicleTypeId === vehicleTypeFromParam);
          } else if (storedId) {
            preSelected = allVehicles.find(v => v.id === storedId);
          } else if (vehicleTypeFromParam) {
            preSelected = allVehicles.find(v => v.vehicleTypeId === vehicleTypeFromParam);
          }

          setSelectedVehicle((preSelected ?? allVehicles[0]).licensePlate);
        } else {
          setVehicles([]);
          setSelectedVehicle('');
        }
      })
      .catch(() => {
        setVehicles([]);
        setSelectedVehicle('');
      });

    // Load Buildings
    api.get<any>('/Buildings')
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setBuildings(res.data);
          setSelectedBuilding(res.data[0].id.toString());
        } else {
          setBuildings([]);
          setSelectedBuilding('');
        }
      })
      .catch(() => {
        setBuildings([]);
        setSelectedBuilding('');
      });
  }, [user]);

  // Load Floors when Building changes
  useEffect(() => {
    if (!selectedBuilding) return;

    api.get<any>(`/Floors/building/${selectedBuilding}`)
      .then(async (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const fetchedFloors = res.data;

          // Fetch zones for each floor to identify supported vehicleTypeIds
          const floorsWithTypes = await Promise.all(
            fetchedFloors.map(async (floor: any) => {
              try {
                const zoneRes = await api.get<any>(`/Zones/floor/${floor.id}`);
                if (zoneRes.success && zoneRes.data) {
                  // Only count floors containing General zones for driver bookings
                  const generalZones = zoneRes.data.filter((z: any) =>
                    z.accessType === 'General' || z.accessType === 0 || z.accessType === '0'
                  );
                  const typeIds = generalZones.map((z: any) => z.vehicleTypeId);
                  return { ...floor, vehicleTypeIds: Array.from(new Set(typeIds)) as number[] };
                }
              } catch (err) {
                console.error(`Error loading zones for floor ${floor.id}`, err);
              }
              // Fallback based on floor number: Floor 1 is Motor (1), Floor 2+ is Car (2)
              return { ...floor, vehicleTypeIds: floor.floorNumber === 1 ? [1] : [2] };
            })
          );

          setAllFloors(floorsWithTypes);
        } else {
          setAllFloors([]);
        }
      })
      .catch(() => {
        setAllFloors([]);
      });
  }, [selectedBuilding]);

  // Filter floors based on selected vehicle type
  useEffect(() => {
    if (allFloors.length === 0) {
      setFloors([]);
      return;
    }

    const filtered = allFloors.filter(floor =>
      (floor.status === 1 || floor.status === 'Active') &&
      (!floor.vehicleTypeIds || floor.vehicleTypeIds.includes(selectedVehicleTypeId))
    );

    setFloors(filtered);

    // Auto-select first matching floor if current selectedFloor is not valid
    if (filtered.length > 0) {
      const isCurrentValid = filtered.some(f => f.id.toString() === selectedFloor);
      if (!isCurrentValid) {
        setSelectedFloor(filtered[0].id.toString());
        setSelectedSlotCode('');
      }
    } else {
      setSelectedFloor('');
      setSelectedSlotCode('');
    }
  }, [allFloors, selectedVehicleTypeId, selectedFloor]);

  // Load Slots when Floor changes
  useEffect(() => {
    if (!selectedFloor) {
      setSlotsList([]);
      return;
    }

    api.get<any>(`/Zones/floor/${selectedFloor}`)
      .then(async (res) => {
        if (res.success && res.data && res.data.length > 0) {
          // Only show slots belonging to General zones
          const generalZones = res.data.filter((z: any) =>
            z.accessType === 'General' || z.accessType === 0 || z.accessType === '0'
          );

          if (generalZones.length === 0) {
            setSlotsList([]);
            return;
          }

          try {
            const allSlotsPromises = generalZones.map((zone: any) =>
              api.get<any>(`/ParkingSlots/zone/${zone.id}`)
                .then(r => r.success ? r.data : [])
                .catch(() => [])
            );
            const results = await Promise.all(allSlotsPromises);
            const mergedSlots = results.flat();

            if (mergedSlots.length > 0) {
              // Filter slots by matching vehicleTypeId
              const matchingSlots = mergedSlots.filter((slot: any) =>
                slot.vehicleTypeId === selectedVehicleTypeId
              );
              setSlotsList(matchingSlots);
            } else {
              setSlotsList([]);
            }
          } catch {
            setSlotsList([]);
          }
        } else {
          setSlotsList([]);
        }
      })
      .catch(() => {
        setSlotsList([]);
      });
  }, [selectedFloor, selectedVehicleTypeId]);

  // Resolve slot code from URL param → find its zone → floor → building, then auto-select all
  useEffect(() => {
    const slotParam = searchParams.get('slot');
    if (!slotParam) return;

    const resolveSlot = async () => {
      try {
        // Fetch all slots to find a match by code
        const allSlotsRes = await api.get<any>('/ParkingSlots');
        if (!allSlotsRes.success || !allSlotsRes.data) return;

        const matchedSlot = allSlotsRes.data.find(
          (s: any) => s.code?.toUpperCase() === slotParam.toUpperCase()
        );
        if (!matchedSlot) {
          // Slot not found in all-slots list; just set the code so the grid can highlight it when loaded
          setSelectedSlotCode(slotParam);
          return;
        }

        // Set the slot code immediately so the grid highlights it
        setSelectedSlotCode(matchedSlot.code);

        // Fetch zone to get floorId
        const zoneRes = await api.get<any>(`/Zones/${matchedSlot.zoneId}`);
        if (!zoneRes.success || !zoneRes.data) return;
        const floorId: number = zoneRes.data.floorId;

        // Fetch floor to get buildingId
        const floorRes = await api.get<any>(`/Floors/${floorId}`);
        if (!floorRes.success || !floorRes.data) return;
        const buildingId: number = floorRes.data.buildingId;

        // Apply selections — existing effects will then load floors & slots for this floor
        setSelectedBuilding(buildingId.toString());
        setSelectedFloor(floorId.toString());
      } catch (err) {
        console.error('Error resolving slot from URL param:', err);
        // Fallback: just set the slot code
        setSelectedSlotCode(slotParam);
      }
    };

    resolveSlot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const formatLocalVNTime = (date: Date): string => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    let hr = parts.find(p => p.type === 'hour')?.value ?? '00';
    const min = parts.find(p => p.type === 'minute')?.value ?? '00';
    const sec = parts.find(p => p.type === 'second')?.value ?? '00';

    if (hr === '24') hr = '00';

    return `${y}-${m}-${d}T${hr}:${min}:${sec}+07:00`;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicleTypeId !== 1 && !selectedSlotCode) {
      showToast("Please select a parking slot!", "error");
      return;
    }
    if (!user?.id) {
      showToast("User session not found. Please log in again.", "error");
      return;
    }

    // Validate times in the frontend — all comparisons are UTC-ms based (timezone-neutral)
    const now = new Date();
    now.setSeconds(0, 0); // Truncate seconds & milliseconds to match backend minute-level precision

    // Build ISO strings with explicit +07:00 offset so Date parsing is unambiguous
    const selectedStart = new Date(`${bookingDate}T${startTime}:00+07:00`);

    // Overnight booking check: if end < start in string comparison, add 1 day
    let endBookingDate = bookingDate;
    if (endTime <= startTime) {
      const d = new Date(`${bookingDate}T00:00:00+07:00`);
      d.setDate(d.getDate() + 1);
      endBookingDate = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    }
    const selectedEnd = new Date(`${endBookingDate}T${endTime}:00+07:00`);

    // Get current Vietnam time for user-friendly error message
    const vnNowStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
    const vnDateStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

    // Check if start time is at least 15 minutes from now
    const diffStartMinutes = (selectedStart.getTime() - now.getTime()) / (1000 * 60);
    if (diffStartMinutes < 15) {
      showToast(
        `Start time must be at least 15 minutes from now. Current time: ${vnNowStr} on ${vnDateStr} (VN Time). Please select a different time.`,
        "error"
      );
      return;
    }

    // Check if end time is at least 4 hours after start time
    const diffEndHours = (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60);
    if (diffEndHours < 3.99) {
      showToast("End time must be at least 4 hours after start time!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const checkinTime = formatLocalVNTime(selectedStart);
      const checkoutTime = formatLocalVNTime(selectedEnd);
      const payload = {
        accountId: user.id,
        licensePlate: selectedVehicle,
        buildingId: parseInt(selectedBuilding),
        plannedCheckinTime: checkinTime,
        plannedCheckoutTime: checkoutTime
      };

      // Create Booking reservation
      const res = await api.post<any>('/bookings', payload);

      if (res.success && res.data) {
        const bookingId = res.data.id;
        setCreatedBookingId(bookingId);
        setDepositAmount(res.data.depositAmount || getEstimatedDeposit());
        setShowPaymentModal(true);
      } else {
        showToast(res.message || 'Failed to create booking.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as { message?: string };
        showToast(errorData.message || 'Error processing reservation.', 'error');
      } else {
        showToast('Connection error. Booking could not be completed.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!createdBookingId) {
      setShowPaymentModal(false);
      return;
    }
    setIsCancelling(true);
    try {
      await api.delete(`/bookings/${createdBookingId}`);
      showToast('Booking has been cancelled successfully.', 'info');
      setShowPaymentModal(false);
      setCreatedBookingId(null);
    } catch (err) {
      console.error(err);
      showToast('An error occurred while cancelling the booking.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOnlinePaymentRedirect = async () => {
    if (!createdBookingId) return;
    setIsPaying(true);
    try {
      const payRes = await api.post<any>('/payments', {
        bookingId: createdBookingId,
        paymentMethod: 'ONLINE_BANKING'
      });

      if (payRes.success && payRes.data && payRes.data.paymentUrl) {
        showToast('Redirecting to VNPay gateway...', 'success');
        window.location.href = payRes.data.paymentUrl;
      } else {
        showToast('Unable to create VNPay payment link.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Payment system is busy. Please try again later.', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">

      {/* PAGE HEADER */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Book a Parking Slot</h1>
        <p className="text-sm text-slate-400 mt-1">Reserve your parking space in advance for a hassle-free arrival.</p>
      </section>

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: SELECTIONS */}
        <div className="lg:col-span-8 space-y-6">

          {/* VEHICLE SELECTION */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Car className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Select Vehicle</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((v) => {
                const isDefault = defaultVehicleId === v.id;
                return (
                  <div
                    key={v.licensePlate}
                    onClick={() => setSelectedVehicle(v.licensePlate)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${selectedVehicle === v.licensePlate
                      ? 'border-[#00a86b] bg-emerald-50/10'
                      : 'border-[#e2e8f0] hover:border-slate-300 bg-slate-50/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVehicle === v.licensePlate ? 'bg-[#00a86b] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-700">{v.licensePlate}</p>
                          {isDefault && (
                            <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{v.vehicleTypeName || 'Private Vehicle'}</p>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedVehicle === v.licensePlate ? 'border-[#00a86b] bg-[#00a86b] text-white' : 'border-slate-300'
                      }`}>
                      {selectedVehicle === v.licensePlate && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FACILITY SELECTION */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Select Facility & Building</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBuilding(b.id.toString());
                    setSelectedSlotCode(''); // Reset selected slot
                  }}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32 ${selectedBuilding === b.id.toString()
                    ? 'border-[#00a86b] bg-emerald-50/10'
                    : 'border-[#e2e8f0] hover:border-slate-300 bg-slate-50/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedBuilding === b.id.toString() ? 'bg-[#00a86b] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>{b.code}</span>
                    <span className="text-xs text-slate-400 font-bold">{b.totalFloor} floors</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mt-2">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{b.address || 'Smart City Zone'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FLOOR & SLOT SELECTION */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Select Floor & Parking Slot</h2>
            </div>

            {selectedVehicleTypeId === 1 ? (
              <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Motorbike Parking Registration</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Motorbikes park in the shared Motorbike Zone on Floor 1. No specific slot selection is required. You only need to select the expected parking time in the Booking Summary section.
                </p>
              </div>
            ) : floors.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-xl text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No available parking slots or this building does not support advance booking for this vehicle type.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are currently no general/booking parking zones configured for this vehicle type in this building. Please select a different vehicle or contact the building management.
                </p>
              </div>
            ) : (
              <>
                {/* Floors tab */}
                <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
                  {floors.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(f.id.toString());
                        setSelectedSlotCode('');
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all whitespace-nowrap shrink-0 ${selectedFloor === f.id.toString()
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      {f.name || `Floor ${f.floorNumber}`}
                    </button>
                  ))}
                </div>

                {/* Slots grid */}
                {slotsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    No available parking slots on this floor.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {slotsList.map((slot) => {
                      const isSelected = selectedSlotCode === slot.code;
                      const isOccupied = slot.status !== 0 && slot.status !== 'Available';
                      
                      let statusText = 'Available';
                      let statusClass = 'border-[#00a86b] text-emerald-700 bg-white hover:bg-emerald-50/10 hover:scale-[1.03]';
                      
                      if (isOccupied) {
                        statusText = 'Unavailable';
                        statusClass = 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed';
                      } else if (isSelected) {
                        statusText = 'Selected';
                        statusClass = 'border-[#00a86b] bg-[#00a86b] text-white shadow-md shadow-emerald-500/10';
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => setSelectedSlotCode(slot.code)}
                          className={`p-3 border-2 rounded-xl text-center font-bold transition-all relative ${statusClass}`}
                        >
                          <span className="block text-sm">{slot.code}</span>
                          <span className="block text-[8px] opacity-75 font-normal mt-0.5">
                            {statusText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING TIMELINE & COST PREVIEW */}
        <div className="lg:col-span-4 space-y-6">

          {/* BOOKING DURATION */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Schedule Time</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOOKING SUMMARY & PREVIEW */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base">Booking Summary</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Vehicle Plate</span>
                <span className="font-bold text-slate-700">{selectedVehicle || 'None'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Building</span>
                <span className="font-bold text-slate-700">
                  {buildings.find(b => b.id.toString() === selectedBuilding)?.name || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Selected Slot</span>
                <span className={`font-bold ${selectedVehicleTypeId === 1 || selectedSlotCode ? 'text-emerald-600' : 'text-slate-400 italic'}`}>
                  {selectedVehicleTypeId === 1 ? 'Motorbike Zone' : (selectedSlotCode || 'Not selected')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Date & Time</span>
                <span className="font-bold text-slate-700 text-xs">
                  {bookingDate} {(() => {
                    if (!startTime) return '';
                    const [h, m] = startTime.split(':');
                    const hours = parseInt(h, 10);
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    return `${String(displayHours).padStart(2, '0')}:${m} ${ampm}`;
                  })()}
                </span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 my-4"></div>

            <div className="space-y-3 bg-slate-50 border border-[#e2e8f0] p-4 rounded-xl">
              {/* Rate breakdown label */}
              {(() => {
                const rate = selectedVehicleTypeId === 1 ? 5000 : 20000;
                const cap = selectedVehicleTypeId === 1 ? 20000 : 150000;
                const [sh, sm] = startTime ? startTime.split(':').map(Number) : [0, 0];
                const [eh, em] = endTime ? endTime.split(':').map(Number) : [0, 0];
                let dur = (eh + em / 60) - (sh + sm / 60);
                if (dur < 0) dur += 24;
                return (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Rate: <span className="text-slate-600 font-bold">{rate.toLocaleString('en-US')} VND/hr</span>
                    {dur > 0 && (
                      <> · <span className="text-slate-600 font-bold">{dur % 1 === 0 ? dur : dur.toFixed(1)} hr{dur !== 1 ? 's' : ''}</span> · Max cap: <span className="text-slate-600 font-bold">{cap.toLocaleString('en-US')} VND</span></>
                    )}
                  </p>
                );
              })()}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Estimated Parking Fee</span>
                <span className="font-bold text-slate-700">{calculateCost().toLocaleString('en-US')} VND</span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-bold pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Total Deposit Amount</span>
                <span className="text-xl font-black text-[#00a86b] whitespace-nowrap">{depositAmount.toLocaleString('en-US')} VND</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                * Deposit is required to confirm booking. Remaining balance is paid at checkout.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || (selectedVehicleTypeId !== 1 && !selectedSlotCode)}
              className="w-full py-4 rounded-xl bg-[#00a86b] text-white font-bold text-sm shadow-md shadow-emerald-500/10 hover:bg-[#00905b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Reserving...</span>
                </>
              ) : (
                <>
                  <span>Confirm Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* ONLINE DEPOSIT PAYMENT MODAL */}
      {mounted && showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-slate-100">

            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Booking Deposit Payment</h3>
              </div>
              <button
                onClick={() => handleCancelBooking()}
                disabled={isPaying || isCancelling}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Booking Deposit</p>
                <h4 className="text-3xl font-black text-[#00a86b]">{depositAmount.toLocaleString('en-US')} VND</h4>
                <p className="text-[11px] text-slate-500 max-w-[320px] mx-auto leading-relaxed">
                  To confirm your parking reservation, you need to pay this deposit online via VNPay gateway.
                </p>
                <p className="text-[10px] text-slate-400">
                  Estimated total fee: <span className="font-bold text-slate-600">{calculateCost().toLocaleString('en-US')} VND</span> · Pay remaining balance at checkout
                </p>
              </div>

              {/* Chi tiết đơn đặt chỗ */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">License Plate:</span>
                  <span className="font-bold text-slate-700">{selectedVehicle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Parking Slot:</span>
                  <span className="font-bold text-slate-750">{selectedVehicleTypeId === 1 ? 'Shared Motorbike Zone' : selectedSlotCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Scheduled Time:</span>
                  <span className="font-bold text-slate-700">{bookingDate} ({startTime} - {endTime})</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left text-amber-800 text-[11px] flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>This booking will be automatically cancelled after 15 minutes if the deposit is not paid online.</span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOnlinePaymentRedirect}
                  disabled={isPaying || isCancelling}
                  className="w-full py-4 bg-[#006d43] hover:bg-[#005c38] text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating VNPay link...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay Online via VNPay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelBooking}
                  disabled={isPaying || isCancelling}
                  className="w-full py-3.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span>Cancelling booking...</span>
                    </>
                  ) : (
                    <span>Cancel Booking</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
