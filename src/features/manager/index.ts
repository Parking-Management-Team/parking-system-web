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
export { OccupancyPieChart }   from './components/OccupancyPieChart';
export { QuickLinks }          from './components/QuickLinks';
export { RecentActivity }      from './components/RecentActivity';
export { default as ManagerWorkspace } from './components/ManagerWorkspace';

// Types xuất ra ngoài để các trang sử dụng cấu trúc dữ liệu
export type { DashboardStats } from './components/StatCards';
export type { ActivityLog }    from './components/RecentActivity';

// Hooks
export { useAccounts } from './hooks/useAccounts';
export { useSystemConfig } from './hooks/useSystemConfig';
export { useShiftReports } from './hooks/useShiftReports';
export { useSubscriptionPriceConfigs } from './hooks/useSubscriptionPriceConfigs';
export { usePricingEngine } from './hooks/usePricingEngine';
export { useDashboardSummary } from './hooks/useDashboardSummary';
export { usePayments } from './hooks/usePayments';
export { useVehicleTypes } from './hooks/useVehicleTypes';
