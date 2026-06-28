'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  completeCheckout,
  createCheckoutPayment,
  fetchCheckoutActiveSessions,
  startCheckout,
  type CheckoutPayment,
  type CheckoutPaymentMethod,
  type CheckoutSession,
} from '@/features/vehicles/services/vehicle-checkout.service';
import { useAuth } from '@/features/auth/context/AuthContext';

type PlateConfirmation = 'WAITING' | 'MATCHED' | 'MISMATCH';

const STAFF_ID = 2;

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getDurationLabel = (checkInTime?: string | null, checkoutTime?: string | null) => {
  if (!checkInTime) return '—';
  const start = new Date(checkInTime).getTime();
  const end = checkoutTime ? new Date(checkoutTime).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '—';

  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes} min`;
  return `${hours}h ${remainingMinutes}m`;
};

const normalizeCode = (value: string) => value.trim().toUpperCase();

export default function VehicleCheckout() {
  const { showToast } = useAuth();
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionSearch, setSessionSearch] = useState('');
  const [manualCardCode, setManualCardCode] = useState('');
  const [plateConfirmation, setPlateConfirmation] =
    useState<PlateConfirmation>('WAITING');
  const [actualExitPlate, setActualExitPlate] = useState('');
  const [actualCardCode, setActualCardCode] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>('CASH');
  const [payment, setPayment] = useState<CheckoutPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardCodeInputRef = useRef<HTMLInputElement | null>(null);

  const notify = useCallback(
    (message: string, tone: 'success' | 'error' | 'warning' = 'success') => {
      showToast(message, tone === 'warning' ? 'info' : tone);
    },
    [showToast]
  );

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  const filteredSessions = useMemo(() => {
    const search = normalizeCode(sessionSearch);
    if (!search) return sessions;

    return sessions.filter((session) =>
      [
        session.sessionCode,
        session.licensePlate,
        session.cardCode,
        session.vehicleType,
        session.customerType,
      ].some((value) => normalizeCode(String(value ?? '')).includes(search))
    );
  }, [sessionSearch, sessions]);

  const expectedCardCode = selectedSession?.cardCode ?? '';
  const canVerifyCard = Boolean(expectedCardCode);
  const isCardMatched =
    Boolean(selectedSession) &&
    canVerifyCard &&
    normalizeCode(actualCardCode) === normalizeCode(expectedCardCode);

  const amountDue = payment?.amount ?? null;
  const paymentStatus = payment?.paymentStatus ?? 'IDLE';
  const canStartCheckout =
    Boolean(selectedSession) &&
    plateConfirmation === 'MATCHED' &&
    isCardMatched &&
    !checkoutTime;
  const canCreatePayment =
    Boolean(selectedSession) && Boolean(checkoutTime) && paymentStatus !== 'PAID';
  const canCompleteCheckout =
    Boolean(selectedSession) &&
    Boolean(checkoutTime) &&
    (amountDue === 0 || paymentStatus === 'PAID');

  const loadActiveSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await fetchCheckoutActiveSessions();
      setSessions(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load active sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadActiveSessions();
  }, [loadActiveSessions]);

  useEffect(() => {
    cardCodeInputRef.current?.focus();
  }, []);

  const handleSelectSession = (session: CheckoutSession) => {
    setSelectedSessionId(session.id);
    setActualExitPlate('');
    setActualCardCode(session.cardCode?.startsWith('#') ? '' : session.cardCode ?? '');
    setPlateConfirmation('WAITING');
    setCheckoutTime('');
    setPayment(null);
  };

  const resetForNextVehicle = () => {
    setSelectedSessionId(null);
    setManualCardCode('');
    setActualExitPlate('');
    setActualCardCode('');
    setPlateConfirmation('WAITING');
    setCheckoutTime('');
    setPayment(null);
    window.setTimeout(() => cardCodeInputRef.current?.focus(), 0);
  };

  const handleManualCardLookup = (event: React.FormEvent) => {
    event.preventDefault();

    const card = normalizeCode(manualCardCode);

    if (!card) {
      notify('Please enter card code.', 'error');
      return;
    }

    const matchedSessions = sessions.filter((session) => {
      const sessionCard = normalizeCode(session.cardCode ?? '');
      return sessionCard === card;
    });

    if (matchedSessions.length === 0) {
      setSelectedSessionId(null);
      setActualExitPlate('');
      setActualCardCode(manualCardCode.toUpperCase());
      setPlateConfirmation('WAITING');
      setCheckoutTime('');
      setPayment(null);
      notify('No active session found for this card code.', 'error');
      return;
    }

    if (matchedSessions.length > 1) {
      notify(
        'More than one active session matched this card. Data is invalid; please select the exact session manually.',
        'warning'
      );
      setSessionSearch(card);
      return;
    }

    const matchedSession = matchedSessions[0];
    handleSelectSession(matchedSession);
    setActualCardCode(manualCardCode.toUpperCase());
    notify(
      `Found active session ${matchedSession.sessionCode}. Please confirm vehicle plate before checkout.`,
      'success'
    );
  };

  const handleStartCheckout = async () => {
    if (!selectedSession) return;

    if (plateConfirmation !== 'MATCHED' || !isCardMatched) {
      notify('Staff must confirm plate matched and card must match before starting checkout.', 'error');
      return;
    }

    const lockedCheckoutTime = new Date().toISOString();
    setIsSubmitting(true);

    try {
      await startCheckout(selectedSession.id, {
        checkOutTime: lockedCheckoutTime,
        licensePlateOut: selectedSession.licensePlate,
        outStaffId: STAFF_ID,
      });
      setCheckoutTime(lockedCheckoutTime);
      notify('Checkout time locked. Fee will not keep increasing while payment is pending.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not start checkout.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedSession || !checkoutTime) return;

    setIsSubmitting(true);

    try {
      const nextPayment = await createCheckoutPayment(selectedSession, paymentMethod);
      setPayment(nextPayment);
      notify(
        nextPayment.paymentStatus === 'PAID'
          ? 'Payment is PAID. You can complete checkout.'
          : 'Payment was created. Complete checkout is enabled only when payment is PAID or amount due is 0.',
        nextPayment.paymentStatus === 'PAID' ? 'success' : 'warning'
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedSession || !canCompleteCheckout) return;

    setIsSubmitting(true);

    try {
      await completeCheckout(selectedSession.id);
      await loadActiveSessions();
      resetForNextVehicle();
      notify('Checkout completed. Ready for next vehicle.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not complete checkout.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Vehicle Check-out Portal</h1>
          <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
            Enter card code → confirm plate → lock fee → payment → complete.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadActiveSessions()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleManualCardLookup}
        className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">
                contactless
              </span>
              <h2 className="text-base font-bold text-slate-800">Quick Manual Card Tap</h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Enter the physical card code to find the active session.
            </p>
          </div>

          <div className="grid flex-[2] grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                Manual Card Code
              </label>
              <input
                ref={cardCodeInputRef}
                type="text"
                value={manualCardCode}
                onChange={(event) => setManualCardCode(event.target.value.toUpperCase())}
                placeholder="Example: CARD002"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xl font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || sessions.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none md:self-end"
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
              Find Active Session
            </button>
          </div>
        </div>

      </form>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(240px,0.58fr)_minmax(0,1.25fr)_minmax(320px,0.78fr)]">
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800">Manual Review</h2>
            <p className="mt-0.5 text-xs text-slate-500">Backup list only.</p>
          </div>

          <input
            type="search"
            value={sessionSearch}
            onChange={(event) => setSessionSearch(event.target.value)}
            placeholder="Filter plate/card..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {isLoading ? (
            <div className="py-10 text-center text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl">
                progress_activity
              </span>
              <p className="mt-2 text-sm">Loading active sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">directions_car_off</span>
              <p className="mt-2 text-xs">No active sessions.</p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredSessions.map((session) => {
                const isSelected = session.id === selectedSessionId;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSelectSession(session)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-black text-slate-800">
                          {session.licensePlate}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {session.cardCode ?? 'No card code'}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        ACTIVE
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-0.5 text-[11px] font-semibold text-slate-600">
                      <p>Customer: {session.customerType}</p>
                      <p>Check-in: {formatDateTime(session.checkInTime)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800">Current Vehicle To Exit</h2>
          </div>

          {selectedSession ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  License Plate
                </p>
                <p className="mt-1 break-all font-mono text-4xl font-black tracking-wider text-slate-900">
                  {selectedSession.licensePlate}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-bold text-slate-700 sm:grid-cols-2">
                  <p>Card: <span className="font-mono text-slate-900">{selectedSession.cardCode ?? 'Not returned by BE'}</span></p>
                  <p>Vehicle: <span className="text-slate-900">{selectedSession.vehicleType}</span></p>
                  <p>Customer: <span className="text-slate-900">{selectedSession.customerType}</span></p>
                  <p>Check-in: <span className="text-slate-900">{formatDateTime(selectedSession.checkInTime)}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                  plateConfirmation === 'MATCHED'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : plateConfirmation === 'MISMATCH'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  <span className="material-symbols-outlined mr-2 align-middle text-base">
                    {plateConfirmation === 'MATCHED'
                      ? 'check_circle'
                      : plateConfirmation === 'MISMATCH'
                        ? 'error'
                        : 'visibility'}
                  </span>
                  {plateConfirmation === 'MATCHED'
                    ? 'Plate matched'
                    : plateConfirmation === 'MISMATCH'
                      ? 'Plate mismatch - incident review required'
                      : 'Waiting for staff confirmation'}
                </div>
                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${isCardMatched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  <span className="material-symbols-outlined mr-2 align-middle text-base">
                    {isCardMatched ? 'check_circle' : 'error'}
                  </span>
                  {isCardMatched ? 'Card matched' : 'Card not matched'}
                </div>
              </div>

              {!checkoutTime && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setPlateConfirmation('MATCHED');
                      setActualExitPlate(selectedSession.licensePlate);
                      notify('Plate confirmed. You can start checkout and lock fee.', 'success');
                    }}
                    className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:bg-slate-300"
                  >
                    Plate Matched - Continue
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setPlateConfirmation('MISMATCH');
                      notify(
                        'Plate mismatch selected. Normal checkout is blocked. TODO: route this case to Incident Handling.',
                        'warning'
                      );
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:bg-slate-100"
                  >
                    Plate Mismatch - Need Incident Review
                  </button>
                </div>
              )}

              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-bold uppercase text-slate-500">
                  Optional plate note
                </summary>
                <input
                  type="text"
                  value={actualExitPlate}
                  onChange={(event) => setActualExitPlate(event.target.value.toUpperCase())}
                  disabled={Boolean(checkoutTime)}
                  placeholder="Only use this for manual note/review"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:text-slate-400"
                />
              </details>

              <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                <p>Duration: <span className="font-black text-slate-800">{getDurationLabel(selectedSession.checkInTime, checkoutTime)}</span></p>
                <p>Zone / Slot: <span className="font-black text-slate-800">{selectedSession.zoneCode ?? '—'} / {selectedSession.slotCode ?? '—'}</span></p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-700">lock_clock</span>
                  <div>
                    <p className="text-sm font-black text-blue-900">Checkout Time Lock</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      Lock checkout time before payment.
                    </p>
                  </div>
                </div>

                {checkoutTime ? (
                  <div className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700">
                    Locked at {formatDateTime(checkoutTime)}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canStartCheckout || isSubmitting}
                    onClick={() => void handleStartCheckout()}
                    className="mt-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Start Checkout / Lock Fee
                  </button>
                )}
              </div>

              <details className="rounded-xl border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-xs font-bold uppercase text-slate-400">
                  Developer Info
                </summary>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                  <p>Session: {selectedSession.sessionCode}</p>
                  <p>Vehicle ID: {selectedSession.vehicleId ?? '—'}</p>
                  <p>Card ID: {selectedSession.cardId ?? '—'}</p>
                  <p>Building ID: {selectedSession.buildingId ?? '—'}</p>
                  <p>Zone ID: {selectedSession.zoneId ?? '—'}</p>
                  <p>Slot ID: {selectedSession.slotId ?? '—'}</p>
                  <p>Booking ID: {selectedSession.bookingId ?? '—'}</p>
                  <p>Monthly ID: {selectedSession.monthlySubscriptionId ?? '—'}</p>
                </div>
              </details>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">fact_check</span>
              <p className="mt-2 text-sm">Enter card code to load vehicle.</p>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800">Fee & Payment</h2>
          </div>

          {selectedSession ? (
            <>
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-600">Amount due</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {amountDue == null ? '—' : formatCurrency(amountDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Payment status</span>
                  <span className="font-black text-slate-800">{paymentStatus}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Checkout time</span>
                  <span className="text-right font-bold text-slate-800">{formatDateTime(checkoutTime)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'ONLINE_BANKING'] as CheckoutPaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      disabled={!checkoutTime || paymentStatus === 'PAID'}
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                        paymentMethod === method
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {method === 'CASH' ? 'Cash' : 'Online Banking'}
                    </button>
                  ))}
                </div>
              </div>

              {payment?.paymentUrl && (
                <a
                  href={payment.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-center text-sm font-bold text-blue-700 hover:bg-blue-100"
                >
                  Open online banking payment URL
                </a>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={!canCreatePayment || isSubmitting}
                  onClick={() => void handleCreatePayment()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  {paymentStatus === 'FAILED' ? 'Retry With New Payment' : 'Create Checkout Payment'}
                </button>

                <button
                  type="button"
                  disabled={!canCompleteCheckout || isSubmitting}
                  onClick={() => void handleCompleteCheckout()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <span className="material-symbols-outlined text-base">exit_to_app</span>
                  Complete Checkout
                </button>

                {checkoutTime && paymentStatus !== 'PAID' && (
                  <p className="text-xs font-semibold text-slate-400">
                    Waiting for BE payment status.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-3xl">payments</span>
              <p className="mt-2 text-sm">Payment appears after card match.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
