/**
 * Public API đại diện cho Module Parking Map (Feature Encapsulation)
 *
 * Cho phép các trang bên ngoài (như app router hoặc các tính năng khác)
 * dễ dàng import các Component, Hook, Service hoặc Type từ `@/features/parking-map`
 * mà không cần phải gọi đường dẫn sâu vào bên trong từng thư mục con.
 */

// 1. Export các giao diện Component chính
export { SlotManagementDashboard } from './components/SlotManagementDashboard';
export { SlotActionModal } from './components/SlotActionModal';

// 2. Export các Custom Hooks của feature
export * from './hooks';

// 3. Export các Services gọi API của feature
export * from './services';

// 4. Export các Kiểu dữ liệu Types
export * from './types';
