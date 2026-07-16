'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { fetchCards } from '@/features/card/services/card.service';
import type { ParkingCard } from '@/features/card/types/card';
import { blacklistService, type BlacklistDto } from '@/features/blacklist';
import { api } from '@/lib/api/client';
import {
  checkInVehicle,
  fetchActiveParkingSessions,
  fetchCheckinBookings,
  fetchCheckinBookingsByBuilding,
  fetchAvailableSlotsForReallocation,
  scanLicensePlate,
  type VehicleCheckinBooking,
  type VehicleCheckinSession,
  type ReallocateSlotDto,
} from '@/features/vehicles/services/vehicle-checkin.service';
import { ApiError } from '@/lib/api/client';

type GateOverlay =
  | {
    type: 'success';
    title: string;
    message: string;
    session?: VehicleCheckinSession;
    vehicleType: string;
    cardCode: string;
    checkInTime: string;
  }
  | {
    type: 'error';
    title: string;
    message: string;
  };

const BUILDING_ID = 3;
const STAFF_ID = 2;

const normalizeText = (value: string) => value.trim().toUpperCase();
const normalizeComparable = (value: string) =>
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

export default function VehicleCheckin({ compact = false }: { compact?: boolean } = {}) {
  const { showToast } = useAuth();

  const [buildingId, setBuildingId] = useState<number>(3);
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [activeSessions, setActiveSessions] = useState<VehicleCheckinSession[]>([]);
  const [bookings, setBookings] = useState<VehicleCheckinBooking[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistDto[]>([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
  const [cardCode, setCardCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlay, setOverlay] = useState<GateOverlay | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const [showReallocateBtn, setShowReallocateBtn] = useState(false);
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<ReallocateSlotDto[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const availableCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.cardType === 'PARKING_CARD' &&
          card.cardStatus === 'AVAILABLE'
      ),
    [cards]
  );

  const sortedAvailableCards = useMemo(
    () =>
      [...availableCards].sort((a, b) => {
        const codeA = a.cardCode || '';
        const codeB = b.cardCode || '';
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      }),
    [availableCards]
  );

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

  // Enumerate cameras
  const enumerateCameras = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.warn('Camera API (navigator.mediaDevices) is not available.');
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
      console.error('No camera device found:', err);
    }
  }, [selectedDeviceId]);

  // Start webcam stream
  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      showToast('Unable to open the camera: the browser is unsupported or the connection is insecure (HTTP). Use localhost or configure HTTPS.', 'error');
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
      showToast('Camera started successfully!', 'success');
    } catch (err) {
      console.error('Unable to open the camera:', err);
      showToast('Unable to connect to the camera. Please grant camera permission.', 'error');
    }
  }, [selectedDeviceId, stream, showToast]);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Capture frame from video stream to base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) {
      showToast('Please activate the camera first.', 'info');
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
    setScanProgress('Scanning license plate...');
    setOcrText('');

    try {
      const result = await scanLicensePlate({ image: base64Img });
      setOcrText(result.licensePlate);
      showToast(`License plate recognized: ${result.licensePlate} (Confidence: ${Math.round(result.confidence * 100)}%)`, 'success');
      return result.licensePlate;
    } catch (err: any) {
      console.error('OCR error:', err);
      showToast(err.message || 'An error occurred during the OCR scan.', 'error');
      return '';
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, [showToast]);

  const handleCheckinScan = useCallback(async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      setLicensePlate(plate);
      console.log('Check-in scan: availableCards =', availableCards);
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        setCardCode(randomCard.cardCode);
      } else {
        console.warn('Check-in scan: No available cards found!');
      }
    }
  }, [captureFrame, performOCR, availableCards]);

  const handleMockScanCheckin = useCallback(() => {
    const mockPlates = ['51A-999.99', '29G1-888.88', '43B-777.77', '59S3-555.55'];
    const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
    setLicensePlate(randomPlate);

    console.log('Check-in mock scan: availableCards =', availableCards);
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setCardCode(randomCard.cardCode);
    } else {
      console.warn('Check-in mock scan: No available cards found!');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 300, 150);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(randomPlate, 150, 60);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('MOCK SCAN IN', 150, 100);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    }
    showToast(`Simulated entry plate scan: ${randomPlate}`, 'success');
  }, [showToast, availableCards]);

  const formattedPlate = normalizeText(licensePlate);
  const normalizedCardCode = normalizeText(cardCode);

  const selectedCard = useMemo(
    () =>
      cards.find(
        (card) => normalizeText(card.cardCode) === normalizedCardCode
      ) ?? null,
    [cards, normalizedCardCode]
  );

  const matchedBooking = useMemo(
    () =>
      bookings.find((booking) =>
        isConfirmedBookingForPlate(booking, formattedPlate)
      ) ?? null,
    [bookings, formattedPlate]
  );

  const activeSessionCount = activeSessions.length;

  const showGateOverlay = useCallback((nextOverlay: GateOverlay) => {
    setOverlay(nextOverlay);
    window.setTimeout(() => {
      setOverlay((current) => (current === nextOverlay ? null : current));
    }, 3000);
  }, []);

  const loadGateData = useCallback(async () => {
    let currentBuildingId = buildingId;
    try {
      const buildingsRes = await api.get<any>('/Buildings/paged?pageIndex=1&pageSize=100');
      if (buildingsRes.success && buildingsRes.data?.items && Array.isArray(buildingsRes.data.items)) {
        const mapped = buildingsRes.data.items.map((b: any) => ({ id: b.id, name: b.name }));
        setBuildings(mapped);

        if (mapped.length > 0) {
          const hasCurrent = mapped.some((b: any) => b.id === buildingId);
          if (!hasCurrent) {
            currentBuildingId = mapped[0].id;
            setBuildingId(currentBuildingId);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch building list:', err);
    }

    try {
      const vehicleTypesRes = await api.get<any>('/vehicle-types');
      if (vehicleTypesRes && vehicleTypesRes.success && Array.isArray(vehicleTypesRes.data)) {
        setVehicleTypes(vehicleTypesRes.data);
        if (vehicleTypesRes.data.length > 0) {
          setVehicleTypeId((prev) => {
            if (prev) return prev;
            const carType = vehicleTypesRes.data.find((vt: any) => {
              const name = (vt.name ?? vt.typeName ?? vt.TypeName ?? '').toUpperCase();
              return name.includes('CAR') || name.includes('AUTO');
            });
            return carType ? (carType.id ?? carType.Id) : (vehicleTypesRes.data[0].id ?? vehicleTypesRes.data[0].Id);
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch vehicle types:', err);
    }

    // Staff check-in uses cards, active sessions, bookings, and blacklist data to operate the entry gate.
    // Booking and blacklist data are supplementary; auxiliary endpoint failures must not break the primary check-in flow.
    const [cardData, sessionData, bookingData, blacklistData] = await Promise.all([
      fetchCards(),
      fetchActiveParkingSessions(),
      fetchCheckinBookingsByBuilding(currentBuildingId).catch(async (error) => {
        console.warn(
          'Booking by building API is not ready; falling back to all bookings.',
          error
        );
        return fetchCheckinBookings().catch((fallbackError) => {
          console.warn('Booking API is not ready; booking detection is disabled.', fallbackError);
          return [];
        });
      }),
      blacklistService.getAll(1, 1000).catch((error) => {
        console.warn('Blacklist API is not ready; blacklist pre-check is disabled.', error);
        return {
          items: [],
          totalCount: 0,
          totalPages: 0,
          pageIndex: 1,
          pageSize: 1000,
        };
      }),
    ]);

    setCards(cardData);
    setActiveSessions(sessionData);
    setBookings(bookingData);
    setBlacklist(blacklistData.items ?? []);
  }, [buildingId]);

  useEffect(() => {
    setIsMounted(true);
    void enumerateCameras();
  }, [enumerateCameras]);

  useEffect(() => {
    void loadGateData().catch((error) => {
      const message =
        error instanceof Error ? error.message : 'Could not load check-in data.';
      showToast(message, 'error');
    });
  }, [loadGateData, showToast]);

  const checkBlacklistBeforeSubmit = () => {
    const plateKey = normalizeComparable(formattedPlate);
    const cardKey = normalizeComparable(normalizedCardCode);

    const plateBlock = blacklist.find(
      (item) =>
        item.licensePlate &&
        normalizeComparable(item.licensePlate) === plateKey
    );

    if (plateBlock) {
      return `Vehicle ${formattedPlate} is blacklisted: ${plateBlock.reason}`;
    }

    const cardBlock = blacklist.find(
      (item) =>
        item.cardCode &&
        normalizeComparable(item.cardCode) === cardKey
    );

    if (cardBlock) {
      return `Card ${normalizedCardCode} is blacklisted: ${cardBlock.reason}`;
    }

    return null;
  };

  const handleConfirmCheckin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formattedPlate) {
      showGateOverlay({
        type: 'error',
        title: 'Missing license plate',
        message: 'Please enter the vehicle license plate before check-in.',
      });
      return;
    }

    if (!normalizedCardCode) {
      showGateOverlay({
        type: 'error',
        title: 'Missing card code',
        message: 'Please enter or scan a parking card code.',
      });
      return;
    }

    const blacklistReason = checkBlacklistBeforeSubmit();
    if (blacklistReason) {
      showGateOverlay({
        type: 'error',
        title: 'Check-in blocked',
        message: blacklistReason,
      });
      return;
    }

    if (!selectedCard) {
      showGateOverlay({
        type: 'error',
        title: 'Card not found',
        message: `Card ${normalizedCardCode} does not exist in Card Management.`,
      });
      return;
    }

    if (selectedCard.cardStatus !== 'AVAILABLE') {
      showGateOverlay({
        type: 'error',
        title: 'Card is not available',
        message: `Card ${normalizedCardCode} is currently ${selectedCard.cardStatus}. Please use another available card.`,
      });
      return;
    }

    setIsSubmitting(true);
    setShowReallocateBtn(false);

    try {
      const selectedType = vehicleTypes.find((vt: any) => (vt.id ?? vt.Id) === vehicleTypeId);
      const vehicleTypeName = selectedType ? (selectedType.name ?? selectedType.typeName ?? selectedType.TypeName ?? '') : 'Unknown';

      const session = await checkInVehicle({
        licensePlate: formattedPlate,
        vehicleTypeId: matchedBooking && matchedBooking.vehicleTypeId
          ? matchedBooking.vehicleTypeId
          : vehicleTypeId!,
        cardCode: normalizedCardCode,
        buildingId: buildingId,
        staffId: STAFF_ID,
        imageIn: capturedImage || undefined,
        ...(matchedBooking ? { bookingId: matchedBooking.id } : {}),
      });

      await loadGateData();
      setCardCode('');
      setCapturedImage(null);

      showGateOverlay({
        type: 'success',
        title: 'Check-in successful',
        message: matchedBooking
          ? `Booking ${matchedBooking.bookingCode} was converted to a parking session.`
          : 'Walk-in parking session was created.',
        session,
        vehicleType: vehicleTypeName,
        cardCode: normalizedCardCode,
        checkInTime: session.checkInTime || new Date().toISOString(),
      });
    } catch (error) {
      let isSlotUnavailableError = false;
      let errMsg = 'This vehicle cannot be checked in. Please verify the information.';

      if (error instanceof ApiError && error.data && typeof error.data === 'object') {
        const body = error.data as { errorCode?: string; message?: string };
        if (body.errorCode === 'SLOT_NOT_AVAILABLE') {
          isSlotUnavailableError = true;
        }
        if (body.message) errMsg = body.message;
      } else if (error instanceof Error) {
        errMsg = error.message;
        if (error.message.includes('SLOT_NOT_AVAILABLE') || error.message.includes('occupied') || error.message.includes('unavailable')) {
          isSlotUnavailableError = true;
        }
      }

      if (isSlotUnavailableError && matchedBooking) {
        setShowReallocateBtn(true);
      }

      showGateOverlay({
        type: 'error',
        title: 'Check-in failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReallocate = async () => {
    if (!matchedBooking) return;
    try {
      setIsSubmitting(true);
      const slots = await fetchAvailableSlotsForReallocation(
        buildingId,
        matchedBooking.vehicleTypeId ?? vehicleTypeId!,
        matchedBooking.plannedCheckinTime || new Date().toISOString(),
        matchedBooking.plannedCheckoutTime || new Date(Date.now() + 4 * 3600000).toISOString()
      );
      setAvailableSlots(slots);
      setIsReallocateModalOpen(true);
    } catch (err) {
      showToast('Unable to load available parking spaces: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReallocateCheckin = async () => {
    if (!selectedSlotId || !matchedBooking) return;
    setIsReallocateModalOpen(false);
    setIsSubmitting(true);
    try {
      const selectedType = vehicleTypes.find((vt: any) => (vt.id ?? vt.Id) === vehicleTypeId);
      const vehicleTypeName = selectedType ? (selectedType.name ?? selectedType.typeName ?? selectedType.TypeName ?? '') : 'Unknown';

      const session = await checkInVehicle({
        licensePlate: formattedPlate,
        vehicleTypeId: matchedBooking.vehicleTypeId ?? vehicleTypeId!,
        cardCode: normalizedCardCode,
        buildingId: buildingId,
        staffId: STAFF_ID,
        bookingId: matchedBooking.id,
        overrideSlotId: selectedSlotId,
      });

      await loadGateData();
      setCardCode('');
      setShowReallocateBtn(false);
      setSelectedSlotId(null);

      showGateOverlay({
        type: 'success',
        title: 'Check-in successful',
        message: `Vehicle ${formattedPlate} was checked in successfully at the new parking space.`,
        session,
        vehicleType: vehicleTypeName,
        cardCode: normalizedCardCode,
        checkInTime: session.checkInTime || new Date().toISOString(),
      });
    } catch (error) {
      let errMsg = 'Failed to change the parking space and check in the vehicle.';
      if (error instanceof ApiError && error.data && typeof error.data === 'object') {
        const body = error.data as { message?: string };
        if (body.message) errMsg = body.message;
      } else if (error instanceof Error) {
        errMsg = error.message;
      }
      showGateOverlay({
        type: 'error',
        title: 'Reallocation failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={compact ? '' : 'bg-slate-50 p-4 text-slate-900'}>
      <div className={compact ? 'flex flex-col gap-4' : 'mx-auto flex max-w-[1600px] flex-col gap-4'}>
        {!compact && (
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h1 className="text-xl font-black text-slate-900">Staff Gate Check-in</h1>

            <button
              type="button"
              onClick={() => setIsSessionsOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">local_parking</span>
              Active sessions
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                {activeSessionCount}
              </span>
            </button>
          </div>
        )}

        <div className={compact ? 'grid gap-4 md:grid-cols-2' : 'grid min-h-0 flex-1 gap-4 xl:grid-cols-2'}>
          {/* LEFT COLUMN: ENTRY CAMERA (LIVE FEED & LPR) */}
          <div className="space-y-4 flex flex-col min-h-0">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <p className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Check-in Camera
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
                    <span className="material-symbols-outlined text-3xl text-slate-600">videocam_off</span>
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

              <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
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
                      className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5 border ${cameraActive
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                      {cameraActive ? 'Stop Cam' : 'Start Cam'}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleCheckinScan}
                    disabled={isScanning || !cameraActive}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    Scan Camera
                  </button>
                </div>

                {capturedImage && (
                  <div className="bg-white rounded-xl p-2 border border-slate-100 flex items-center gap-3">
                    <div className="h-12 w-20 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={capturedImage} alt="Captured plate snapshot" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Detected License Plate</p>
                      <p className="font-mono text-base font-black text-slate-900 tracking-wider mt-0.5">{licensePlate || '---'}</p>
                    </div>
                  </div>
                )}
                {ocrText && <p className="text-[9px] text-emerald-400 font-bold mt-0.5">Confidence: {ocrText ? 'Passed' : ''}</p>}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ENTRY INFORMATION AND CONFIRMATION */}
          <form
            onSubmit={handleConfirmCheckin}
            className="min-h-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-start"
          >
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-base font-black text-slate-900">
                Check-in Information
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Enter license plate and map to building and parking card
              </p>
            </div>

            <div className="space-y-3">
              {buildings.length > 0 && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Building
                  </label>
                  <select
                    value={buildingId}
                    onChange={(e) => setBuildingId(Number(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    License plate
                  </label>
                  <input
                    value={licensePlate}
                    onChange={(event) => setLicensePlate(event.target.value.toUpperCase())}
                    placeholder="Example: 51A-123.45"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-lg font-black uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Parking card code
                  </label>
                  <input
                    value={cardCode}
                    onChange={(event) => setCardCode(event.target.value.toUpperCase())}
                    placeholder="Type/select card"
                    list="available-checkin-cards"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-bold uppercase text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <datalist id="available-checkin-cards">
                    {sortedAvailableCards.map((card) => (
                      <option key={card.id} value={card.cardCode} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Vehicle type
                </label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  {vehicleTypes.map((type) => {
                    const id = type.id ?? type.Id;
                    const name = type.name ?? type.typeName ?? type.TypeName ?? '';
                    const isSelected = vehicleTypeId === id;
                    const isCar = name.toUpperCase().includes('CAR') || name.toUpperCase().includes('AUTO');
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setVehicleTypeId(id)}
                        className={`rounded-xl border px-3 py-2 text-xs font-black transition ${isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        <span className="material-symbols-outlined mr-1.5 align-middle text-base">
                          {isCar ? 'directions_car' : 'two_wheeler'}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      Entry type status
                    </p>
                    {formattedPlate ? (
                      matchedBooking ? (
                        <p className="mt-0.5 text-xs font-bold text-slate-800">
                          Booking matched{' '}
                          <span className="font-mono text-emerald-700 font-bold">
                            {matchedBooking.bookingCode}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs font-bold text-slate-500">
                          Walk-in vehicle
                        </p>
                      )
                    ) : (
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        Enter plate to verify booking status
                      </p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-2xl text-emerald-600">
                    confirmation_number
                  </span>
                </div>

                {matchedBooking && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 border-t border-emerald-100/50 pt-2">
                    <span>Deposit: {formatCurrency(matchedBooking.depositAmount)}</span>
                    <span>Grace: {formatDateTime(matchedBooking.checkinGraceUntil)}</span>
                    <span>Building: {matchedBooking.buildingName || buildingId}</span>
                    <span>Type: {matchedBooking.vehicleTypeName}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
                >
                  <span className="material-symbols-outlined text-base">
                    {isSubmitting ? 'progress_activity' : 'login'}
                  </span>
                  {isSubmitting ? 'Checking in...' : 'Confirm Check-in'}
                </button>

                {showReallocateBtn && matchedBooking && (
                  <button
                    type="button"
                    onClick={handleOpenReallocate}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-black text-white shadow-md hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
                  >
                    <span className="material-symbols-outlined text-base">swap_horiz</span>
                    Reallocate Parking Slot
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {isMounted &&
        isSessionsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-slate-950/70 p-6 backdrop-blur-sm">
            <div className="mx-auto flex h-full max-w-5xl flex-col rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Active parking sessions
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Vehicles currently inside the parking area.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadGateData()}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-700"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSessionsOpen(false)}
                    className="rounded-2xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
                    aria-label="Close active sessions"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                {activeSessions.length === 0 ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl">
                      local_parking
                    </span>
                    <p className="mt-3 text-sm font-semibold">No active sessions.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {activeSessions.map((session) => (
                      <article
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xl font-black text-slate-900">
                              {session.licensePlate}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {session.cardCode} · {session.customerType}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                            ACTIVE
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          In: {formatDateTime(session.checkInTime)}
                        </p>
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
          <div
            className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center px-6 text-center text-white ${overlay.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
          >
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 shadow-2xl">
              <span className="material-symbols-outlined text-7xl">
                {overlay.type === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <h2 className="mt-8 text-4xl font-black md:text-5xl">
              {overlay.title}
            </h2>
            <p className="mt-3 max-w-3xl text-lg font-bold text-white/90">
              {overlay.message}
            </p>

            {overlay.type === 'success' && (
              <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 rounded-3xl bg-white/15 p-5 text-left md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase text-white/60">License plate</p>
                  <p className="font-mono text-3xl font-black">{overlay.session?.licensePlate ?? formattedPlate}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/60">Card code</p>
                  <p className="font-mono text-2xl font-black">{overlay.cardCode}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/60">Vehicle type</p>
                  <p className="text-2xl font-black">{overlay.vehicleType}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white/60">Check-in time</p>
                  <p className="text-2xl font-black">{formatDateTime(overlay.checkInTime)}</p>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

      {isMounted &&
        isReallocateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
            <div className="flex w-full max-w-lg flex-col rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Select a New Parking Space
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Select another available parking space in the building.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="rounded-2xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200"
                  aria-label="Close modal"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto max-h-[320px] pr-1">
                {availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl">
                      search_off
                    </span>
                    <p className="mt-2 text-xs font-semibold">No available parking spaces were found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${selectedSlotId === slot.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                      >
                        <span className="font-mono text-sm font-black">{slot.code}</span>
                        <span className="mt-1 text-[10px] font-bold text-slate-400">
                          {slot.floorName} · {slot.zoneName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReallocateCheckin}
                  disabled={!selectedSlotId || isSubmitting}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Confirm & Check In
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
