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
  bookingId?: number | null;
  monthlySubscriptionId?: number | null;
};



type IncidentItem = {
  id: number;
  status?: string | null;
  incidentName?: string | null;
  licensePlate?: string | null;
  createdAt?: string | null;
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



const getBookingTimeStatus = (booking: Booking): 'grace' | 'soon' | 'upcoming' | 'other' => {
  const now = Date.now();
  const checkin = booking.plannedCheckinTime ? new Date(booking.plannedCheckinTime).getTime() : null;
  const graceUntil = booking.checkinGraceUntil ? new Date(booking.checkinGraceUntil).getTime() : null;
  if (checkin === null) return 'other';
  if (graceUntil && now > checkin && now <= graceUntil) return 'grace';
  if (checkin > now && checkin - now <= 60 * 60 * 1000) return 'soon';
  if (checkin > now && checkin - now <= 3 * 60 * 60 * 1000) return 'upcoming';
  return 'other';
};

// Xác định loại khách theo session
const getSessionType = (session: ActiveSession): string => {
  if (session.monthlySubscriptionId) return 'Monthly';
  if (session.bookingId) return 'Booking';
  return 'Walk-in';
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  badge,
  color,
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  badge?: { text: string; color: string } | null;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${href ? 'cursor-pointer' : ''}`}>
      {badge && (
        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-black ${badge.color}`}>
          {badge.text}
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <span className="material-symbols-outlined text-xl text-white">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-[#111c2d]">{value}</p>
        <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        {sub && <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  const status = getBookingTimeStatus(booking);
  const badgeConfig = {
    grace:    { cls: 'bg-red-100 text-red-700 border-red-200',    label: '⚠ Grace Period' },
    soon:     { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: '⏰ Within 1h' },
    upcoming: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '📅 Upcoming' },
    other:    { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Scheduled' },
  }[status];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-base font-black text-[#111c2d] truncate">
            {booking.licensePlate || booking.vehiclePlate || '—'}
          </p>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {booking.vehicleTypeName || booking.vehicleType || 'Vehicle'} · {booking.buildingName || 'Facility'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${badgeConfig.cls}`}>
          {badgeConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-[10px] font-black uppercase text-slate-400">Check-in</p>
          <p className="mt-0.5 text-xs font-black text-[#111c2d]">{fmtDate(booking.plannedCheckinTime)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-[10px] font-black uppercase text-slate-400">Check-out</p>
          <p className="mt-0.5 text-xs font-black text-[#111c2d]">{fmtDate(booking.plannedCheckoutTime)}</p>
        </div>
        {booking.depositAmount > 0 && (
          <div className="col-span-2 rounded-lg bg-emerald-50 p-2.5">
            <p className="text-[10px] font-black uppercase text-emerald-500">Deposit Paid</p>
            <p className="mt-0.5 text-xs font-black text-emerald-700">{fmtCurrency(booking.depositAmount)}</p>
          </div>
        )}
        {booking.checkinGraceUntil && (
          <div className="col-span-2 rounded-lg bg-amber-50 p-2.5">
            <p className="text-[10px] font-black uppercase text-amber-500">Grace Deadline</p>
            <p className="mt-0.5 text-xs font-black text-amber-700">{fmt(booking.checkinGraceUntil)}</p>
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold text-slate-400">
        {booking.code || `BK-${booking.id}`} · {booking.bookingStatus}
      </p>
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: ActiveSession }) {
  const typeLabel = getSessionType(session);
  const typeBadge: Record<string, string> = {
    Monthly: 'bg-violet-100 text-violet-700',
    Booking: 'bg-blue-100 text-blue-700',
    'Walk-in': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:bg-white hover:shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111c2d] text-white">
        <span className="material-symbols-outlined text-sm">directions_car</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-black text-[#111c2d]">
          {session.licensePlateIn || '—'}
        </p>
        <p className="text-[11px] font-bold text-slate-400 truncate">
          {/* Hiển thị card code nếu có, nếu không thì ẩn */}
          {session.cardCode ? `${session.cardCode}` : 'No card code'}
          {' · '}
          {session.slotCode || session.zoneCode || '—'}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <p className="text-xs font-black text-slate-600">In {fmt(session.checkInTime)}</p>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${typeBadge[typeLabel]}`}>
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffOverview() {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, incidentRes, bookingRes] = await Promise.allSettled([
        api.get<BaseResponse<ActiveSession[]> | ActiveSession[]>('/parking-sessions/active'),
        api.get<BaseResponse<IncidentItem[]> | IncidentItem[]>('/Incident'),
        api.get<BaseResponse<Booking[]> | Booking[]>('/bookings'),
      ]);

      if (sessionRes.status === 'fulfilled') setActiveSessions(unwrap(sessionRes.value, []));

      if (incidentRes.status === 'fulfilled') {
        const raw = unwrap(incidentRes.value, []);
        setIncidents(Array.isArray(raw) ? raw : []);
      }

      if (bookingRes.status === 'fulfilled') {
        const raw = unwrap(bookingRes.value, []);
        const mapped = (Array.isArray(raw) ? raw : []).map((item: any): Booking => ({
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
      showToast('Could not load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
    const interval = setInterval(() => void loadDashboard(), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const openIncidents = useMemo(
    () => incidents.filter(i => i.status === 'OPEN' || i.status === 'PROCESSING'),
    [incidents]
  );

  const { priorityBookings, confirmedCount, graceCount, soonCount } = useMemo(() => {
    const confirmed = bookings.filter(b => b.bookingStatus?.toUpperCase() === 'CONFIRMED');
    const priority = confirmed
      .filter(b => getBookingTimeStatus(b) !== 'other')
      .sort((a, b) => {
        const o = { grace: 0, soon: 1, upcoming: 2, other: 3 };
        return o[getBookingTimeStatus(a)] - o[getBookingTimeStatus(b)];
      });
    const grace = confirmed.filter(b => getBookingTimeStatus(b) === 'grace').length;
    const soon = confirmed.filter(b => getBookingTimeStatus(b) === 'soon').length;
    return { priorityBookings: priority, confirmedCount: confirmed.length, graceCount: grace, soonCount: soon };
  }, [bookings]);

  const displayedSessions = showAllSessions ? activeSessions : activeSessions.slice(0, 6);
  const displayedBookings = showAllBookings ? priorityBookings : priorityBookings.slice(0, 4);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006d43]">Staff Portal</p>
          <h1 className="mt-0.5 text-xl font-black text-[#111c2d]">Operational Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#111c2d] px-4 py-2 text-sm font-black text-white transition hover:bg-[#263143] disabled:opacity-60 self-start sm:self-auto"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon="directions_car"
          label="In Parking Now"
          value={activeSessions.length}
          sub="Active sessions"
          color="bg-[#111c2d]"
          href="/dashboard/staff/monitoring"
        />
        <StatCard
          icon="event_available"
          label="Confirmed Bookings"
          value={confirmedCount}
          sub={graceCount > 0 ? `${graceCount} in grace!` : soonCount > 0 ? `${soonCount} within 1h` : 'No urgent bookings'}
          badge={graceCount > 0 ? { text: '!', color: 'bg-red-500 text-white' } : null}
          color={graceCount > 0 ? 'bg-red-500' : soonCount > 0 ? 'bg-amber-500' : 'bg-[#006d43]'}
        />
        <StatCard
          icon="warning"
          label="Open Incidents"
          value={openIncidents.length}
          sub={openIncidents.length > 0 ? 'Need attention' : 'All clear'}
          color={openIncidents.length > 0 ? 'bg-red-500' : 'bg-[#006d43]'}
          href="/dashboard/staff/incident"
        />
      </div>

      {/* ── Main 2-col ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

        {/* Left: Booking Review */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#006d43]">Booking Review</p>
              <h2 className="mt-0.5 text-base font-black text-[#111c2d]">Incoming Reservations</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                CONFIRMED bookings approaching check-in time or in grace period
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {graceCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-700">
                  {graceCount} Grace
                </span>
              )}
              {soonCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                  {soonCount} Soon
                </span>
              )}
            </div>
          </div>

          {loading && priorityBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#006d43]"></div>
              <p className="text-xs font-bold text-slate-400">Loading...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_available</span>
              <p className="mt-2 text-sm font-bold text-slate-400">No bookings require immediate attention.</p>
              <p className="mt-1 text-xs text-slate-400">
                {confirmedCount > 0 ? `${confirmedCount} CONFIRMED booking(s) pending.` : 'No CONFIRMED bookings.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {displayedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
              {priorityBookings.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllBookings(p => !p)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-black text-slate-600 hover:bg-slate-100 transition"
                >
                  {showAllBookings ? 'Show less' : `+${priorityBookings.length - 4} more bookings`}
                </button>
              )}
            </>
          )}

          <Link
            href="/dashboard/staff/bookings"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-black text-slate-500 hover:bg-slate-50 transition"
          >
            View all bookings
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Right: Live Sessions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#006d43]">Live</p>
              <h2 className="mt-0.5 text-base font-black text-[#111c2d]">
                Vehicles In Parking
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm font-black text-slate-600">
                  {activeSessions.length}
                </span>
              </h2>
            </div>
            <Link
              href="/dashboard/staff/monitoring"
              className="text-xs font-black text-[#006d43] hover:underline"
            >
              Slot map →
            </Link>
          </div>

          {/* Breakdown mini stats */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Walk-in', count: activeSessions.filter(s => !s.bookingId && !s.monthlySubscriptionId).length, color: 'text-slate-600 bg-slate-50' },
              { label: 'Booking', count: activeSessions.filter(s => s.bookingId).length, color: 'text-blue-600 bg-blue-50' },
              { label: 'Monthly', count: activeSessions.filter(s => s.monthlySubscriptionId).length, color: 'text-violet-600 bg-violet-50' },
            ].map(g => (
              <div key={g.label} className={`rounded-lg px-2 py-2 text-center ${g.color}`}>
                <p className="text-base font-black">{g.count}</p>
                <p className="text-[10px] font-black uppercase">{g.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {loading && activeSessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-[#006d43]"></div>
              </div>
            ) : displayedSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">garage</span>
                <p className="mt-2 text-sm font-bold text-slate-400">Parking lot is currently empty.</p>
              </div>
            ) : (
              <>
                {displayedSessions.map(s => <SessionRow key={s.id} session={s} />)}
                {activeSessions.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSessions(p => !p)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-black text-slate-600 hover:bg-slate-100 transition"
                  >
                    {showAllSessions ? 'Show less' : `+${activeSessions.length - 6} more`}
                  </button>
                )}
              </>
            )}
          </div>


        </div>
      </div>

      {/* ── Open Incidents strip ── */}
      {openIncidents.length > 0 && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-red-600">warning</span>
              <p className="text-sm font-black text-red-700">
                {openIncidents.length} Incident{openIncidents.length > 1 ? 's' : ''} need attention
              </p>
            </div>
            <Link href="/dashboard/staff/incident" className="text-xs font-black text-red-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {openIncidents.slice(0, 3).map(inc => (
              <div key={inc.id} className="flex items-center gap-2 rounded-xl bg-white border border-red-100 px-3 py-2.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#111c2d] truncate">{inc.incidentName || 'Incident'}</p>
                  <p className="text-[10px] font-bold text-slate-500">{inc.licensePlate || '—'} · {fmt(inc.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
