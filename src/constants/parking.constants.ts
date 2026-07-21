/**
 * Parking Constants & Type Definitions
 *
 * Chứa các enum trạng thái chuẩn và định nghĩa kiểu dữ liệu (Types/Enums)
 * cho hệ thống quản lý bãi đỗ xe NexPark.
 */

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
