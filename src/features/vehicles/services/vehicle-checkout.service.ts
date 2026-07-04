import { api, ApiError } from '@/lib/api/client';

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
};

type ActiveSessionDto = {
  id?: number | null;
  vehicleId?: number | null;
  buildingId?: number | null;
  cardId?: number | null;
  zoneId?: number | null;
  slotId?: number | null;
  bookingId?: number | null;
  monthlySubscriptionId?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  licensePlateIn?: string | null;
  licensePlateOut?: string | null;
  sessionStatus?: string | null;
  cardCode?: string | null;
  zoneCode?: string | null;
  slotCode?: string | null;
  vehicleType?: string | null;
  customerType?: string | null;
  bookingCode?: string | null;
  subscriptionCode?: string | null;
  monthlyValidTo?: string | null;
};

type PaymentDto = {
  id?: number | null;
  sessionId?: number | null;
  bookingId?: number | null;
  monthlySubscriptionId?: number | null;
  amount?: number | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentTime?: string | null;
  orderCode?: number | null;
  paymentUrl?: string | null;
  qrCodeUrl?: string | null;
};

type CardDto = {
  id?: number | null;
  cardCode?: string | null;
};

export type CheckoutPaymentMethod = 'CASH' | 'ONLINE_BANKING';

export type CheckoutPaymentStatus = 'IDLE' | 'PENDING' | 'PAID' | 'FAILED';

export type CheckoutSession = {
  id: number;
  sessionCode: string;
  licensePlate: string;
  vehicleType: string;
  customerType: 'WALK_IN' | 'BOOKING' | 'MONTHLY';
  cardId: number | null;
  cardCode: string | null;
  vehicleId: number | null;
  buildingId: number | null;
  zoneId: number | null;
  zoneCode: string | null;
  slotId: number | null;
  slotCode: string | null;
  bookingId: number | null;
  bookingCode: string | null;
  monthlySubscriptionId: number | null;
  subscriptionCode: string | null;
  monthlyValidTo: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
};

export type CheckoutPayment = {
  id: number;
  sessionId: number | null;
  amount: number;
  paymentMethod: CheckoutPaymentMethod | string;
  paymentStatus: CheckoutPaymentStatus | string;
  paymentTime: string | null;
  paymentUrl: string | null;
  qrCodeUrl: string | null;
  orderCode: number | null;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const body = error.data as {
      message?: unknown;
      title?: unknown;
      errors?: Record<string, unknown>;
    };

    const validationMessages = body.errors
      ? Object.values(body.errors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((value): value is string => typeof value === 'string')
      : [];

    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (validationMessages.length > 0) return validationMessages.join('\n');
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
  }

  return error instanceof Error ? error.message : 'Vehicle check-out request failed.';
};

const unwrap = <T>(response: BaseResponse<T> | T, fallback: string): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    const baseResponse = response as BaseResponse<T>;

    if (baseResponse.success === false) {
      throw new Error(baseResponse.message || fallback);
    }

    if (baseResponse.data == null) {
      throw new Error(baseResponse.message || fallback);
    }

    return baseResponse.data;
  }

  return response as T;
};

const mapCustomerType = (session: ActiveSessionDto): CheckoutSession['customerType'] => {
  const raw = String(session.customerType ?? '').trim().toUpperCase();
  if (raw === 'BOOKING' || session.bookingId) return 'BOOKING';
  if (raw === 'MONTHLY' || session.monthlySubscriptionId) return 'MONTHLY';
  return 'WALK_IN';
};

const mapSession = (
  session: ActiveSessionDto,
  cardCodeById: Map<number, string> = new Map()
): CheckoutSession => {
  const id = Number(session.id ?? 0);
  const cardId = session.cardId ?? null;
  const cardCodeFromCardApi = cardId ? cardCodeById.get(cardId) : undefined;

  return {
    id,
    sessionCode: `SS-${id}`,
    licensePlate: String(session.licensePlateIn ?? '-'),
    vehicleType: String(session.vehicleType ?? 'Not returned by BE'),
    customerType: mapCustomerType(session),
    cardId,
    cardCode: session.cardCode ?? cardCodeFromCardApi ?? (cardId ? `#${cardId}` : null),
    vehicleId: session.vehicleId ?? null,
    buildingId: session.buildingId ?? null,
    zoneId: session.zoneId ?? null,
    zoneCode: session.zoneCode ?? null,
    slotId: session.slotId ?? null,
    slotCode: session.slotCode ?? null,
    bookingId: session.bookingId ?? null,
    bookingCode: session.bookingCode ?? null,
    monthlySubscriptionId: session.monthlySubscriptionId ?? null,
    subscriptionCode: session.subscriptionCode ?? null,
    monthlyValidTo: session.monthlyValidTo ?? null,
    checkInTime: session.checkInTime ?? null,
    checkOutTime: session.checkOutTime ?? null,
    status: String(session.sessionStatus ?? 'ACTIVE'),
  };
};

