// ─── App Config ───────────────────────────────────────────────────
export const APP_CONFIG = {
  name:        process.env.NEXT_PUBLIC_APP_NAME ?? 'NexPark',
  apiBaseUrl:  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  appUrl:      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  // API settings
  requestTimeout: 10_000, // ms
  retryAttempts:  2,

  // Booking rules
  bookingMinHours:    1,
  bookingMaxHours:    8,
  noShowGracePeriod:  45, // minutes
  gracePeriodMinutes: 15, // rounding grace
} as const;
