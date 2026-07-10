'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchCards } from '@/features/card/services/card.service';
import type { ParkingCard } from '@/features/card/types/card';
import { blacklistService } from '@/features/blacklist/services/blacklist.service';
import type { BlacklistDto } from '@/features/blacklist/types';
import {
  checkInVehicle,
  fetchActiveParkingSessions,
  fetchCheckinBookings,
  fetchCheckinBookingsByBuilding,
  scanLicensePlate,
  type VehicleCheckinBooking,
  type VehicleCheckinSession,
} from '@/features/vehicles/services/vehicle-checkin.service';
import {
  createCheckoutPayment,
  startCheckout,
  completeCheckout,
  type CheckoutPayment,
  type CheckoutPaymentMethod,
  type CheckoutSession,
  type StartCheckoutResponse,
} from '@/features/vehicles/services/vehicle-checkout.service';

const BUILDING_ID = 3;
const STAFF_ID = 2;
const VEHICLE_TYPE_ID_BY_TYPE = { CAR: 2, MOTORCYCLE: 3 };

// Text normalization helpers
const normalizeText = (val: string) => val.trim().toUpperCase().replace(/\s+/g, '');
const normalizeComparable = (val: string | null) => (val ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
};

const getDurationLabel = (checkInTime: string | null, checkOutTime: string = new Date().toISOString()) => {
  if (!checkInTime) return '—';
  try {
    const diffMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
    if (diffMs <= 0) return '0m';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  } catch {
    return '—';
  }
};

const isConfirmedBookingForPlate = (
  booking: VehicleCheckinBooking,
  formattedPlate: string
) => {
  const samePlate =
    normalizeComparable(booking.licensePlate) === normalizeComparable(formattedPlate);
  const status = normalizeText(booking.bookingStatus);
  if (!samePlate || status !== 'CONFIRMED') return false;

  if (!booking.checkinGraceUntil) return true;
  const graceUntil = new Date(booking.checkinGraceUntil).getTime();
  return Number.isNaN(graceUntil) || graceUntil >= Date.now();
};

