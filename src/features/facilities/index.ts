/**
 * Facilities Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/facilities chỉ được import từ đây.
 * KHÔNG import trực tiếp vào bên trong thư mục con.
 *
 * @example
 * import { FacilitiesWorkspace } from '@/features/facilities'
 */

// Components
export { default as FacilitiesWorkspace } from './components/FacilitiesWorkspace';

// Hooks (nếu cần dùng ngoài module)
export { useFacilities } from './hooks/useFacilities';

// Types
export * from './types';
