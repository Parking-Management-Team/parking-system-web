/**
 * Admin Feature - Cổng Xuất Công Khai (Public Barrel Export API)
 *
 * Mọi trang thuộc module Quản trị viên (src/app/dashboard/admin) 
 * CHỈ ĐƯỢC IMPORT dữ liệu/component/hook từ file index.ts này.
 * Tuân thủ nguyên lý đóng gói (Encapsulation) của Feature-Driven Architecture.
 *
 * @example
 * import { UserManagement, useAccounts } from '@/features/admin';
 */

// ── 1. UI Components dành cho Admin ──
export { default as UserManagement } from './components/UserManagement';
export { default as SystemSettings } from './components/SystemSettings';

// ── 2. Custom Hooks xử lý nghiệp vụ Quản trị ──
export * from './hooks/useAccounts';
