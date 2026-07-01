'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchCards as fetchCardsFromApi } from '@/features/card/services/card.service';
import {
  checkInVehicle,
  checkEntryConditions,
  updateCheckinInfo,
  fetchActiveParkingSessions,
  type VehicleCheckinSession as ParkingSession,
} from '@/features/vehicles/services/vehicle-checkin.service';
import {
  fetchAllZones,
  fetchAllSlots,
  fetchActiveBookings,
  fetchActiveMonthlySubscriptions,
  type CheckinParkingZone,
  type CheckinParkingSlot,
  type CheckinBooking,
  type CheckinMonthlySubscription,
} from '@/features/vehicles/services/vehicle-checkin-data.service';

type VehicleType = 'CAR' | 'MOTORCYCLE';
type CustomerType = 'WALK_IN' | 'BOOKING' | 'MONTHLY';
type CardType = 'NORMAL' | 'MONTHLY';
type CardStatus =
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'ASSIGNED'
  | 'LOST'
  | 'BLOCKED'
  | 'INACTIVE'
  | 'UNKNOWN';
type ParkingSessionStatus = 'ACTIVE' | 'LOST_CARD_REPORTED';

type ParkingCard = {
  id: number;
  code: string;
  type: CardType;
  status: CardStatus;
  vehiclePlate: string | null;
  monthlySubscriptionId: number | null;
};

const formatLicensePlate = (plate: string) => plate.trim().toUpperCase();
const isZoneFull = (zone: CheckinParkingZone) => zone.occupied >= zone.capacity;
const getSlotsLeft = (zone: CheckinParkingZone) => zone.capacity - zone.occupied;

const getCustomerTypeLabel = (type: CustomerType) => {
  switch (type) {
    case 'WALK_IN':
      return 'Walk-in';
    case 'BOOKING':
      return 'Booking';
    case 'MONTHLY':
      return 'Monthly';
  }
};

const getVehicleTypeLabel = (type: ParkingSession['vehicleType']) => {
  if (type === 'UNKNOWN') return 'Unknown';
  return type === 'CAR' ? 'Car' : 'Motorcycle';
};

