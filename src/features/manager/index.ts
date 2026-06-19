/**
 * Manager Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/manager chỉ được import từ file này.
 * KHÔNG import trực tiếp từ bên trong thư mục con để giữ tính đóng gói.
 *
 * @example
 * import { StatCards, RecentActivity } from '@/features/manager'
 */

// Components phục vụ trang Dashboard của Manager
export { StatCards }           from './components/StatCards';
export { HourlyTrafficChart }  from './components/HourlyTrafficChart';
export { QuickLinks }          from './components/QuickLinks';
export { RecentActivity }      from './components/RecentActivity';

// Types xuất ra ngoài để các trang sử dụng cấu trúc dữ liệu
export type { DashboardStats } from './components/StatCards';
export type { ActivityLog }    from './components/RecentActivity';
