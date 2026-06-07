/**
 * Dashboard Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/dashboard chỉ được import từ đây.
 * KHÔNG import trực tiếp vào bên trong thư mục con.
 *
 * @example
 * import { StatCards, RecentActivity } from '@/features/dashboard'
 */

// Components
export { StatCards }           from './components/StatCards';
export { HourlyTrafficChart }  from './components/HourlyTrafficChart';
export { QuickLinks }          from './components/QuickLinks';
export { RecentActivity }      from './components/RecentActivity';

// Types
export type { DashboardStats } from './components/StatCards';
export type { ActivityLog }    from './components/RecentActivity';
