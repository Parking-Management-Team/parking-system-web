/**
 * Blacklist Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/blacklist chỉ được import từ đây.
 * KHÔNG import trực tiếp vào bên trong thư mục con.
 *
 * @example
 * import { BlacklistManagement, blacklistService } from '@/features/blacklist'
 */

// Components
export { default as BlacklistManagement } from './components/BlacklistManagement';

// Hooks
export { useBlacklist } from './hooks/useBlacklist';

// Services
export { blacklistService } from './services/blacklist.service';

// Types
export type { AddToBlacklistRequest, BlacklistDto, PagedResult, BlacklistApiResponse } from './types';
