/**
 * Vehicles Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/vehicles chỉ được import từ đây.
 * KHÔNG import trực tiếp vào bên trong thư mục con.
 *
 * @example
 * import { VehicleDetailsWorkspace } from '@/features/vehicles'
 */

// Components
export { default as VehicleDetailsWorkspace } from './components/VehicleDetailsWorkspace';

// Hooks (nếu cần dùng ngoài module)
export { useVehicles } from './hooks/useVehicles';

// Types
export * from './types';
