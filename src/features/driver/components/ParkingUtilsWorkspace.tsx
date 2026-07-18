'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';
import { usePricingEngine } from '@/features/manager/hooks/usePricingEngine';
import { formatPlate } from '@/lib/utils/format';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  CreditCard,
  QrCode,
  RefreshCw,
  Timer,
  CheckCircle,
  AlertCircle,
  X,
  Edit3,
  Loader2,
  Search,
  Download,
  Layers,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────
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
  isReserved?: boolean;
}

interface BookingRecord {
  id: number;
  licensePlate: string;
  buildingId?: number;
  buildingName?: string;
  plannedCheckinTime: string;
  plannedCheckoutTime: string;
  depositAmount: number;
  totalAmount?: number;
  bookingStatus: string;
  createdAt: string;
  slotCode?: string;
}

interface ParkingSessionRecord {
  id: string | number;
  licensePlateIn?: string;
  licensePlate?: string;
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

function normalizeSession(raw: any) {
  const rawPlate = raw.licensePlateIn || raw.licensePlate || '';
  const plate = rawPlate ? formatPlate(rawPlate) : '—';
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
  let status: 'completed' | 'cancelled' | 'pending' = 'pending';
  if (rawStatus === 'completed' || rawStatus === 'checkout' || rawStatus === 'done' || rawStatus === 'finished') status = 'completed';
  else if (rawStatus === 'cancelled' || rawStatus === 'canceled') status = 'cancelled';
  // 'active' và các status chưa checkout đều map thành 'pending' (màu vàng)

  const formatDt = (dt: string) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dt;
    }
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

const formatLocalVNTime = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
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

export default function ParkingUtilsWorkspace() {
  const { user, showToast } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Main Tabs State ────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'sessions' | 'history'>('sessions');

  // ─── Shared Driver Data States ──────────────────────────────────────
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);

