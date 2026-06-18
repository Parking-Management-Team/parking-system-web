'use client';

import React, { useEffect, useMemo, useState } from 'react';
import mockData from './mocks/vehicle-checkin.mock.json';
/* ==========================================================
   TYPE DEFINITIONS
   Định nghĩa các kiểu dữ liệu dùng trong màn hình Vehicle Check-in
========================================================== */

// Loại xe hiện tại theo SRS chỉ xử lý chính: CAR và MOTORCYCLE
type VehicleType = 'CAR' | 'MOTORCYCLE';

// Loại khách khi check-in
type CustomerType = 'WALK_IN' | 'BOOKING' | 'MONTHLY';

// Loại thẻ vận hành
type CardType = 'NORMAL' | 'MONTHLY';

// Trạng thái thẻ
type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'LOST' | 'INACTIVE';

// Loại zone: GENERAL cho khách thường/booking, MONTHLY cho xe tháng
type ZoneAccessType = 'GENERAL' | 'MONTHLY';

// Trạng thái zone
type ZoneStatus = 'ACTIVE' | 'MAINTENANCE' | 'LOCKED';

// Trạng thái slot
type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'LOCKED';

// Trạng thái booking
type BookingStatus = 'CONFIRMED' | 'PENDING' | 'EXPIRED' | 'CANCELLED';

// Trạng thái monthly subscription
type MonthlySubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';

// Trạng thái parking session
type ParkingSessionStatus = 'ACTIVE' | 'LOST_CARD_REPORTED';

// Kiểu dữ liệu Card
type ParkingCard = {
  id: number;
  code: string;
  type: CardType;
  status: CardStatus;
  vehiclePlate: string | null;
  monthlySubscriptionId: number | null;
};

// Kiểu dữ liệu Zone
type ParkingZone = {
  id: number;
  code: string;
  name: string;
  buildingName: string;
  floorName: string;
  vehicleType: VehicleType;
  accessType: ZoneAccessType;
  status: ZoneStatus;
  capacity: number;
  occupied: number;
};

// Kiểu dữ liệu Slot
type ParkingSlot = {
  id: number;
  code: string;
  zoneId: number;
  vehicleType: VehicleType;
  accessType: ZoneAccessType;
  status: SlotStatus;
  assignedVehiclePlate: string | null;
};

// Kiểu dữ liệu Booking
type Booking = {
  id: number;
  code: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  status: BookingStatus;
  depositPaid: boolean;
  isWithinGrace: boolean;
  buildingName: string;
};

// Kiểu dữ liệu Monthly Subscription
type MonthlySubscription = {
  id: number;
  cardCode: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  status: MonthlySubscriptionStatus;
  buildingName: string;
  assignedZoneId: number | null;
  assignedSlotCode: string | null;
  validTo: string;
};

// Kiểu dữ liệu kiểm tra Pricing Policy giả lập
type PricingPolicyCheck = {
  vehicleType: VehicleType;
  validPolicyCount: number;
  windowsCover24Hours: boolean;
  windowsOverlap: boolean;
  message: string;
};

// Kiểu dữ liệu Parking Session
type ParkingSession = {
  id: number;
  sessionCode: string;
  licensePlate: string;
  vehicleType: VehicleType;
  customerType: CustomerType;
  cardId: number;
  cardCode: string;
  zoneId: number | null;
  zoneName: string;
  actualSlotId: number | null;
  actualSlotCode: string | null;
  checkInTime: string;
  status: ParkingSessionStatus;
};

// Kiểu dữ liệu tổng của file JSON mock
type VehicleCheckinMockData = {
  cards: ParkingCard[];
  zones: ParkingZone[];
  slots: ParkingSlot[];
  bookings: Booking[];
  monthlySubscriptions: MonthlySubscription[];
  pricingPolicyChecks: PricingPolicyCheck[];
  activeSessions: ParkingSession[];
};

/* ==========================================================
   MOCK DATA CAST
   Ép kiểu dữ liệu JSON để TypeScript hiểu đúng structure
========================================================== */

const typedMockData = mockData as VehicleCheckinMockData;

/* ==========================================================
   HELPER FUNCTIONS
   Các hàm nhỏ dùng để format và xử lý UI
========================================================== */

