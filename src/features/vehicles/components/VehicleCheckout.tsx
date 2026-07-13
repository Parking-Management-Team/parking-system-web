'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { markCardLost } from '@/features/card/services/card.service';
import { incidentService } from '@/features/incident/services/incident.service';
import type { IncidentType } from '@/features/incident/types';
import {
  createCheckoutPayment,
  fetchCheckoutActiveSessions,
  startCheckout,
  completeCheckout,
  type CheckoutPayment,
  type CheckoutPaymentMethod,
  type CheckoutSession,
  type StartCheckoutResponse,
} from '@/features/vehicles/services/vehicle-checkout.service';
import { scanLicensePlate } from '@/features/vehicles/services/vehicle-checkin.service';

type CheckoutHistoryItem = {
  id: string;
  sessionId: number;
  licensePlate: string;
  cardCode: string;
  customerType: CheckoutSession['customerType'];
  checkInTime: string | null;
  checkOutTime: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
};

type CheckoutOverlay = {
  session: CheckoutSession;
  payment: CheckoutPayment;
  checkOutTime: string;
  exitPlate: string;
  duration: string;
};

type VehicleTypeFilter = 'ALL' | 'CAR' | 'MOTORCYCLE' | 'UNKNOWN';

const STAFF_ID = 2;
const HISTORY_STORAGE_KEY = 'pbms_staff_checkout_history';

