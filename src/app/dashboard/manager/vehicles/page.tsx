'use client';

import { VehicleDetailsWorkspace } from '@/features/vehicles';

/**
 * Trang chi tiết phương tiện và giám sát thời gian thực dành cho Manager.
 * Sử dụng kiến trúc Feature-Based, toàn bộ logic và giao diện được đóng gói
 * bên trong `@/features/vehicles`.
 */
export default function VehicleDetailsPage() {
  return <VehicleDetailsWorkspace />;
}
