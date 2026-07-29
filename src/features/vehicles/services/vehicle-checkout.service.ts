import { api, ApiError } from '@/lib/api/client';
import {
  fetchActiveParkingSessionDtos,
  type ActiveParkingSessionDto,
} from './active-parking-session.service';

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errorCode?: string | null;
  errors?: Record<string, string[]> | null;
};

type ActiveSessionDto = ActiveParkingSessionDto;

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

export type CheckoutPaymentMethod = 'CASH' | 'ONLINE_BANKING';

export type CheckoutPaymentStatus = 'IDLE' | 'PENDING' | 'PAID' | 'FAILED';

export type CheckoutSession = {
  id: number;
  sessionCode: string;
  licensePlate: string;
  vehicleType: string;
  customerType: 'WALK_IN' | 'BOOKING';
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
  status: string;
  imageIn: string | null;
  imageOut: string | null;
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
  if (error && typeof error === 'object') {
    const isApiError =
      error instanceof ApiError ||
      ('name' in error && (error as any).name === 'ApiError') ||
      ('status' in error && 'data' in error);

    if (isApiError && 'data' in error && error.data && typeof error.data === 'object') {
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

    if ('message' in error && typeof (error as any).message === 'string' && (error as any).message.trim()) {
      return (error as any).message;
    }
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
  return 'WALK_IN';
};

const normalizeImageSource = (value: string | null | undefined): string | null => {
  const image = value?.trim();
  if (!image) return null;

  if (
    image.startsWith('data:image/') ||
    image.startsWith('blob:') ||
    image.startsWith('/') ||
    /^https?:\/\//i.test(image)
  ) {
    return image;
  }

  // Older/session-imported records may contain only the raw base64 payload.
  // The browser needs a Data URL prefix before it can render that payload.
  return `data:image/jpeg;base64,${image}`;
};

export const mapCheckoutSession = (
  session: ActiveSessionDto
): CheckoutSession => {
  const id = Number(session.id ?? 0);
  const cardId = session.cardId ?? null;

  return {
    id,
    sessionCode: `SS-${id}`,
    licensePlate: String(session.licensePlateIn ?? '-'),
    vehicleType: String(session.vehicleType ?? 'Not returned by BE'),
    customerType: mapCustomerType(session),
    cardId,
    cardCode: session.cardCode ?? (cardId ? `#${cardId}` : null),
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
    status: String(session.sessionStatus ?? 'ACTIVE'),
    imageIn: normalizeImageSource(session.imageIn),
    imageOut: normalizeImageSource(session.imageOut),
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

export const fetchCheckoutActiveSessions = async (
  source?: ActiveParkingSessionDto[]
): Promise<CheckoutSession[]> => {
  try {
    const data = source ?? await fetchActiveParkingSessionDtos();
    return data.map(mapCheckoutSession);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const fetchCheckoutSessionDetail = async (
  sessionId: number
): Promise<CheckoutSession> => {
  try {
    const response = await api.get<BaseResponse<ActiveSessionDto> | ActiveSessionDto>(
      `/parking-sessions/${sessionId}`
    );
    return mapCheckoutSession(unwrap(response, 'Could not load parking session details.'));
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export type StartCheckoutResponse = {
  totalFee: number;
  penaltyFee: number;
  amountDue: number;
};

export const startCheckout = async (
  sessionId: number,
  input: {
    checkOutTime: string;
    licensePlateOut: string;
    outStaffId: number;
    imageOut?: string;
  }
): Promise<StartCheckoutResponse> => {
  try {
    const response = await api.patch<BaseResponse<any>>(
      `/parking-sessions/${sessionId}/checkout/start`,
      input
    );
    const data = unwrap(response, 'Could not start checkout.');
    return {
      totalFee: data.totalFee ?? 0,
      penaltyFee: data.penaltyFee ?? 0,
      amountDue: data.amountDue ?? 0,
    };
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

export const reportLostCard = async (
  sessionId: number,
  input: {
    staffId: number;
    description: string;
  }
): Promise<any> => {
  try {
    const response = await api.post<BaseResponse<any>>(
      `/parking-sessions/${sessionId}/lost-card`,
      input
    );
    return unwrap(response, 'Could not report lost card.');
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const unpaidCheckout = async (
  sessionId: number,
  input?: {
    staffId?: number;
    reason?: string;
  }
): Promise<any> => {
  try {
    const response = await api.post<BaseResponse<any>>(
      `/parking-sessions/${sessionId}/unpaid-checkout`,
      {
        staffId: input?.staffId ?? 2,
        reason: input?.reason ?? 'Vehicle exited without completing parking fee payment.',
      }
    );
    return unwrap(response, 'Could not complete unpaid checkout.');
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
