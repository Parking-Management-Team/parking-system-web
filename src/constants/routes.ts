// ─── Route constants ─────────────────────────────────────────────
export const ROUTES = {
  // Public
  HOME:          '/',
  BOOKING:       '/booking',
  PRICING:       '/pricing',
  PARKING_MAP:   '/parking-map',
  MONTHLY_CARD:  '/monthly-card',

  // Dashboard (staff/manager)
  DASHBOARD:     '/dashboard',
  CHECKIN:       '/checkin',
  CHECKOUT:      '/checkout',
  SESSIONS:      '/sessions',
  REPORTS:       '/reports',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
