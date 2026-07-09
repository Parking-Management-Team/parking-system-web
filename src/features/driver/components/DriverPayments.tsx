'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { 
  Wallet, 
  MapPin, 
  Clock, 
  Car, 
  QrCode, 
  CheckCircle, 
  X, 
  ExternalLink, 
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface BuildingItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  totalFloor: number;
}

interface ActiveSessionRecord {
  id: number;
  licensePlateIn: string;
  checkInTime: string;
  slotCode?: string;
  zoneCode?: string;
  sessionStatus: string;
  buildingId?: number;
}

interface PendingBookingRecord {
  id: number;
  buildingId: number;
  plannedCheckinTime: string;
  plannedCheckoutTime: string;
  depositAmount: number;
  bookingStatus: string;
  paymentDeadline: string;
  vehicleId: number;
  vehicle?: {
    licensePlate: string;
  };
}

export default function DriverPayments() {
  const { user, showToast } = useAuth();
  
  // Mounting state for Portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // API States
  const [activeSession, setActiveSession] = useState<ActiveSessionRecord | null>(null);
  const [pendingBookings, setPendingBookings] = useState<PendingBookingRecord[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Payment Modal States (session fee)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Deposit payment modal states (booking deposit mockup)
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [selectedBookingForDeposit, setSelectedBookingForDeposit] = useState<PendingBookingRecord | null>(null);
  const [isPayingDeposit, setIsPayingDeposit] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // 1. Fetch buildings
      try {
        const buildRes = await api.get<any>('/Buildings');
        if (buildRes.success && buildRes.data) {
          setBuildings(buildRes.data);
        }
      } catch (err) {
        console.error("Error loading buildings:", err);
      }

      // 2. Fetch user vehicles
      let userPlates: string[] = [];
      let vehiclesList: any[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          vehiclesList = vehRes.data;
          setVehicles(vehRes.data);
          userPlates = vehRes.data.map((v: any) => v.licensePlate);
        }
      } catch (err) {
        console.error("Error loading user vehicles", err);
      }

      // 3. Fetch active sessions
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
            setDuration(diffSecs);
            const matchedVehicle = vehiclesList.find((v: any) => v.licensePlate === matchedSession.licensePlateIn);
            const isMotor = matchedVehicle?.vehicleTypeId === 1 || matchedSession.slotCode?.startsWith('M');
            const rate = isMotor ? 5000 : 20000;
            setCost((diffSecs / 3600) * rate);
          } else {
            setActiveSession(null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        console.error("Error loading active session:", err);
        setActiveSession(null);
      }

      // 4. Fetch pending bookings
      try {
        const bookRes = await api.get<any>(`/bookings/by-account/${user.id}`);
        if (bookRes.success && Array.isArray(bookRes.data)) {
          const pending = bookRes.data.filter((b: any) => 
            b.bookingStatus === 'Pending' && 
            new Date(b.paymentDeadline).getTime() > Date.now()
          );
          setPendingBookings(pending);
        }
      } catch (err) {
        console.error("Error loading pending bookings:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch data on mount or user change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live timer tick for active session
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSession) {
      const checkInDate = new Date(activeSession.checkInTime);
      const diffSecs = Math.max(0, Math.floor((Date.now() - checkInDate.getTime()) / 1000));
      setDuration(diffSecs);
      
      const matchedVehicle = vehicles.find(v => v.licensePlate === activeSession.licensePlateIn);
      const isMotor = matchedVehicle?.vehicleTypeId === 1 || activeSession.slotCode?.startsWith('M');
      const rate = isMotor ? 5000 : 20000;
      setCost((diffSecs / 3600) * rate);

      timer = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          const nextCost = (next / 3600) * rate;
          setCost(nextCost);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, vehicles]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Pay Active Session Fee Online
  const handlePaySessionOnline = async () => {
    if (!activeSession) return;
    setIsProcessingPayment(true);
    try {
      const payRes = await api.post<any>('/payments', {
        sessionId: activeSession.id,
        paymentMethod: 'ONLINE_BANKING'
      });

      if (payRes.success && payRes.data) {
        setPaymentUrl(payRes.data.paymentUrl || '');
        setQrCodeUrl(payRes.data.qrCodeUrl || '');
        setShowPaymentModal(true);
      } else {
        showToast(payRes.message || 'Failed to generate online payment link.', 'error');
      }
    } catch (err) {
      console.error("Error initiating online payment for session:", err);
      showToast('Payment gateway offline.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Open deposit mockup modal
  const handleOpenDepositModal = (booking: PendingBookingRecord) => {
    setSelectedBookingForDeposit(booking);
    setShowDepositModal(true);
  };

  // Pay Booking Deposit via VNPAY (from deposit modal)
  const handlePayDepositVNPAY = async () => {
    if (!selectedBookingForDeposit) return;
    setIsPayingDeposit(true);
    try {
      const payRes = await api.post<any>('/payments', {
        bookingId: selectedBookingForDeposit.id,
        paymentMethod: 'ONLINE_BANKING'
      });
      if (payRes.success && payRes.data && payRes.data.paymentUrl) {
        showToast('Redirecting to VNPAY gateway...', 'success');
        window.location.href = payRes.data.paymentUrl;
      } else {
        showToast('Unable to create VNPAY payment link.', 'error');
      }
    } catch (err) {
      console.error('Error initiating VNPAY deposit payment:', err);
      showToast('Payment system is busy. Please try again later.', 'error');
    } finally {
      setIsPayingDeposit(false);
    }
  };

  // Pay Later – close deposit modal
  const handleDepositPayLater = () => {
    setShowDepositModal(false);
    setSelectedBookingForDeposit(null);
    showToast('Booking reserved! Please pay the deposit within the time limit.', 'success');
    fetchData();
  };

  // Close payment modal and refresh
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    fetchData();
  };

  const hasOutstandingBills = activeSession !== null || pendingBookings.length > 0;

  return (
    <div className="p-8 max-w-[900px] mx-auto space-y-8">
      
      {/* PAGE HEADER */}
      <section className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Outstanding Bills</h1>
        <p className="text-sm text-slate-400 mt-1.5">Manage and pay your active parking fees and pending reservation deposits.</p>
      </section>

      {/* BILLS LIST AREA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-medium">Scanning outstanding balances...</p>
        </div>
      ) : !hasOutstandingBills ? (
        <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-700 text-base">All Bills Settled!</h3>
            <p className="text-xs text-slate-400 max-w-[320px] mx-auto leading-relaxed">
              You have no active parking fees or unpaid reservation deposits. Enjoy your day!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. ACTIVE SESSION BILL */}
          {activeSession && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 transition-all hover:border-slate-300/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Unpaid Active Parking Fee</h3>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                  Check-out required
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Location</p>
                    <p className="text-slate-700 font-extrabold mt-0.5">
                      {buildings.find(b => b.id === activeSession.buildingId)?.name || 'Building A'}
                    </p>
                    <p className="text-[10px] text-slate-400">Slot {activeSession.slotCode || 'Allocating...'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 md:pl-4">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Duration</p>
                    <p className="text-slate-700 font-extrabold mt-0.5 font-mono">{formatDuration(duration)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 md:pl-4">
                  <Car className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Vehicle License Plate</p>
                    <p className="text-slate-700 font-extrabold mt-0.5">{activeSession.licensePlateIn}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-left">
                  <span className="text-xs text-slate-400 font-semibold block">Total Accrued Fee</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{Math.round(cost).toLocaleString('vi-VN')} đ</span>
                </div>
                <button 
                  onClick={handlePaySessionOnline}
                  disabled={isProcessingPayment}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pay Parking Fee via VNPAY</span>
                </button>
              </div>
            </div>
          )}

          {pendingBookings.map((booking) => {
            const matchedVehicle = vehicles.find(v => v.id === booking.vehicleId);
            return (
              <div key={booking.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 transition-all hover:border-slate-300/80">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Unpaid Booking Deposit</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                      Hạn thanh toán: {new Date(booking.paymentDeadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                      Deposit Pending
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Building</p>
                      <p className="text-slate-700 font-extrabold mt-0.5">
                        {buildings.find(b => b.id === booking.buildingId)?.name || 'Building A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 md:pl-4">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Check-in Schedule</p>
                      <p className="text-slate-700 font-extrabold mt-0.5">
                        {new Date(booking.plannedCheckinTime).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 md:pl-4">
                    <Car className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Vehicle</p>
                      <p className="text-slate-700 font-extrabold mt-0.5">
                        {booking.vehicle?.licensePlate || matchedVehicle?.licensePlate || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 font-semibold block">Required Deposit Amount</span>
                    <span className="text-2xl font-black font-mono text-emerald-600">{booking.depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <button 
                    onClick={() => handleOpenDepositModal(booking)}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/10 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Deposit via VNPAY</span>
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ONLINE PAYMENT QR PORTAL MODAL (session fee) */}
      {mounted && showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Secure Payment Gateway</h3>
              </div>
              <button 
                onClick={handleClosePaymentModal}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center text-center space-y-6">
              <div className="space-y-1.5">
                <h4 className="text-slate-800 font-bold text-base">Scan to Settle Bill</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                  Scan the VNPAY QR code using your mobile banking app or click the button below to open the secure payment link.
                </p>
              </div>

              {qrCodeUrl ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner">
                  <img src={qrCodeUrl} alt="VNPAY QR Code" className="w-56 h-56 object-contain" />
                </div>
              ) : (
                <div className="w-56 h-56 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  Generating QR Code...
                </div>
              )}

              {paymentUrl && (
                <a 
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
                >
                  <span>Open payment link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="border-t border-slate-100 w-full pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/10"
                >
                  I have completed the payment
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DEPOSIT PAYMENT MOCKUP MODAL */}
      {mounted && showDepositModal && selectedBookingForDeposit && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">

              {/* Close button */}
              <div className="w-full flex justify-end mb-2">
                <button
                  onClick={() => { setShowDepositModal(false); setSelectedBookingForDeposit(null); }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Payment Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8" />
              </div>

              {/* Header */}
              <h3 className="text-lg font-extrabold text-slate-800">Confirm Deposit Payment</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Pay the reservation deposit to confirm your parking space slot.
              </p>

              {/* Price Details */}
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 my-6 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Deposit Due</span>
                <span className="text-base font-black text-emerald-700">
                  {Math.round(selectedBookingForDeposit.depositAmount).toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-left flex gap-2.5 items-start mb-6 w-full">
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
                  onClick={handlePayDepositVNPAY}
                  disabled={isPayingDeposit}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-700/10 transition-all flex items-center justify-center gap-1.5"
                >
                  {isPayingDeposit ? (
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
                  onClick={handleDepositPayLater}
                  disabled={isPayingDeposit}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  Pay Later (Thanh toán sau)
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