const normalizeText = (value?: string | null) => String(value ?? '').trim().toUpperCase();
const normalizeComparable = (value?: string | null) =>
  normalizeText(value).replace(/[^A-Z0-9]/g, '');

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const getDurationLabel = (checkInTime?: string | null, checkOutTime?: string | null) => {
  if (!checkInTime) return '—';
  const start = new Date(checkInTime).getTime();
  const end = checkOutTime ? new Date(checkOutTime).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '—';

  const minutes = Math.max(1, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${remainingMinutes}m`;
};

const getVehicleTypeGroup = (vehicleType: string): VehicleTypeFilter => {
  const value = normalizeText(vehicleType);
  if (value.includes('MOTOR') || value.includes('BIKE') || value.includes('TWO')) {
    return 'MOTORCYCLE';
  }
  if (value.includes('CAR') || value.includes('AUTO')) return 'CAR';
  return 'UNKNOWN';
};

const readHistory = (): CheckoutHistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (items: CheckoutHistoryItem[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
};

export default function VehicleCheckout() {
  const { showToast } = useAuth();
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleTypeFilter>('ALL');
  const [exitPlate, setExitPlate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('CASH');
  const [history, setHistory] = useState<CheckoutHistoryItem[]>([]);
  const [overlay, setOverlay] = useState<CheckoutOverlay | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Fee calculation state
  const [calculatedFee, setCalculatedFee] = useState<StartCheckoutResponse | null>(null);
  const [lockedCheckoutTime, setLockedCheckoutTime] = useState<string | null>(null);

  // Webcam & LPR states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  // Enumerate cameras
  const enumerateCameras = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.warn('Camera API is not available.');
      return;
    }
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

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      showToast('Không thể mở camera: Trình duyệt không hỗ trợ hoặc kết nối không an toàn. Vui lòng sử dụng localhost hoặc HTTPS.', 'error');
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
      showToast('Camera lối ra hoạt động thành công!', 'success');
    } catch (err) {
      console.error('Không thể mở camera:', err);
      showToast('Không thể kết nối camera. Vui lòng cấp quyền.', 'error');
    }
  }, [selectedDeviceId, stream, showToast]);

  // Stop camera stream
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

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Capture frame to base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) {
      showToast('Vui lòng bật camera lối ra trước.', 'info');
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
    setCapturedImage(dataUrl);
    return dataUrl;
  }, [cameraActive, showToast]);

  // Run OCR on Backend Cloud API
  const performOCR = useCallback(async (base64Img: string) => {
    setIsScanning(true);
    setScanProgress('Đang quét biển số lối ra...');
    setOcrText('');

    try {
      const result = await scanLicensePlate({ image: base64Img });
      setOcrText(result.licensePlate);
      showToast(`Nhận diện biển số ra: ${result.licensePlate} (${Math.round(result.confidence * 100)}%)`, 'success');
      return result.licensePlate;
    } catch (err: any) {
      console.error('Lỗi OCR:', err);
      showToast(err.message || 'Lỗi trong quá trình quét OCR.', 'error');
      return '';
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [showToast]);

  const handleCheckoutScan = useCallback(async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      if (!selectedSession) {
        const queryKey = normalizeComparable(plate);
        const matched = sessions.find(
          s => normalizeComparable(s.cardCode) === queryKey || normalizeComparable(s.licensePlate) === queryKey
        );
        if (matched) {
          setSelectedSessionId(matched.id);
          setSearchQuery(matched.cardCode || matched.licensePlate);
          setCalculatedFee(null);
          setLockedCheckoutTime(null);
          setExitPlate(plate);
          showToast(`Tự động khớp phiên đỗ của xe: ${plate}`, 'success');
        } else {
          showToast(`Không tìm thấy xe đang đỗ có biển số: ${plate}`, 'error');
        }
      } else {
        setExitPlate(plate);
      }
    }
  }, [captureFrame, performOCR, selectedSession, sessions, showToast]);

  const handleMockScanCheckout = useCallback(() => {
    let targetPlate = '51A-999.99';
    if (selectedSession) {
      targetPlate = selectedSession.licensePlate;
    } else if (sessions.length > 0) {
      const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
      targetPlate = randomSession.licensePlate;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 300, 150);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(targetPlate, 150, 60);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('MOCK SCAN OUT', 150, 100);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    }
    showToast(`Giả lập quét biển số ra: ${targetPlate}`, 'success');

    if (!selectedSession) {
      const queryKey = normalizeComparable(targetPlate);
      const matched = sessions.find(
        s => normalizeComparable(s.cardCode) === queryKey || normalizeComparable(s.licensePlate) === queryKey
      );
      if (matched) {
        setSelectedSessionId(matched.id);
        setSearchQuery(matched.cardCode || matched.licensePlate);
        setCalculatedFee(null);
        setLockedCheckoutTime(null);
        setExitPlate(targetPlate);
      }
    } else {
      setExitPlate(targetPlate);
    }
  }, [showToast, selectedSession, sessions]);



  const filteredSessions = useMemo(() => {
    const fromTime = filterFrom ? new Date(filterFrom).getTime() : null;
    const toTime = filterTo ? new Date(filterTo).getTime() : null;

    return sessions.filter((session) => {
      const checkInTime = session.checkInTime
        ? new Date(session.checkInTime).getTime()
        : null;
      const vehicleGroup = getVehicleTypeGroup(session.vehicleType);

      const matchesVehicle =
        vehicleTypeFilter === 'ALL' || vehicleGroup === vehicleTypeFilter;

      const matchesFrom =
        fromTime == null ||
        checkInTime == null ||
        Number.isNaN(checkInTime) ||
        checkInTime >= fromTime;

      const matchesTo =
        toTime == null ||
        checkInTime == null ||
        Number.isNaN(checkInTime) ||
        checkInTime <= toTime;

      return matchesVehicle && matchesFrom && matchesTo;
    });
  }, [filterFrom, filterTo, sessions, vehicleTypeFilter]);

  const isFilterActive = Boolean(filterFrom || filterTo || vehicleTypeFilter !== 'ALL');
  const isPlateMatched =
    Boolean(selectedSession) &&
    normalizeComparable(exitPlate) === normalizeComparable(selectedSession?.licensePlate);

  const loadActiveSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      setSessions(await fetchCheckoutActiveSessions());
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not load active sessions.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setIsMounted(true);
    setHistory(readHistory());
    void loadActiveSessions();
    void enumerateCameras();
  }, [loadActiveSessions, enumerateCameras]);

  const selectSession = (session: CheckoutSession) => {
    setSelectedSessionId(session.id);
    setExitPlate('');
    setSearchQuery(session.cardCode || session.licensePlate);
    setCalculatedFee(null);
    setLockedCheckoutTime(null);
    setCapturedImage(null);
    setOcrText('');
  };

  const resetForNextVehicle = () => {
    setSelectedSessionId(null);
    setExitPlate('');
    setPaymentMethod('CASH');
    setSearchQuery('');
    setCalculatedFee(null);
    setLockedCheckoutTime(null);
    setCapturedImage(null);
    setOcrText('');
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const queryKey = normalizeComparable(searchQuery);
    if (!queryKey) {
      showToast('Please enter card code or license plate.', 'error');
      return;
    }

    const exactMatch =
      filteredSessions.find(
        (session) =>
          normalizeComparable(session.cardCode) === queryKey ||
          normalizeComparable(session.licensePlate) === queryKey
      ) ?? null;

    const partialMatches = filteredSessions.filter(
      (session) =>
        normalizeComparable(session.cardCode).includes(queryKey) ||
        normalizeComparable(session.licensePlate).includes(queryKey)
    );

    const matchedSession = exactMatch ?? partialMatches[0] ?? null;

    if (!matchedSession) {
      showToast('No active session found for this card or license plate.', 'error');
      return;
    }

    selectSession(matchedSession);
    showToast('Active session loaded. Please compare exit plate.', 'success');
  };

  const handleMarkLost = async () => {
    if (!selectedSession) return;

    if (!selectedSession.cardId) {
      showToast('This session does not have cardId from the system.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await markCardLost(selectedSession.cardId);
      await loadActiveSessions();
      showToast(`Card ${selectedSession.cardCode ?? selectedSession.cardId} was marked LOST.`, 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not mark this card as lost.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCheckout = async () => {
    if (!selectedSession) {
      showToast('Please search and load a session first.', 'error');
      return;
    }

    if (!exitPlate.trim()) {
      showToast('Please enter exit license plate for comparison.', 'error');
      return;
    }

    if (!isPlateMatched) {
      showToast('Exit plate does not match check-in plate. Please route to incident handling.', 'error');
      return;
    }

    const checkoutTimeStr = new Date().toISOString();
    setIsSubmitting(true);

    try {
      const res = await startCheckout(selectedSession.id, {
        checkOutTime: checkoutTimeStr,
        licensePlateOut: normalizeText(exitPlate),
        outStaffId: STAFF_ID,
        imageOut: capturedImage || undefined,
      });

      setCalculatedFee(res);
      setLockedCheckoutTime(checkoutTimeStr);
      showToast('Tính phí đỗ xe thành công. Vui lòng xác nhận thanh toán.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Không thể tính toán phí gửi xe.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedSession || !calculatedFee || !lockedCheckoutTime) {
      showToast('Vui lòng tính phí đỗ xe trước.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payment = await createCheckoutPayment(selectedSession, paymentMethod);
      await completeCheckout(selectedSession.id);

      const duration = getDurationLabel(selectedSession.checkInTime, lockedCheckoutTime);

      const nextHistory: CheckoutHistoryItem = {
        id: `${selectedSession.id}-${lockedCheckoutTime}`,
        sessionId: selectedSession.id,
        licensePlate: selectedSession.licensePlate,
        cardCode: selectedSession.cardCode ?? '—',
        customerType: selectedSession.customerType,
        checkInTime: selectedSession.checkInTime,
        checkOutTime: lockedCheckoutTime,
        amount: payment.amount,
        paymentMethod: String(payment.paymentMethod || paymentMethod),
        paymentStatus: String(payment.paymentStatus),
      };

      const newHistory = [nextHistory, ...history].slice(0, 50);
      setHistory(newHistory);
      writeHistory(newHistory);

      setOverlay({
        session: selectedSession,
        payment,
        checkOutTime: lockedCheckoutTime,
        exitPlate: normalizeText(exitPlate),
        duration,
      });

      await loadActiveSessions();
      resetForNextVehicle();
      showToast('Thực hiện check-out và thanh toán thành công!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not complete checkout flow.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const findUnpaidIncidentType = (incidentTypes: IncidentType[]) =>
    incidentTypes.find((type) => {
      const code = normalizeText(type.incidentCode);
      const name = normalizeText(type.incidentName);
      return (
        code === 'UNPAID_VEHICLE' ||
        code.includes('UNPAID') ||
        code.includes('PAYMENT') ||
        name.includes('UNPAID') ||
        name.includes('PAYMENT') ||
        name.includes('REFUSE') ||
        name.includes('KHONG THANH TOAN') ||
        name.includes('KHÔNG THANH TOÁN')
      );
    }) ?? null;

  const handleReportPaymentIssue = async () => {
    if (!overlay) return;

    setIsReporting(true);

    try {
      const incidentTypes = await incidentService.getIncidentTypes();
      const incidentType = findUnpaidIncidentType(incidentTypes);

      if (!incidentType) {
        showToast(
          'Missing incident type for unpaid/refused payment. Please ask Backend/Manager to add it first.',
          'error'
        );
        return;
      }

      await incidentService.create({
        sessionId: overlay.session.id,
        incidentTypeId: incidentType.id,
        description: `Driver refused or could not complete payment. Plate: ${overlay.session.licensePlate}. Card: ${overlay.session.cardCode ?? 'N/A'}. Amount: ${formatCurrency(overlay.payment.amount)}. Payment status: ${overlay.payment.paymentStatus}.`,
        penaltyFee: null,
      });

      showToast('Payment issue was reported to manager.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not report payment issue.',
        'error'
      );
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-108px)] max-w-[1500px] flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
              Staff Gate Exit
            </p>
            <h1 className="text-2xl font-black text-slate-950">Vehicle Check-out</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen((value) => !value)}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black ${
                isFilterActive
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
                }`}
            >
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              Filter
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              History
            </button>
            <button
              type="button"
              onClick={() => void loadActiveSessions()}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-lg">
                {isLoading ? 'progress_activity' : 'refresh'}
              </span>
              Refresh
            </button>
          </div>
        </div>

        <section className="shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value.toUpperCase())}
                placeholder="Scan/enter card code or license plate"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-mono text-xl font-black uppercase outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <button
              type="submit"
              className="h-14 rounded-2xl bg-emerald-600 px-8 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Load Session
            </button>
          </form>

          {isFilterOpen && (
            <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_180px_auto]">
              <FilterField label="From">
                <input
                  type="datetime-local"
                  value={filterFrom}
                  onChange={(event) => setFilterFrom(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </FilterField>
              <FilterField label="To">
                <input
                  type="datetime-local"
                  value={filterTo}
                  onChange={(event) => setFilterTo(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </FilterField>
              <FilterField label="Vehicle">
                <select
                  value={vehicleTypeFilter}
                  onChange={(event) => setVehicleTypeFilter(event.target.value as VehicleTypeFilter)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All</option>
                  <option value="CAR">Car</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </FilterField>
              <button
                type="button"
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                  setVehicleTypeFilter('ALL');
                }}
                className="self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <main className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
          {/* CỘT TRÁI: CAMERA VÀ THÔNG TIN CHECK-IN */}
          <div className="space-y-4 flex flex-col min-h-0">
            {/* Khung Camera lối ra */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Exit Camera · GATE-OUT-01
                </p>
              </div>

              <div className="relative aspect-video bg-slate-900 border-b border-slate-100 flex items-center justify-center overflow-hidden">
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
                    <p className="text-slate-400 text-xs font-semibold">Camera is not active.</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-32 border-4 border-dashed border-emerald-400/40 rounded-3xl relative">
                      <div className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-slate-950/80 text-emerald-400 px-1 py-0.5 rounded">
                        LPR ALIGNMENT
                      </div>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-emerald-400 text-xs font-black tracking-wider animate-pulse">{scanProgress}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
                    >
                      {devices.map((device, idx) => (
                        <option key={device.deviceId || idx} value={device.deviceId}>
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cameraActive ? stopCamera : startCamera}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        cameraActive
                          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                      {cameraActive ? 'Stop Cam' : 'Start Cam'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCheckoutScan}
                    disabled={isScanning || !cameraActive}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    Scan Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleMockScanCheckout}
                    className="rounded-xl bg-white hover:bg-slate-50 text-slate-600 py-2 text-xs font-semibold border border-slate-200 transition"
                  >
                    Mock Scan
                  </button>
                </div>

                {capturedImage && (
                  <div className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-4">
                    <div className="h-14 w-24 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={capturedImage} alt="Captured exit snapshot" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Detected Exit Plate</p>
                      <p className="font-mono text-xl font-black text-slate-900 tracking-wider mt-0.5">{exitPlate || '---'}</p>
                      {ocrText && <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Confidence: Passed</p>}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Thông tin check-in */}
            {selectedSession ? (
              <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">Checked-in info</h2>
                    <p className="text-xs font-semibold text-slate-500">
                      Loaded from card or license plate search.
                    </p>
                  </div>
                  {selectedSession.cardId && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleMarkLost()}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      Lost card
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-emerald-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                      Check-in plate
                    </p>
                    <p className="mt-1 break-all font-mono text-5xl font-black tracking-widest text-slate-950">
                      {selectedSession.licensePlate}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="Card" value={selectedSession.cardCode ?? '—'} mono />
                    <InfoBox label="Customer" value={selectedSession.customerType} />
                    <InfoBox label="Vehicle" value={selectedSession.vehicleType} />
                    <InfoBox label="Check-in" value={formatDateTime(selectedSession.checkInTime)} />
                    <InfoBox label="Duration" value={getDurationLabel(selectedSession.checkInTime)} />
                    <InfoBox
                      label="Zone / slot"
                      value={`${selectedSession.zoneCode ?? '—'} / ${selectedSession.slotCode ?? '—'}`}
                    />
                  </div>
                </div>
              </section>
            ) : (
              <section className="min-h-[150px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-center">
                <EmptyState icon="badge" text="Scan or enter a card code/license plate to load the vehicle." />
              </section>
            )}
          </div>

          {/* CỘT PHẢI: XÁC NHẬN THANH TOÁN VÀ THANH TOÁN */}
          <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-start">
              <h2 className="text-base font-black text-slate-900">Check-out confirmation</h2>
            <p className="text-xs font-semibold text-slate-500 mb-4">
                Compare plate at exit before creating payment.
              </p>

            {selectedSession ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Khung nhập biển số lối ra */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Exit license plate
                    </label>
                    <input
                      value={exitPlate}
                      onChange={(event) => setExitPlate(event.target.value.toUpperCase())}
                      placeholder="Enter plate seen at gate"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-3xl font-black uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  {/* Trạng thái khớp biển số */}
                  <div
                    className={`rounded-2xl border px-4 py-3 ${
                      !exitPlate
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : isPlateMatched
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-black">
                      <span className="material-symbols-outlined">
                        {!exitPlate ? 'visibility' : isPlateMatched ? 'check_circle' : 'error'}
                      </span>
                      {!exitPlate
                        ? 'Waiting for plate input'
                        : isPlateMatched
                          ? 'Plate matched'
                          : 'Plate mismatch - check plate or send to incident handling'}
                    </div>
                  </div>

                  {/* Phân đoạn 1: Khi chưa tính phí đỗ xe */}
                  {!calculatedFee ? (
                    <div className="pt-4">
                      <button
                        type="button"
                        disabled={!isPlateMatched || isSubmitting}
                        onClick={() => void handleStartCheckout()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <span className="material-symbols-outlined">calculate</span>
                        {isSubmitting ? 'Calculating...' : 'Calculate Fee'}
                      </button>
                    </div>
                  ) : (
                    /* Phân đoạn 2: Sau khi đã tính phí đỗ xe thành công, hiện hóa đơn chi tiết */
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Parking Bill Details</p>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-500">Checkout Time:</span>
                          <span className="font-mono font-bold text-slate-900">{formatDateTime(lockedCheckoutTime)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-500">Base Parking Fee:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(calculatedFee.totalFee)}</span>
                        </div>
                        {calculatedFee.penaltyFee > 0 && (
                          <div className="flex justify-between text-xs text-red-600">
                            <span className="font-semibold">Penalty Fee:</span>
                            <span className="font-bold">{formatCurrency(calculatedFee.penaltyFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2 text-sm">
                          <span className="font-black text-slate-900">Total Amount Due:</span>
                          <span className="font-black text-emerald-600 text-base">{formatCurrency(calculatedFee.amountDue)}</span>
                        </div>
                      </div>

                      {/* Chọn phương thức thanh toán */}
                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Payment method
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {(['CASH', 'ONLINE_BANKING'] as CheckoutPaymentMethod[]).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`rounded-2xl border px-4 py-3.5 text-sm font-black transition ${
                                paymentMethod === method
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                              {method === 'CASH' ? 'Cash' : 'Online banking'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nút thanh toán và các nút điều khiển */}
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleCompleteCheckout()}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <span className="material-symbols-outlined">payments</span>
                          {isSubmitting ? 'Confirming...' : 'Confirm Payment & Exit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalculatedFee(null);
                            setLockedCheckoutTime(null);
                          }}
                          className="text-xs font-black text-slate-400 hover:text-slate-600 text-center py-2 transition"
                        >
                          Recalculate Fee / Re-scan Plate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon="logout" text="Checkout confirmation appears after loading a vehicle." />
            )}
          </section>
        </main>
      </div>

      {isMounted &&
        isHistoryOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-slate-950/70 p-6 backdrop-blur-sm">
            <div className="mx-auto flex h-full max-w-5xl flex-col rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Checkout history</h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Recent vehicles that have exited the gate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
                  aria-label="Close history"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <EmptyState icon="history" text="No checkout history in this browser yet." />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {history.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-2xl font-black text-slate-900">
                              {item.licensePlate}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {item.cardCode} · {item.customerType}
                            </p>
                          </div>
                          <p className="text-right text-lg font-black text-emerald-700">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                          <p>In: {formatDateTime(item.checkInTime)}</p>
                          <p>Out: {formatDateTime(item.checkOutTime)}</p>
                          <p>Method: {item.paymentMethod}</p>
                          <p>Status: {item.paymentStatus}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {isMounted &&
        overlay &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-emerald-700 p-6 text-white">
            <div className="w-full max-w-4xl rounded-[2rem] bg-white/15 p-8 text-center shadow-2xl backdrop-blur-sm">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                <span className="material-symbols-outlined text-6xl">paid</span>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.4em] text-white/70">
                Checkout summary
              </p>
              <h2 className="mt-2 font-mono text-5xl font-black tracking-widest">
                {overlay.session.licensePlate}
              </h2>
              <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
                <OverlayInfo label="Card code" value={overlay.session.cardCode ?? '—'} />
                <OverlayInfo label="Exit plate" value={overlay.exitPlate} />
                <OverlayInfo label="Check-in time" value={formatDateTime(overlay.session.checkInTime)} />
                <OverlayInfo label="Check-out time" value={formatDateTime(overlay.checkOutTime)} />
                <OverlayInfo label="Duration" value={overlay.duration} />
                <OverlayInfo label="Payment method" value={String(overlay.payment.paymentMethod || paymentMethod)} />
                <OverlayInfo label="Payment status" value={String(overlay.payment.paymentStatus)} />
                <OverlayInfo label="Amount due" value={formatCurrency(overlay.payment.amount)} strong />
              </div>
              {overlay.payment.paymentUrl && (
                <a
                  href={overlay.payment.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700"
                >
                  Open online payment URL
                </a>
              )}
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {String(overlay.payment.paymentStatus).toUpperCase() !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSessions((current) =>
                        current.some((session) => session.id === overlay.session.id)
                          ? current
                          : [overlay.session, ...current]
                      );
                      setSelectedSessionId(overlay.session.id);
                      setExitPlate(overlay.exitPlate);
                      setSearchQuery(overlay.session.cardCode || overlay.session.licensePlate);
                      setOverlay(null);
                      showToast(
                        'Returned to checkout screen. Current pending payment is still open until Backend supports cancel/change payment.',
                        'info'
                      );
                    }}
                    className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
                  >
                    Back to checkout
                  </button>
                )}
                <button
                  type="button"
                  disabled={isReporting}
                  onClick={() => void handleReportPaymentIssue()}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isReporting ? 'Reporting...' : 'Report to manager'}
                </button>
                <button
                  type="button"
                  onClick={() => setOverlay(null)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50"
                >
                  Ready for next vehicle
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function InfoBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-black text-slate-800 ${
          mono ? 'font-mono' : ''
          }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function OverlayInfo({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-4">
      <p className="text-xs font-black uppercase text-white/60">{label}</p>
      <p className={`mt-1 font-black ${strong ? 'text-3xl' : 'text-xl'}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
      <span className="material-symbols-outlined text-5xl">{icon}</span>
      <p className="mx-auto mt-3 max-w-xs text-sm font-semibold">{text}</p>
    </div>
  );
}
