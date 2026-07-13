'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/lib/api/client';
import { Booking } from '@/features/booking/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
};

type ActiveSession = {
  id: number;
  licensePlateIn?: string | null;
  cardCode?: string | null;
  vehicleTypeName?: string | null;
  vehicleType?: string | null;
  checkInTime?: string | null;
  slotCode?: string | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  sessionStatus?: string | null;
};

type PaymentItem = {
  id: number;
  amount: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentTime?: string | null;
};

type IncidentItem = {
  id: number;
  status?: string | null;
  incidentName?: string | null;
  licensePlate?: string | null;
  createdAt?: string | null;
};

type ShiftStats = {
  vehiclesInParking: number;
  cashRevenue: number;
  onlineRevenue: number;
  openIncidents: number;
  confirmedBookings: number;
  upcomingBookings: number;
  gracePeriodBookings: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const unwrap = <T,>(res: BaseResponse<T> | T | T[], fallback: T): T => {
  if (Array.isArray(res)) return res as unknown as T;
  if (res && typeof res === 'object' && 'success' in (res as object)) {
    const wrapped = res as BaseResponse<T>;
    return wrapped.success && wrapped.data != null ? wrapped.data : fallback;
  }
  return res as T;
};

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
};

const fmtCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getBookingTimeStatus = (booking: Booking): 'upcoming' | 'grace' | 'soon' | 'other' => {
  const now = Date.now();
  const checkin = booking.plannedCheckinTime ? new Date(booking.plannedCheckinTime).getTime() : null;
  const graceUntil = booking.checkinGraceUntil ? new Date(booking.checkinGraceUntil).getTime() : null;

  if (checkin === null) return 'other';

  // Đang trong grace period (đã qua giờ checkin nhưng chưa EXPIRED)
  if (graceUntil && now > checkin && now <= graceUntil) return 'grace';

  // Sắp đến giờ (<= 60 phút tới)
  if (checkin > now && checkin - now <= 60 * 60 * 1000) return 'soon';

  // Trong vòng 3 tiếng tới
  if (checkin > now && checkin - now <= 3 * 60 * 60 * 1000) return 'upcoming';

  return 'other';
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`group flex flex-col gap-3 rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${href ? 'cursor-pointer' : ''}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
        <span className="material-symbols-outlined text-xl text-white">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-black text-[#111c2d]">{value}</p>
        <p className="mt-0.5 text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        {sub && <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Booking Review Card ──────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  const status = getBookingTimeStatus(booking);

  const badgeClass =
    status === 'grace'
      ? 'bg-red-100 text-red-700 border-red-200'
      : status === 'soon'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const badgeLabel =
    status === 'grace' ? '⚠ In grace period' : status === 'soon' ? '⏰ Coming soon' : '📅 Upcoming';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-base font-black text-[#111c2d] truncate">
            {booking.licensePlate || booking.vehiclePlate || '—'}
          </p>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {booking.vehicleTypeName || booking.vehicleType || 'Vehicle'} · {booking.buildingName || 'Facility'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[10px] font-black uppercase text-slate-400">Check-in Time</p>
          <p className="mt-0.5 text-xs font-black text-[#111c2d]">
            {booking.plannedCheckinTime ? fmtDate(booking.plannedCheckinTime) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[10px] font-black uppercase text-slate-400">Check-out Time</p>
          <p className="mt-0.5 text-xs font-black text-[#111c2d]">
            {booking.plannedCheckoutTime ? fmtDate(booking.plannedCheckoutTime) : '—'}
          </p>
        </div>
        {booking.depositAmount > 0 && (
          <div className="rounded-xl bg-emerald-50 p-2.5">
            <p className="text-[10px] font-black uppercase text-emerald-500">Deposit Paid</p>
            <p className="mt-0.5 text-xs font-black text-emerald-700">{fmtCurrency(booking.depositAmount)}</p>
          </div>
        )}
        {booking.checkinGraceUntil && (
          <div className="rounded-xl bg-amber-50 p-2.5">
            <p className="text-[10px] font-black uppercase text-amber-500">Grace Until</p>
            <p className="mt-0.5 text-xs font-black text-amber-700">{fmt(booking.checkinGraceUntil)}</p>
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold text-slate-400">
        Booking #{booking.code || `BK-${booking.id}`} · {booking.bookingStatus}
      </p>
    </div>
  );
}

// ─── Active Session Row ───────────────────────────────────────────────────────

function SessionRow({ session }: { session: ActiveSession }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:bg-white hover:shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white">
        <span className="material-symbols-outlined text-base">directions_car</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-black text-[#111c2d] truncate">
          {session.licensePlateIn || '—'}
        </p>
        <p className="text-[11px] font-bold text-slate-400 truncate">
          {session.cardCode || 'No card'} · {session.vehicleTypeName || session.vehicleType || 'Vehicle'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-black text-slate-600">{fmt(session.checkInTime)}</p>
        <p className="text-[10px] font-bold text-slate-400">{session.slotCode || session.zoneCode || '—'}</p>
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  desc,
  href,
  color,
}: {
  icon: string;
  label: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-200"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color} transition group-hover:scale-110`}>
        <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-[#111c2d]">{label}</p>
        <p className="text-xs font-medium text-slate-500 truncate">{desc}</p>
      </div>
      <span className="material-symbols-outlined ml-auto text-slate-300 text-lg group-hover:text-slate-500 transition">
        arrow_forward
      </span>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffOverview() {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, paymentRes, incidentRes, bookingRes] = await Promise.allSettled([
        api.get<BaseResponse<ActiveSession[]> | ActiveSession[]>('/parking-sessions/active'),
        api.get<BaseResponse<PaymentItem[]> | PaymentItem[]>('/payments'),
        api.get<BaseResponse<IncidentItem[]> | IncidentItem[]>('/Incident'),
        api.get<BaseResponse<Booking[]> | Booking[]>('/bookings'),
      ]);

      if (sessionRes.status === 'fulfilled') {
        setActiveSessions(unwrap(sessionRes.value, []));
      }
      if (paymentRes.status === 'fulfilled') {
        const raw = unwrap(paymentRes.value, []);
        setPayments(Array.isArray(raw) ? raw : []);
      }
      if (incidentRes.status === 'fulfilled') {
        const raw = unwrap(incidentRes.value, []);
        setIncidents(Array.isArray(raw) ? raw : []);
      }
      if (bookingRes.status === 'fulfilled') {
        const raw = unwrap(bookingRes.value, []);
        const mapped = (Array.isArray(raw) ? raw : []).map((item: any) => ({
          id: item.id,
          code: item.code || `BK-${item.id}`,
          accountId: item.accountId,
          accountName: item.accountName || 'Customer',
          vehicleId: item.vehicleId,
          licensePlate: item.licensePlate || item.vehiclePlate || '',
          vehiclePlate: item.vehiclePlate || item.licensePlate || '',
          vehicleType: item.vehicleTypeName || item.vehicleType || '',
          vehicleTypeId: item.vehicleTypeId,
          vehicleTypeName: item.vehicleTypeName,
          buildingId: item.buildingId,
          buildingName: item.buildingName || 'Facility',
          plannedCheckinTime: item.plannedCheckinTime || item.createdAt || '',
          plannedCheckoutTime: item.plannedCheckoutTime || '',
          depositAmount: item.depositAmount || 0,
          bookingStatus: item.bookingStatus || item.status || 'Pending',
          depositPaid: item.depositPaid ?? (item.bookingStatus === 'Confirmed'),
          paymentDeadline: item.paymentDeadline || null,
          checkinGraceUntil: item.checkinGraceUntil || null,
          confirmedAt: item.confirmedAt || null,
          cancelledAt: item.cancelledAt || null,
          cancelReason: item.cancelReason || null,
          isWithinGrace: item.isWithinGrace ?? null,
          slotId: item.slotId || null,
          slotCode: item.slotCode || null,
          createdAt: item.createdAt || '',
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      showToast('Không tải được dữ liệu dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
    // Auto-refresh mỗi 2 phút
    const interval = setInterval(() => void loadDashboard(), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ── Computed stats ────────────────────────────────────────────────────────

  const shiftStart = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    // Ca sáng: 06-14, Ca chiều: 14-22, Ca đêm: 22-06
    if (h >= 6 && h < 14) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    } else if (h >= 14 && h < 22) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    } else {
      const d = h >= 22 ? new Date(now) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      if (h < 6) d.setDate(d.getDate() - 1);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 22, 0, 0);
    }
  }, []);

  const shiftLabel = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 6 && h < 14) return 'Morning (06:00 – 14:00)';
    if (h >= 14 && h < 22) return 'Afternoon (14:00 – 22:00)';
    return 'Night (22:00 – 06:00)';
  }, []);

  const stats = useMemo<ShiftStats>(() => {
    const shiftPayments = payments.filter(p => {
      if (!p.paymentTime) return false;
      return new Date(p.paymentTime) >= shiftStart && p.paymentStatus === 'PAID';
    });

    const cashRevenue = shiftPayments
      .filter(p => p.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const onlineRevenue = shiftPayments
      .filter(p => !p.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const confirmedBookings = bookings.filter(
      b => b.bookingStatus?.toUpperCase() === 'CONFIRMED'
    ).length;

    const upcomingBookings = bookings.filter(
      b => b.bookingStatus?.toUpperCase() === 'CONFIRMED' && ['soon', 'upcoming'].includes(getBookingTimeStatus(b))
    ).length;

    const gracePeriodBookings = bookings.filter(
      b => b.bookingStatus?.toUpperCase() === 'CONFIRMED' && getBookingTimeStatus(b) === 'grace'
    ).length;

    return {
      vehiclesInParking: activeSessions.length,
      cashRevenue,
      onlineRevenue,
      openIncidents: incidents.filter(i => i.status === 'OPEN').length,
      confirmedBookings,
      upcomingBookings,
      gracePeriodBookings,
    };
  }, [activeSessions, payments, incidents, bookings, shiftStart]);

  // Bookings cần Staff chú ý: grace period + sắp đến giờ (1h)
  const priorityBookings = useMemo(
    () =>
      bookings
        .filter(b => {
          const st = getBookingTimeStatus(b);
          return (
            b.bookingStatus?.toUpperCase() === 'CONFIRMED' && (st === 'grace' || st === 'soon' || st === 'upcoming')
          );
        })
        .sort((a, b) => {
          const order = { grace: 0, soon: 1, upcoming: 2, other: 3 };
          return order[getBookingTimeStatus(a)] - order[getBookingTimeStatus(b)];
        }),
    [bookings]
  );

  const displayedSessions = showAllSessions ? activeSessions : activeSessions.slice(0, 5);
  const displayedBookings = showAllBookings ? priorityBookings : priorityBookings.slice(0, 4);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#006d43]">Staff Portal</p>
          <h1 className="mt-1 text-2xl font-black text-[#111c2d]">Operational Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi vận hành và điều phối cổng vào/ra theo thời gian thực.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700">{shiftLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111c2d] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#263143] disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon="directions_car"
          label="In Parking Now"
          value={stats.vehiclesInParking}
          sub="Active sessions"
          color="bg-[#111c2d]"
          href="/dashboard/staff/monitoring"
        />
        <StatCard
          icon="event_available"
          label="Confirmed Bookings"
          value={stats.confirmedBookings}
          sub={
            stats.gracePeriodBookings > 0
              ? `${stats.gracePeriodBookings} in grace!`
              : stats.upcomingBookings > 0
                ? `${stats.upcomingBookings} within 3h`
                : 'No upcoming soon'
          }
          color={stats.gracePeriodBookings > 0 ? 'bg-red-500' : stats.upcomingBookings > 0 ? 'bg-amber-500' : 'bg-[#006d43]'}
        />
        <StatCard
          icon="warning"
          label="Open Incidents"
          value={stats.openIncidents}
          sub={stats.openIncidents > 0 ? 'Need attention' : 'All clear'}
          color={stats.openIncidents > 0 ? 'bg-red-500' : 'bg-[#006d43]'}
          href="/dashboard/staff/incident"
        />
        <StatCard
          icon="payments"
          label="Shift Revenue"
          value={fmtCurrency(stats.cashRevenue + stats.onlineRevenue)}
          sub={`Cash: ${fmtCurrency(stats.cashRevenue)}`}
          color="bg-violet-500"
        />
      </div>

      {/* ── Main content: 2 columns ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Booking Review + Active Sessions */}
        <div className="space-y-6">
          {/* ── Booking Review ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d43]">Booking Review</p>
                <h2 className="mt-1 text-lg font-black text-[#111c2d]">
                  Incoming Reservations
                </h2>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  Booking CONFIRMED sắp đến giờ hoặc đang trong grace period.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {stats.gracePeriodBookings > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                    {stats.gracePeriodBookings} Grace
                  </span>
                )}
                {stats.upcomingBookings > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    {stats.upcomingBookings} Soon
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              {loading && priorityBookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#006d43]"></div>
                  <p className="text-sm font-bold text-slate-400">Loading bookings...</p>
                </div>
              ) : displayedBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300">event_available</span>
                  <p className="mt-2 text-sm font-bold text-slate-400">Không có booking nào cần chú ý ngay lúc này.</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {stats.confirmedBookings > 0
                      ? `${stats.confirmedBookings} booking CONFIRMED nhưng chưa đến giờ.`
                      : 'Không có booking nào đang CONFIRMED.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {displayedBookings.map(b => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>

                  {priorityBookings.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllBookings(prev => !prev)}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                    >
                      {showAllBookings
                        ? 'Show less'
                        : `Show ${priorityBookings.length - 4} more bookings`}
                    </button>
                  )}
                </>
              )}
            </div>

            <Link
              href="/dashboard/staff/bookings"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              View all bookings
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {/* ── Active Sessions ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d43]">Live</p>
                <h2 className="mt-1 text-lg font-black text-[#111c2d]">
                  Vehicles In Parking
                  <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-black text-slate-600">
                    {activeSessions.length}
                  </span>
                </h2>
              </div>
              <Link
                href="/dashboard/staff/monitoring"
                className="text-xs font-black text-[#006d43] hover:underline"
              >
                Full monitoring →
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {loading && activeSessions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#006d43]"></div>
                </div>
              ) : displayedSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300">garage</span>
                  <p className="mt-2 text-sm font-bold text-slate-400">Bãi xe đang trống.</p>
                </div>
              ) : (
                <>
                  {displayedSessions.map(s => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                  {activeSessions.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSessions(p => !p)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                    >
                      {showAllSessions
                        ? 'Show less'
                        : `Show ${activeSessions.length - 5} more vehicles`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Shift Summary + Quick Actions */}
        <div className="space-y-6">
          {/* ── Shift Summary ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d43]">Shift Summary</p>
            <h2 className="mt-1 text-lg font-black text-[#111c2d]">{shiftLabel}</h2>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Vehicles In Parking', value: String(stats.vehiclesInParking), icon: 'directions_car', color: 'text-[#111c2d]' },
                { label: 'Open Incidents', value: String(stats.openIncidents), icon: 'warning', color: stats.openIncidents > 0 ? 'text-red-600' : 'text-slate-600' },
                { label: 'Confirmed Bookings', value: String(stats.confirmedBookings), icon: 'event_available', color: 'text-[#006d43]' },
                { label: 'In Grace Period', value: String(stats.gracePeriodBookings), icon: 'schedule', color: stats.gracePeriodBookings > 0 ? 'text-amber-600' : 'text-slate-600' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className={`material-symbols-outlined text-xl ${row.color}`}>{row.icon}</span>
                  <span className="flex-1 text-sm font-bold text-slate-600">{row.label}</span>
                  <span className={`text-xl font-black ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-[#006d43]/5 border border-[#006d43]/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#006d43]">Shift Revenue</p>
              <p className="mt-1 text-2xl font-black text-[#111c2d]">
                {fmtCurrency(stats.cashRevenue + stats.onlineRevenue)}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-400">Cash</p>
                  <p className="font-black text-slate-700">{fmtCurrency(stats.cashRevenue)}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400">Online</p>
                  <p className="font-black text-slate-700">{fmtCurrency(stats.onlineRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d43]">Quick Actions</p>
            <h2 className="mt-1 text-lg font-black text-[#111c2d]">Jump To</h2>
            <div className="mt-4 space-y-2">
              <QuickAction
                icon="login"
                label="Vehicle Check-in"
                desc="Ghi nhận xe vào cổng"
                href="/dashboard/staff/check-in"
                color="bg-emerald-500"
              />
              <QuickAction
                icon="logout"
                label="Vehicle Check-out"
                desc="Thanh toán & cho xe ra"
                href="/dashboard/staff/check-out"
                color="bg-[#111c2d]"
              />
              <QuickAction
                icon="grid_view"
                label="Slot Monitoring"
                desc="Xem tình trạng chỗ đỗ"
                href="/dashboard/staff/monitoring"
                color="bg-blue-500"
              />
              <QuickAction
                icon="warning"
                label="Incident Reports"
                desc="Xử lý sự cố và báo cáo"
                href="/dashboard/staff/incident"
                color="bg-red-500"
              />
              <QuickAction
                icon="event_available"
                label="Bookings"
                desc="Danh sách đặt chỗ trước"
                href="/dashboard/staff/bookings"
                color="bg-violet-500"
              />
              <QuickAction
                icon="credit_card"
                label="Card Management"
                desc="Quản lý thẻ gửi xe"
                href="/dashboard/staff/cards"
                color="bg-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
