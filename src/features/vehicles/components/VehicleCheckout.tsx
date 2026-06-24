'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/features/auth';

type PaymentMethod = 'ONLINE_BANKING' | 'CASH';
type PaymentStatus = 'IDLE' | 'PENDING' | 'PAID' | 'FAILED';

interface ParkingSessionDto {
  id: number;
  vehicleId: number;
  buildingId: number;
  cardId: number;
  zoneId?: number;
  slotId?: number;
  bookingId?: number;
  bookingCode?: string;
  monthlySubscriptionId?: number;
  inStaffId?: number;
  outStaffId?: number;
  checkInTime: string;
  checkOutTime?: string | null;
  licensePlateIn: string;
  licensePlateOut?: string | null;
  sessionStatus: string;
  cardCode?: string;
  zoneCode?: string;
  slotCode?: string;
}

interface IncidentDto {
  id: number;
  sessionId: number;
  licensePlate?: string;
  incidentTypeId: number;
  incidentName: string;
  description?: string;
  penaltyFee?: number;
  status: number; // 0 = Open
}

/*
  Hàm format tiền theo kiểu Việt Nam.
  Ví dụ: 20000 -> 20.000 đ
*/
const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('vi-VN')} đ`;
};

/*
  Hàm format hiển thị thời gian.
*/
const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/*
  Hàm tính phí gửi xe ở Frontend khớp với cấu hình Pricing Policy ở Backend.
*/
function calculateSegmentFee(start: Date, end: Date, isCar: boolean) {
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (totalMinutes <= 0) return 0;
  
  const startHour = start.getHours();
  const isDay = startHour >= 6 && startHour < 22; // Day window: 6h - 22h
  
  if (isCar) {
    if (isDay) {
      if (totalMinutes <= 60) return 20000;
      const over = totalMinutes - 60;
      const blocks = Math.ceil(over / 15);
      return 20000 + blocks * 5000;
    } else {
      if (totalMinutes <= 60) return 40000;
      const over = totalMinutes - 60;
      const blocks = Math.ceil(over / 30);
      return 40000 + blocks * 10000;
    }
  } else {
    // Motorcycle
    if (isDay) {
      if (totalMinutes <= 60) return 5000;
      const over = totalMinutes - 60;
      const blocks = Math.ceil(over / 15);
      return 5000 + blocks * 2000;
    } else {
      if (totalMinutes <= 60) return 10000;
      const over = totalMinutes - 60;
      const blocks = Math.ceil(over / 30);
      return 10000 + blocks * 5000;
    }
  }
}

function calculateExactFee(checkInStr: string, checkOutStr: string, isCar: boolean) {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  if (checkOut <= checkIn) return 0;
  
  let current = new Date(checkIn);
  let totalFee = 0;
  
  while (current < checkOut) {
    const nextTransition = new Date(current);
    nextTransition.setSeconds(0, 0);
    
    const curHour = current.getHours();
    if (curHour >= 6 && curHour < 22) {
      nextTransition.setHours(22, 0, 0, 0);
    } else {
      if (curHour >= 22) {
        nextTransition.setDate(nextTransition.getDate() + 1);
      }
      nextTransition.setHours(6, 0, 0, 0);
    }
    
    const segEnd = nextTransition < checkOut ? nextTransition : checkOut;
    totalFee += calculateSegmentFee(current, segEnd, isCar);
    current = segEnd;
  }
  return totalFee;
}

export default function VehicleCheckout() {
  const { user, showToast } = useAuth();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected session state
  const [session, setSession] = useState<ParkingSessionDto | null>(null);
  const [vehicleTypeName, setVehicleTypeName] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [plannedCheckoutTime, setPlannedCheckoutTime] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);

  // Verification state
  const [actualExitPlate, setActualExitPlate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);

  // Payment UI state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE_BANKING');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [vnpayOrderCode, setVnpayOrderCode] = useState<number | null>(null);
  const [paymentAttempt, setPaymentAttempt] = useState(1);

  // Live timer for checkout calculation (if checkout has not started)
  const [liveCheckoutTime, setLiveCheckoutTime] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active sessions list on mount
  useEffect(() => {
    fetchActiveSessions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update live checkout time every second when session is loaded but checkoutTime is not locked
  useEffect(() => {
    if (session && !session.checkOutTime) {
      setLiveCheckoutTime(new Date().toISOString());
      timerRef.current = setInterval(() => {
        setLiveCheckoutTime(new Date().toISOString());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (session?.checkOutTime) {
        setLiveCheckoutTime(session.checkOutTime);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  const fetchActiveSessions = async () => {
    setIsLoadingList(true);
    try {
      const res = await api.get<any>('/parking-sessions/active');
      if (res.success && res.data) {
        setActiveSessions(res.data);
      }
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectSession = async (selected: ParkingSessionDto) => {
    setErrorMsg('');
    setSession(selected);
    setActualExitPlate(selected.licensePlateIn);
    setPaymentStatus(selected.checkOutTime ? 'PENDING' : 'IDLE');
    setVnpayUrl('');
    setVnpayOrderCode(null);
    setPaymentAttempt(1);
    setApiSuccess(false);

    try {
      // 1. Fetch vehicle details to get type name
      const vehRes = await api.get<any>(`/vehicles/${selected.vehicleId}`);
      if (vehRes.success && vehRes.data) {
        setVehicleTypeName(vehRes.data.vehicleTypeName || 'Car');
      }

      // 2. Fetch booking details if available
      if (selected.bookingId) {
        const bookRes = await api.get<any>(`/bookings/${selected.bookingId}`);
        if (bookRes.success && bookRes.data) {
          setDepositAmount(bookRes.data.depositAmount || 0);
          setPlannedCheckoutTime(bookRes.data.plannedCheckoutTime || null);
        }
      } else {
        setDepositAmount(0);
        setPlannedCheckoutTime(null);
      }

      // 3. Fetch incidents for this session
      const incRes = await api.get<any>(`/incident/session/${selected.id}`);
      if (incRes.success && incRes.data) {
        setIncidents(incRes.data);
      } else {
        setIncidents([]);
      }

    } catch (err) {
      console.error('Error fetching session extra info:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const matched = activeSessions.find(s => 
      s.licensePlateIn.toUpperCase() === searchTerm.toUpperCase() ||
      s.cardCode?.toUpperCase() === searchTerm.toUpperCase() ||
      s.bookingCode?.toUpperCase() === searchTerm.toUpperCase()
    );

    if (matched) {
      handleSelectSession(matched);
    } else {
      setErrorMsg(`Không tìm thấy lượt đỗ xe hoạt động nào khớp với từ khóa "${searchTerm}".`);
      setSession(null);
    }
  };

  // Pricing calculations
  const isCar = vehicleTypeName.toUpperCase().includes('CAR') || !!session?.slotCode;
  
  const currentCheckoutTime = session?.checkOutTime || liveCheckoutTime;
  const parkingDurationMinutes = session && currentCheckoutTime 
    ? Math.max(0, Math.round((new Date(currentCheckoutTime).getTime() - new Date(session.checkInTime).getTime()) / (1000 * 60)))
    : 0;

  const parkingFee = session && currentCheckoutTime
    ? calculateExactFee(session.checkInTime, currentCheckoutTime, isCar)
    : 0;

  const isOvertime = plannedCheckoutTime && currentCheckoutTime
    ? new Date(currentCheckoutTime) > new Date(plannedCheckoutTime)
    : false;

  const bookingOvertimePenalty = isOvertime ? 50000 : 0;

  const openIncidents = incidents.filter(i => i.status === 0);
  const totalIncidentPenalty = openIncidents.reduce((sum, inc) => sum + (inc.penaltyFee || 0), 0);

  // Breakdown summary
  const finalFeeAfterDeposit = Math.max(0, parkingFee - depositAmount);
  const totalAmountDue = finalFeeAfterDeposit + totalIncidentPenalty + bookingOvertimePenalty;

  const isPlateMatched = session !== null && 
    actualExitPlate.trim().toUpperCase() === session.licensePlateIn.toUpperCase();

  const handleStartCheckout = async () => {
    if (!session) return;
    if (!isPlateMatched) {
      showToast('Biển số xe ra thực tế không khớp với hệ thống!', 'error');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const nowStr = new Date().toISOString();
      const patchRes = await api.patch<any>(`/parking-sessions/${session.id}/checkout/start`, {
        checkOutTime: nowStr,
        licensePlateOut: actualExitPlate,
        outStaffId: user?.id
      });

      if (patchRes.success && patchRes.data) {
        // Cập nhật lại session trong state với checkoutTime mới khóa
        setSession(patchRes.data);
        setPaymentStatus(totalAmountDue > 0 ? 'PENDING' : 'IDLE');
        showToast('Đã bắt đầu checkout & khóa phí thành công.', 'success');
        fetchActiveSessions();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        setErrorMsg((err.data as any).message || 'Lỗi khi bắt đầu checkout.');
      } else {
        setErrorMsg('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollbackCheckout = async () => {
    if (!session) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const rollbackRes = await api.patch<any>(`/parking-sessions/${session.id}/checkout/rollback`);
      if (rollbackRes.success && rollbackRes.data) {
        setSession(rollbackRes.data);
        setPaymentStatus('IDLE');
        setVnpayUrl('');
        setVnpayOrderCode(null);
        showToast('Đã hủy bỏ checkout, mở khóa phí thành công.', 'info');
        fetchActiveSessions();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        setErrorMsg((err.data as any).message || 'Lỗi khi hủy bỏ checkout.');
      } else {
        setErrorMsg('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePaymentOnline = async () => {
    if (!session) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.post<any>('/payments', {
        sessionId: session.id,
        paymentMethod: 'ONLINE_BANKING'
      });

      if (res.success && res.data) {
        setVnpayUrl(res.data.paymentUrl || '');
        setVnpayOrderCode(res.data.orderCode || null);
        setPaymentStatus('PENDING');
        showToast('Đã tạo liên kết thanh toán trực tuyến thành công.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        setErrorMsg((err.data as any).message || 'Lỗi khi tạo giao dịch thanh toán.');
      } else {
        setErrorMsg('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOnlinePayment = async () => {
    if (!session) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.get<any>(`/parking-sessions/${session.id}`);
      if (res.success && res.data) {
        if (res.data.sessionStatus.toUpperCase() === 'COMPLETED') {
          setPaymentStatus('PAID');
          setApiSuccess(true);
          showToast('Xác nhận thanh toán online thành công!', 'success');
          
          setTimeout(() => {
            handleResetForm();
          }, 3000);
        } else {
          showToast('Khách hàng chưa hoàn tất thanh toán VNPay.', 'info');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xác thực thanh toán.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteCashPayment = async () => {
    if (!session) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.post<any>('/payments', {
        sessionId: session.id,
        paymentMethod: 'CASH'
      });

      if (res.success) {
        setPaymentStatus('PAID');
        setApiSuccess(true);
        showToast('Thanh toán tiền mặt thành công!', 'success');
        
        setTimeout(() => {
          handleResetForm();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        setErrorMsg((err.data as any).message || 'Thanh toán thất bại.');
      } else {
        setErrorMsg('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteZeroAmount = async () => {
    if (!session) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.patch<any>(`/parking-sessions/${session.id}/complete`);
      if (res.success) {
        setPaymentStatus('PAID');
        setApiSuccess(true);
        showToast('Hoàn tất checkout thành công (0đ)!', 'success');
        
        setTimeout(() => {
          handleResetForm();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        setErrorMsg((err.data as any).message || 'Không thể hoàn tất checkout.');
      } else {
        setErrorMsg('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePaymentFailed = () => {
    setPaymentStatus('FAILED');
    showToast('Giả lập giao dịch thất bại.', 'info');
  };

  const handleRetryPayment = () => {
    setPaymentAttempt(prev => prev + 1);
    setPaymentStatus('PENDING');
    setVnpayUrl('');
    setVnpayOrderCode(null);
  };

  const handleResetForm = () => {
    setSession(null);
    setSearchTerm('');
    setActualExitPlate('');
    setVnpayUrl('');
    setVnpayOrderCode(null);
    setPaymentStatus('IDLE');
    setPaymentAttempt(1);
    setApiSuccess(false);
    setErrorMsg('');
    fetchActiveSessions();
  };

  // Helper mapping customer types
  const getCustomerTypeLabel = (s: ParkingSessionDto) => {
    if (s.monthlySubscriptionId) return 'MONTHLY';
    if (s.bookingId) return 'BOOKING';
    return 'WALK_IN';
  };

  const getCustomerBadgeClass = (s: ParkingSessionDto) => {
    if (s.monthlySubscriptionId) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (s.bookingId) return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cổng Hoàn Tất Gửi Xe (Vehicle Check-out)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Xác minh thông tin phương tiện ra, khóa phí đỗ xe, đối chiếu cọc đặt chỗ, tính phạt lố giờ và xử lý thanh toán.
          </p>
        </div>
        <button
          onClick={fetchActiveSessions}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Tải lại danh sách
        </button>
      </section>

      {/* ERROR MESSAGE ALERT */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-3 text-sm font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-rose-600 shrink-0">error</span>
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600 transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE SESSIONS SIDEBAR */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">local_parking</span>
            Xe đang trong bãi ({activeSessions.length})
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Biển số, Vé hoặc Thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700"
            />
            <button
              type="submit"
              className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center"
            >
              Tìm
            </button>
          </form>

          <div className="h-[450px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                Không có phương tiện nào đang ở trong bãi.
              </div>
            ) : (
              activeSessions.map((s) => {
                const isSelected = session?.id === s.id;
                const custType = getCustomerTypeLabel(s);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 bg-slate-50/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-700">{s.licensePlateIn}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.cardCode || 'N/A'}
                        </span>
                        {s.slotCode && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {s.slotCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[9px] font-extrabold uppercase border px-2 py-0.5 rounded-full ${getCustomerBadgeClass(s)}`}>
                        {custType}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {new Date(s.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE/RIGHT COLUMN: WORK AREA */}
        <div className="lg:col-span-8 space-y-6">
          {session ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* VERIFICATION & TIME SECTION */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 font-bold">verified</span>
                    Xác minh thông tin phương tiện ra
                  </h3>
                </div>

                {/* MANUAL VEHICLE COMPARISON */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <p className="text-xs text-slate-500 leading-normal font-semibold">
                    * Nhân viên so sánh biển số thực tế ở camera chụp xe ra với biển số lúc xe vào.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Biển số lúc vào</label>
                      <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono font-black text-slate-700">
                        {session.licensePlateIn}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Biển số xe ra thực tế</label>
                      <input
                        type="text"
                        value={actualExitPlate}
                        disabled={!!session.checkOutTime}
                        onChange={(e) => setActualExitPlate(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-black text-slate-700 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                      isPlateMatched
                        ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50/50 text-rose-600 border-rose-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isPlateMatched ? 'check_circle' : 'error'}
                    </span>
                    {isPlateMatched
                      ? 'Trùng khớp! Cho phép bắt đầu hoàn tất gửi xe.'
                      : 'Biển số không trùng khớp! Hãy xác minh lại trước khi tiếp tục.'}
                  </div>
                </div>

                {/* SESSION INFO */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100/80 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Lượt Gửi</span>
                    <p className="font-bold text-slate-700 mt-0.5">PS-{session.id.toString().padStart(6, '0')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loại Xe</span>
                    <p className="font-bold text-slate-700 mt-0.5">{vehicleTypeName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã thẻ</span>
                    <p className="font-bold text-slate-700 mt-0.5">{session.cardCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vị trí</span>
                    <p className="font-bold text-slate-700 mt-0.5">{session.slotCode || session.zoneCode || 'Khu xe máy'}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold">Thời gian vào</span>
                      <p className="font-semibold text-slate-700 mt-0.5 text-[11px]">{formatDateTime(session.checkInTime)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold">Thời gian đỗ</span>
                      <p className="font-semibold text-slate-700 mt-0.5 text-[11px]">
                        {Math.floor(parkingDurationMinutes / 60)} giờ {parkingDurationMinutes % 60} phút
                      </p>
                    </div>
                  </div>
                </div>

                {/* LOCK CHECKOUT TIME ACTION */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex gap-2">
                    <span className="material-symbols-outlined text-blue-600 shrink-0">alarm_on</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-800">Khóa thời gian checkout & tính phí</h4>
                      <p className="text-[10px] text-blue-700 leading-normal">
                        Bắt đầu checkout sẽ lưu thời điểm xe ra và khóa tổng số tiền cần thanh toán. 
                        Sau khi khóa, phí đỗ xe sẽ không tăng thêm nữa trong quá trình đợi tài xế thanh toán.
                      </p>
                    </div>
                  </div>

                  {session.checkOutTime ? (
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-blue-100/60">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Thời điểm checkout đã khóa</span>
                        <span className="text-xs font-black text-slate-700">{formatDateTime(session.checkOutTime)}</span>
                      </div>
                      <button
                        onClick={handleRollbackCheckout}
                        disabled={isProcessing || paymentStatus === 'PAID'}
                        className="px-3 py-1.5 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        Mở khóa (Rollback)
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      disabled={!isPlateMatched || isProcessing}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">lock</span>
                      )}
                      Bắt đầu Checkout & Khóa phí
                    </button>
                  )}
                </div>

                {/* INCIDENTS LIST IN WORK AREA */}
                {incidents.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Danh sách sự cố ghi nhận ({incidents.length})</h4>
                    <div className="space-y-1.5">
                      {incidents.map((i) => (
                        <div key={i.id} className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-700">{i.incidentName}</p>
                            {i.description && <p className="text-[10px] text-slate-400 mt-0.5">{i.description}</p>}
                          </div>
                          <div className="text-right space-y-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${i.status === 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                              {i.status === 0 ? 'Đang mở (Chưa phạt)' : 'Đã xử lý'}
                            </span>
                            {i.penaltyFee && <p className="font-bold text-rose-600 mt-0.5">{formatCurrency(i.penaltyFee)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* PAYMENT SECTION */}
              <div className="md:col-span-5 flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden min-h-[550px]">
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 font-bold">receipt_long</span>
                      Hóa đơn thanh toán
                    </h3>
                  </div>

                  {/* ALERTS: OVERTIME BANNERS */}
                  {isOvertime && (
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] rounded-xl flex gap-2 font-semibold">
                      <span className="material-symbols-outlined text-amber-600 shrink-0 text-base">warning</span>
                      <span>
                        Xe đỗ quá giờ đặt chỗ! Phí phạt dịch vụ quá hạn 50.000đ được áp dụng.
                      </span>
                    </div>
                  )}

                  {/* FEE BREAKDOWN */}
                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-400">Phí gửi xe gốc:</span>
                      <span className="font-bold text-slate-700">{formatCurrency(parkingFee)}</span>
                    </div>

                    {session.bookingId && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Khấu trừ tiền cọc:</span>
                        <span className="font-bold text-rose-500">- {formatCurrency(depositAmount)}</span>
                      </div>
                    )}

                    {session.bookingId && (
                      <div className="flex justify-between border-t border-slate-100 pt-2.5">
                        <span className="font-medium text-slate-400">Phí sau khấu trừ:</span>
                        <span className="font-bold text-slate-700">{formatCurrency(finalFeeAfterDeposit)}</span>
                      </div>
                    )}

                    {bookingOvertimePenalty > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Phạt quá giờ đặt chỗ:</span>
                        <span className="font-bold text-amber-600">+ {formatCurrency(bookingOvertimePenalty)}</span>
                      </div>
                    )}

                    {totalIncidentPenalty > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Phí phạt sự cố (Open):</span>
                        <span className="font-bold text-rose-600">+ {formatCurrency(totalIncidentPenalty)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">Cần thanh toán:</span>
                      <span className="text-lg font-black text-emerald-600">
                        {formatCurrency(totalAmountDue)}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS AUDIT BOX */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[10px] text-slate-500 font-semibold">
                    <div className="flex justify-between">
                      <span>Loại khách hàng</span>
                      <span className="font-bold uppercase">{getCustomerTypeLabel(session)}</span>
                    </div>
                    {plannedCheckoutTime && (
                      <div className="flex justify-between">
                        <span>Giờ ra dự kiến</span>
                        <span className="font-bold text-slate-600">{new Date(plannedCheckoutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Lượt tạo giao dịch</span>
                      <span className="font-bold">Giao dịch #{paymentAttempt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái hóa đơn</span>
                      <span
                        className={`font-bold ${
                          paymentStatus === 'PAID'
                            ? 'text-emerald-600'
                            : paymentStatus === 'FAILED'
                            ? 'text-rose-500'
                            : paymentStatus === 'PENDING'
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT METHOD SELECTOR (ONLY DISPLAY WHEN LOCK SUCCESS & AMOUNT > 0) */}
                  {session.checkOutTime && totalAmountDue > 0 && paymentStatus !== 'PAID' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phương thức thanh toán</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'ONLINE_BANKING', label: 'Cổng VNPay', icon: 'qr_code_2' },
                          { id: 'CASH', label: 'Tiền mặt (Cash)', icon: 'payments' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            disabled={vnpayUrl !== '' && paymentMethod === 'ONLINE_BANKING'}
                            onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                            className={`py-2 px-1 border rounded-xl flex flex-col items-center gap-1 transition-all ${
                              paymentMethod === m.id
                                ? 'border-emerald-600 bg-emerald-50/20 text-emerald-600 font-bold'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                            } disabled:opacity-50`}
                          >
                            <span className="material-symbols-outlined text-lg">{m.icon}</span>
                            <span className="text-[9px]">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VNPAY QR CODE / REDIRECT LINK (IF GENERATED) */}
                  {vnpayUrl && paymentMethod === 'ONLINE_BANKING' && paymentStatus !== 'PAID' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        {/* QR Code generator using free API from QRServer */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vnpayUrl)}`}
                          alt="VNPay QR Code"
                          className="w-36 h-36"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold text-center">
                        Quét mã QR để chuyển khoản. Mã giao dịch VNPay: <span className="font-mono text-slate-700">{vnpayOrderCode}</span>
                      </p>
                      <a
                        href={vnpayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        Mở cổng thanh toán VNPay
                      </a>
                    </div>
                  )}

                </div>

                {/* FOOTER ACTIONS */}
                <div className="mt-8 space-y-3">
                  {/* CASE 1: NOT LOCKED YET */}
                  {!session.checkOutTime && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      Vui lòng bắt đầu checkout & khóa phí đỗ xe trước.
                    </div>
                  )}

                  {/* CASE 2: LOCKED, AMOUNT DUE = 0 */}
                  {session.checkOutTime && totalAmountDue === 0 && paymentStatus !== 'PAID' && (
                    <button
                      type="button"
                      onClick={handleCompleteZeroAmount}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">check_circle</span>
                      )}
                      Hoàn tất Checkout (Miễn phí)
                    </button>
                  )}

                  {/* CASE 3: LOCKED, AMOUNT DUE > 0, FAILED PAYMENT */}
                  {session.checkOutTime && totalAmountDue > 0 && paymentStatus === 'FAILED' && (
                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      Tạo lại giao dịch thanh toán mới
                    </button>
                  )}

                  {/* CASE 4: LOCKED, AMOUNT DUE > 0, IDLE/PENDING */}
                  {session.checkOutTime && totalAmountDue > 0 && (paymentStatus === 'IDLE' || paymentStatus === 'PENDING') && (
                    <>
                      {paymentMethod === 'ONLINE_BANKING' ? (
                        vnpayUrl ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleVerifyOnlinePayment}
                              disabled={isProcessing}
                              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
                            >
                              {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-base">task_alt</span>
                              )}
                              Xác nhận đã thanh toán
                            </button>
                            <button
                              type="button"
                              onClick={handleSimulatePaymentFailed}
                              disabled={isProcessing}
                              className="px-3 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold transition-all"
                            >
                              Giả lập Lỗi
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCreatePaymentOnline}
                            disabled={isProcessing}
                            className="w-full py-3.5 bg-[#006d43] hover:bg-[#005c38] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                          >
                            {isProcessing ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                            )}
                            Tạo Link VNPay & QR Code
                          </button>
                        )
                      ) : (
                        // CASH METHOD
                        <button
                          type="button"
                          onClick={handleCompleteCashPayment}
                          disabled={isProcessing}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-base">payments</span>
                          )}
                          Xác nhận thu Tiền mặt & Hoàn tất
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* SUCCESS OVERLAY */}
                {apiSuccess && (
                  <div className="absolute inset-0 bg-emerald-600 flex flex-col items-center justify-center text-white font-sans transition-opacity duration-300 animate-fadeIn z-20">
                    <span className="material-symbols-outlined text-5xl text-white">check_circle</span>
                    <p className="font-black text-base mt-3">ĐÃ THANH TOÁN & CHECKOUT XONG!</p>
                    <p className="text-xs text-white/80 mt-1">Lượt gửi xe đã hoàn tất. Xe có thể rời bãi.</p>
                    <button
                      onClick={handleResetForm}
                      className="mt-6 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-lg text-xs font-bold transition-all"
                    >
                      Tiếp tục lượt xe khác
                    </button>
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* EMPTY/UNSELECTED STATE */
            <div className="p-16 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 bg-white shadow-xs">
              <span className="material-symbols-outlined text-5xl text-slate-300">search_check</span>
              <p className="text-sm font-bold text-slate-500 mt-3">Chọn hoặc tìm kiếm lượt đỗ xe</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy chọn một phương tiện trong danh sách đang ở trong bãi ở thanh bên trái hoặc nhập mã thẻ/biển số vào ô tìm kiếm để xử lý checkout.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}