export default function CombinedGatePage() {
  const { showToast } = useAuth();

  // General shared data
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [activeSessions, setActiveSessions] = useState<VehicleCheckinSession[]>([]);
  const [bookings, setBookings] = useState<VehicleCheckinBooking[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistDto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Camera LPR states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [capturedImageIn, setCapturedImageIn] = useState<string | null>(null);
  const [capturedImageOut, setCapturedImageOut] = useState<string | null>(null);
  const [gateMode, setGateMode] = useState<'IN' | 'OUT'>('IN');

  // Check-In specific form states
  const [checkinPlate, setCheckinPlate] = useState('');
  const [checkinVehicleType, setCheckinVehicleType] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
  const [checkinCardCode, setCheckinCardCode] = useState('');
  const [checkinIsSubmitting, setCheckinIsSubmitting] = useState(false);
  const [checkinOverlay, setCheckinOverlay] = useState<any | null>(null);

  // Check-Out specific form states
  const [checkoutSelectedSessionId, setCheckoutSelectedSessionId] = useState<number | null>(null);
  const [checkoutExitPlate, setCheckoutExitPlate] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<CheckoutPaymentMethod>('CASH');
  const [checkoutCalculatedFee, setCheckoutCalculatedFee] = useState<StartCheckoutResponse | null>(null);
  const [checkoutLockedTime, setCheckoutLockedTime] = useState<string | null>(null);
  const [checkoutIsSubmitting, setCheckoutIsSubmitting] = useState(false);
  const [checkoutOverlay, setCheckoutOverlay] = useState<any | null>(null);
  const [checkoutSearchQuery, setCheckoutSearchQuery] = useState('');

  // Selected session mapping
  const selectedCheckoutSession = useMemo(() => {
    return activeSessions.find(s => s.id === checkoutSelectedSessionId) ?? null;
  }, [activeSessions, checkoutSelectedSessionId]);

  // Derived lists
  const availableCards = useMemo(() => {
    return cards.filter(c => c.cardType === 'PARKING_CARD' && c.cardStatus === 'AVAILABLE');
  }, [cards]);

  const checkinFormattedPlate = normalizeText(checkinPlate);
  const checkinNormalizedCardCode = normalizeText(checkinCardCode);

  const matchedBooking = useMemo(() => {
    return bookings.find(b => isConfirmedBookingForPlate(b, checkinFormattedPlate)) ?? null;
  }, [bookings, checkinFormattedPlate]);

  const isCheckoutPlateMatched = useMemo(() => {
    if (!selectedCheckoutSession) return false;
    if (!checkoutExitPlate.trim()) return true;
    return normalizeComparable(selectedCheckoutSession.licensePlate) === normalizeComparable(checkoutExitPlate);
  }, [selectedCheckoutSession, checkoutExitPlate]);

  // Load gate data
  const loadGateData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [cardData, sessionData, bookingData, blacklistData] = await Promise.all([
        fetchCards(),
        fetchActiveParkingSessions(),
        fetchCheckinBookingsByBuilding(BUILDING_ID).catch(async () => {
          return fetchCheckinBookings().catch(() => []);
        }),
        blacklistService.getAll(1, 1000).catch(() => ({ items: [] })),
      ]);

      setCards(cardData);
      setActiveSessions(sessionData);
      setBookings(bookingData);
      setBlacklist(blacklistData.items ?? []);
    } catch (err) {
      console.error(err);
      showToast('Could not load portal data.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  // Enumerate cameras
  const enumerateCameras = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Không tìm thấy thiết bị camera:', err);
    }
  }, [selectedDeviceId]);

  // Start stream
  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      showToast('Camera API is not supported on this context.', 'error');
      return;
    }
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      showToast('Camera cổng chung đã sẵn sàng!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Không thể kết nối camera. Vui lòng cấp quyền.', 'error');
    }
  }, [selectedDeviceId, stream, showToast]);

  // Stop stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Switch camera device
  useEffect(() => {
    if (cameraActive && selectedDeviceId) {
      void startCamera();
    }
  }, [selectedDeviceId]);

  // Clean stream on unmount
  useEffect(() => {
    void loadGateData();
    void enumerateCameras();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadGateData, enumerateCameras]);

  // Capture frame
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) {
      showToast('Vui lòng bật camera cổng trước.', 'info');
      return null;
    }
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    if (gateMode === 'IN') {
      setCapturedImageIn(dataUrl);
    } else {
      setCapturedImageOut(dataUrl);
    }
    return dataUrl;
  }, [cameraActive, gateMode, showToast]);

  // OCR
  const performOCR = useCallback(async (base64Img: string) => {
    setIsScanning(true);
    setScanProgress('Đang nhận diện biển số...');
    setOcrText('');
    try {
      const result = await scanLicensePlate({ image: base64Img });
      setOcrText(result.licensePlate);
      showToast(`Nhận diện biển số thành công: ${result.licensePlate}`, 'success');
      return result.licensePlate;
    } catch (err: any) {
      showToast(err.message || 'Lỗi quét OCR.', 'error');
      return '';
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [showToast]);

  const handleSharedScan = useCallback(async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      if (gateMode === 'IN') {
        setCheckinPlate(plate);
      } else {
        setCheckoutExitPlate(plate);
      }
    }
  }, [captureFrame, performOCR, gateMode]);

  const handleMockScan = useCallback(() => {
    const mockPlates = ['51A-999.99', '29G1-888.88', '43B-777.77', '59S3-555.55'];
    const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 300, 150);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(randomPlate, 150, 65);
      ctx.fillStyle = '#10b981';
      ctx.font = '12px sans-serif';
      ctx.fillText(`MOCK SCAN (${gateMode})`, 150, 105);
      const dataUrl = canvas.toDataURL('image/jpeg');
      if (gateMode === 'IN') {
        setCheckinPlate(randomPlate);
        setCapturedImageIn(dataUrl);
      } else {
        setCheckoutExitPlate(randomPlate);
        setCapturedImageOut(dataUrl);
      }
    }
    showToast(`Giả lập quét biển số (${gateMode}): ${randomPlate}`, 'success');
  }, [gateMode, showToast]);

  // Checkin Submit Handler
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinFormattedPlate) {
      showToast('Vui lòng nhập biển số xe.', 'error');
      return;
    }
    if (!checkinNormalizedCardCode) {
      showToast('Vui lòng nhập hoặc quét thẻ.', 'error');
      return;
    }

    const card = cards.find(c => normalizeText(c.cardCode) === checkinNormalizedCardCode);
    if (!card) {
      showToast('Mã thẻ không hợp lệ.', 'error');
      return;
    }

    if (card.cardStatus !== 'AVAILABLE') {
      showToast('Thẻ không khả dụng hoặc đang được đỗ.', 'error');
      return;
    }

    // Check blacklist
    const plateKey = normalizeComparable(checkinFormattedPlate);
    const cardKey = normalizeComparable(checkinNormalizedCardCode);
    const isPlateBlack = blacklist.some(b => b.licensePlate && normalizeComparable(b.licensePlate) === plateKey);
    const isCardBlack = blacklist.some(b => b.cardCode && normalizeComparable(b.cardCode) === cardKey);

    if (isPlateBlack || isCardBlack) {
      showToast('Cảnh báo: Xe hoặc Thẻ này nằm trong danh sách đen!', 'error');
      return;
    }

    setCheckinIsSubmitting(true);
    try {
      const session = await checkInVehicle({
        licensePlate: checkinFormattedPlate,
        vehicleTypeId: VEHICLE_TYPE_ID_BY_TYPE[checkinVehicleType],
        cardCode: checkinNormalizedCardCode,
        buildingId: BUILDING_ID,
        staffId: STAFF_ID,
        imageIn: capturedImageIn || undefined,
        ...(matchedBooking ? { bookingId: matchedBooking.id } : {}),
      });

      await loadGateData();
      setCheckinCardCode('');
      setCapturedImageIn(null);
      setCheckinPlate('');

      setCheckinOverlay({
        session,
        vehicleType: checkinVehicleType,
        cardCode: checkinNormalizedCardCode,
      });

      showToast('Check-in thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi Check-in.', 'error');
    } finally {
      setCheckinIsSubmitting(false);
    }
  };

  // Search Session for Checkout
  const handleCheckoutSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = normalizeComparable(checkoutSearchQuery);
    if (!query) {
      showToast('Vui lòng nhập biển số hoặc mã thẻ để tìm.', 'error');
      return;
    }

    const session = activeSessions.find(
      s => normalizeComparable(s.cardCode) === query || normalizeComparable(s.licensePlate) === query
    );

    if (session) {
      setCheckoutSelectedSessionId(session.id);
      setCheckoutExitPlate('');
      setCheckoutCalculatedFee(null);
      setCheckoutLockedTime(null);
      setCapturedImageOut(null);
      setCheckoutSearchQuery(session.cardCode || session.licensePlate);
      showToast('Tìm thấy phiên đỗ xe chủ động!', 'success');
    } else {
      showToast('Không tìm thấy phiên đỗ xe đang hoạt động.', 'error');
    }
  };

  // Checkout Phase 1: Start/Calculate
  const handleCheckoutStart = async () => {
    if (!selectedCheckoutSession) return;
    if (!checkoutExitPlate.trim()) {
      showToast('Vui lòng nhập biển số ra để đối chiếu.', 'error');
      return;
    }
    if (!isCheckoutPlateMatched) {
      showToast('Cảnh báo: Biển số ra không khớp biển số vào!', 'error');
      return;
    }

    const timeStr = new Date().toISOString();
    setCheckoutIsSubmitting(true);
    try {
      const res = await startCheckout(selectedCheckoutSession.id, {
        checkOutTime: timeStr,
        licensePlateOut: normalizeText(checkoutExitPlate),
        outStaffId: STAFF_ID,
        imageOut: capturedImageOut || undefined,
      });

      setCheckoutCalculatedFee(res);
      setCheckoutLockedTime(timeStr);
      showToast('Tính toán tiền đỗ xe thành công.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể tính phí đỗ xe.', 'error');
    } finally {
      setCheckoutIsSubmitting(false);
    }
  };

  // Checkout Phase 2: Complete
  const handleCheckoutComplete = async () => {
    if (!selectedCheckoutSession || !checkoutCalculatedFee || !checkoutLockedTime) return;

    setCheckoutIsSubmitting(true);
    try {
      // Cast the session object structure safely to match CheckoutSession
      const mockCheckoutSession: CheckoutSession = {
        id: selectedCheckoutSession.id,
        sessionCode: selectedCheckoutSession.sessionCode || '',
        licensePlate: selectedCheckoutSession.licensePlate,
        vehicleType: selectedCheckoutSession.vehicleType,
        customerType: selectedCheckoutSession.customerType,
        cardId: selectedCheckoutSession.cardId ?? null,
        cardCode: selectedCheckoutSession.cardCode ?? null,
        vehicleId: selectedCheckoutSession.vehicleId ?? null,
        buildingId: selectedCheckoutSession.buildingId ?? BUILDING_ID,
        zoneId: selectedCheckoutSession.zoneId ?? null,
        zoneCode: selectedCheckoutSession.zoneName ?? null,
        slotId: selectedCheckoutSession.actualSlotId ?? null,
        slotCode: selectedCheckoutSession.actualSlotCode ?? null,
        bookingId: null,
        bookingCode: null,
        monthlySubscriptionId: null,
        subscriptionCode: null,
        monthlyValidTo: null,
        checkInTime: selectedCheckoutSession.checkInTime,
        status: selectedCheckoutSession.status || '',
        imageIn: selectedCheckoutSession.imageIn || null,
        imageOut: capturedImageOut || null,
      };

      const payment = await createCheckoutPayment(mockCheckoutSession, checkoutPaymentMethod);
      await completeCheckout(selectedCheckoutSession.id);

      setCheckoutOverlay({
        session: selectedCheckoutSession,
        payment,
        checkOutTime: checkoutLockedTime,
        exitPlate: checkoutExitPlate,
        duration: getDurationLabel(selectedCheckoutSession.checkInTime, checkoutLockedTime),
      });

      setCheckoutSelectedSessionId(null);
      setCheckoutExitPlate('');
      setCheckoutCalculatedFee(null);
      setCheckoutLockedTime(null);
      setCapturedImageOut(null);
      setCheckoutSearchQuery('');

      await loadGateData();
      showToast('Xe ra cổng thành công và hoàn tất giao dịch!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi thanh toán hoàn tất checkout.', 'error');
    } finally {
      setCheckoutIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto flex flex-col gap-4 max-w-[1600px]">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Combined Gate Portal</span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">Cổng Kiểm Soát Vào/Ra Đồng Thời</h1>
          </div>
          <button
            onClick={loadGateData}
            className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Tải Lại Dữ Liệu ({activeSessions.length} xe đang đỗ)
          </button>
        </div>

        {/* main workspace */}
        <div className="grid gap-4 xl:grid-cols-[460px_1fr]">
          {/* CỘT TRÁI: CAMERA ĐỒNG THỜI */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${gateMode === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-xs font-bold text-slate-700">CAMERA CỔNG CHUNG</span>
                </div>
                {/* Gate switch toggles */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setGateMode('IN')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                      gateMode === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    VÀO (IN)
                  </button>
                  <button
                    onClick={() => setGateMode('OUT')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                      gateMode === 'OUT' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    RA (OUT)
                  </button>
                </div>
              </div>

              {/* Stream Screen */}
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950">
                    <span className="material-symbols-outlined text-4xl text-slate-600">videocam_off</span>
                    <p className="text-slate-400 text-xs font-semibold">Camera chưa được kích hoạt.</p>
                    <button
                      onClick={startCamera}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                    >
                      Bật Camera
                    </button>
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-28 border-3 border-dashed border-emerald-400/40 rounded-2xl relative" />
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="h-7 w-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-emerald-400 text-xs font-bold tracking-wider animate-pulse">{scanProgress}</p>
                  </div>
                )}
              </div>

              {/* Camera Actions Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="grid gap-2 grid-cols-2">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none"
                  >
                    {devices.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`rounded-xl py-2 text-xs font-bold transition border ${
                      cameraActive ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}
                  >
                    {cameraActive ? 'Tắt Cam' : 'Bật Cam'}
                  </button>
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <button
                    onClick={handleSharedScan}
                    disabled={!cameraActive || isScanning}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white font-bold py-2.5 text-xs hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    Chụp & Quét LPR
                  </button>
                  <button
                    onClick={handleMockScan}
                    className="rounded-xl bg-white text-slate-600 border border-slate-200 font-semibold py-2.5 text-xs hover:bg-slate-50 transition"
                  >
                    Giả Lập Quét
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Previews */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center">
                <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">Ảnh Cổng Vào (IN)</p>
                <div className="h-20 w-full bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                  {capturedImageIn ? (
                    <img src={capturedImageIn} alt="In" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold">Chưa có ảnh vào</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center">
                <p className="text-[9px] font-black uppercase text-rose-600 mb-2">Ảnh Cổng Ra (OUT)</p>
                <div className="h-20 w-full bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                  {capturedImageOut ? (
                    <img src={capturedImageOut} alt="Out" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold">Chưa có ảnh ra</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: HAI FORM CHI TIẾT */}
          <div className="grid gap-4 md:grid-cols-2 min-h-0 flex-1">
            {/* FORM 1: VEHICLE CHECK-IN */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">login</span>
                    LÀM CỔNG VÀO (CHECK-IN)
                  </h2>
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5">MOCK ID: 3</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">Cấp thẻ và nhận diện xe vào bãi đỗ</p>

                <form onSubmit={handleCheckinSubmit} className="space-y-3.5 mt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Biển số xe vào</label>
                    <input
                      type="text"
                      value={checkinPlate}
                      onChange={(e) => setCheckinPlate(e.target.value.toUpperCase())}
                      placeholder="VD: 51A-123.45"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-mono text-base font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500">Vehicle Type</label>
                      <select
                        value={checkinVehicleType}
                        onChange={(e) => setCheckinVehicleType(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="CAR">Car</option>
                        <option value="MOTORCYCLE">Motorcycle</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Mã thẻ thông minh</label>
                      <input
                        type="text"
                        value={checkinCardCode}
                        onChange={(e) => setCheckinCardCode(e.target.value)}
                        placeholder="Quét thẻ từ"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Booking match box */}
                  {checkinFormattedPlate && (
                    <div className={`rounded-xl border p-3 flex items-center justify-between text-xs font-bold ${
                      matchedBooking ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <span>Trạng thái đặt lịch:</span>
                      <span>{matchedBooking ? `Khớp Lịch: ${matchedBooking.bookingCode}` : 'Vãng lai (Walk-in)'}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={checkinIsSubmitting}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 text-sm transition shadow-md shadow-emerald-600/10 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {checkinIsSubmitting ? 'Đang thực hiện check-in...' : 'Xác Nhận Cho Xe Vào'}
                  </button>
                </form>
              </div>

              {/* Show check-in success summary overlay inside form container */}
              {checkinOverlay && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 mt-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                    <span className="material-symbols-outlined">check_circle</span>
                    Vào bãi thành công
                  </div>
                  <div className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                    <p>Phiên ID: #{checkinOverlay.session.id}</p>
                    <p>Biển số: {checkinOverlay.session.licensePlate}</p>
                    <p>Mã thẻ: {checkinOverlay.cardCode}</p>
                    <p>Thời gian: {formatDateTime(checkinOverlay.session.checkInTime)}</p>
                  </div>
                  <button
                    onClick={() => setCheckinOverlay(null)}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 underline mt-1"
                  >
                    Đóng biên lai
                  </button>
                </div>
              )}
            </section>

            {/* FORM 2: VEHICLE CHECK-OUT */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-600 text-xl">logout</span>
                  LÀM CỔNG RA (CHECK-OUT)
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Tính tiền đỗ xe và đối chiếu biển số khi cho xe ra</p>

                {/* Tìm phiên đỗ xe đang đỗ */}
                <form onSubmit={handleCheckoutSearch} className="flex gap-2 mt-4">
                  <input
                    value={checkoutSearchQuery}
                    onChange={(e) => setCheckoutSearchQuery(e.target.value)}
                    placeholder="Mã thẻ / Biển số"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white rounded-xl px-4 text-xs font-bold hover:bg-slate-800"
                  >
                    Tìm
                  </button>
                </form>

                {selectedCheckoutSession ? (
                  <div className="space-y-3.5 mt-4">
                    {/* Session info loaded */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-500">Biển số vào:</span>
                        <span className="font-mono text-slate-900">{selectedCheckoutSession.licensePlate}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-500">Thời gian vào:</span>
                        <span>{formatDateTime(selectedCheckoutSession.checkInTime)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-500">Thời gian đỗ:</span>
                        <span>{getDurationLabel(selectedCheckoutSession.checkInTime)}</span>
                      </div>
                    </div>

                    {/* Exit plate comparison input */}
                    <div>
                      <label className="text-xs font-bold text-slate-500">Biển số lối ra</label>
                      <input
                        type="text"
                        value={checkoutExitPlate}
                        onChange={(e) => setCheckoutExitPlate(e.target.value.toUpperCase())}
                        placeholder="Nhập hoặc quét biển số ra"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Biển số khớp status block */}
                    <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                      !checkoutExitPlate ? 'bg-amber-50 border-amber-200 text-amber-700' : isCheckoutPlateMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">
                          {!checkoutExitPlate ? 'visibility' : isCheckoutPlateMatched ? 'check_circle' : 'error'}
                        </span>
                        {!checkoutExitPlate ? 'Đang đợi biển số ra...' : isCheckoutPlateMatched ? 'Biển số trùng khớp' : 'Biển số KHÔNG khớp! Kiểm tra lại.'}
                      </div>
                    </div>

                    {/* Calculation form switches */}
                    {!checkoutCalculatedFee ? (
                      <button
                        type="button"
                        onClick={handleCheckoutStart}
                        disabled={!isCheckoutPlateMatched || checkoutIsSubmitting}
                        className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 text-xs transition shadow-md shadow-rose-600/10 disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {checkoutIsSubmitting ? 'Đang tính toán...' : 'Tính Phí Gửi Xe'}
                      </button>
                    ) : (
                      <div className="space-y-3.5 border-t border-slate-100 pt-3">
                        {/* Bill Detail breakdown */}
                        <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100 text-xs space-y-1.5">
                          <p className="font-black text-rose-800 text-[10px] uppercase">Chi tiết hóa đơn gửi xe</p>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phí cơ bản:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(checkoutCalculatedFee.totalFee)}</span>
                          </div>
                          {checkoutCalculatedFee.penaltyFee > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold">
                              <span>Phí phạt sự cố:</span>
                              <span>{formatCurrency(checkoutCalculatedFee.penaltyFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-rose-200/60 pt-1.5 font-bold text-sm">
                            <span className="text-slate-900">Tổng thanh toán:</span>
                            <span className="text-rose-600">{formatCurrency(checkoutCalculatedFee.amountDue)}</span>
                          </div>
                        </div>

                        {/* Payment method */}
                        <div>
                          <label className="text-xs font-bold text-slate-500">Phương thức thanh toán</label>
                          <div className="mt-1.5 grid grid-cols-2 gap-2">
                            {(['CASH', 'ONLINE_BANKING'] as CheckoutPaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setCheckoutPaymentMethod(method)}
                                className={`rounded-xl border py-2 text-xs font-bold transition ${
                                  checkoutPaymentMethod === method
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản QR'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCheckoutComplete}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs transition"
                          >
                            Xác Nhận Đã Thu Tiền & Cho Xe Ra
                          </button>
                          <button
                            onClick={() => {
                              setCheckoutCalculatedFee(null);
                              setCheckoutLockedTime(null);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 text-center font-bold"
                          >
                            Quét lại/Tính phí lại
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-4 text-center p-4">
                    <span className="text-xs text-slate-400 font-semibold">Vui lòng quét hoặc nhập mã thẻ của xe ra</span>
                  </div>
                )}
              </div>

              {/* Show checkout success summary overlay inside form container */}
              {checkoutOverlay && (
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 space-y-2 mt-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                    <span className="material-symbols-outlined">check_circle</span>
                    Hóa đơn thanh toán ra bãi thành công
                  </div>
                  <div className="text-[11px] text-rose-700 leading-relaxed font-medium">
                    <p>Biển số: {checkoutOverlay.session.licensePlate}</p>
                    <p>Thời gian đỗ: {checkoutOverlay.duration}</p>
                    <p>Phương thức: {checkoutOverlay.payment.paymentMethod}</p>
                    <p>Tổng tiền thu: {formatCurrency(checkoutOverlay.payment.amount)}</p>
                  </div>
                  <button
                    onClick={() => setCheckoutOverlay(null)}
                    className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline mt-1"
                  >
                    Đóng biên lai
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* BOTTOM SECTION: CURRENT IN YARD ACTIVE SESSIONS */}
        <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-900">Danh sách xe đang đỗ trong bãi</h2>
            <p className="text-xs font-semibold text-slate-500">Các xe hiện có trong khu vực gửi xe của tòa nhà.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Biển số</th>
                  <th className="pb-3 pr-4">Loại xe</th>
                  <th className="pb-3 pr-4">Mã thẻ</th>
                  <th className="pb-3 pr-4">Giờ vào</th>
                  <th className="pb-3 pr-4">Thời gian đã đỗ</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 font-semibold">Không có xe nào đang đỗ trong bãi.</td>
                  </tr>
                ) : (
                  activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-4 text-slate-500">#{session.id}</td>
                      <td className="py-3 pr-4 font-mono font-bold text-slate-900">{session.licensePlate}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-600">{session.vehicleType}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{session.cardCode ?? '—'}</td>
                      <td className="py-3 pr-4 text-slate-500">{formatDateTime(session.checkInTime)}</td>
                      <td className="py-3 pr-4 text-slate-600 font-bold">{getDurationLabel(session.checkInTime)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setCheckoutSelectedSessionId(session.id);
                            setCheckoutExitPlate('');
                            setCheckoutCalculatedFee(null);
                            setCheckoutLockedTime(null);
                            setCapturedImageOut(null);
                            setCheckoutSearchQuery(session.cardCode || session.licensePlate);
                            setGateMode('OUT');
                            showToast(`Đã nạp xe ${session.licensePlate} vào khung Check-out.`, 'info');
                          }}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl px-3 py-1.5 font-bold text-[11px] transition"
                        >
                          Chọn xe ra
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
