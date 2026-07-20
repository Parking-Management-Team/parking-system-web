'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
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
  Loader2
} from 'lucide-react';
import { formatPlate } from '@/lib/utils/format';

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
}

interface ParkingSessionRecord {
  id: number;
  licensePlateIn: string;
  checkInTime: string;
  slotCode?: string;
  zoneCode?: string;
  sessionStatus: string;
}

export default function DriverSessions() {
  const { user, showToast } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'booked' | 'walkin'>('booked');

  // API states
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeSession, setActiveSession] = useState<ParkingSessionRecord | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mounting for portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Modify booking modal states
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingBooking, setModifyingBooking] = useState<BookingRecord | null>(null);
  const [newCheckinDate, setNewCheckinDate] = useState('');
  const [newCheckinTime, setNewCheckinTime] = useState('');
  const [isSavingModify, setIsSavingModify] = useState(false);

  // Cancel confirm modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Extend booking modal states
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<BookingRecord | null>(null);
  const [newCheckoutDate, setNewCheckoutDate] = useState('');
  const [newCheckoutTime, setNewCheckoutTime] = useState('');
  const [isSavingExtend, setIsSavingExtend] = useState(false);

  // Walk-in live counter
  const [duration, setDuration] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);

  const fetchSessionsData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      let userPlates: string[] = [];
      let vehiclesList: any[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          setVehicles(vehRes.data);
          vehiclesList = vehRes.data;
          userPlates = vehRes.data.map((v: any) => v.licensePlate);
        }
      } catch (err) {
        console.error('Error loading vehicles', err);
      }

      // Fetch bookings
      try {
        const bookRes = await api.get<any>(`/bookings/by-account/${user.id}`);
        if (bookRes.success && bookRes.data) {
          const activeBookings = bookRes.data.filter((b: any) =>
            b.bookingStatus === 'Pending' || b.bookingStatus === 'Confirmed' || b.bookingStatus === 'CheckedIn'
          );
          setBookings(activeBookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Error loading bookings', err);
        setBookings([]);
      }

      // Fetch active sessions
      try {
        const sessRes = await api.get<any>('/parking-sessions/active');
        if (sessRes.success && sessRes.data) {
          const matchedSession = sessRes.data.find((s: any) =>
            userPlates.length > 0
              ? userPlates.includes(s.licensePlateIn)
              : false
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
        }
      } catch (err) {
        console.error('Error loading active sessions', err);
        setActiveSession(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessionsData();
  }, [fetchSessionsData]);

  // Live timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'walkin' && activeSession) {
      const matchedVehicle = vehicles.find(v => v.licensePlate === activeSession.licensePlateIn);
      const isMotor = matchedVehicle?.vehicleTypeId === 1 || activeSession.slotCode?.startsWith('M');
      const rate = isMotor ? 5000 : 20000;
      timer = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          setCost((next / 3600) * rate);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, activeSession, vehicles]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // ── Cancel Booking ─────────────────────────────────────────
  const openCancelConfirm = (bookingId: number) => {
    setCancellingId(bookingId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    setIsCancelling(true);
    try {
      await api.delete(`/bookings/${cancellingId}`);
      showToast('Booking cancelled successfully.', 'success');
      setShowCancelModal(false);
      setCancellingId(null);
      fetchSessionsData();
    } catch (err: any) {
      console.error('Cancel error:', err);
      const errMsg = err?.data?.message || err?.message || 'Unable to cancel booking. Please contact support.';
      showToast(errMsg, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Modify Booking ──────────────────────────────────────────
  const openModifyModal = (booking: BookingRecord) => {
    setModifyingBooking(booking);
    const dt = new Date(booking.plannedCheckinTime);
    
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
    
    setNewCheckinDate(`${year}-${month}-${day}`);
    setNewCheckinTime(`${hour}:${minute}`);
    setShowModifyModal(true);
  };

  const handleSaveModify = async () => {
    if (!modifyingBooking) return;
    if (!newCheckinDate || !newCheckinTime) {
      showToast('Please select a valid date and time.', 'error');
      return;
    }
    setIsSavingModify(true);
    try {
      const formatLocalVNTime = (date: Date): string => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
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

      const checkinDate = new Date(`${newCheckinDate}T${newCheckinTime}:00+07:00`);
      
      // Tính toán khoảng thời gian đỗ xe ban đầu, tối thiểu là 4 tiếng
      const originalDurationMs = modifyingBooking.plannedCheckoutTime 
        ? (new Date(modifyingBooking.plannedCheckoutTime).getTime() - new Date(modifyingBooking.plannedCheckinTime).getTime())
        : 4 * 60 * 60 * 1000;
      const durationMs = Math.max(originalDurationMs, 4 * 60 * 60 * 1000);
      const checkoutDate = new Date(checkinDate.getTime() + durationMs);

      await api.put(`/bookings/${modifyingBooking.id}`, {
        plannedCheckinTime: formatLocalVNTime(checkinDate),
        plannedCheckoutTime: formatLocalVNTime(checkoutDate)
      });
      showToast('Booking updated successfully!', 'success');
      setShowModifyModal(false);
      setModifyingBooking(null);
      fetchSessionsData();
    } catch (err: any) {
      console.error('Modify error:', err);
      const errMsg = err?.data?.message || err?.message || 'Failed to update booking. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsSavingModify(false);
    }
  };

  // ── Extend Booking ──────────────────────────────────────────
  const openExtendModal = (booking: BookingRecord) => {
    setExtendingBooking(booking);
    
    // Set default: current planned checkout time plus 1 hour (in VN timezone)
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
      const formatLocalVNTime = (date: Date): string => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
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
          fetchSessionsData();
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

  const matchedVehicleForActive = vehicles.find(v => v.licensePlate === activeSession?.licensePlateIn);
  const isMotor = matchedVehicleForActive?.vehicleTypeId === 1 || activeSession?.slotCode?.startsWith('M');

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">

      {/* PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parking Sessions</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your active check-ins and pre-booked parking reservations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all ${activeTab === 'booked'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
          >
            Pre-booked ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('walkin')}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all ${activeTab === 'walkin'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
          >
            Walk-in / Active ({activeSession ? 1 : 0})
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-xs">Synchronizing sessions from database...</p>
        </div>
      ) : (
        <>
          {/* TAB CONTENT: PRE-BOOKED */}
          {activeTab === 'booked' && (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Main Card */}
                  <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            booking.bookingStatus === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : booking.bookingStatus === 'CheckedIn'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                          {booking.bookingStatus}
                        </span>
                        <h2 className="text-lg font-bold text-[#1B2A41] mt-1">Booking #BK-{booking.id}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Created date</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Location</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">
                              {booking.buildingName || 'Smart City Plaza'}
                            </p>
                            <p className="text-xs text-slate-400">Smart City Zone</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Scheduled Date & Time</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">
                              {new Date(booking.plannedCheckinTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicle Plate</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{formatPlate(booking.licensePlate)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Payment</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{(booking.totalAmount ?? booking.depositAmount ?? 0).toLocaleString('vi-VN')} đ</p>
                            <p className="text-xs text-slate-400">
                              {(() => {
                                const s = new Date(booking.plannedCheckinTime);
                                const e = new Date(booking.plannedCheckoutTime);
                                const hrs = (e.getTime() - s.getTime()) / 3600000;
                                if (hrs <= 0) return '';
                                const h = Math.floor(hrs);
                                const m = Math.round((hrs - h) * 60);
                                return m > 0 ? `${h}h ${m}m` : `${h}h`;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-100 my-4"></div>

                    <div className="flex justify-end gap-3">
                      {booking.bookingStatus !== 'CheckedIn' && (
                        <button
                          onClick={() => openCancelConfirm(booking.id)}
                          className="px-5 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {booking.bookingStatus === 'Pending' && (
                        <button
                          onClick={() => openModifyModal(booking)}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Modify Reservation
                        </button>
                      )}
                      {(booking.bookingStatus === 'Pending' || booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'CheckedIn') ? (
                        <button
                          onClick={() => openExtendModal(booking)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Extend Stay
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-1.5 border border-slate-200"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Extend Stay (Locked)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code Side Card */}
                  <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl">
                      <QrCode className="w-48 h-48 text-[#1B2A41]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700">Check-in QR Pass</h4>
                      <p className="text-xs text-slate-400 max-w-[240px]">Scan this QR code at the gate terminal to check-in on arrival.</p>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono tracking-wider">REF-BK{booking.id}</span>
                  </div>
                </div>
              ))}

              {bookings.length === 0 && (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-slate-700 text-sm">No Pre-booked Sessions</h3>
                  <p className="text-xs text-slate-400">You don't have any pending or active parking reservations.</p>
                  <button
                    onClick={() => router.push('/dashboard/driver/booking')}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm mt-3"
                  >
                    Reserve a Spot
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: WALK-IN / ACTIVE */}
          {activeTab === 'walkin' && (
            <div className="space-y-6">
              {activeSession ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Main Card */}
                  <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md animate-pulse">Live Tracking</span>
                        <h2 className="text-lg font-bold text-[#1B2A41] mt-1">Session #SS-{activeSession.id}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Check-in time</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(activeSession.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Location</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">
                              {activeSession.zoneCode || 'Central Plaza'}
                            </p>
                            <p className="text-xs text-slate-400">Slot {activeSession.slotCode || 'Allocating...'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Timer className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Time Elapsed</h3>
                            <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 tabular-nums">{formatDuration(duration)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicle Info</h3>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{formatPlate(activeSession.licensePlateIn)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <RefreshCw className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accumulated Fee</h3>
                            <p className="text-sm font-bold text-emerald-600 mt-0.5">{Math.round(cost).toLocaleString('vi-VN')} đ</p>
                            <p className="text-xs text-slate-400">Rate: {isMotor ? '5.000' : '20.000'} đ/h</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-800">
                      <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                      <p className="text-xs font-semibold">Note: The fee accumulates in real-time. Scan the QR code on the right at the gate to check-out and pay automatically from your wallet.</p>
                    </div>
                  </div>

                  {/* QR Code Side Card */}
                  <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl">
                      <QrCode className="w-48 h-48 text-[#1B2A41]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700">Check-out QR Pass</h4>
                      <p className="text-xs text-slate-400 max-w-[240px]">Scan this QR code at the exit gate terminal to check-out and pay.</p>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono tracking-wider">REF-SS{activeSession.id}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-slate-700 text-sm">No Active Session</h3>
                  <p className="text-xs text-slate-400">You don't have any active check-in sessions running at this time.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── CANCEL CONFIRM MODAL ── */}
      {mounted && showCancelModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Cancel Booking?</h3>
              <p className="text-xs text-slate-400 mt-1">This action cannot be undone. Your booking will be permanently cancelled.</p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancellingId(null); }}
                disabled={isCancelling}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCancelling ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...</> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODIFY BOOKING MODAL ── */}
      {mounted && showModifyModal && modifyingBooking && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">Modify Booking #BK-{modifyingBooking.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Update the check-in date & time for this reservation.</p>
              </div>
              <button
                onClick={() => setShowModifyModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">New Check-in Date</label>
                <input
                  type="date"
                  value={newCheckinDate}
                  min={(() => {
                    const d = new Date();
                    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
                    return `${p.find(x => x.type === 'year')?.value}-${p.find(x => x.type === 'month')?.value}-${p.find(x => x.type === 'day')?.value}`;
                  })()}
                  onChange={(e) => setNewCheckinDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">New Check-in Time</label>
                <input
                  type="time"
                  value={newCheckinTime}
                  onChange={(e) => setNewCheckinTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm rounded-xl"
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>No additional payment required for time adjustments. Your original deposit remains valid.</span>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModifyModal(false)}
                disabled={isSavingModify}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModify}
                disabled={isSavingModify}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSavingModify ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EXTEND STAY MODAL ── */}
      {mounted && showExtendModal && extendingBooking && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">Extend Stay #BK-{extendingBooking.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Select a new checkout date and time for this reservation.</p>
              </div>
              <button
                onClick={() => setShowExtendModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Current Checkout Time</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-xl text-slate-600 font-semibold">
                  {new Date(extendingBooking.plannedCheckoutTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">New Checkout Date</label>
                <input
                  type="date"
                  value={newCheckoutDate}
                  min={(() => {
                    const d = new Date(extendingBooking.plannedCheckoutTime);
                    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
                    return `${p.find(x => x.type === 'year')?.value}-${p.find(x => x.type === 'month')?.value}-${p.find(x => x.type === 'day')?.value}`;
                  })()}
                  onChange={(e) => setNewCheckoutDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">New Checkout Time</label>
                <input
                  type="time"
                  value={newCheckoutTime}
                  onChange={(e) => setNewCheckoutTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm rounded-xl"
                />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Extending your stay may require additional payment. You will be redirected to VNPay to confirm.</span>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowExtendModal(false)}
                disabled={isSavingExtend}
                className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              {extendingBooking.bookingStatus === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleSaveExtend(true)}
                    disabled={isSavingExtend}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    Pay Later
                  </button>
                  <button
                    onClick={() => handleSaveExtend(false)}
                    disabled={isSavingExtend}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingExtend ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Pay Now'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleSaveExtend(false)}
                  disabled={isSavingExtend}
                  className="flex-grow py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingExtend ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Confirm Extension'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