const getSessionStatusClassName = (status: ParkingSessionStatus) => {
  if (status === 'LOST_CARD_REPORTED') {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getCardStatusClassName = (status: CardStatus) => {
  switch (status) {
    case 'AVAILABLE':
      return 'text-emerald-700';
    case 'ACTIVE':
    case 'ASSIGNED':
      return 'text-blue-700';
    case 'LOST':
      return 'text-red-700';
    case 'BLOCKED':
      return 'text-slate-700';
    case 'INACTIVE':
    case 'UNKNOWN':
      return 'text-slate-500';
  }
};

export default function VehicleCheckin() {
  const { showToast } = useAuth();
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [zones, setZones] = useState<CheckinParkingZone[]>([]);
  const [slots, setSlots] = useState<CheckinParkingSlot[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [bookings, setBookings] = useState<CheckinBooking[]>([]);
  const [monthlySubscriptions, setMonthlySubscriptions] = useState<CheckinMonthlySubscription[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ==========================================================
     STATE FORM CHECK-IN
     Các input Staff nhập trên màn hình
  ========================================================== */

  const [licensePlate, setLicensePlate] = useState('51A-123.45');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const isBookingCheckin = true;
  const [bookingCode, setBookingCode] = useState('BK-001');
  const [cardCode, setCardCode] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(1);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [activeView, setActiveView] = useState<'CHECKIN' | 'SESSIONS'>('CHECKIN');

  /* ==========================================================
     STATE: RANDOM SLOT ASSIGNMENT TOGGLE
     Bật/tắt tự động gán slot ngẫu nhiên sau check-in.
  ========================================================== */

  const [autoAssignSlot, setAutoAssignSlot] = useState(true);

  /* ==========================================================
     STATE: ENTRY CONDITION CHECK
     Kiểm tra điều kiện trước khi cho phép check-in.
  ========================================================== */

  const [isCheckingEntry, setIsCheckingEntry] = useState(false);
  const [entryCheckResult, setEntryCheckResult] = useState<{
    allowed: boolean;
    reason?: string;
  } | null>(null);

  /* ==========================================================
     STATE: EDIT CHECK-IN MODAL
     Cho phép Staff chỉnh sửa thông tin check-in.
  ========================================================== */

  const [editingSession, setEditingSession] = useState<ParkingSession | null>(null);
  const [editForm, setEditForm] = useState({
    licensePlate: '',
    vehicleType: '' as VehicleType | '',
    zoneId: null as number | null,
    slotId: null as number | null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  /* ==========================================================
     STATE CONFIRM ACTUAL SLOT
     Dùng cho ô tô Walk-in/Booking:
     check-in trước chỉ gợi ý Zone GENERAL, slot thật xác nhận sau.
  ========================================================== */

  const [selectedSlotBySessionId, setSelectedSlotBySessionId] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAvailableCards = async () => {
    const apiCards = await fetchCardsFromApi();
    const parkingCards: ParkingCard[] = apiCards
      .filter((card) => card.cardType === 'PARKING_CARD')
      .map((card) => ({
        id: card.id,
        code: card.cardCode,
        type: 'NORMAL',
        status: card.cardStatus,
        vehiclePlate: card.vehiclePlate,
        monthlySubscriptionId: null,
      }));
    setCards(parkingCards);
  };

  const fetchActiveSessions = async () => {
    setSessions(await fetchActiveParkingSessions());
  };

  const fetchZones = async () => {
    try {
      setZones(await fetchAllZones());
    } catch (error) {
      console.error('Failed to load zones:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      setSlots(await fetchAllSlots());
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookings(await fetchActiveBookings());
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const fetchMonthlySubscriptions = async () => {
    try {
      setMonthlySubscriptions(await fetchActiveMonthlySubscriptions());
    } catch (error) {
      console.error('Failed to load monthly subscriptions:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchAvailableCards(),
      fetchActiveSessions(),
      fetchZones(),
      fetchSlots(),
      fetchBookings(),
      fetchMonthlySubscriptions(),
    ]).catch((error) => {
      console.error('Failed to load vehicle check-in data:', error);
    });
  }, []);

  /* ==========================================================
     FIND SELECTED DATA
     Tìm các object đang được chọn từ form
  ========================================================== */

  // Biển số đã được format
  const formattedPlate = formatLicensePlate(licensePlate);

  // Tìm card đang được chọn
  const normalizedCardCode = cardCode.trim().toUpperCase();

  const selectedCard = cards.find(
    (card) => card.code.toUpperCase() === normalizedCardCode
  );

  // Customer type is inferred from the scanned card. NORMAL cards can opt into
  // the booking flow; MONTHLY cards always use their subscription.
  const customerType: CustomerType =
    selectedCard?.type === 'MONTHLY'
      ? 'MONTHLY'
      : isBookingCheckin
        ? 'BOOKING'
        : 'WALK_IN';

  const selectedBooking = bookings.find(
    (booking) =>
      formatLicensePlate(booking.vehiclePlate) === formattedPlate &&
      booking.vehicleType === vehicleType
  );

  // Tìm monthly subscription theo card hoặc biển số
  const selectedMonthlySubscription = monthlySubscriptions.find(
    (subscription) =>
      subscription.cardCode.toUpperCase() === normalizedCardCode ||
      subscription.vehiclePlate.toUpperCase() === formattedPlate
  );

  // Tìm slot tháng đã gán cho xe tháng
  const assignedMonthlySlot = slots.find(
    (slot) =>
      slot.code === selectedMonthlySubscription?.assignedSlotCode &&
      slot.assignedVehiclePlate?.toUpperCase() === formattedPlate
  );

  /* ==========================================================
     FILTER RECOMMENDED ZONES
     Xe máy: gợi ý Zone còn capacity.
     Ô tô Walk-in/Booking: chỉ gợi ý Zone GENERAL.
     Ô tô Monthly: dùng Slot riêng trong Zone MONTHLY.
  ========================================================== */

  const candidateZones = useMemo(() => {
    return zones.filter((zone) => {
      // Chỉ lấy zone đúng loại xe
      const matchVehicleType = zone.vehicleType === vehicleType;

      // Zone phải đang hoạt động
      const isActiveZone = zone.status === 'ACTIVE';

      // Monthly car dùng MONTHLY zone, các trường hợp còn lại dùng GENERAL zone
      const matchAccessType =
        customerType === 'MONTHLY' && vehicleType === 'CAR'
          ? zone.accessType === 'MONTHLY'
          : zone.accessType === 'GENERAL';

      return matchVehicleType && isActiveZone && matchAccessType;
    });
  }, [zones, vehicleType, customerType]);

  // Zone còn chỗ
  const availableZones = useMemo(() => {
    return candidateZones.filter((zone) => !isZoneFull(zone));
  }, [candidateZones]);

  const filteredSessions = useMemo(() => {
    const normalizedSearch = sessionSearch.trim().toUpperCase().replace(/\s/g, '');

    if (!normalizedSearch) return sessions;

    return sessions.filter((session) =>
      session.licensePlate.toUpperCase().replace(/\s/g, '').includes(normalizedSearch)
    );
  }, [sessions, sessionSearch]);

  /* ==========================================================
     AUTO SELECT FIRST AVAILABLE ZONE
     Khi đổi loại xe hoặc loại khách thì tự chọn zone còn trống đầu tiên.
  ========================================================== */

  useEffect(() => {
    if (availableZones.length > 0) {
      setSelectedZoneId(availableZones[0].id);
    } else {
      setSelectedZoneId(null);
    }
  }, [availableZones]);

  /* ==========================================================
     SIMULATE CARD SWIPE
     Khi Staff nhập đúng Card Code, tự lấy biển số đã gắn với Card.
     NORMAL card AVAILABLE chưa gắn xe nên vẫn nhập biển số thủ công.
  ========================================================== */

  useEffect(() => {
    if (!selectedCard?.vehiclePlate) return;

    setLicensePlate(selectedCard.vehiclePlate);

    const monthlySubscription = monthlySubscriptions.find(
      (subscription) => subscription.id === selectedCard.monthlySubscriptionId
    );

    if (monthlySubscription) {
  setVehicleType(monthlySubscription.vehicleType);
}
  }, [selectedCard]);

  /* ==========================================================
     VALIDATION LOGIC
     Các rule giả lập theo FR-003.
     Sau này BE sẽ validate thật và trả lỗi về FE.
  ========================================================== */

  // Rule 1: Biển số không được rỗng
  const isLicensePlateValid = formattedPlate.length > 0;

  // ─── BLACKLIST VALIDATION ──────────────────────────────────────────
  const [blacklist, setBlacklist] = useState<any[]>([]);

  useEffect(() => {
    const loadBlacklist = async () => {
      try {
        const { blacklistService } = await import('@/features/blacklist/services/blacklist.service');
        const res = await blacklistService.getAll(1, 9999);
        if (res && res.items) {
          setBlacklist(res.items);
        }
      } catch (err) {
        console.error('Failed to load blacklist:', err);
      }
    };
    loadBlacklist();
  }, []);

  const isPlateBlacklisted = useMemo(() => {
    if (!formattedPlate) return false;
    const cleanPlate = formattedPlate.replace(/[^A-Z0-9]/g, '');
    return blacklist.some(
      (item) => item.licensePlate?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate
    );
  }, [blacklist, formattedPlate]);

  const isCardBlacklisted = useMemo(() => {
    if (!normalizedCardCode) return false;
    const cleanCard = normalizedCardCode.replace(/[^A-Z0-9]/g, '');
    return blacklist.some(
      (item) => item.cardCode?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCard
    );
  }, [blacklist, normalizedCardCode]);

  const blacklistReason = useMemo(() => {
    if (isPlateBlacklisted) {
      const cleanPlate = formattedPlate.replace(/[^A-Z0-9]/g, '');
      const match = blacklist.find((item) => item.licensePlate?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate);
      return `Vehicle ${formattedPlate} is blacklisted: "${match?.reason}"`;
    }
    if (isCardBlacklisted) {
      const cleanCard = normalizedCardCode.replace(/[^A-Z0-9]/g, '');
      const match = blacklist.find((item) => item.cardCode?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCard);
      return `Card ${normalizedCardCode} is blacklisted: "${match?.reason}"`;
    }
    return null;
  }, [blacklist, isPlateBlacklisted, isCardBlacklisted, formattedPlate, normalizedCardCode]);

  // FE chỉ validate các field bắt buộc; entry conditions do BE xử lý.
  const canCheckin =
    isLicensePlateValid &&
    selectedCard?.status === 'AVAILABLE' &&
    Boolean(vehicleType) &&
    entryCheckResult?.allowed === true;

  useEffect(() => {
    if (!selectedBooking) {
      setBookingCode('');
      return;
    }

    setBookingCode(selectedBooking.code);
    setVehicleType(selectedBooking.vehicleType);
  }, [selectedBooking]);

  /* ==========================================================
     APPLY MONTHLY CARD INFO
     Nút này dùng để giả lập lấy thông tin từ Card MONTHLY.
  ========================================================== */

  const handleApplyMonthlyInfo = () => {
    if (!selectedMonthlySubscription) {
      showToast('Monthly subscription not found.', 'error');
      return;
    }

    setLicensePlate(selectedMonthlySubscription.vehiclePlate);
    setVehicleType(selectedMonthlySubscription.vehicleType);
  };

  /* ==========================================================
     AUTO CHECK ENTRY CONDITIONS
     Tự động kiểm tra khi tất cả field bắt buộc đã nhập.
   ========================================================== */

  const hasRequiredFields = formattedPlate.length > 0 && normalizedCardCode.length > 0 && Boolean(vehicleType);

  useEffect(() => {
    if (!hasRequiredFields || !selectedCard) {
      setEntryCheckResult(null);
      return;
    }

    let cancelled = false;

    const runCheck = async () => {
      setIsCheckingEntry(true);
      try {
        const result = await checkEntryConditions({
          licensePlate: formattedPlate,
          vehicleTypeId: vehicleType === 'CAR' ? 2 : 1,
          cardCode: selectedCard.code,
          buildingId: 1,
        });
        if (!cancelled) {
          setEntryCheckResult(result);
          if (!result.allowed) {
            showToast(result.reason || 'Entry conditions not met.', 'error');
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Entry check failed.';
          setEntryCheckResult({ allowed: false, reason: message });
          showToast(message, 'error');
        }
      } finally {
        if (!cancelled) setIsCheckingEntry(false);
      }
    };

    runCheck();

    return () => { cancelled = true; };
  }, [formattedPlate, normalizedCardCode, vehicleType]);

  /* ==========================================================
     HANDLE CHECK-IN
     Gọi API BE thật để tạo Parking Session.
     Nếu autoAssignSlot=true và là CAR, randomly assign slot.
   ========================================================== */

const handleCheckin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!canCheckin || !selectedCard) {
    showToast('License plate, vehicle type and an available card are required.', 'error');
    return;
  }

  setIsSubmitting(true);

  try {
    await checkInVehicle({
      licensePlate: formattedPlate,
      vehicleTypeId: vehicleType === 'CAR' ? 2 : 1,
      cardCode: selectedCard.code,
      buildingId: 1,
      staffId: 2,
      randomizeSlot: autoAssignSlot && vehicleType === 'CAR',
    });

    await Promise.all([fetchActiveSessions(), fetchAvailableCards()]);

    setCardCode('');
    setEntryCheckResult(null);
    setIsCheckedIn(true);
    setTimeout(() => setIsCheckedIn(false), 3000);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check-in failed.';
    showToast(message, 'error');
  } finally {
    setIsSubmitting(false);
  }
};

  /* ==========================================================
     HANDLE CONFIRM ACTUAL SLOT
     Dành cho ô tô Walk-in/Booking.
     Sau khi xe đậu thật, Staff ghi nhận slot thực tế.
  ========================================================== */

  const handleConfirmActualSlot = (session: ParkingSession) => {
    const selectedSlotId = selectedSlotBySessionId[session.id];

    if (!selectedSlotId) {
      showToast('Please select actual slot.', 'error');
      return;
    }

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

    if (!selectedSlot) {
      showToast('Slot not found.', 'error');
      return;
    }

    if (selectedSlot.status !== 'AVAILABLE') {
      showToast('This slot is not available.', 'error');
      return;
    }

    if (selectedSlot.zoneId !== session.zoneId) {
      showToast('Slot must belong to the recommended GENERAL zone.', 'error');
      return;
    }

    /*
      TODO API:
      PUT /api/parking-sessions/{sessionId}/confirm-slot

      body:
      {
        slotId: selectedSlotId
      }
    */

    // Cập nhật session có slot thực tế
    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id
          ? {
              ...item,
              actualSlotId: selectedSlot.id,
              actualSlotCode: selectedSlot.code,
            }
          : item
      )
    );

    // Cập nhật slot sang OCCUPIED
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === selectedSlot.id
          ? { ...slot, status: 'OCCUPIED', assignedVehiclePlate: session.licensePlate }
          : slot
      )
    );

    showToast('Actual slot confirmed successfully.', 'success');
  };

  /* ==========================================================
     HANDLE LOST CARD
     Xử lý trường hợp mất thẻ/card.
  ========================================================== */

  const handleLostCard = (session: ParkingSession) => {
    const confirmed = confirm(
      `Confirm lost card for session ${session.sessionCode}?`
    );

    if (!confirmed) return;

    /*
      TODO API:
      PUT /api/parking-sessions/{sessionId}/lost-card

      BE nên:
      - tạo incident record
      - mark card LOST
      - giữ session ACTIVE để còn checkout xử lý ngoại lệ
    */

    // Đổi session sang trạng thái đã báo mất thẻ
    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id ? { ...item, status: 'LOST_CARD_REPORTED' } : item
      )
    );

    // Đổi card sang LOST
    setCards((prev) =>
      prev.map((card) =>
        card.id === session.cardId ? { ...card, status: 'LOST' } : card
      )
    );
  };

  /* ==========================================================
     GET AVAILABLE SLOTS FOR SESSION
     Lấy danh sách slot trống trong zone đã gợi ý.
  ========================================================== */

  const getAvailableSlotsForSession = (session: ParkingSession) => {
    return slots.filter(
      (slot) =>
        slot.zoneId === session.zoneId &&
        slot.vehicleType === 'CAR' &&
        slot.accessType === 'GENERAL' &&
        slot.status === 'AVAILABLE'
    );
  };

  /* ==========================================================
     HANDLE EDIT SESSION
     Mở modal chỉnh sửa thông tin check-in.
  ========================================================== */

  const handleOpenEdit = (session: ParkingSession) => {
    setEditingSession(session);
    setEditForm({
      licensePlate: session.licensePlate,
      vehicleType: session.vehicleType === 'UNKNOWN' ? '' : session.vehicleType,
      zoneId: session.zoneId,
      slotId: session.actualSlotId,
    });
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setEditForm({ licensePlate: '', vehicleType: '', zoneId: null, slotId: null });
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;

    setIsUpdating(true);

    try {
      await updateCheckinInfo(editingSession.id, {
        licensePlate: editForm.licensePlate.trim().toUpperCase(),
        vehicleTypeId: editForm.vehicleType === 'CAR' ? 2 : editForm.vehicleType === 'MOTORCYCLE' ? 1 : undefined,
        zoneId: editForm.zoneId ?? undefined,
        slotId: editForm.slotId,
      });

      // Update local sessions state
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? {
                ...s,
                licensePlate: editForm.licensePlate.trim().toUpperCase(),
                vehicleType: (editForm.vehicleType as ParkingSession['vehicleType']) || s.vehicleType,
                zoneId: editForm.zoneId ?? s.zoneId,
                actualSlotId: editForm.slotId,
                actualSlotCode: editForm.slotId
                  ? slots.find((sl) => sl.id === editForm.slotId)?.code ?? s.actualSlotCode
                  : s.actualSlotCode,
              }
            : s
        )
      );

      showToast('Check-in info updated successfully.', 'success');
      handleCloseEdit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed.';
      showToast(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  /* ==========================================================
     UI RENDER
     Giao diện chính
  ========================================================== */

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Vehicle Check-in Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Scan a card to identify the customer and complete vehicle check-in.
          </p>
        </div>

        <nav className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Check-in sections">
          <button
            type="button"
            onClick={() => setActiveView('CHECKIN')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
              activeView === 'CHECKIN'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Check-in
          </button>
          <button
            type="button"
            onClick={() => setActiveView('SESSIONS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
              activeView === 'SESSIONS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            Parking sessions
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${activeView === 'SESSIONS' ? 'bg-white/15' : 'bg-slate-100'}`}>
              {sessions.length}
            </span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      {activeView === 'CHECKIN' && (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* LEFT SIDE */}
        <div className="xl:col-span-3 space-y-8">
          {/* CHECK-IN FORM */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Check-in Registration
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Customer type loads automatically from the selected card.
                </p>
              </div>

            </div>

            <form onSubmit={handleCheckin} className="space-y-6">
              {/* FORM GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* LICENSE PLATE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="Example: 51A-123.45"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-mono text-lg font-bold uppercase tracking-wider ${
                      isPlateBlacklisted
                        ? 'border-red-300 bg-red-50/30 text-red-900 focus:ring-red-500'
                        : 'bg-slate-50 border-slate-200 focus:ring-emerald-500 text-slate-700'
                    }`}
                  />
                </div>

                {/* VEHICLE TYPE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                  >
                    <option value="CAR">Car</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                  </select>
                </div>

                {/* CARD CODE */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Card Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      contactless
                    </span>
                   <input 
                   type="text" 
                   value={cardCode} 
                   onChange={(e) => setCardCode(e.target.value.toUpperCase())} 
                   placeholder="Enter card code, EX:CARD12" 
                   className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-mono font-bold uppercase ${
                     isCardBlacklisted
                       ? 'border-red-300 bg-red-50/30 text-red-900 focus:ring-red-500'
                       : 'bg-slate-50 border-slate-200 focus:ring-emerald-500 text-slate-700'
                   }`} />
                  </div>

                  <p className="text-xs text-slate-400">
                    Staff must enter the exact physical card code. Only AVAILABLE cards from the server are accepted.
                  </p>

                  {selectedCard && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                      <span className={getCardStatusClassName(selectedCard.status)}>
                        {selectedCard.type} · {selectedCard.status}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                        {getCustomerTypeLabel(customerType)}
                      </span>
                      {selectedCard.vehiclePlate && (
                        <span className="text-emerald-600">
                          Plate loaded: {selectedCard.vehiclePlate}
                        </span>
                      )}
                    </div>
                  )}

                  {cardCode.trim() && !selectedCard && (
                    <p className="text-xs font-bold text-red-600">
                      Card code not found.
                    </p>
                  )}

                  {selectedCard && selectedCard.status !== 'AVAILABLE' && (
                    <p className="text-xs font-bold text-amber-600">
                      This card is {selectedCard.status}. Only AVAILABLE cards can be used for check-in.
                    </p>
                  )}
                </div>

                {/* BOOKING CODE */}
                {customerType === 'BOOKING' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Booking Code
                    </label>

                    <input
                      type="text"
                      value={bookingCode}
                      readOnly
                      placeholder="No booking code"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase text-slate-700"
                    />
                  </div>
                )}

                {/* MONTHLY INFO BUTTON */}
                {customerType === 'MONTHLY' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Monthly Subscription
                    </label>

                    <button
                      type="button"
                      onClick={handleApplyMonthlyInfo}
                      className="w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100"
                    >
                      Load Monthly Vehicle From Selected Card
                    </button>
                  </div>
                )}

                {/* MONTHLY CAR SLOT */}
                {customerType === 'MONTHLY' && vehicleType === 'CAR' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Assigned Monthly Slot
                    </label>

                    <div className="px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">
                      {assignedMonthlySlot
                        ? `${assignedMonthlySlot.code} - Monthly Zone`
                        : 'No assigned monthly slot found'}
                    </div>
                  </div>
                )}
              </div>

              {blacklistReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 my-4">
                  <span className="material-symbols-outlined text-red-600 shrink-0">block</span>
                  <div>
                    <h4 className="font-bold text-red-800 text-sm">Check-in Blocked (Blacklisted)</h4>
                    <p className="text-red-700 text-xs mt-0.5">{blacklistReason}</p>
                  </div>
                </div>
              )}

              {/* ENTRY CONDITION CHECK RESULT — only show errors */}
              {entryCheckResult && !entryCheckResult.allowed && (
                <div className="p-4 rounded-xl flex items-start gap-3 my-4 bg-amber-50 border border-amber-200">
                  <span className="material-symbols-outlined shrink-0 text-amber-600">warning</span>
                  <div>
                    <h4 className="font-bold text-sm text-amber-800">Entry Conditions Failed</h4>
                    {entryCheckResult.reason && (
                      <p className="text-xs mt-0.5 text-amber-700">{entryCheckResult.reason}</p>
                    )}
                  </div>
                </div>
              )}

              {isCheckingEntry && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                  Checking entry conditions...
                </div>
              )}

              {/* RANDOM SLOT ASSIGNMENT TOGGLE */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-500">casino</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Auto Random Slot Assignment</p>
                    <p className="text-xs text-slate-400">
                      {autoAssignSlot
                        ? 'Car will get a random available slot after check-in'
                        : 'Manual slot selection required after check-in'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAssignSlot(!autoAssignSlot)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    autoAssignSlot ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={autoAssignSlot}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoAssignSlot ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!canCheckin || isSubmitting}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                <span className="material-symbols-outlined">login</span>
                {isSubmitting ? 'Checking in...' : 'Confirm Check-in'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="xl:col-span-2 space-y-8">
          {/* CAMERA PREVIEW */}
          <div className="bg-slate-900 h-[240px] rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400">
              MANUAL INPUT SIMULATION
            </div>

            <div className="text-center -translate-y-5">
              <span className="material-symbols-outlined text-5xl text-slate-700">
                directions_car
              </span>
              <p className="text-slate-400 text-xs mt-2">
                Camera / RFID preview
              </p>
            </div>

            <div className="absolute inset-x-4 bottom-4 border border-emerald-500/40 bg-emerald-500/5 rounded-xl px-4 py-3 text-emerald-400 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span>PLATE</span>
                <span className="font-bold text-base">
                  {formattedPlate || 'NO PLATE'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs mt-1">
                <span>CARD</span>
                <span className="font-bold">{cardCode}</span>
              </div>
            </div>
          </div>

          {/* ZONE AVAILABILITY */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Open zones</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Live availability for {getVehicleTypeLabel(vehicleType).toLowerCase()} check-in.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            <div className="space-y-3 p-4">
              {availableZones.map((zone) => {
                const spacesLeft = getSlotsLeft(zone);
                const availabilityPercent = Math.round((spacesLeft / zone.capacity) * 100);
                const isNearlyFull = availabilityPercent <= 20;
                const isSelected = zone.id === selectedZoneId;

                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZoneId(zone.id)}
                    aria-pressed={isSelected}
                    className={`group w-full rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/70 shadow-sm shadow-emerald-900/5'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <p className="truncate text-sm font-bold text-slate-800">{zone.name}</p>
                        </div>
                        <p className="mt-1 pl-4 text-[11px] text-slate-500">
                          {zone.buildingName} · {zone.floorName}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className={`text-xl font-black tabular-nums ${isNearlyFull ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {spacesLeft}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">spaces open</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-[10px] font-bold tabular-nums text-slate-500">
                        {availabilityPercent}%
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1.5 border-t border-emerald-200/70 pt-3 text-[10px] font-bold text-emerald-700">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Recommended for this check-in
                      </div>
                    )}
                  </button>
                );
              })}

              {availableZones.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300">block</span>
                  <p className="mt-2 text-sm font-semibold text-slate-600">No open zone available</p>
                  <p className="mt-1 text-xs text-slate-400">Try another vehicle type or contact the floor operator.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      )}

      {/* ACTIVE PARKING SESSIONS TABLE */}
      {activeView === 'SESSIONS' && (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Active Parking Sessions
            </h3>
            <p className="text-sm text-slate-500">
              Staff can view active sessions, edit check-in info, handle lost card
              and confirm actual slot for car after parking.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="search"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search by license plate..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-4 text-left">Session</th>
                <th className="px-5 py-4 text-left">Plate</th>
                <th className="px-5 py-4 text-left">Vehicle</th>
                <th className="px-5 py-4 text-left">Customer</th>
                <th className="px-5 py-4 text-left">Card</th>
                <th className="px-5 py-4 text-left">Zone</th>
                <th className="px-5 py-4 text-left">Actual Slot</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((session) => {
                const availableSlotsForSession =
                  getAvailableSlotsForSession(session);

                const needConfirmSlot =
                  session.vehicleType === 'CAR' &&
                  session.customerType !== 'MONTHLY' &&
                  !session.actualSlotId;

                return (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-700">
                      {session.sessionCode}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-700">
                      {session.licensePlate}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {getVehicleTypeLabel(session.vehicleType)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {getCustomerTypeLabel(session.customerType)}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-700">
                      {session.cardCode}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {session.zoneName}
                    </td>

                    <td className="px-5 py-4">
                      {needConfirmSlot ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedSlotBySessionId[session.id] ?? ''}
                            onChange={(e) =>
                              setSelectedSlotBySessionId((prev) => ({
                                ...prev,
                                [session.id]: Number(e.target.value),
                              }))
                            }
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="">Select slot</option>

                            {availableSlotsForSession.map((slot) => (
                              <option key={slot.id} value={slot.id}>
                                {slot.code}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleConfirmActualSlot(session)}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-700">
                          {session.actualSlotCode ?? '-'}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-bold ${getSessionStatusClassName(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(session)}
                          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLostCard(session)}
                          className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-bold hover:bg-red-100"
                        >
                          Lost Card
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSessions.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    {sessionSearch.trim()
                      ? 'No parking session matches this license plate.'
                      : 'No active parking session.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ==========================================================
         EDIT CHECK-IN MODAL
         Cho phép Staff chỉnh sửa thông tin check-in.
      ========================================================== */}
      {isMounted && editingSession && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="material-symbols-outlined">edit</span>
                <h3 className="font-bold text-base">Edit Check-in Info</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Session Code (read-only) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Session Code
                </label>
                <input
                  type="text"
                  value={editingSession.sessionCode}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500"
                />
              </div>

              {/* License Plate */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  License Plate
                </label>
                <input
                  type="text"
                  value={editForm.licensePlate}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      licensePlate: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Vehicle Type
                </label>
                <select
                  value={editForm.vehicleType}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      vehicleType: e.target.value as VehicleType | '',
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep current</option>
                  <option value="CAR">Car</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                </select>
              </div>

              {/* Zone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Zone
                </label>
                <select
                  value={editForm.zoneId ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      zoneId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep current</option>
                  {zones
                    .filter((z) => z.status === 'ACTIVE')
                    .map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Slot */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Slot
                </label>
                <select
                  value={editForm.slotId ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      slotId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No slot</option>
                  {slots
                    .filter(
                      (s) =>
                        s.status === 'AVAILABLE' &&
                        (!editForm.zoneId || s.zoneId === editForm.zoneId)
                    )
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.code}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-transparent hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/10 disabled:bg-slate-300"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isMounted &&
        isCheckedIn &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-emerald-500 flex flex-col items-center justify-center px-6 text-center text-white">
            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center shadow-2xl shadow-emerald-900/20">
              <span className="material-symbols-outlined text-7xl">
                check_circle
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mt-8">
              Check-in Successful!
            </h2>
            <p className="text-lg text-white/85 mt-3">
              Parking session has been created for
            </p>
            <p className="font-mono text-3xl md:text-4xl font-black tracking-wider mt-2">
              {formattedPlate}
            </p>
            <button
              type="button"
              onClick={() => setIsCheckedIn(false)}
              className="mt-10 px-8 py-3 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors"
            >
              Continue
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
