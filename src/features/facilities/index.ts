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
export { default as BuildingDirectory } from './components/BuildingDirectory';
export { default as AddBuilding } from './components/AddBuilding';
export { default as BuildingDetails } from './components/BuildingDetails';
export { default as FloorManagement } from './components/FloorManagement';
export { default as SlotMonitoring } from './components/SlotMonitoring';

// Hooks (nếu cần dùng ngoài module)
export { useFacilities } from './hooks/useFacilities';

// Context
export { FacilitiesProvider, useFacilitiesContext } from './context/FacilitiesContext';

// Services
export { facilityService } from './services/facility.service';

// Types
export * from './types';
