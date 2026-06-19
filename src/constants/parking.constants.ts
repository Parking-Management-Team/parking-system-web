// ─── Vehicle Types ─────────────────────────────────────────────────
export const VEHICLE_TYPE = {
  MOTORBIKE: 'MOTORBIKE',
  CAR:       'CAR',
} as const;

export type VehicleType = typeof VEHICLE_TYPE[keyof typeof VEHICLE_TYPE];

// ─── Slot Status ───────────────────────────────────────────────────
export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED:  'OCCUPIED',
  RESERVED:  'RESERVED',
  INACTIVE:  'INACTIVE',
} as const;

export type SlotStatus = typeof SLOT_STATUS[keyof typeof SLOT_STATUS];

// ─── Session Status ────────────────────────────────────────────────
export const SESSION_STATUS = {
  ACTIVE:    'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// ─── Booking Status ────────────────────────────────────────────────
export const BOOKING_STATUS = {
  PENDING:   'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN:'CHECKED_IN',
  EXPIRED:   'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

// ─── Pricing Windows ───────────────────────────────────────────────
export const PRICING_WINDOW = {
  DAY:   'DAY',    // 06:00 - 18:00
  NIGHT: 'NIGHT',  // 18:00 - 06:00
} as const;

// ─── Standard Pricing (VNĐ) ────────────────────────────────────────
export const STANDARD_PRICING = {
  MOTORBIKE: {
    DAY: {
      basePrice:      5_000,
      baseDuration:   4,    // hours
      blockPrice:     1_000,
      blockDuration:  1,    // hour
      windowCap:      10_000,
    },
    NIGHT: {
      basePrice:      5_000,
      baseDuration:   4,
      blockPrice:     2_000,
      blockDuration:  1,
      windowCap:      20_000,
    },
  },
  CAR: {
    DAY: {
      basePrice:      30_000,
      baseDuration:   4,
      blockPrice:     10_000,
      blockDuration:  1,
      windowCap:      100_000,
    },
    NIGHT: {
      basePrice:      30_000,
      baseDuration:   4,
      blockPrice:     12_000,
      blockDuration:  1,
      windowCap:      120_000,
    },
  },
} as const;

// ─── Monthly Pass Pricing (VNĐ) ────────────────────────────────────
export const MONTHLY_PRICING = {
  MOTORBIKE: 200_000,
  CAR:       1_500_000,
} as const;

// ─── Fees & Penalties (VNĐ) ────────────────────────────────────────
export const SURCHARGE = {
  BOOKING_DEPOSIT:    5_000,
  LOST_CARD_PENALTY:  50_000,
  WRONG_ZONE_PENALTY: 100_000,
} as const;

// ─── Payment Methods ───────────────────────────────────────────────
export const PAYMENT_METHOD = {
  CASH:    'CASH',
  QR_CODE: 'QR_CODE',
  EWALLET: 'EWALLET',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

// ─── Zone Access Types ────────────────────────────────────────────
export const ZONE_ACCESS_TYPE = {
  GENERAL: 'GENERAL',   // Walk-in / Booking vehicles
  MONTHLY: 'MONTHLY',   // Monthly subscription vehicles only
} as const;

export type ZoneAccessType = typeof ZONE_ACCESS_TYPE[keyof typeof ZONE_ACCESS_TYPE];