// Format thời gian check-in để hiển thị trong bảng session
const getCurrentDateTime = () => {
  return new Date().toLocaleString('vi-VN', { hour12: false });
};

// Chuẩn hóa biển số: xóa khoảng trắng và chuyển thành chữ hoa
const formatLicensePlate = (plate: string) => {
  return plate.trim().toUpperCase();
};

// Kiểm tra zone đã đầy chưa
const isZoneFull = (zone: ParkingZone) => {
  return zone.occupied >= zone.capacity;
};

// Lấy số chỗ còn lại của zone
const getSlotsLeft = (zone: ParkingZone) => {
  return zone.capacity - zone.occupied;
};

// Hiển thị tên loại khách cho dễ đọc
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

// Hiển thị tên loại xe cho dễ đọc
const getVehicleTypeLabel = (type: VehicleType) => {
  return type === 'CAR' ? 'Car' : 'Motorcycle';
};

// Màu badge cho session status
const getSessionStatusClassName = (status: ParkingSessionStatus) => {
  if (status === 'LOST_CARD_REPORTED') {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

// Màu badge cho card status
const getCardStatusClassName = (status: CardStatus) => {
  switch (status) {
    case 'AVAILABLE':
      return 'text-emerald-700';
    case 'ASSIGNED':
      return 'text-blue-700';
    case 'LOST':
      return 'text-red-700';
    case 'INACTIVE':
      return 'text-slate-500';
  }
};

/* ==========================================================
   MAIN COMPONENT
   Màn hình Vehicle Check-in cho Staff
========================================================== */

export default function VehicleCheckin() {
  /* ==========================================================
     STATE MOCK DATA
     Hiện tại lấy từ file JSON.
     Sau này gắn API thì thay các state này bằng dữ liệu response từ BE.
  ========================================================== */

  const [cards, setCards] = useState<ParkingCard[]>(typedMockData.cards);
  const [zones, setZones] = useState<ParkingZone[]>(typedMockData.zones);
  const [slots, setSlots] = useState<ParkingSlot[]>(typedMockData.slots);
  const [sessions, setSessions] = useState<ParkingSession[]>(
    typedMockData.activeSessions
  );

  /* ==========================================================
     STATE FORM CHECK-IN
     Các input Staff nhập trên màn hình
  ========================================================== */

  const [licensePlate, setLicensePlate] = useState('51A-123.45');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [customerType, setCustomerType] = useState<CustomerType>('WALK_IN');
  const [bookingCode, setBookingCode] = useState('BK-001');
  const [cardCode, setCardCode] = useState('Card 1');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(1);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');

  /* ==========================================================
     STATE CONFIRM ACTUAL SLOT
     Dùng cho ô tô Walk-in/Booking:
     check-in trước chỉ gợi ý Zone GENERAL, slot thật xác nhận sau.
  ========================================================== */

  const [selectedSlotBySessionId, setSelectedSlotBySessionId] = useState<
    Record<number, number>
  >({});

  /* ==========================================================
     API PLACEHOLDER
     Chừa sẵn chỗ để gắn API sau này.
     Hiện tại chưa gọi API thật, chỉ dùng JSON mock.
  ========================================================== */

  /*
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5029';

  const fetchCheckinData = async () => {
    // TODO API:
    // GET /api/cards
    // GET /api/zones
    // GET /api/slots
    // GET /api/parking-sessions/active
    // GET /api/pricing-policies/check-valid?vehicleType=CAR

    const response = await fetch(`${API_BASE_URL}/api/checkin/init`);
    const result = await response.json();

    setCards(result.data.cards);
    setZones(result.data.zones);
    setSlots(result.data.slots);
    setSessions(result.data.activeSessions);
  };
  */

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

  // Tìm booking đang được nhập
  const selectedBooking = typedMockData.bookings.find(
    (booking) => booking.code.toUpperCase() === bookingCode.trim().toUpperCase()
  );

  // Tìm monthly subscription theo card hoặc biển số
  const selectedMonthlySubscription = typedMockData.monthlySubscriptions.find(
    (subscription) =>
      subscription.cardCode.toUpperCase() === normalizedCardCode ||
      subscription.vehiclePlate.toUpperCase() === formattedPlate
  );

  // Tìm pricing policy check theo loại xe
  const pricingPolicyCheck = typedMockData.pricingPolicyChecks.find(
    (policy) => policy.vehicleType === vehicleType
  );

  // Tìm zone đang được chọn
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

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

  // Zone đã đầy
  const fullZones = useMemo(() => {
    return candidateZones.filter((zone) => isZoneFull(zone));
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

    const monthlySubscription = typedMockData.monthlySubscriptions.find(
      (subscription) => subscription.id === selectedCard.monthlySubscriptionId
    );

    if (monthlySubscription) {
      setCustomerType('MONTHLY');
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

  // Rule 2: Xe không được có session đang mở
  const hasActiveSession = sessions.some(
    (session) =>
      session.licensePlate.toUpperCase() === formattedPlate &&
      session.status === 'ACTIVE'
  );

  const hasNoActiveSession = !hasActiveSession;

  // Rule 3: Card phải hợp lệ theo loại khách
  const isCardValid = (() => {
    if (!selectedCard) return false;

    if (customerType === 'MONTHLY') {
      return selectedCard.type === 'MONTHLY' && selectedCard.status === 'ASSIGNED';
    }

    return selectedCard.type === 'NORMAL' && selectedCard.status === 'AVAILABLE';
  })();

  // Rule 4: Pricing Policy phải có đúng 1 policy hợp lệ, window phủ 24h và không overlap
  const isPricingPolicyValid =
    pricingPolicyCheck?.validPolicyCount === 1 &&
    pricingPolicyCheck.windowsCover24Hours &&
    !pricingPolicyCheck.windowsOverlap;

  // Rule 5: Booking hợp lệ khi chọn customer type là BOOKING
  const isBookingValid = (() => {
    if (customerType !== 'BOOKING') return true;

    if (!selectedBooking) return false;

    return (
      selectedBooking.status === 'CONFIRMED' &&
      selectedBooking.depositPaid &&
      selectedBooking.isWithinGrace &&
      selectedBooking.vehiclePlate.toUpperCase() === formattedPlate &&
      selectedBooking.vehicleType === vehicleType
    );
  })();

  // Rule 6: Monthly subscription hợp lệ khi chọn customer type là MONTHLY
  const isMonthlySubscriptionValid = (() => {
    if (customerType !== 'MONTHLY') return true;

    if (!selectedMonthlySubscription) return false;

    return (
      selectedMonthlySubscription.status === 'ACTIVE' &&
      selectedMonthlySubscription.vehiclePlate.toUpperCase() === formattedPlate &&
      selectedMonthlySubscription.vehicleType === vehicleType
    );
  })();

  // Rule 7: Có zone/slot phù hợp
  const isAllocationValid = (() => {
    // Ô tô tháng phải có slot tháng riêng
    if (customerType === 'MONTHLY' && vehicleType === 'CAR') {
      return Boolean(assignedMonthlySlot && assignedMonthlySlot.status === 'AVAILABLE');
    }

    // Các trường hợp còn lại cần có zone còn chỗ
    return Boolean(selectedZone && !isZoneFull(selectedZone));
  })();

  // Toàn bộ form hợp lệ thì mới cho check-in
  const canCheckin =
    isLicensePlateValid &&
    hasNoActiveSession &&
    isCardValid &&
    isPricingPolicyValid &&
    isBookingValid &&
    isMonthlySubscriptionValid &&
    isAllocationValid;

  /* ==========================================================
     APPLY BOOKING INFO
     Nút này dùng để giả lập lấy thông tin booking từ BE.
  ========================================================== */

  const handleApplyBookingInfo = () => {
    if (!selectedBooking) {
      alert('Booking not found.');
      return;
    }

    setLicensePlate(selectedBooking.vehiclePlate);
    setVehicleType(selectedBooking.vehicleType);
  };

  /* ==========================================================
     APPLY MONTHLY CARD INFO
     Nút này dùng để giả lập lấy thông tin từ Card MONTHLY.
  ========================================================== */

  const handleApplyMonthlyInfo = () => {
    if (!selectedMonthlySubscription) {
      alert('Monthly subscription not found.');
      return;
    }

    setLicensePlate(selectedMonthlySubscription.vehiclePlate);
    setVehicleType(selectedMonthlySubscription.vehicleType);
  };

  /* ==========================================================
     HANDLE CHECK-IN
     Tạo Parking Session giả lập.
     Sau này đổi phần này thành POST API.
  ========================================================== */

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra toàn bộ validation trước khi tạo session
    if (!canCheckin) {
      alert('Check-in failed. Please check the entered information.');
      return;
    }

    // Card bắt buộc phải tồn tại
    if (!selectedCard) {
      alert('Card not found.');
      return;
    }

    // Xác định zone name lưu vào session
    let finalZoneId: number | null = selectedZone?.id ?? null;
    let finalZoneName = selectedZone?.name ?? '-';

    // Với ô tô tháng, zone lấy từ slot tháng đã gán
    if (customerType === 'MONTHLY' && vehicleType === 'CAR') {
      const monthlyZone = zones.find(
        (zone) => zone.id === assignedMonthlySlot?.zoneId
      );

      finalZoneId = monthlyZone?.id ?? null;
      finalZoneName = monthlyZone?.name ?? 'Monthly Zone';
    }

    // Với ô tô tháng, slot có sẵn ngay vì đã được cấp riêng trong MONTHLY zone
    const finalSlotId =
      customerType === 'MONTHLY' && vehicleType === 'CAR'
        ? assignedMonthlySlot?.id ?? null
        : null;

    const finalSlotCode =
      customerType === 'MONTHLY' && vehicleType === 'CAR'
        ? assignedMonthlySlot?.code ?? null
        : null;

    // Tạo Parking Session giả lập
    const newSession: ParkingSession = {
      id: Date.now(),
      sessionCode: `SS-${Date.now().toString().slice(-5)}`,
      licensePlate: formattedPlate,
      vehicleType,
      customerType,
      cardId: selectedCard.id,
      cardCode: selectedCard.code,
      zoneId: finalZoneId,
      zoneName: finalZoneName,
      actualSlotId: finalSlotId,
      actualSlotCode: finalSlotCode,
      checkInTime: getCurrentDateTime(),
      status: 'ACTIVE',
    };

    /*
      TODO API:
      Sau này thay đoạn setState bên dưới bằng API thật:

      const response = await fetch(`${API_BASE_URL}/api/parking-sessions/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: formattedPlate,
          vehicleType,
          customerType,
          bookingCode: customerType === 'BOOKING' ? bookingCode : null,
          cardCode,
          recommendedZoneId: finalZoneId
        })
      });

      const result = await response.json();
      setSessions((prev) => [result.data, ...prev]);
    */

    // Thêm session mới lên đầu bảng
    setSessions((prev) => [newSession, ...prev]);

    // Cập nhật Card sang ASSIGNED sau khi check-in thành công
    setCards((prev) =>
      prev.map((card) =>
        card.id === selectedCard.id ? { ...card, status: 'ASSIGNED' } : card
      )
    );

    // Cập nhật số lượng occupied của zone
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === finalZoneId ? { ...zone, occupied: zone.occupied + 1 } : zone
      )
    );

    // Nếu là ô tô tháng thì slot tháng chuyển thành OCCUPIED ngay
    if (finalSlotId) {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === finalSlotId
            ? { ...slot, status: 'OCCUPIED', assignedVehiclePlate: formattedPlate }
            : slot
        )
      );
    }

    // Hiện success overlay
    setIsCheckedIn(true);

    // Tắt success overlay sau 3 giây
    setTimeout(() => setIsCheckedIn(false), 3000);
  };

  /* ==========================================================
     HANDLE CONFIRM ACTUAL SLOT
     Dành cho ô tô Walk-in/Booking.
     Sau khi xe đậu thật, Staff ghi nhận slot thực tế.
  ========================================================== */

  const handleConfirmActualSlot = (session: ParkingSession) => {
    const selectedSlotId = selectedSlotBySessionId[session.id];

    if (!selectedSlotId) {
      alert('Please select actual slot.');
      return;
    }

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

    if (!selectedSlot) {
      alert('Slot not found.');
      return;
    }

    if (selectedSlot.status !== 'AVAILABLE') {
      alert('This slot is not available.');
      return;
    }

    if (selectedSlot.zoneId !== session.zoneId) {
      alert('Slot must belong to the recommended GENERAL zone.');
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

    alert('Actual slot confirmed successfully.');
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
     UI RENDER
     Giao diện chính
  ========================================================== */

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Vehicle Check-in Portal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Staff manually checks vehicle information, card code, pricing policy
          and zone availability before creating a parking session.
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* LEFT SIDE */}
        <div className="xl:col-span-3 space-y-8">
          {/* CHECK-IN FORM */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Check-in Registration
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Walk-in/Booking uses NORMAL card. Monthly Subscription uses
                MONTHLY card.
              </p>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold uppercase tracking-wider text-slate-700"
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

                {/* CUSTOMER TYPE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Customer Type
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                  >
                    <option value="WALK_IN">Walk-in</option>
                    <option value="BOOKING">Booking</option>
                    <option value="MONTHLY">Monthly Subscription</option>
                  </select>
                </div>

                {/* CARD CODE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Card Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      contactless
                    </span>
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={cardCode}
                      onChange={(e) => setCardCode(e.target.value)}
                      placeholder="Example: CARD-000001"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase text-slate-700"
                    />
                  </div>

                  <p className="text-xs text-slate-400">
                    Enter or scan a card code. A linked vehicle plate will be
                    filled automatically.
                  </p>

                  {selectedCard && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                      <span className={getCardStatusClassName(selectedCard.status)}>
                        {selectedCard.type} · {selectedCard.status}
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
                </div>

                {/* BOOKING CODE */}
                {customerType === 'BOOKING' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Booking Code
                    </label>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={bookingCode}
                        onChange={(e) => setBookingCode(e.target.value)}
                        placeholder="Example: BK-001"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase text-slate-700"
                      />

                      <button
                        type="button"
                        onClick={handleApplyBookingInfo}
                        className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100"
                      >
                        Load
                      </button>
                    </div>
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

                {/* RECOMMENDED ZONE */}
                {!(customerType === 'MONTHLY' && vehicleType === 'CAR') && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Recommended Zone
                    </label>

                    <select
                      value={selectedZoneId ?? ''}
                      onChange={(e) => setSelectedZoneId(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                    >
                      {availableZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {getSlotsLeft(zone)} places left
                        </option>
                      ))}
                    </select>

                    {availableZones.length === 0 && (
                      <p className="text-xs text-red-600 font-bold">
                        No available zone for this vehicle type.
                      </p>
                    )}
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

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                <span className="material-symbols-outlined">login</span>
                Confirm Check-in & Create Parking Session
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
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-800">
              Zone Availability
            </h3>

            {/* AVAILABLE ZONES */}
            <div>
              <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3">
                Available Zones
              </h4>

              <div className="space-y-3">
                {availableZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-4 rounded-xl border border-emerald-100 bg-emerald-50"
                  >
                    <div className="flex justify-between text-sm font-bold text-slate-700">
                      <span>{zone.name}</span>
                      <span className="text-emerald-600">
                        {getSlotsLeft(zone)} left
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {zone.occupied}/{zone.capacity} occupied · {zone.accessType}
                    </p>
                  </div>
                ))}

                {availableZones.length === 0 && (
                  <p className="text-sm text-slate-400">No available zone.</p>
                )}
              </div>
            </div>

            {/* FULL ZONES */}
            <div>
              <h4 className="text-xs font-bold text-red-700 uppercase mb-3">
                Full Zones
              </h4>

              <div className="space-y-3">
                {fullZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-4 rounded-xl border border-red-100 bg-red-50"
                  >
                    <div className="flex justify-between text-sm font-bold text-slate-700">
                      <span>{zone.name}</span>
                      <span className="text-red-600">Full</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {zone.occupied}/{zone.capacity} occupied · {zone.accessType}
                    </p>
                  </div>
                ))}

                {fullZones.length === 0 && (
                  <p className="text-sm text-slate-400">No full zone.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ACTIVE PARKING SESSIONS TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Active Parking Sessions
            </h3>
            <p className="text-sm text-slate-500">
              Staff can view active sessions, handle lost card and confirm actual
              slot for car after parking.
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
                <th className="px-5 py-4 text-left">Action</th>
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
                      <button
                        type="button"
                        onClick={() => handleLostCard(session)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-bold hover:bg-red-100"
                      >
                        Lost Card
                      </button>
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

      {isCheckedIn && (
        <div className="fixed inset-0 z-[100] bg-emerald-500 flex flex-col items-center justify-center px-6 text-center text-white">
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
        </div>
      )}
    </div>
  );
}
