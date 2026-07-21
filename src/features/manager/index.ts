/**
 * Manager Feature - Cổng Xuất Công Khai (Public Barrel Export API)
 *
 * Mọi file bên ngoài thuộc ứng dụng (ví dụ: src/app/dashboard/manager) 
 * CHỈ ĐƯỢC IMPORT dữ liệu/component/hook từ file index.ts này.
 * Tuân thủ nguyên lý đóng gói (Encapsulation) của Feature-Driven Architecture.
 *
 * @example
 * import { StatCards, useManagerDashboard } from '@/features/manager';
 */

// ── 1. UI Components cho Dashboard Quản lý ──
export { StatCards }           from './components/StatCards';
export { HourlyTrafficChart }  from './components/HourlyTrafficChart';
export { OccupancyPieChart }   from './components/OccupancyPieChart';
export { QuickLinks }          from './components/QuickLinks';
export { RecentActivity }      from './components/RecentActivity';
export { default as ManagerWorkspace } from './components/ManagerWorkspace';

// ── 2. Data Types xuất ra cho các tầng sử dụng ──
export type { DashboardStats } from './components/StatCards';
export type { ActivityLog }    from './components/RecentActivity';

// ── 3. Custom Hooks quản lý Nghiệp vụ & API ──
export { useAccounts } from './hooks/useAccounts';
export { useSystemConfig } from './hooks/useSystemConfig';
export { usePricingEngine } from './hooks/usePricingEngine';
export { useManagerDashboard } from './hooks/useManagerDashboard';
export { usePayments } from './hooks/usePayments';
export { useVehicleTypes } from './hooks/useVehicleTypes';