const mapPaymentStatus = (value: unknown): CheckoutPaymentStatus | string => {
  const status = String(value ?? 'PENDING').trim().toUpperCase();
  if (status === 'PAID' || status === 'PENDING' || status === 'FAILED') return status;
  return status || 'PENDING';
};

const mapPayment = (payment: PaymentDto): CheckoutPayment => ({
  id: Number(payment.id ?? 0),
  sessionId: payment.sessionId ?? null,
  amount: Number(payment.amount ?? 0),
  paymentMethod: String(payment.paymentMethod ?? ''),
  paymentStatus: mapPaymentStatus(payment.paymentStatus),
  paymentTime: payment.paymentTime ?? null,
  paymentUrl: payment.paymentUrl ?? null,
  qrCodeUrl: payment.qrCodeUrl ?? null,
  orderCode: payment.orderCode ?? null,
});

const fetchCardCodeMap = async (): Promise<Map<number, string>> => {
  const response = await api.get<BaseResponse<CardDto[]> | CardDto[]>('/cards');
  const cards = Array.isArray(response)
    ? response
    : unwrap(response, 'Could not load cards for checkout card-code matching.');

  const cardCodeById = new Map<number, string>();

  cards.forEach((card) => {
    const id = Number(card.id ?? 0);
    const code = String(card.cardCode ?? '').trim();
    if (id > 0 && code) {
      cardCodeById.set(id, code);
    }
  });

  return cardCodeById;
};

export const fetchCheckoutActiveSessions = async (): Promise<CheckoutSession[]> => {
  try {
    const [response, cardCodeById] = await Promise.all([
      api.get<BaseResponse<ActiveSessionDto[]> | ActiveSessionDto[]>(
        '/parking-sessions/active'
      ),
      fetchCardCodeMap(),
    ]);
    const data = Array.isArray(response)
      ? response
      : unwrap(response, 'Could not load active parking sessions.');
    return data.map((session) => mapSession(session, cardCodeById));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchCheckoutHistorySessions = async (): Promise<CheckoutSession[]> => {
  try {
    const [response, cardCodeById] = await Promise.all([
      api.get<BaseResponse<ActiveSessionDto[]> | ActiveSessionDto[]>('/parking-sessions'),
      fetchCardCodeMap(),
    ]);
    const data = Array.isArray(response)
      ? response
      : unwrap(response, 'Could not load checkout history.');

    return data
      .map((session) => mapSession(session, cardCodeById))
      .filter((session) => {
        const status = String(session.status ?? '').trim().toUpperCase();
        return status === 'COMPLETED' || Boolean(session.checkOutTime);
      })
      .sort((a, b) => {
        const aTime = new Date(a.checkOutTime ?? a.checkInTime ?? 0).getTime();
        const bTime = new Date(b.checkOutTime ?? b.checkInTime ?? 0).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const startCheckout = async (
  sessionId: number,
  input: {
    checkOutTime: string;
    licensePlateOut: string;
    outStaffId: number;
  }
): Promise<void> => {
  try {
    await api.patch<BaseResponse<unknown>>(
      `/parking-sessions/${sessionId}/checkout/start`,
      input
    );
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const rollbackCheckout = async (sessionId: number): Promise<void> => {
  try {
    await api.patch<BaseResponse<unknown>>(
      `/parking-sessions/${sessionId}/checkout/rollback`,
      {}
    );
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createCheckoutPayment = async (
  session: CheckoutSession,
  paymentMethod: CheckoutPaymentMethod
): Promise<CheckoutPayment> => {
  try {
    const response = await api.post<BaseResponse<PaymentDto>>('/payments', {
      sessionId: session.id,
      bookingId: null,
      monthlySubscriptionId: null,
      paymentMethod,
    });
    return mapPayment(unwrap(response, 'Could not create checkout payment.'));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const completeCheckout = async (sessionId: number): Promise<void> => {
  try {
    await api.patch<BaseResponse<unknown>>(`/parking-sessions/${sessionId}/complete`, {});
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
