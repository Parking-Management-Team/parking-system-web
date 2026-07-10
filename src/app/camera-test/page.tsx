'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchCards } from '@/features/card/services/card.service';
import type { ParkingCard } from '@/features/card/types/card';
import {
  checkInVehicle,
  fetchActiveParkingSessions,
  scanLicensePlate,
  type VehicleCheckinSession,
} from '@/features/vehicles/services/vehicle-checkin.service';
import {
  startCheckout,
  createCheckoutPayment,
  completeCheckout,
  type CheckoutSession,
} from '@/features/vehicles/services/vehicle-checkout.service';
import {
  Camera,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Play,
  Square,
  ChevronRight,
} from 'lucide-react';

const BUILDING_ID = 3;
const STAFF_ID = 2;
const VEHICLE_TYPE_ID_BY_TYPE = {
  CAR: 2,
  MOTORCYCLE: 3,
};

export default function CameraTestPage() {
  const { showToast } = useAuth();

  // Webcam States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // OCR States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Forms States
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [activeSessions, setActiveSessions] = useState<VehicleCheckinSession[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Check-in fields
  const [checkinPlate, setCheckinPlate] = useState<string>('');
  const [checkinCard, setCheckinCard] = useState<string>('');
  const [checkinVehicleType, setCheckinVehicleType] = useState<'CAR' | 'MOTORCYCLE'>('CAR');

  // Check-out fields
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [checkoutPlate, setCheckoutPlate] = useState<string>('');
  const [checkoutImage, setCheckoutImage] = useState<string | null>(null);

  // Selected session detailed object
  const selectedSession = activeSessions.find(s => s.id === selectedSessionId) || null;

  // Load initial options & active sessions
  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const [cardData, sessionData] = await Promise.all([
        fetchCards(),
        fetchActiveParkingSessions(),
      ]);
      setCards(cardData);
      setActiveSessions(sessionData);
    } catch (error) {
      console.error(error);
      showToast('Không thể tải danh sách thẻ hoặc phiên hoạt động.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    enumerateCameras();
  }, []);

  // Enumerate cameras
  const enumerateCameras = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.warn('Camera API (navigator.mediaDevices) is not available.');
      return;
    }
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Không tìm thấy thiết bị camera:', err);
    }
  };

  // Start webcam stream
  const startCamera = async () => {
    stopCamera();
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      showToast('Không thể mở camera: Trình duyệt không hỗ trợ hoặc kết nối không an toàn (HTTP). Vui lòng dùng localhost hoặc cấu hình HTTPS.', 'error');
      return;
    }
    try {
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      showToast('Camera hoạt động thành công!', 'success');
    } catch (err) {
      console.error('Không thể mở camera:', err);
      showToast('Không thể kết nối camera. Vui lòng cấp quyền.', 'error');
    }
  };

  // Stop webcam stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Switch camera device
  useEffect(() => {
    if (cameraActive && selectedDeviceId) {
      startCamera();
    }
  }, [selectedDeviceId]);

  // Capture frame from video stream to base64
  const captureFrame = (): string | null => {
    if (!videoRef.current || !cameraActive) {
      showToast('Vui lòng kích hoạt camera trước.', 'info');
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video context
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to JPEG with 0.75 quality (keeps size to ~50-80kb)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setCapturedImage(dataUrl);
    return dataUrl;
  };

  // Run OCR on Backend Cloud API
  const performOCR = async (base64Img: string) => {
    setIsScanning(true);
    setScanProgress('Đang gửi hình ảnh lên Cloud API để nhận diện...');
    setOcrText('');

    try {
      const result = await scanLicensePlate({ image: base64Img });
      setOcrText(result.licensePlate);
      showToast(`Nhận diện biển số thành công: ${result.licensePlate} (Độ tin cậy: ${Math.round(result.confidence * 100)}%)`, 'success');
      return result.licensePlate;
    } catch (err: any) {
      console.error('Lỗi OCR:', err);
      showToast(err.message || 'Lỗi trong quá trình quét OCR.', 'error');
      return '';
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  // Scan trigger for Check-in
  const handleCheckinScan = async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      setCheckinPlate(plate);
    }
  };

  // Scan trigger for Check-out
  const handleCheckoutScan = async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      setCheckoutPlate(plate);
      setCheckoutImage(base64);
    }
  };

  // Mock scan triggers for developer experience without camera
  const handleMockScanCheckin = () => {
    const mockPlates = ['51A-999.99', '29G1-888.88', '43B-777.77', '59S3-555.55'];
    const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
    setCheckinPlate(randomPlate);
    
    // Draw a placeholder mockup on canvas to save as base64
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
    
    showToast(`Giả lập quét biển số vào: ${randomPlate}`, 'success');
  };

  const handleMockScanCheckout = () => {
    if (!selectedSession) {
      showToast('Vui lòng chọn một Session cần Check-out trước.', 'info');
      return;
    }
    const matchPlate = selectedSession.licensePlate;
    setCheckoutPlate(matchPlate);
    
    // Mock exit image
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
      ctx.fillText(matchPlate, 150, 60);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('MOCK SCAN OUT', 150, 100);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCheckoutImage(dataUrl);
    }

    showToast(`Giả lập quét biển số ra: ${matchPlate}`, 'success');
  };

  // Submit Check-in to API
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkinPlate) {
      showToast('Vui lòng nhập hoặc quét biển số xe.', 'info');
      return;
    }
    if (!checkinCard) {
      showToast('Vui lòng chọn thẻ xe.', 'info');
      return;
    }

    try {
      setIsLoadingData(true);
      
      const payload = {
        licensePlate: checkinPlate.trim().toUpperCase(),
        vehicleTypeId: VEHICLE_TYPE_ID_BY_TYPE[checkinVehicleType],
        cardCode: checkinCard,
        buildingId: BUILDING_ID,
        staffId: STAFF_ID,
        imageIn: capturedImage || undefined,
      };

      await checkInVehicle(payload);
      showToast('Xe đã Check-in thành công có ảnh!', 'success');
      
      // Reset form
      setCheckinPlate('');
      setCheckinCard('');
      setCapturedImage(null);
      
      // Reload lists
      await loadInitialData();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Check-in thất bại.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Submit Check-out to API
  const handleCheckoutSubmit = async () => {
    if (!selectedSessionId || !selectedSession) {
      showToast('Vui lòng chọn phiên gửi xe.', 'info');
      return;
    }
    if (!checkoutPlate) {
      showToast('Vui lòng nhập hoặc quét biển số xe lúc ra.', 'info');
      return;
    }

    try {
      setIsLoadingData(true);
      
      const isMatched = checkoutPlate.replace(/[^A-Z0-9]/g, '') === selectedSession.licensePlate.replace(/[^A-Z0-9]/g, '');
      if (!isMatched) {
        showToast('Cảnh báo: Biển số lúc ra không khớp biển số lúc vào!', 'info');
      }

      // 1. Khởi động Check-out
      await startCheckout(selectedSession.id, {
        checkOutTime: new Date().toISOString(),
        licensePlateOut: checkoutPlate.trim().toUpperCase(),
        outStaffId: STAFF_ID,
        imageOut: checkoutImage || undefined,
      });

      // 2. Tạo payment và hoàn tất (Cash mặc định cho test)
      const checkoutSessionData: CheckoutSession = {
        id: selectedSession.id,
        sessionCode: selectedSession.sessionCode,
        licensePlate: selectedSession.licensePlate,
        vehicleType: selectedSession.vehicleType,
        customerType: selectedSession.customerType,
        cardId: selectedSession.cardId,
        cardCode: selectedSession.cardCode,
        vehicleId: selectedSession.vehicleId,
        buildingId: selectedSession.buildingId,
        zoneId: selectedSession.zoneId,
        zoneCode: selectedSession.zoneName,
        slotId: selectedSession.actualSlotId,
        slotCode: selectedSession.actualSlotCode,
        bookingId: null,
        bookingCode: null,
        monthlySubscriptionId: null,
        subscriptionCode: null,
        monthlyValidTo: null,
        checkInTime: selectedSession.checkInTime,
        status: selectedSession.status,
        imageIn: selectedSession.imageIn || null,
        imageOut: checkoutImage || null,
      };

      const payment = await createCheckoutPayment(checkoutSessionData, 'CASH');

      showToast(`Xe đã Check-out thành công! Phí thanh toán: ${payment.amount.toLocaleString()} VND.`, 'success');

      // Reset
      setSelectedSessionId(null);
      setCheckoutPlate('');
      setCheckoutImage(null);

      // Reload
      await loadInitialData();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : 'Check-out thất bại.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const availableCards = cards.filter(
    card => card.cardType === 'PARKING_CARD' && card.cardStatus === 'AVAILABLE'
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">
              Chế Độ Thử Nghiệm Mới
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              Kiểm thử Quét Biển Số Xe qua Camera (LPR Test)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Trang thử nghiệm riêng biệt chạy OCR bằng Tesseract.js và lưu trữ ảnh Base64 lên Database.
            </p>
          </div>
          <button
            onClick={loadInitialData}
            disabled={isLoadingData}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </header>

        {/* main workspace split */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* CAMERA FEED & PREVIEW PANEL (7 COLS) */}
          <section className="lg:col-span-7 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Camera className="text-emerald-500" />
                Live Camera Feed
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${cameraActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {cameraActive ? 'CAMERA ON' : 'CAMERA OFF'}
              </span>
            </div>

            {/* Video Box */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-900">
                  <Camera className="h-12 w-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm font-semibold">Camera chưa được kích hoạt.</p>
                  <button
                    onClick={startCamera}
                    className="mx-auto flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                  >
                    Bật Camera
                  </button>
                </div>
              )}

              {/* Viewfinder Target frame overlay */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-80 h-40 border-4 border-dashed border-emerald-400/40 rounded-3xl relative">
                    <div className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-slate-950/80 text-emerald-400 px-1 py-0.5 rounded">
                      CĂN CHỈNH BIỂN SỐ XE VÀO ĐÂY
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Scanning Overlay Indicator */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-emerald-400 text-sm font-black tracking-wider animate-pulse">{scanProgress}</p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Thiết bị Camera</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                {cameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="flex-1 rounded-xl bg-red-950 border border-red-800 text-red-400 py-2.5 text-xs font-bold hover:bg-red-900 transition flex items-center justify-center gap-2"
                  >
                    Tắt Camera
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="flex-1 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 py-2.5 text-xs font-bold hover:bg-emerald-900 transition flex items-center justify-center gap-2"
                  >
                    Kích hoạt Cam
                  </button>
                )}
              </div>
            </div>

            {/* OCR Debug / Snapshot section */}
            <div className="border-t border-slate-800 pt-4 grid gap-4 sm:grid-cols-2">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh chụp Snapshot mới nhất</p>
                <div className="mt-2 h-28 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured preview" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">Chưa chụp ảnh nào</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dữ liệu thô nhận diện (OCR Text)</p>
                  <pre className="mt-2 h-20 p-2 overflow-auto bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-400 whitespace-pre-wrap border border-slate-800">
                    {ocrText || 'Không có dữ liệu.'}
                  </pre>
                </div>
                <div className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Quét offline bằng Tesseract.js có thể sai lệch nhẹ, hãy sửa thủ công nếu cần.
                </div>
              </div>
            </div>

          </section>

          {/* CHECK-IN & CHECK-OUT FORMS PANEL (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* GATE-IN FORM */}
            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Cổng vào (Check-in)</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">TEST-IN-01</span>
              </h2>

              <form onSubmit={handleCheckinSubmit} className="mt-4 space-y-4">
                
                {/* Plate field with Capture triggers */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">1. Quét biển số xe vào</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checkinPlate}
                      onChange={(e) => setCheckinPlate(e.target.value.toUpperCase())}
                      placeholder="Gõ hoặc quét biển số"
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm font-mono uppercase tracking-wider text-slate-200 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleCheckinScan}
                      disabled={isScanning}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                    >
                      Quét Cam
                    </button>
                    <button
                      type="button"
                      onClick={handleMockScanCheckin}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 text-xs font-medium border border-slate-700 transition"
                      title="Giả lập không cần webcam"
                    >
                      Mock
                    </button>
                  </div>
                </div>

                {/* Vehicle type */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">2. Loại phương tiện</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CAR', 'MOTORCYCLE'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCheckinVehicleType(type)}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          checkinVehicleType === type
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {type === 'CAR' ? '🚗 Ô tô' : '🏍️ Xe máy'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card selection */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">3. Chọn thẻ xe (Vật lý)</label>
                  <select
                    value={checkinCard}
                    onChange={(e) => setCheckinCard(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn thẻ xe khả dụng --</option>
                    {availableCards.map(card => (
                      <option key={card.id} value={card.cardCode}>
                        {card.cardCode} (Thẻ ID: {card.id})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Thẻ xe rảnh hiện có: {availableCards.length} thẻ
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoadingData || isScanning}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                >
                  Xác nhận Check-in kèm Ảnh
                </button>

              </form>
            </section>

            {/* GATE-OUT FORM */}
            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Cổng ra (Check-out)</span>
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">TEST-OUT-01</span>
              </h2>

              <div className="mt-4 space-y-4">
                
                {/* Select active session */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">1. Chọn xe đang trong bãi</label>
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedSessionId(id || null);
                      // Clear exit inputs
                      setCheckoutPlate('');
                      setCheckoutImage(null);
                    }}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn xe muốn cho ra --</option>
                    {activeSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.licensePlate} (Thẻ: {session.cardCode}) - Vào: {new Date(session.checkInTime).toLocaleTimeString('vi-VN')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSession && (
                  <div className="space-y-3 p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Xe lúc vào:</span>
                      <span className="text-white font-mono">{selectedSession.licensePlate}</span>
                    </div>
                    {selectedSession.imageIn && (
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Ảnh chụp lúc vào:</span>
                        <div className="h-24 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                          <img src={selectedSession.imageIn} alt="Entry Plate" className="h-full w-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scan exit plate */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">2. Quét biển số xe ra</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checkoutPlate}
                      onChange={(e) => setCheckoutPlate(e.target.value.toUpperCase())}
                      placeholder="Quét biển số xe ra"
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm font-mono uppercase tracking-wider text-slate-200 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleCheckoutScan}
                      disabled={isScanning || !selectedSessionId}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                    >
                      Quét Cam
                    </button>
                    <button
                      type="button"
                      onClick={handleMockScanCheckout}
                      disabled={!selectedSessionId}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
                      title="Giả lập không cần webcam"
                    >
                      Mock
                    </button>
                  </div>
                </div>

                {/* Compare Check-in vs Check-out Plate */}
                {checkoutPlate && selectedSession && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    checkoutPlate.replace(/[^A-Z0-9]/g, '') === selectedSession.licensePlate.replace(/[^A-Z0-9]/g, '')
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                  }`}>
                    {checkoutPlate.replace(/[^A-Z0-9]/g, '') === selectedSession.licensePlate.replace(/[^A-Z0-9]/g, '') ? (
                      <>
                        <CheckCircle className="h-4 w-4 shrink-0" /> Trùng khớp biển số. Đủ điều kiện ra bãi.
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 shrink-0" /> Không khớp biển số vào/ra! Nhân viên cần đối soát.
                      </>
                    )}
                  </div>
                )}

                {/* Checkout image preview */}
                {checkoutImage && (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-500 block mb-1">Ảnh chụp lúc ra:</span>
                    <div className="h-20 bg-slate-950 rounded overflow-hidden border border-slate-850">
                      <img src={checkoutImage} alt="Exit Plate" className="h-full w-full object-contain" />
                    </div>
                  </div>
                )}

                {/* Submit Checkout button */}
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={isLoadingData || !selectedSessionId || !checkoutPlate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  Xác nhận Check-out kèm Ảnh
                </button>

              </div>
            </section>

          </div>

        </div>

        {/* DATABASE VIEW: ACTIVE PARKING SESSIONS WITH CAPTURED IMAGES */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileText className="text-emerald-500" />
            Cơ sở dữ liệu: Các xe đang trong bãi đỗ (Active Sessions)
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {activeSessions.length} xe
            </span>
          </h2>

          <div className="mt-4 overflow-x-auto">
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm font-medium">
                Hiện tại không có phiên gửi xe hoạt động. Vui lòng Check-in xe mới.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Mã SS</th>
                    <th className="py-3 px-2">Biển số</th>
                    <th className="py-3 px-2">Thẻ xe</th>
                    <th className="py-3 px-2">Thời gian vào</th>
                    <th className="py-3 px-2">Ảnh chụp lúc vào (Base64 trong DB)</th>
                    <th className="py-3 px-2 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {activeSessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-2 font-mono text-emerald-500 font-bold">SS-{session.id}</td>
                      <td className="py-3 px-2 font-mono text-white font-black text-sm tracking-wider">{session.licensePlate}</td>
                      <td className="py-3 px-2 font-mono">{session.cardCode}</td>
                      <td className="py-3 px-2 text-slate-400">
                        {new Date(session.checkInTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-2">
                        {session.imageIn ? (
                          <div className="h-16 w-32 rounded bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden group relative cursor-pointer"
                               onClick={() => {
                                 const image = new Image();
                                 image.src = session.imageIn || '';
                                 const w = window.open('');
                                 w?.document.write(image.outerHTML);
                               }}>
                            <img src={session.imageIn} alt="Plate database" className="h-full w-full object-cover group-hover:scale-110 transition" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white transition font-bold">
                              NHẤP ĐỂ XEM
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Không có ảnh</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 text-[11px] font-bold transition"
                        >
                          Chọn Checkout <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
