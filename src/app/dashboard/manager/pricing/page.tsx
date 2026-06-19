'use client';

import { PricingWorkspace } from '@/features/pricing';

/**
 * Trang quản lý cấu hình giá (Pricing Management) dành cho Manager.
 * Sử dụng kiến trúc Feature-Based, toàn bộ logic và giao diện được đóng gói
 * bên trong `@/features/pricing`.
 */
export default function PricingManagementPage() {
  return <PricingWorkspace />;
}
