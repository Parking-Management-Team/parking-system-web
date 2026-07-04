'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  type VehicleCheckinBooking,
  type VehicleCheckinSession,
} from '@/features/vehicles/services/vehicle-checkin.service';

type VehicleType = 'CAR' | 'MOTORCYCLE';

type GateOverlay =
  | {
      type: 'success';
      title: string;
      message: string;
      session?: VehicleCheckinSession;
      vehicleType: VehicleType;
      cardCode: string;
      checkInTime: string;
    }
  | {
      type: 'error';
      title: string;
      message: string;
    };

const BUILDING_ID = 1;
const STAFF_ID = 2;

// TODO(api-confirm): giữ mapping tạm theo yêu cầu test hiện tại.
// Nếu BE seed VehicleType khác, chỉ cần đổi mapping này.
const VEHICLE_TYPE_ID_BY_TYPE: Record<VehicleType, number> = {
  CAR: 1,
  MOTORCYCLE: 2,
};

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

export default function VehicleCheckin() {
  const { showToast } = useAuth();

  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [activeSessions, setActiveSessions] = useState<VehicleCheckinSession[]>([]);
  const [bookings, setBookings] = useState<VehicleCheckinBooking[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistDto[]>([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [cardCode, setCardCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlay, setOverlay] = useState<GateOverlay | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const formattedPlate = normalizeText(licensePlate);
  const normalizedCardCode = normalizeText(cardCode);

  const availableCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.cardType === 'PARKING_CARD' &&
          card.cardStatus === 'AVAILABLE'
      ),
    [cards]
  );

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
    // Staff check-in cần Cards/Active Sessions/Booking/Blacklist để hỗ trợ vận hành cổng vào.
    // Booking/Blacklist chỉ là dữ liệu hỗ trợ; nếu endpoint phụ lỗi thì không được làm hỏng check-in chính.
    const [cardData, sessionData, bookingData, blacklistData] = await Promise.all([
      fetchCards(),
      fetchActiveParkingSessions(),
      fetchCheckinBookingsByBuilding(BUILDING_ID).catch(async (error) => {
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
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    try {
      const session = await checkInVehicle({
        licensePlate: formattedPlate,
        vehicleTypeId: VEHICLE_TYPE_ID_BY_TYPE[vehicleType],
        cardCode: normalizedCardCode,
        buildingId: BUILDING_ID,
        staffId: STAFF_ID,
        ...(matchedBooking ? { bookingId: matchedBooking.id } : {}),
      });

      await loadGateData();
      setCardCode('');

      showGateOverlay({
        type: 'success',
        title: 'Check-in successful',
        message: matchedBooking
          ? `Booking ${matchedBooking.bookingCode} was converted to a parking session.`
          : 'Walk-in parking session was created.',
        session,
        vehicleType,
        cardCode: normalizedCardCode,
        checkInTime: session.checkInTime || new Date().toISOString(),
      });
    } catch (error) {
      showGateOverlay({
        type: 'error',
        title: 'Check-in failed',
        message:
          error instanceof Error
            ? error.message
            : 'This vehicle cannot be checked in. Please verify the information.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 p-4">
      <div className="mx-auto flex min-h-[calc(100vh-108px)] max-w-7xl flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Staff Gate In
            </p>
            <h1 className="text-2xl font-black text-slate-900">
              Vehicle Check-in
            </h1>
          </div>

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

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(360px,0.88fr)_minmax(420px,1.12fr)]">
          <form
            onSubmit={handleConfirmCheckin}
            className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Check-in information
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Enter plate, vehicle type and parking card.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Gate ready
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  License plate
                </label>
                <input
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(event.target.value.toUpperCase())}
                  placeholder="Example: 51A-123.45"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-2xl font-black uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Vehicle type
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(['CAR', 'MOTORCYCLE'] as VehicleType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        vehicleType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined mr-2 align-middle text-lg">
                        {type === 'CAR' ? 'directions_car' : 'two_wheeler'}
                      </span>
                      {type === 'CAR' ? 'Car' : 'Motorcycle'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Parking card code
                </label>
                <input
                  value={cardCode}
                  onChange={(event) => setCardCode(event.target.value.toUpperCase())}
                  placeholder="Example: CARD-001"
                  list="available-checkin-cards"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xl font-black uppercase text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
                <datalist id="available-checkin-cards">
                  {availableCards.map((card) => (
                    <option key={card.id} value={card.cardCode} />
                  ))}
                </datalist>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Available parking cards: {availableCards.length}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                      Entry type
                    </p>
                    {formattedPlate ? (
                      matchedBooking ? (
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          Booking matched{' '}
                          <span className="font-mono text-emerald-700">
                            {matchedBooking.bookingCode}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Walk-in vehicle
                        </p>
                      )
                    ) : (
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        Enter a plate to identify entry type.
                      </p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-3xl text-emerald-600">
                    confirmation_number
                  </span>
                </div>

                {matchedBooking && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                    <span>Deposit: {formatCurrency(matchedBooking.depositAmount)}</span>
                    <span>Grace: {formatDateTime(matchedBooking.checkinGraceUntil)}</span>
                    <span>Building: {matchedBooking.buildingName || BUILDING_ID}</span>
                    <span>Type: {matchedBooking.vehicleTypeName}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <span className="material-symbols-outlined">
                  {isSubmitting ? 'progress_activity' : 'login'}
                </span>
                {isSubmitting ? 'Checking in...' : 'Confirm Check-in'}
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <p className="font-mono text-xs font-bold text-emerald-400">
                CAMERA DEMO · GATE-IN-01
              </p>
            </div>

            <div className="relative min-h-[520px] bg-[radial-gradient(circle_at_top,_#1e3a2f,_#020617_55%)]">
              <div className="absolute right-5 top-5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-xs font-black text-emerald-300">
                CAMERA READY
              </div>

              <div className="absolute inset-x-10 top-20 h-44 rounded-[2rem] border-4 border-dashed border-emerald-400/40" />
              <div className="absolute inset-x-16 bottom-36 rounded-3xl border border-white/10 bg-black/50 p-5 text-center">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
                  Detected plate
                </p>
                <p className="mt-3 font-mono text-4xl font-black tracking-widest text-white">
                  {formattedPlate || '---'}
                </p>
              </div>

              <div className="absolute bottom-6 left-5 right-5 grid grid-cols-3 gap-3 text-xs font-black">
                <div className="rounded-2xl bg-white/10 p-3 text-slate-300">
                  Vehicle
                  <p className="mt-1 text-white">{vehicleType}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-slate-300">
                  Card
                  <p className="mt-1 text-white">{normalizedCardCode || '—'}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-slate-300">
                  Entry
                  <p className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[10px] ${
                    matchedBooking
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-emerald-300 text-emerald-950'
                  }`}>
                    {matchedBooking ? 'BOOKING' : 'WALK-IN'}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
            className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center px-6 text-center text-white ${
              overlay.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
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
    </div>
  );
}
