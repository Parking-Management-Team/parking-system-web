'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';
import { 
  Car, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Building,
  Layers,
  ChevronRight,
  QrCode,
  ExternalLink,
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
}

interface SlotItem {
  id: number;
  code: string;
  name?: string;
  status: any; // Can be string (from backend enum) or number (from mockup fallback)
  vehicleTypeId?: number;
}

export default function BookingPage() {
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
    
    // Set initial date/time values based on GMT+7 timezone to avoid SSR hydration mismatch
    // Default start time is current time + 15 minutes
    const nowGmt7 = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const startGmt7 = new Date(nowGmt7.getTime() + 15 * 60 * 1000);
    
    const year = startGmt7.getUTCFullYear();
    const month = String(startGmt7.getUTCMonth() + 1).padStart(2, '0');
    const day = String(startGmt7.getUTCDate()).padStart(2, '0');
    setBookingDate(`${year}-${month}-${day}`);

    const hours = String(startGmt7.getUTCHours()).padStart(2, '0');
    const minutes = String(startGmt7.getUTCMinutes()).padStart(2, '0');
    setStartTime(`${hours}:${minutes}`);

    // Default end time to 1 hour after start time
    const endGmt7 = new Date(startGmt7.getTime() + 1 * 60 * 60 * 1000);
    const endHours = String(endGmt7.getUTCHours()).padStart(2, '0');
    const endMinutes = String(endGmt7.getUTCMinutes()).padStart(2, '0');
    setEndTime(`${endHours}:${endMinutes}`);
  }, []);

  // API Data States
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [allFloors, setAllFloors] = useState<FloorItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [slotsList, setSlotsList] = useState<SlotItem[]>([]);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(20000);

  // Identify active vehicle and its type ID
  const activeVehicle = vehicles.find(v => v.licensePlate === selectedVehicle);
  const selectedVehicleTypeId = activeVehicle?.vehicleTypeId || 2; // Default to Car (2) if none selected

  const getEstimatedDeposit = () => {
    if (!bookingDate || !startTime) return selectedVehicleTypeId === 1 ? 5000 : 20000;
    try {
      const dt = new Date(`${bookingDate}T${startTime}:00+07:00`);
      const utcHours = dt.getUTCHours();
      const utcMinutes = dt.getUTCMinutes();
      const utcTimeVal = utcHours * 60 + utcMinutes;
      const isDayWindow = utcTimeVal >= 360 && utcTimeVal < 1320;
      if (selectedVehicleTypeId === 1) {
        return isDayWindow ? 5000 : 10000;
      } else {
        return isDayWindow ? 20000 : 40000;
      }
    } catch {
      return selectedVehicleTypeId === 1 ? 5000 : 20000;
    }
  };

  useEffect(() => {
    setDepositAmount(getEstimatedDeposit());
  }, [selectedVehicleTypeId, bookingDate, startTime]);

  // Load Vehicles & Buildings
  useEffect(() => {
    if (!user?.id) return;
    
    // Load Vehicles
    api.get<any>(`/vehicles?accountId=${user.id}`)
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setVehicles(res.data);
          setSelectedVehicle(res.data[0].licensePlate);
        } else {
          // Fallback mock vehicles if DB is empty
          const fallbackVehicles = [
            { id: 1, licensePlate: '30A-888.88', vehicleTypeName: 'Car', vehicleTypeId: 2 },
            { id: 2, licensePlate: '29A-999.99', vehicleTypeName: 'Motorcycle', vehicleTypeId: 1 }
          ];
          setVehicles(fallbackVehicles);
          setSelectedVehicle(fallbackVehicles[0].licensePlate);
        }
      })
      .catch(() => {
        const fallbackVehicles = [
          { id: 1, licensePlate: '30A-888.88', vehicleTypeName: 'Car', vehicleTypeId: 2 },
          { id: 2, licensePlate: '29A-999.99', vehicleTypeName: 'Motorcycle', vehicleTypeId: 1 }
        ];
        setVehicles(fallbackVehicles);
        setSelectedVehicle(fallbackVehicles[0].licensePlate);
      });

    // Load Buildings
    api.get<any>('/Buildings')
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setBuildings(res.data);
          setSelectedBuilding(res.data[0].id.toString());
        } else {
          // Fallback mock buildings
          const fallbackBuildings = [
            { id: 1, code: 'BLD01', name: 'Building A (Central Plaza)', address: 'High Tech Park, Dist 9', totalFloor: 3 },
            { id: 2, code: 'BLD02', name: 'Building B (Tech Hub)', address: 'High Tech Park, Dist 9', totalFloor: 2 }
          ];
          setBuildings(fallbackBuildings);
          setSelectedBuilding(fallbackBuildings[0].id.toString());
        }
      })
      .catch(() => {
        const fallbackBuildings = [
          { id: 1, code: 'BLD01', name: 'Building A (Central Plaza)', address: 'High Tech Park, Dist 9', totalFloor: 3 },
          { id: 2, code: 'BLD02', name: 'Building B (Tech Hub)', address: 'High Tech Park, Dist 9', totalFloor: 2 }
        ];
        setBuildings(fallbackBuildings);
        setSelectedBuilding(fallbackBuildings[0].id.toString());
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
          // Fallback mock floors
          const fallbackFloors = [
            { id: 1, floorNumber: 1, name: 'Floor 1', vehicleTypeIds: [1] },
            { id: 2, floorNumber: 2, name: 'Floor 2', vehicleTypeIds: [2] },
            { id: 3, floorNumber: 3, name: 'Floor 3', vehicleTypeIds: [2] }
          ];
          setAllFloors(fallbackFloors);
        }
      })
      .catch(() => {
        const fallbackFloors = [
          { id: 1, floorNumber: 1, name: 'Floor 1', vehicleTypeIds: [1] },
          { id: 2, floorNumber: 2, name: 'Floor 2', vehicleTypeIds: [2] },
          { id: 3, floorNumber: 3, name: 'Floor 3', vehicleTypeIds: [2] }
        ];
        setAllFloors(fallbackFloors);
      });
  }, [selectedBuilding]);

  // Filter floors based on selected vehicle type
  useEffect(() => {
    if (allFloors.length === 0) {
      setFloors([]);
      return;
    }

    const filtered = allFloors.filter(floor => 
      !floor.vehicleTypeIds || floor.vehicleTypeIds.includes(selectedVehicleTypeId)
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

  const generateMockSlots = (): SlotItem[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      code: `${selectedVehicleTypeId === 1 ? 'M' : 'C'}-0${i + 1}`,
      status: (i === 3 || i === 6) ? 1 : 0,
      vehicleTypeId: selectedVehicleTypeId
    }));
  };

  useEffect(() => {
    const slotParam = searchParams.get('slot');
    if (slotParam) {
      setSelectedSlotCode(slotParam);
    }
  }, [searchParams]);

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

    // Validate times in the frontend
    const now = new Date();
    const selectedStart = new Date(`${bookingDate}T${startTime}:00+07:00`);
    const selectedEnd = new Date(`${bookingDate}T${endTime}:00+07:00`);

    // Check if start time is at least 15 minutes from now
    const diffStartMinutes = (selectedStart.getTime() - now.getTime()) / (1000 * 60);
    if (diffStartMinutes < 14) {
      showToast("Thời gian bắt đầu đặt chỗ phải cách hiện tại tối thiểu 15 phút!", "error");
      return;
    }

    // Check if end time is at least 1 hour after start time
    const diffEndHours = (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60);
    if (diffEndHours < 0.99) {
      showToast("Thời gian kết thúc phải cách thời gian bắt đầu tối thiểu 1 tiếng!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const checkinTime = new Date(`${bookingDate}T${startTime}:00+07:00`).toISOString();
      const payload = {
        accountId: user.id,
        licensePlate: selectedVehicle,
        buildingId: parseInt(selectedBuilding),
        plannedCheckinTime: checkinTime
      };

      // Create Booking reservation
      const res = await api.post<any>('/bookings', payload);
      
      if (res.success && res.data) {
        const bookingId = res.data.id;
        showToast('Booking created successfully! Generating deposit payment request...', 'success');

        // Create Payment link for Deposit
        try {
          const payRes = await api.post<any>('/payments', {
            bookingId: bookingId,
            paymentMethod: 'ONLINE_BANKING'
          });

          if (payRes.success && payRes.data) {
            setDepositAmount(payRes.data.amount || getEstimatedDeposit());
            setPaymentUrl(payRes.data.paymentUrl || '');
            setQrCodeUrl(payRes.data.qrCodeUrl || '');
            setShowPaymentModal(true);
          } else {
            showToast('Failed to generate PayOS payment link. Redirecting to sessions.', 'info');
            router.push('/dashboard/driver/sessions');
          }
        } catch (payErr) {
          console.error("Error creating deposit payment:", payErr);
          showToast('Payment system offline. Booking saved as pending.', 'info');
          router.push('/dashboard/driver/sessions');
        }
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

  const handleFinishPayment = () => {
    setShowPaymentModal(false);
    showToast('Payment confirmed! Your check-in QR pass is now active.', 'success');
    router.push('/dashboard/driver/sessions');
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
              {vehicles.map((v) => (
                <div 
                  key={v.licensePlate}
                  onClick={() => setSelectedVehicle(v.licensePlate)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    selectedVehicle === v.licensePlate 
                      ? 'border-[#00a86b] bg-emerald-50/10' 
                      : 'border-[#e2e8f0] hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedVehicle === v.licensePlate ? 'bg-[#00a86b] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{v.licensePlate}</p>
                      <p className="text-xs text-slate-400">{v.vehicleTypeName || 'Private Vehicle'}</p>
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedVehicle === v.licensePlate ? 'border-[#00a86b] bg-[#00a86b] text-white' : 'border-slate-300'
                  }`}>
                    {selectedVehicle === v.licensePlate && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
              ))}
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
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32 ${
                    selectedBuilding === b.id.toString() 
                      ? 'border-[#00a86b] bg-emerald-50/10' 
                      : 'border-[#e2e8f0] hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      selectedBuilding === b.id.toString() ? 'bg-[#00a86b] text-white' : 'bg-slate-100 text-slate-500'
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
                <p className="text-sm font-bold text-slate-700">Đăng ký đỗ xe máy theo khung giờ</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Xe máy được đỗ tại khu vực đỗ xe máy chung (Motorbike Zone) tại Tầng 1. Hệ thống không yêu cầu chọn vị trí ô đỗ cụ thể. Bạn chỉ cần chọn thời gian gửi dự kiến ở phần Tóm tắt đặt chỗ.
                </p>
              </div>
            ) : floors.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-xl text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Tòa nhà không còn chỗ trống hoặc không hỗ trợ đặt chỗ trước cho loại xe này.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Hiện tại không có khu vực đỗ xe vãng lai/đặt chỗ nào được cấu hình cho loại phương tiện này trong tòa nhà. Vui lòng chọn phương tiện khác hoặc liên hệ Ban quản lý.
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
                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                        selectedFloor === f.id.toString() 
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
                    Không có vị trí đỗ xe khả dụng trên tầng này.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {slotsList.map((slot) => {
                      const isSelected = selectedSlotCode === slot.code;
                      const isOccupied = slot.status !== 0 && slot.status !== 'Available';
                      let statusLabel = 'Available';
                      if (slot.status === 1 || slot.status === 'Occupied') statusLabel = 'Occupied';
                      if (slot.status === 2 || slot.status === 'Blocked') statusLabel = 'Blocked';
                      if (slot.status === 3 || slot.status === 'Maintenance') statusLabel = 'Maintenance';

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => setSelectedSlotCode(slot.code)}
                          className={`p-3 border rounded-xl text-center font-bold transition-all relative ${
                            isOccupied 
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' 
                              : isSelected
                                ? 'border-[#00a86b] bg-[#00a86b] text-white shadow-md shadow-emerald-500/10'
                                : 'border-[#e2e8f0] hover:border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          <span className="block text-sm">{slot.code}</span>
                          <span className="block text-[8px] opacity-75 font-normal">
                            {isOccupied ? statusLabel : isSelected ? 'Selected' : 'Available'}
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
                  {selectedVehicleTypeId === 1 ? 'Khu vực xe máy' : (selectedSlotCode || 'Not selected')}
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
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Estimated Parking Fee</span>
                <span className="font-bold text-slate-700">{calculateCost().toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Required Deposit</span>
                <span className="text-xl font-black text-[#00a86b]">{getEstimatedDeposit().toLocaleString('vi-VN')} đ</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                * Note: The deposit will be deducted from your final parking fee upon checkout.
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Secure Booking Deposit</h3>
              </div>
              <button 
                onClick={() => handleFinishPayment()}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Payment Request</p>
                <h4 className="text-2xl font-extrabold text-slate-800">{depositAmount.toLocaleString('vi-VN')} đ</h4>
                <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto">
                  A deposit is required to lock your slot. Scan the VietQR code or pay via PayOS in the browser.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl inline-block">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="VietQR Deposit Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 animate-pulse flex items-center justify-center rounded-xl">
                    <QrCode className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>

              {/* PayOS External Link */}
              {paymentUrl && (
                <div>
                  <a 
                    href={paymentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    <span>Open PayOS Gateway</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left text-amber-800 text-[11px] flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>The slot will be automatically released if payment is not received within 15 minutes.</span>
              </div>

              <button 
                onClick={handleFinishPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                I Have Completed Payment
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