  // ─── Parking History States ─────────────────────────────────────────
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled' | 'pending'>('all');
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ─── Booking Modal & Stepper States ────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Selection states for booking wizard
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedSlotCode, setSelectedSlotCode] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [urlPreselectedSlot, setUrlPreselectedSlot] = useState<{ id: number; code: string; floorId: number; buildingId: number } | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [endBookingDate, setEndBookingDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Lists loaded dynamically in booking stepper
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

  // Modify booking modal states
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingBooking, setModifyingBooking] = useState<BookingRecord | null>(null);
  const [newCheckinDate, setNewCheckinDate] = useState('');
  const [newCheckinTime, setNewCheckinTime] = useState('');
  const [isSavingModify, setIsSavingModify] = useState(false);

  // Cancel reservation confirm modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancellingReservation, setIsCancellingReservation] = useState(false);

  // Extend booking modal states
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<BookingRecord | null>(null);
  const [newCheckoutDate, setNewCheckoutDate] = useState('');
  const [newCheckoutTime, setNewCheckoutTime] = useState('');
  const [isSavingExtend, setIsSavingExtend] = useState(false);

  // Walk-in counter states
  const [sessionsTab, setSessionsTab] = useState<'booked' | 'walkin'>('booked');
  const [walkinDuration, setWalkinDuration] = useState<number>(0);
  const [walkinCost, setWalkinCost] = useState<number>(0);

  const activeVehicle = vehicles.find(v => v.licensePlate === selectedVehicle);
  const selectedVehicleTypeId = activeVehicle?.vehicleTypeId || 2; // Default to Car (2)

  // Dynamic Pricing Engine Integration
  const { calculatePrice } = usePricingEngine();
  const [isEstimatingPrice, setIsEstimatingPrice] = useState<boolean>(false);

  const calculateCost = useCallback(() => {
    if (!startTime || !endTime || !bookingDate || !endBookingDate) return 0;
    const start = new Date(`${bookingDate}T${startTime}:00+07:00`);
    const end = new Date(`${endBookingDate}T${endTime}:00+07:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;

    const durationHours = diffMs / (1000 * 60 * 60);
    const rate = selectedVehicleTypeId === 1 ? 5000 : 20000;
    const cost = durationHours * rate;

    // No hardcoded cap - let backend pricing engine handle daily caps
    return cost;
  }, [startTime, endTime, bookingDate, endBookingDate, selectedVehicleTypeId]);

  const getEstimatedDeposit = useCallback(() => {
    return depositAmount || calculateCost();
  }, [depositAmount, calculateCost]);

  // Automatically estimate the price using the Pricing Engine API
  useEffect(() => {
    if (!startTime || !endTime || !bookingDate || !endBookingDate) {
      return;
    }

    const start = new Date(`${bookingDate}T${startTime}:00+07:00`);
    const end = new Date(`${endBookingDate}T${endTime}:00+07:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      return;
    }

    let isCancelled = false;

    const fetchEstimate = async () => {
      setIsEstimatingPrice(true);
      try {
        const formattedStart = formatLocalVNTime(start);
        const formattedEnd = formatLocalVNTime(end);

        const res = await calculatePrice({
          vehicleTypeId: selectedVehicleTypeId,
          checkInTime: formattedStart,
          checkOutTime: formattedEnd,
        });

        if (!isCancelled) {
          if (res) {
            setDepositAmount(res.totalAmount);
          } else {
            // Fallback to local rate calculation
            setDepositAmount(calculateCost());
          }
        }
      } catch (err) {
        console.error("Failed to estimate price via Pricing Engine API", err);
        if (!isCancelled) {
          setDepositAmount(calculateCost());
        }
      } finally {
        if (!isCancelled) {
          setIsEstimatingPrice(false);
        }
      }
    };

    fetchEstimate();

    return () => {
      isCancelled = true;
    };
  }, [bookingDate, startTime, endBookingDate, endTime, selectedVehicleTypeId, calculatePrice, calculateCost]);

  // ─── Fetch Active Sessions & Bookings ────────────────────────────────
  const fetchActiveData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingActive(true);
    try {
      let userPlates: string[] = [];
      let vehiclesList: VehicleItem[] = [];

      // 1. Fetch Vehicles
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          setVehicles(vehRes.data);
          vehiclesList = vehRes.data;
          userPlates = vehRes.data.map((v: any) => v.licensePlate);
          if (vehRes.data.length > 0 && !selectedVehicle) {
            setSelectedVehicle(vehRes.data[0].licensePlate);
          }
        }
      } catch (err) {
        console.error('Error loading vehicles', err);
      }

      // 2. Fetch Active Bookings
      try {
        const bookRes = await api.get<any>(`/bookings/by-account/${user.id}`);
        if (bookRes.success && bookRes.data) {
          const activeBookings = bookRes.data.filter((b: any) =>
            b.bookingStatus === 'Pending' || b.bookingStatus === 'Confirmed'
          );
          setBookings(activeBookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Error loading bookings', err);
        setBookings([]);
      }

      // 3. Fetch Active Parking Sessions
      try {
        const sessRes = await api.get<any>('/parking-sessions/active');
        if (sessRes.success && sessRes.data) {
          const matchedSession = sessRes.data.find((s: any) =>
            userPlates.length > 0 ? userPlates.includes(s.licensePlateIn) : false
          );
          if (matchedSession) {
            setActiveSession(matchedSession);
            const checkInDate = new Date(matchedSession.checkInTime);
            const diffSecs = Math.max(0, Math.floor((Date.now() - checkInDate.getTime()) / 1000));
            setWalkinDuration(diffSecs);

            const matchedVehicle = vehiclesList.find((v: any) => v.licensePlate === matchedSession.licensePlateIn);
            const isMotor = matchedVehicle?.vehicleTypeId === 1 || matchedSession.slotCode?.startsWith('M');
            const rate = isMotor ? 5000 : 20000;
            setWalkinCost((diffSecs / 3600) * rate);
          } else {
            setActiveSession(null);
          }
        }
      } catch (err) {
        console.error('Error loading active sessions', err);
        setActiveSession(null);
      }
    } finally {
      setIsLoadingActive(false);
    }
  }, [user, selectedVehicle]);

  // ─── Fetch Historical Sessions ──────────────────────────────────────
  const fetchHistoryData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      let rawSessions: any[] = [];
      try {
        const res = await api.get<any>(`/parking-sessions/by-account/${user.id}`);
        if (res.success && Array.isArray(res.data)) {
          rawSessions = res.data;
        }
      } catch {
        // Fallback checks
        try {
          const res2 = await api.get<any>(`/parking-sessions?accountId=${user.id}`);
          if (res2.success && Array.isArray(res2.data)) {
            rawSessions = res2.data;
          }
        } catch {
          if (vehicles.length > 0) {
            try {
              const res3 = await api.get<any>(`/parking-sessions?licensePlate=${vehicles[0].licensePlate}`);
              if (res3.success && Array.isArray(res3.data)) {
                rawSessions = res3.data;
              }
            } catch { /* empty */ }
          }
        }
      }

      const normalized = rawSessions
        .map(normalizeSession)
        .filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'pending');

      normalized.sort((a, b) => {
        const da = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const db = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return db - da;
      });

      setHistorySessions(normalized);
    } catch (err) {
      console.error('Error loading parking history:', err);
      setHistorySessions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user, vehicles]);

  // Trigger loads
  useEffect(() => {
    fetchActiveData();
  }, [fetchActiveData]);

  useEffect(() => {
    if (mainTab === 'history') {
      fetchHistoryData();
    }
  }, [mainTab, fetchHistoryData]);

  // Walk-in counter tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionsTab === 'walkin' && activeSession) {
      const matchedVehicle = vehicles.find(v => v.licensePlate === activeSession.licensePlateIn);
      const isMotor = matchedVehicle?.vehicleTypeId === 1 || activeSession.slotCode?.startsWith('M');
      const rate = isMotor ? 5000 : 20000;

      timer = setInterval(() => {
        setWalkinDuration(prev => {
          const next = prev + 1;
          setWalkinCost((next / 3600) * rate);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionsTab, activeSession, vehicles]);

  const maxBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const vnDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d);
    return `${vnDateParts.find(p => p.type === 'year')?.value}-${vnDateParts.find(p => p.type === 'month')?.value}-${vnDateParts.find(p => p.type === 'day')?.value}`;
  }, []);

  // ─── Initialize Booking Stepper Date & Times ────────────────────────
  const initWizardDateTime = () => {
    const now = new Date();
    const vnDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const vnDate = `${vnDateParts.find(p => p.type === 'year')?.value}-${vnDateParts.find(p => p.type === 'month')?.value}-${vnDateParts.find(p => p.type === 'day')?.value}`;

    const startMs = now.getTime() + 30 * 60 * 1000;
    const startDate = new Date(startMs);
    const vnStartParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(startDate);
    const startH = vnStartParts.find(p => p.type === 'hour')?.value ?? '00';
    const startM = vnStartParts.find(p => p.type === 'minute')?.value ?? '00';

    const endDate = new Date(startMs + 4 * 60 * 60 * 1000);
    const vnEndParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(endDate);
    const endH = vnEndParts.find(p => p.type === 'hour')?.value ?? '00';
    const endM = vnEndParts.find(p => p.type === 'minute')?.value ?? '00';
    const endDateStr = endDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    setBookingDate(vnDate);
    setEndBookingDate(endDateStr);
    setStartTime(`${startH}:${startM}`);
    setEndTime(`${endH}:${endM}`);
  };

  // Load static buildings list
  const loadBuildingsList = async () => {
    try {
      const res = await api.get<any>('/Buildings');
      if (res.success && res.data && res.data.length > 0) {
        setBuildings(res.data);
        if (!selectedBuilding) {
          setSelectedBuilding(res.data[0].id.toString());
        }
      } else {
        setBuildings([]);
      }
    } catch {
      setBuildings([]);
    }
  };

  // Resolve slot and vehicle type from URL parameters (e.g., from Dashboard)
  useEffect(() => {
    const slotParam = searchParams.get('slot');
    const vehicleTypeParam = searchParams.get('vehicleTypeId');
    if (!slotParam) return;

    const resolveSlotFromUrl = async () => {
      try {
        // 1. Make sure buildings are loaded
        await loadBuildingsList();

        // 2. Fetch all slots to find the matched one
        const allSlotsRes = await api.get<any>('/ParkingSlots');
        if (!allSlotsRes.success || !allSlotsRes.data) return;

        const matchedSlot = allSlotsRes.data.find(
          (s: any) => s.code?.toUpperCase() === slotParam.toUpperCase()
        );
        if (!matchedSlot) {
          return;
        }

        // Fetch zone to get floorId
        const zoneRes = await api.get<any>(`/Zones/${matchedSlot.zoneId}`);
        if (!zoneRes.success || !zoneRes.data) return;
        const floorId: number = zoneRes.data.floorId;

        // Fetch floor to get buildingId
        const floorRes = await api.get<any>(`/Floors/${floorId}`);
        if (!floorRes.success || !floorRes.data) return;
        const buildingId: number = floorRes.data.buildingId;

        // Save pre-selected slot state to restore later in Step 4
        setUrlPreselectedSlot({
          id: matchedSlot.id,
          code: matchedSlot.code,
          floorId: floorId,
          buildingId: buildingId
        });

        // Apply building and floor selections
        setSelectedBuilding(buildingId.toString());
        setSelectedFloor(floorId.toString());

        // Pre-select vehicle matching vehicleTypeId if provided
        if (vehicleTypeParam && user?.id) {
          const typeId = Number(vehicleTypeParam);
          try {
            const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
            if (vehRes.success && vehRes.data && vehRes.data.length > 0) {
              const matchedVeh = vehRes.data.find((v: any) => v.vehicleTypeId === typeId);
              if (matchedVeh) {
                setSelectedVehicle(matchedVeh.licensePlate);
              } else {
                setSelectedVehicle(vehRes.data[0].licensePlate);
              }
            }
          } catch (err) {
            console.error('Error pre-selecting vehicle for slot', err);
          }
        }

        // Initialize date & times
        initWizardDateTime();

        // Start booking modal from STEP 1 (Vehicle Selection)
        setWizardStep(1);
        setShowBookingModal(true);

        // Clear query parameters from URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

      } catch (err) {
        console.error('Error resolving slot from URL param:', err);
        setWizardStep(1);
        setShowBookingModal(true);
      }
    };

    resolveSlotFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  // Load Floors on Building Change
  useEffect(() => {
    if (!selectedBuilding || !showBookingModal) return;

    // Clear old floors and slots immediately to prevent displaying stale data from the previously selected building
    setAllFloors([]);
    setFloors([]);
    setSlotsList([]);
    setSelectedFloor('');
    setSelectedSlotCode('');
    setSelectedSlotId(null);

    api.get<any>(`/Floors/building/${selectedBuilding}`)
      .then(async (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const fetchedFloors = res.data;
          const floorsWithTypes = await Promise.all(
            fetchedFloors.map(async (floor: any) => {
              try {
                const zoneRes = await api.get<any>(`/Zones/floor/${floor.id}`);
                if (zoneRes.success && zoneRes.data) {
                  const generalZones = zoneRes.data.filter((z: any) =>
                    z.accessType === 'General' || z.accessType === 0 || z.accessType === '0'
                  );
                  const typeIds = generalZones.map((z: any) => z.vehicleTypeId);
                  return { ...floor, vehicleTypeIds: Array.from(new Set(typeIds)) as number[] };
                }
              } catch (err) {
                console.error(`Error loading zones for floor ${floor.id}`, err);
              }
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
  }, [selectedBuilding, showBookingModal]);

  // Sync Floors with Selected Vehicle Type
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

  // Reset slot selection when time or floor changes to prevent stale selections
  useEffect(() => {
    setSelectedSlotCode('');
    setSelectedSlotId(null);
  }, [bookingDate, startTime, endBookingDate, endTime, selectedFloor]);

  // Load Slots on Floor Change
  useEffect(() => {
    if (!selectedFloor || !showBookingModal) {
      setSlotsList([]);
      return;
    }

    let timeParams = '';
    if (bookingDate && startTime && endBookingDate && endTime) {
      try {
        const startDt = new Date(`${bookingDate}T${startTime}:00+07:00`);
        const endDt = new Date(`${endBookingDate}T${endTime}:00+07:00`);
        timeParams = `?plannedCheckinTime=${encodeURIComponent(startDt.toISOString())}&plannedCheckoutTime=${encodeURIComponent(endDt.toISOString())}`;
      } catch (err) {
        console.error("Error constructing times for slot query:", err);
      }
    }

    api.get<any>(`/Zones/floor/${selectedFloor}`)
      .then(async (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const generalZones = res.data.filter((z: any) =>
            z.accessType === 'General' || z.accessType === 0 || z.accessType === '0'
          );
          if (generalZones.length === 0) {
            setSlotsList([]);
            return;
          }
          try {
            const allSlotsPromises = generalZones.map((zone: any) =>
              api.get<any>(`/ParkingSlots/zone/${zone.id}${timeParams}`)
                .then(r => r.success ? r.data : [])
                .catch(() => [])
            );
            const results = await Promise.all(allSlotsPromises);
            const mergedSlots = results.flat();
            if (mergedSlots.length > 0) {
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
  }, [selectedFloor, selectedVehicleTypeId, showBookingModal, bookingDate, startTime, endBookingDate, endTime]);

  // Restore preselected slot from URL when wizard reaches step 4 and slots are loaded
  useEffect(() => {
    if (wizardStep === 4 && urlPreselectedSlot && slotsList.length > 0) {
      const isSlotInList = slotsList.some(s => s.id === urlPreselectedSlot.id);
      if (isSlotInList) {
        setSelectedSlotCode(urlPreselectedSlot.code);
        setSelectedSlotId(urlPreselectedSlot.id);
      }
      setUrlPreselectedSlot(null); // Clear after restore
    }
  }, [wizardStep, urlPreselectedSlot, slotsList]);

  const openNewBooking = () => {
    if (vehicles.length === 0) {
      showToast("Please register a vehicle first before making a booking.", "error");
      return;
    }
    initWizardDateTime();
    loadBuildingsList();
    setWizardStep(1);
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
  };



  // Stepper Next Step Validation
  const handleWizardNext = () => {
    if (wizardStep === 1) {
      if (!selectedVehicle) {
        showToast("Please select a vehicle to proceed.", "error");
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!selectedBuilding) {
        showToast("Please select a building to proceed.", "error");
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      // Step 3: Schedule Timing (Choose date & time first)
      if (!bookingDate || !endBookingDate || !startTime || !endTime) {
        showToast("Please specify the booking date and time duration.", "error");
        return;
      }

      const now = new Date();
      now.setSeconds(0, 0);

      const selectedStart = new Date(`${bookingDate}T${startTime}:00+07:00`);
      const selectedEnd = new Date(`${endBookingDate}T${endTime}:00+07:00`);

      const diffStartMinutes = (selectedStart.getTime() - now.getTime()) / (1000 * 60);
      if (diffStartMinutes < 15) {
        showToast("Start time must be at least 15 minutes from now.", "error");
        return;
      }

      const diffEndHours = (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60);
      if (diffEndHours < 3.99) {
        showToast("Minimum booking duration is 4 hours.", "error");
        return;
      }

      setDepositAmount(getEstimatedDeposit());
      setWizardStep(4);
    } else if (wizardStep === 4) {
      // Step 4: Floor & Slot Selection (Select spot based on chose timing)
      if (selectedVehicleTypeId !== 1) {
        if (!selectedSlotCode) {
          showToast("Please select a parking slot to proceed.", "error");
          return;
        }
        // Verify that the pre-selected or selected slot is indeed available in the current timeframe
        const currentSlotObj = slotsList.find(s => s.code === selectedSlotCode);
        if (currentSlotObj) {
          const isSlotOccupied = (currentSlotObj.status !== 0 && currentSlotObj.status !== 'Available') || currentSlotObj.isReserved;
          if (isSlotOccupied) {
            showToast("The selected slot is reserved or occupied during this timeframe. Please choose another slot.", "error");
            return;
          }
        }
      }
      setWizardStep(5);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(prev => prev - 1);
    }
  };

  const handleBookingSubmit = async () => {
    if (!user?.id) return;

    // Validate times in the frontend before requesting payment confirmation
    const now = new Date();
    now.setSeconds(0, 0);

    const selectedStart = new Date(`${bookingDate}T${startTime}:00+07:00`);
    const selectedEnd = new Date(`${endBookingDate}T${endTime}:00+07:00`);

    const diffStartMinutes = (selectedStart.getTime() - now.getTime()) / (1000 * 60);
    if (diffStartMinutes < 15) {
      showToast("Start time must be at least 15 minutes from now. Please adjust your timing.", "error");
      setWizardStep(4); // Force them back to step 4
      return;
    }

    const diffEndHours = (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60);
    if (diffEndHours < 3.99) {
      showToast("Minimum booking duration is 4 hours. Please adjust your timing.", "error");
      setWizardStep(4); // Force them back to step 4
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const payload: any = {
        accountId: user.id,
        licensePlate: selectedVehicle,
        buildingId: parseInt(selectedBuilding),
        plannedCheckinTime: formatLocalVNTime(selectedStart),
        plannedCheckoutTime: formatLocalVNTime(selectedEnd)
      };

      if (selectedVehicleTypeId !== 1 && selectedSlotId) {
        payload.slotId = selectedSlotId;
      }

      const res = await api.post<any>('/bookings', payload);
      if (res.success && res.data) {
        setCreatedBookingId(res.data.id);
        setDepositAmount(res.data.depositAmount || getEstimatedDeposit());
        setShowBookingModal(false);
        setShowPaymentModal(true);
      } else {
        showToast(res.message || 'Failed to create booking.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errData = err.data as any;
        showToast(errData.message || 'Error processing reservation.', 'error');
      } else {
        showToast('Connection error. Booking could not be completed.', 'error');
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // ─── Payment Procedures ─────────────────────────────────────────────
  const handleCancelCreatedBooking = async () => {
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
      fetchActiveData();
    } catch (err) {
      console.error(err);
      showToast('An error occurred while cancelling the booking.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayLater = () => {
    setShowPaymentModal(false);
    setCreatedBookingId(null);
    fetchActiveData();
    showToast('Booking reserved! Please pay the deposit within 15 minutes in your Payments dashboard.', 'success');
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

  // ─── Modify Booking Actions ──────────────────────────────────────────
  const openModifyModal = (booking: BookingRecord) => {
    setModifyingBooking(booking);
    
    // Check-in Date/Time
    const dtIn = new Date(booking.plannedCheckinTime);
    const yearIn = dtIn.getFullYear();
    const monthIn = String(dtIn.getMonth() + 1).padStart(2, '0');
    const dateIn = String(dtIn.getDate()).padStart(2, '0');
    setNewCheckinDate(`${yearIn}-${monthIn}-${dateIn}`);

    const hoursIn = String(dtIn.getHours()).padStart(2, '0');
    const minutesIn = String(dtIn.getMinutes()).padStart(2, '0');
    setNewCheckinTime(`${hoursIn}:${minutesIn}`);

    // Check-out Date/Time
    const dtOut = new Date(booking.plannedCheckoutTime);
    const yearOut = dtOut.getFullYear();
    const monthOut = String(dtOut.getMonth() + 1).padStart(2, '0');
    const dateOut = String(dtOut.getDate()).padStart(2, '0');
    setNewCheckoutDate(`${yearOut}-${monthOut}-${dateOut}`);

    const hoursOut = String(dtOut.getHours()).padStart(2, '0');
    const minutesOut = String(dtOut.getMinutes()).padStart(2, '0');
    setNewCheckoutTime(`${hoursOut}:${minutesOut}`);

    setShowModifyModal(true);
  };

  const handleSaveModify = async (payLater: boolean = false) => {
    if (!modifyingBooking) return;
    setIsSavingModify(true);
    try {
      if (modifyingBooking.bookingStatus === 'Pending') {
        if (!newCheckinDate || !newCheckinTime || !newCheckoutDate || !newCheckoutTime) {
          showToast('Please select valid check-in and check-out dates and times.', 'error');
          setIsSavingModify(false);
          return;
        }

        const checkinDate = new Date(`${newCheckinDate}T${newCheckinTime}:00+07:00`);
        const checkoutDate = new Date(`${newCheckoutDate}T${newCheckoutTime}:00+07:00`);

        if (checkoutDate <= checkinDate) {
          showToast('Check-out time must be after check-in time.', 'error');
          setIsSavingModify(false);
          return;
        }

        // Call PUT /api/bookings/{id} to save new times and recalculate deposit fee
        const res = await api.put<any>(`/bookings/${modifyingBooking.id}`, {
          plannedCheckinTime: formatLocalVNTime(checkinDate),
          plannedCheckoutTime: formatLocalVNTime(checkoutDate)
        });

        if (res.success && res.data) {
          if (!payLater) {
            // Pay Now: trigger payment redirect
            const payRes = await api.post<any>('/payments', {
              bookingId: modifyingBooking.id,
              paymentMethod: 'ONLINE_BANKING'
            });

            if (payRes.success && payRes.data && payRes.data.paymentUrl) {
              showToast('Redirecting to VNPay gateway...', 'success');
              window.location.href = payRes.data.paymentUrl;
              return;
            } else {
              showToast('Booking updated, but failed to create VNPay payment link.', 'info');
            }
          } else {
            showToast('Booking updated successfully (Pay Later)!', 'success');
          }
          setShowModifyModal(false);
          setModifyingBooking(null);
          fetchActiveData();
        } else {
          showToast('Failed to update booking.', 'error');
        }
      } else {
        // Confirmed or CheckedIn: only checkout time can be updated (extension)
        if (!newCheckoutDate || !newCheckoutTime) {
          showToast('Please select a valid checkout date and time.', 'error');
          setIsSavingModify(false);
          return;
        }

        const checkoutDate = new Date(`${newCheckoutDate}T${newCheckoutTime}:00+07:00`);
        const res = await api.post<any>(`/bookings/${modifyingBooking.id}/extend?requestedNewEndTime=${encodeURIComponent(formatLocalVNTime(checkoutDate))}&payLater=false`, null);
        if (res.success && res.data) {
          const extResult = res.data;
          if (extResult.paymentUrl) {
            showToast('Redirecting to VNPay for additional payment...', 'success');
            window.location.href = extResult.paymentUrl;
          } else {
            showToast(extResult.message || 'Booking extended successfully!', 'success');
            setShowModifyModal(false);
            setModifyingBooking(null);
            fetchActiveData();
          }
        } else {
          showToast('Failed to request booking extension.', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.data?.message || err?.message || 'Failed to save changes.';
      showToast(errMsg, 'error');
    } finally {
      setIsSavingModify(false);
    }
  };

  // ─── Extend Booking Actions ──────────────────────────────────────────
  const openExtendModal = (booking: BookingRecord) => {
    setExtendingBooking(booking);
    
    // Set default value: current planned checkout time plus 1 hour (in VN timezone)
    const currentCheckout = new Date(booking.plannedCheckoutTime);
    const dt = new Date(currentCheckout.getTime() + 60 * 60 * 1000);
    
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(dt);
    const year = parts.find(p => p.type === 'year')?.value ?? '';
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const day = parts.find(p => p.type === 'day')?.value ?? '';
    let hour = parts.find(p => p.type === 'hour')?.value ?? '00';
    if (hour === '24') hour = '00';
    const minute = parts.find(p => p.type === 'minute')?.value ?? '00';
    
    setNewCheckoutDate(`${year}-${month}-${day}`);
    setNewCheckoutTime(`${hour}:${minute}`);
    setShowExtendModal(true);
  };

  const handleSaveExtend = async (payLater: boolean = false) => {
    if (!extendingBooking) return;
    if (!newCheckoutDate || !newCheckoutTime) {
      showToast('Please select a valid date and time.', 'error');
      return;
    }
    setIsSavingExtend(true);
    try {
      const checkoutDate = new Date(`${newCheckoutDate}T${newCheckoutTime}:00+07:00`);
      const res = await api.post<any>(`/bookings/${extendingBooking.id}/extend?requestedNewEndTime=${encodeURIComponent(formatLocalVNTime(checkoutDate))}&payLater=${payLater}`, null);
      if (res.success && res.data) {
        const extResult = res.data;
        if (extResult.paymentUrl) {
          showToast('Redirecting to VNPay for additional payment...', 'success');
          window.location.href = extResult.paymentUrl;
        } else {
          showToast(extResult.message || 'Booking extended successfully!', 'success');
          setShowExtendModal(false);
          setExtendingBooking(null);
          fetchActiveData();
        }
      } else {
        showToast('Failed to request booking extension.', 'error');
      }
    } catch (err: any) {
      console.error('Extend error:', err);
      const errMsg = err?.data?.message || err?.message || 'Failed to extend booking. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsSavingExtend(false);
    }
  };

  // ─── Cancel Booking Actions ──────────────────────────────────────────
  const openCancelConfirm = (bookingId: number) => {
    setCancellingId(bookingId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    setIsCancellingReservation(true);
    try {
      await api.delete(`/bookings/${cancellingId}`);
      showToast('Booking cancelled successfully.', 'success');
      setShowCancelModal(false);
      setCancellingId(null);
      fetchActiveData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.data?.message || err?.message || 'Unable to cancel booking.';
      showToast(errMsg, 'error');
    } finally {
      setIsCancellingReservation(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // ─── Filtered Sessions for History ──────────────────────────────────
  const filteredSessions = historySessions.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch = String(s.id).includes(q) ||
      s.plate.toLowerCase().includes(q) ||
      s.zone.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalHistoryPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const paginatedHistory = filteredSessions.slice(
    (currentHistoryPage - 1) * ITEMS_PER_PAGE,
    currentHistoryPage * ITEMS_PER_PAGE
  );

  const handleExportPDF = () => {
    const safeFullName = escapeHtml(user?.fullName || 'Driver');
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
      const safeStatus = s.status === 'completed' || s.status === 'cancelled' ? s.status : 'cancelled';
      return `
                <tr>
                  <td>#${safeId}</td>
                  <td>${safePlate}</td>
                  <td>${safeCheckIn}</td>
                  <td>${safeCheckOut}</td>
                  <td>${safeDuration}</td>
                  <td>${safeZone}</td>
                  <td>${Math.round(s.fee).toLocaleString('vi-VN')} đ</td>
                  <td><span class="badge-${safeStatus}">${safeStatus}</span></td>
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

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">

      {/* ─── HEADER ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parking Utilities</h1>
          <p className="text-sm text-slate-400 mt-1">Manage active sessions, pre-booked reservations, and complete histories.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMainTab('sessions')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${mainTab === 'sessions'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
          >
            Sessions & Bookings
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${mainTab === 'history'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
          >
            Parking History
          </button>
        </div>
      </section>

      {/* ─── TAB 1: SESSIONS & BOOKINGS ─── */}
      {mainTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setSessionsTab('booked')}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${sessionsTab === 'booked'
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
              >
                Pre-booked ({bookings.length})
              </button>
              <button
                onClick={() => setSessionsTab('walkin')}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${sessionsTab === 'walkin'
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
              >
                Active Session ({activeSession ? 1 : 0})
              </button>
            </div>

            <button
              onClick={openNewBooking}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Timer className="w-4 h-4" />
              New Reservation
            </button>
          </div>

          {isLoadingActive ? (
            <div className="py-20 flex flex-col items-center gap-3 bg-white border border-slate-200/60 rounded-2xl">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading active reservations...</p>
            </div>
          ) : (
            <>
              {/* Pre-booked list */}
              {sessionsTab === 'booked' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookings.length === 0 ? (
                    <div className="col-span-full bg-white border border-[#e2e8f0] p-12 rounded-2xl text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No Active Reservations</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        You do not have any upcoming reservations. Click "New Reservation" above to book a parking spot in advance.
                      </p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                booking.bookingStatus === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : booking.bookingStatus === 'CheckedIn'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                              {booking.bookingStatus}
                            </span>
                            <h3 className="text-sm font-extrabold text-[#1B2A41] mt-2">
                              Reservation #{String(booking.id).slice(0, 8)}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold uppercase">License Plate</p>
                            <p className="text-xs font-black text-slate-700 mt-0.5">{formatPlate(booking.licensePlate)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold text-[10px] uppercase">Location</span>
                            </div>
                            <p className="font-bold text-slate-700">{booking.buildingName || 'Smart City Plaza'}</p>
                            {booking.slotCode && (
                              <p className="text-[10px] text-slate-400">Reserved Slot: <span className="font-extrabold text-emerald-600">{booking.slotCode}</span></p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold text-[10px] uppercase">Planned Time</span>
                            </div>
                            <p className="font-bold text-slate-700 text-[10px]">
                              {new Date(booking.plannedCheckinTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">Tổng thanh toán</p>
                            <p className="text-sm font-black text-emerald-700 mt-0.5">
                              {Math.round(booking.totalAmount ?? booking.depositAmount).toLocaleString('vi-VN')} đ
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {booking.bookingStatus === 'Pending' && (
                              <button
                                onClick={() => {
                                  setCreatedBookingId(booking.id);
                                  setDepositAmount(booking.totalAmount ?? booking.depositAmount);
                                  setShowPaymentModal(true);
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                              >
                                Pay Now
                              </button>
                            )}
                            {(booking.bookingStatus === 'Pending' || booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'CheckedIn') && (
                              <button
                                onClick={() => openModifyModal(booking)}
                                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            {booking.bookingStatus !== 'CheckedIn' && (
                              <button
                                onClick={() => openCancelConfirm(booking.id)}
                                className="px-3 py-2 text-white bg-red-500 hover:bg-red-600 text-xs font-bold rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Walk-in session list */}
              {sessionsTab === 'walkin' && (
                <div className="max-w-2xl mx-auto">
                  {!activeSession ? (
                    <div className="bg-white border border-[#e2e8f0] p-12 rounded-2xl text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Timer className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No Active Parking Session</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        There is no vehicle currently parked in the facility matching your registered license plates.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Car className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {activeSession.bookingId ? 'BOOKING CHECK-IN' : (activeSession.sessionStatus || 'ACTIVE')}
                            </span>
                            <h3 className="text-base font-extrabold text-[#1B2A41] mt-1">
                              Session #{String(activeSession.id).slice(0, 8)}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-[10px] font-bold uppercase">License Plate</p>
                          <p className="text-sm font-black text-slate-700 mt-0.5">{formatPlate(activeSession.licensePlateIn)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[10px] uppercase">Zone / Slot</span>
                          </div>
                          <p className="font-bold text-slate-700">
                            {activeSession.slotCode ? `${activeSession.zoneCode || 'Zone'} / ${activeSession.slotCode}` : 'Motorbike Shared Zone'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[10px] uppercase">Checked In At</span>
                          </div>
                          <p className="font-bold text-slate-700">
                            {new Date(activeSession.checkInTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Timer className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[10px] uppercase">Elapsed Time</span>
                          </div>
                          <p className="font-bold text-slate-700 font-mono text-sm">
                            {formatDuration(walkinDuration)}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-600">Accrued Parking Fee</span>
                        </div>
                        <p className="text-base font-black text-emerald-700">
                          {Math.round(walkinCost).toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      {activeSession.bookingId && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              const linkedBooking = bookings.find(b => b.id === activeSession.bookingId);
                              if (linkedBooking) {
                                openModifyModal(linkedBooking);
                              } else {
                                // Fallback: try fetching it
                                api.get<any>(`/bookings/${activeSession.bookingId}`).then(res => {
                                  if (res.success && res.data) {
                                    openModifyModal(res.data);
                                  } else {
                                    showToast('Failed to find booking information.', 'error');
                                  }
                                }).catch(() => {
                                  showToast('Failed to load booking details.', 'error');
                                });
                              }
                            }}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TAB 2: PARKING HISTORY ─── */}
      {mainTab === 'history' && (
        <div className="space-y-6">
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
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentHistoryPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium rounded-xl"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentHistoryPage(1); }}
                  className="px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-600 font-sans"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Active (Đang đỗ)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentHistoryPage(1); }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold px-2"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* TABLE LIST */}
            <div className="overflow-x-auto">
              {isLoadingHistory ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading history records...</p>
                </div>
              ) : (
                <>
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
                      {paginatedHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                            No historical records found matching current criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedHistory.map((s) => (
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
                              {s.fee > 0 ? `${Math.round(s.fee).toLocaleString('vi-VN')} đ` : '0 đ'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  s.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-[#ba1a1a] border border-red-200'
                                }`}>
                                {s.status === 'pending' ? 'active' : s.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* PAGINATION */}
                  {totalHistoryPages > 1 && (
                    <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
                      <span className="text-xs text-slate-400 font-medium">
                        Page {currentHistoryPage} of {totalHistoryPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          disabled={currentHistoryPage === 1}
                          onClick={() => setCurrentHistoryPage(prev => prev - 1)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={currentHistoryPage === totalHistoryPages}
                          onClick={() => setCurrentHistoryPage(prev => prev + 1)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. NEW RESERVATION STEPPER WIZARD MODAL ─── */}
      {mounted && showBookingModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/40">
              <div>
                <h2 className="text-lg font-extrabold text-[#1B2A41]">Reserve a Parking Space</h2>
                <p className="text-xs text-slate-400 mt-0.5">Follow the steps below to reserve your slot in advance.</p>
              </div>
              <button
                onClick={handleCloseBookingModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-8 py-4 bg-slate-50/20 border-b border-slate-100">
              <div className="flex justify-between items-center relative">
                {/* Connector line */}
                <div className="absolute left-0 right-0 h-0.5 bg-slate-100 -z-10 top-1/2 transform -translate-y-1/2"></div>

                {[
                  { num: 1, label: 'Vehicle' },
                  { num: 2, label: 'Building' },
                  { num: 3, label: 'Schedule' },
                  { num: 4, label: 'Floor & Slot' },
                  { num: 5, label: 'Summary' }
                ].map((item) => {
                  const isCurrent = wizardStep === item.num;
                  const isCompleted = wizardStep > item.num;
                  return (
                    <div key={item.num} className="flex flex-col items-center bg-white px-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent
                          ? 'bg-[#1B2A41] text-white ring-4 ring-slate-100'
                          : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : item.num}
                      </div>
                      <span className={`text-[10px] font-bold uppercase mt-1.5 tracking-wider ${isCurrent ? 'text-[#1B2A41]' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stepper Content Section (Scrollable) */}
            <div className="flex-grow p-8 overflow-y-auto min-h-[300px]">

              {/* STEP 1: Select Vehicle */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Choose Your Vehicle</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select a vehicle from your registered fleet.</p>
                  </div>
                  {vehicles.length === 0 ? (
                    <div className="p-6 bg-amber-50 border border-amber-200/60 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">directions_car</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">Không tìm thấy biển số xe</p>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                        Tài khoản của bạn chưa đăng ký phương tiện nào. Vui lòng thêm biển số xe trước khi thực hiện đặt chỗ gửi xe.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookingModal(false);
                          router.push('/dashboard/driver/vehicles');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-850 transition shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Đăng ký xe ngay
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vehicles.map((v) => (
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
                              <p className="text-sm font-bold text-slate-700">{formatPlate(v.licensePlate)}</p>
                              <p className="text-xs text-slate-400">{v.vehicleTypeName || 'Private Vehicle'}</p>
                            </div>
                          </div>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedVehicle === v.licensePlate ? 'border-[#00a86b] bg-[#00a86b] text-white' : 'border-slate-300'
                            }`}>
                            {selectedVehicle === v.licensePlate && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Select Building */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Choose Building</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select a parking facility building.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {buildings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBuilding(b.id.toString());
                          setSelectedSlotCode('');
                          setSelectedSlotId(null);
                        }}
                        className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32 ${selectedBuilding === b.id.toString()
                            ? 'border-[#00a86b] bg-emerald-50/10'
                            : 'border-[#e2e8f0] hover:border-slate-300 bg-slate-50/30'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedBuilding === b.id.toString() ? 'bg-[#00a86b] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>{b.code}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{b.totalFloor} floors</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-700 mt-2">{b.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{b.address || 'Smart City Plaza'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Floor & Slot Selection */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Choose Floor & Slot</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select floor level and specific spot.</p>
                  </div>

                  {selectedVehicleTypeId === 1 ? (
                    <div className="p-8 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Motorbike Parking Registration</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Motorbikes park in the shared Motorbike Zone on Floor 1. No specific slot selection is required. Please advance to schedule timing directly.
                      </p>
                    </div>
                  ) : floors.length === 0 ? (
                    <div className="p-8 bg-slate-50 border border-slate-200/60 rounded-2xl text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No active floors found in this building supporting cars advance reservations.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Floors Tab */}
                      <div className="flex gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto scrollbar-none">
                        {floors.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setSelectedFloor(f.id.toString());
                              setSelectedSlotCode('');
                              setSelectedSlotId(null);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap shrink-0 ${selectedFloor === f.id.toString()
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            {f.name || `Floor ${f.floorNumber}`}
                          </button>
                        ))}
                      </div>

                      {/* Slots Grid */}
                      {slotsList.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs italic">
                          No available parking slots found on this floor.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                          {slotsList.map((slot) => {
                            const isSelected = selectedSlotCode === slot.code;

                            const getStatusString = (s: number | string) => {
                              if (s === 0 || s === 'Available') return 'available';
                              if (s === 1 || s === 'Occupied') return 'occupied';
                              if (s === 2 || s === 'Blocked') return 'blocked';
                              if (s === 3 || s === 'Maintenance') return 'maintenance';
                              if (s === 4 || s === 'Reserved') return 'reserved';
                              return 'available';
                            };

                            const statusKey = slot.isReserved ? 'reserved' : getStatusString(slot.status);
                            const isDisabled = statusKey !== 'available';

                            let statusText = 'Available';
                            let statusClass = 'border-emerald-250/20 text-emerald-700 bg-white hover:bg-emerald-50/15 hover:scale-[1.02]';

                            if (statusKey === 'occupied' || statusKey === 'blocked') {
                              statusText = 'Occupied';
                              statusClass = 'border-slate-100 text-slate-350 bg-slate-50/40 cursor-not-allowed';
                            } else if (statusKey === 'maintenance') {
                              statusText = 'Maintenance';
                              statusClass = 'border-rose-100 text-rose-350 bg-rose-50/40 cursor-not-allowed';
                            } else if (statusKey === 'reserved') {
                              statusText = 'Reserved';
                              statusClass = 'border-amber-200 bg-amber-50/60 text-amber-700 cursor-not-allowed';
                            } else if (isSelected) {
                              statusText = 'Selected';
                              statusClass = 'border-[#00a86b] bg-[#00a86b] text-white shadow-md shadow-emerald-500/10';
                            }

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  setSelectedSlotCode(slot.code);
                                  setSelectedSlotId(slot.id);
                                }}
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
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Schedule Timing */}
              {wizardStep === 3 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="pb-2 border-b border-slate-100 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">Specify Arrival Time</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Choose date and parking duration (minimum 4 hours).</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">From Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          max={maxBookingDate}
                          onChange={(e) => {
                            setBookingDate(e.target.value);
                            if (endBookingDate && e.target.value > endBookingDate) {
                              setEndBookingDate(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">To Date</label>
                        <input
                          type="date"
                          value={endBookingDate}
                          min={bookingDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          max={maxBookingDate}
                          onChange={(e) => setEndBookingDate(e.target.value)}
                          className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none font-sans"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:border-[#00a86b] focus:ring-[#00a86b]/10 transition-all outline-none font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Booking Summary */}
              {wizardStep === 5 && (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="pb-2 border-b border-slate-100 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">Booking Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Please review your reservation parameters.</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-400">License Plate</span>
                      <span className="font-bold text-slate-800">{formatPlate(selectedVehicle)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-400">Building Facility</span>
                      <span className="font-bold text-slate-800">
                        {buildings.find(b => b.id.toString() === selectedBuilding)?.name || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-400">Selected Space</span>
                      <span className="font-bold text-emerald-700">
                        {selectedVehicleTypeId === 1 ? 'Motorbike Shared Zone' : `Slot ${selectedSlotCode}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Booking Time</span>
                      <span className="font-bold text-slate-800 text-right leading-relaxed">
                        From: {bookingDate} {startTime}<br />
                        To: {endBookingDate} {endTime}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Single payment amount = API depositAmount (full booking cost) */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-emerald-800">Tổng thanh toán (Total Payment)</h4>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {(() => {
                            if (!startTime || !endTime || !bookingDate || !endBookingDate) return 'Booking duration';
                            const s = new Date(`${bookingDate}T${startTime}:00+07:00`);
                            const e = new Date(`${endBookingDate}T${endTime}:00+07:00`);
                            const hrs = (e.getTime() - s.getTime()) / 3600000;
                            if (hrs <= 0) return 'Booking duration';
                            const h = Math.floor(hrs);
                            const m = Math.round((hrs - h) * 60);
                            return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEstimatingPrice && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
                        <p className="text-base font-black text-emerald-700">
                          {Math.round(depositAmount).toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/40">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={handleWizardBack}
                className="px-5 py-2.5 text-xs font-bold bg-white text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-350 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={handleWizardNext}
                  className="px-5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all flex items-center gap-1.5"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmittingBooking}
                  onClick={handleBookingSubmit}
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center gap-1.5"
                >
                  {isSubmittingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Confirm & Pay
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
        , document.body)}

      {/* ─── 2. DEPOSIT ONLINE PAYMENT MODAL ─── */}
      {mounted && showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">

              {/* Payment Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#006d43] flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8" />
              </div>

              {/* Header */}
              <h3 className="text-lg font-extrabold text-[#1B2A41]">Confirm Deposit Payment</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Pay the reservation deposit to confirm your parking space slot.
              </p>

              {/* Single price — depositAmount IS the total booking cost from API */}
              <div className="w-full space-y-2.5 my-6 text-xs text-left">
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">Tổng thanh toán (Total Payment)</span>
                    <p className="text-[10px] text-emerald-600 mt-1">
                      {(() => {
                        if (!startTime || !endTime || !bookingDate || !endBookingDate) return 'Booking duration';
                        const s = new Date(`${bookingDate}T${startTime}:00+07:00`);
                        const e = new Date(`${endBookingDate}T${endTime}:00+07:00`);
                        const hrs = (e.getTime() - s.getTime()) / 3600000;
                        if (hrs <= 0) return 'Booking duration';
                        const h = Math.floor(hrs);
                        const m = Math.round((hrs - h) * 60);
                        return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
                      })()}
                    </p>
                  </div>
                  <span className="text-base font-black text-[#006d43]">
                    {Math.round(depositAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-left flex gap-2.5 items-start mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Time Limit</h4>
                  <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
                    You have exactly 15 minutes to pay this deposit. If unpaid, the reserved space will be automatically cancelled.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleOnlinePaymentRedirect}
                  disabled={isPaying}
                  className="w-full py-3 bg-[#006d43] hover:bg-[#005c38] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#006d43]/10 transition-all flex items-center justify-center gap-1.5"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      Pay Online via VNPAY
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={handlePayLater}
                  disabled={isPaying || isCancelling}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  Pay Later (Thanh toán sau)
                </button>
                <button
                  onClick={handleCancelCreatedBooking}
                  disabled={isCancelling}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Booking'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
        , document.body)}

      {/* ─── 3. MODIFY BOOKING MODAL ─── */}
      {mounted && showModifyModal && modifyingBooking && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#1B2A41]">
                {modifyingBooking.bookingStatus === 'Pending' ? 'Modify Reservation Time' : 'Extend Stay'}
              </h3>
              <button
                onClick={() => { setShowModifyModal(false); setModifyingBooking(null); }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-left">
              {modifyingBooking.bookingStatus === 'Pending' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Check-in Date</label>
                    <input
                      type="date"
                      value={newCheckinDate}
                      min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      max={maxBookingDate}
                      onChange={(e) => setNewCheckinDate(e.target.value)}
                      className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-emerald-600 outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Check-in Time</label>
                    <input
                      type="time"
                      value={newCheckinTime}
                      onChange={(e) => setNewCheckinTime(e.target.value)}
                      className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-emerald-600 outline-none font-sans"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Current Checkout Time</label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-xl text-slate-600 font-semibold font-sans">
                    {new Date(modifyingBooking.plannedCheckoutTime).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {modifyingBooking.bookingStatus === 'Pending' ? 'Check-out Date' : 'New Checkout Date'}
                </label>
                <input
                  type="date"
                  value={newCheckoutDate}
                  min={(() => {
                    const d = new Date(modifyingBooking.plannedCheckoutTime);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const date = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${date}`;
                  })()}
                  onChange={(e) => setNewCheckoutDate(e.target.value)}
                  className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-emerald-600 outline-none font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {modifyingBooking.bookingStatus === 'Pending' ? 'Check-out Time' : 'New Checkout Time'}
                </label>
                <input
                  type="time"
                  value={newCheckoutTime}
                  onChange={(e) => setNewCheckoutTime(e.target.value)}
                  className="w-full bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:border-emerald-600 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => { setShowModifyModal(false); setModifyingBooking(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              {modifyingBooking.bookingStatus === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleSaveModify(true)}
                    disabled={isSavingModify}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    Pay Later
                  </button>
                  <button
                    onClick={() => handleSaveModify(false)}
                    disabled={isSavingModify}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    {isSavingModify ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pay Now'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleSaveModify(false)}
                  disabled={isSavingModify}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  {isSavingModify ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm Extension'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        , document.body)} bord      {/* ─── 4. CANCEL BOOKING CONFIRM MODAL ─── */}
      {mounted && showCancelModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-[#1B2A41]">Cancel Reservation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to cancel this booking reservation?
              <br />
              <span className="text-[10px] text-amber-600 font-bold block mt-1">
                Notice: Cancellations within 1 hour of scheduled arrival forfeit the deposit.
              </span>
            </p>

            <div className="flex gap-2 justify-center mt-6">
              <button
                onClick={() => { setShowCancelModal(false); setCancellingId(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                No, Keep It
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancellingReservation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                {isCancellingReservation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
        , document.body)}

    </div>
  );
}
