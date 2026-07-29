/**
 * Pricing Feature - Public API (Cổng xuất công khai)
 *
 * Mọi file bên ngoài features/pricing chỉ được import từ đây.
 * KHÔNG import trực tiếp vào bên trong thư mục con.
 *
 * @example
 * import { PricingWorkspace } from '@/features/pricing'
 */

// Components
export { default as PricingWorkspace } from './components/PricingWorkspace';

// Hooks
export { usePricing } from './hooks/usePricing';

// Services
export { pricingService } from './services/pricing.service';

// Types
export * from './types';
