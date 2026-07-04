'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { markCardLost } from '@/features/card/services/card.service';
import { incidentService } from '@/features/incident/services/incident.service';
import type { IncidentType } from '@/features/incident/types';
import {
  createCheckoutPayment,
  fetchCheckoutActiveSessions,
  startCheckout,
  type CheckoutPayment,
  type CheckoutPaymentMethod,
  type CheckoutSession,
} from '@/features/vehicles/services/vehicle-checkout.service';

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

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

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
  }, [loadActiveSessions]);

  const selectSession = (session: CheckoutSession) => {
    setSelectedSessionId(session.id);
    setExitPlate('');
    setSearchQuery(session.cardCode || session.licensePlate);
  };

  const resetForNextVehicle = () => {
    setSelectedSessionId(null);
    setExitPlate('');
    setPaymentMethod('CASH');
    setSearchQuery('');
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

  const handleConfirmCheckout = async () => {
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

    const lockedCheckOutTime = new Date().toISOString();
    setIsSubmitting(true);

    try {
      await startCheckout(selectedSession.id, {
        checkOutTime: lockedCheckOutTime,
        licensePlateOut: normalizeText(exitPlate),
        outStaffId: STAFF_ID,
      });

      const payment = await createCheckoutPayment(selectedSession, paymentMethod);
      const duration = getDurationLabel(selectedSession.checkInTime, lockedCheckOutTime);

      const nextHistory: CheckoutHistoryItem = {
        id: `${selectedSession.id}-${lockedCheckOutTime}`,
        sessionId: selectedSession.id,
        licensePlate: selectedSession.licensePlate,
        cardCode: selectedSession.cardCode ?? '—',
        customerType: selectedSession.customerType,
        checkInTime: selectedSession.checkInTime,
        checkOutTime: lockedCheckOutTime,
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
        checkOutTime: lockedCheckOutTime,
        exitPlate: normalizeText(exitPlate),
        duration,
      });

      await loadActiveSessions();
      resetForNextVehicle();
      showToast('Checkout completed for the selected vehicle.', 'success');
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
          <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Checked-in info</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Loaded from card or license plate search.
                </p>
              </div>
              {selectedSession && (
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

            {selectedSession ? (
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
            ) : (
              <EmptyState icon="badge" text="Scan or enter a card code/license plate to load the vehicle." />
            )}
          </section>

          <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900">Check-out confirmation</h2>
            <p className="text-xs font-semibold text-slate-500">
              Compare plate at exit before creating payment.
            </p>

            {selectedSession ? (
              <div className="mt-4 space-y-4">
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
                        : 'Plate mismatch - send to incident handling'}
                  </div>
                </div>

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
                        className={`rounded-2xl border px-4 py-4 text-sm font-black transition ${
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

                <div className="grid grid-cols-2 gap-3">
                  <InfoBox label="Checkout time" value="Logged when confirmed" />
                  <InfoBox label="Amount due" value="Calculated after confirm" />
                </div>

                <button
                  type="button"
                  disabled={!isPlateMatched || isSubmitting}
                  onClick={() => void handleConfirmCheckout()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <span className="material-symbols-outlined">
                    {isSubmitting ? 'progress_activity' : 'logout'}
                  </span>
                  {isSubmitting ? 'Processing...' : 'Confirm Check-out'}
                </button>
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
