'use client';

import { BuildingDirectory } from '@/features/facilities';

/**
 * Trang quản lý cơ sở vật chất (Facilities Management) dành cho Manager.
 * Sử dụng kiến trúc Feature-Based, toàn bộ logic và giao diện được đóng gói
 * bên trong `@/features/facilities`.
 */
export default function FacilityManagementPage() {
  return <BuildingDirectory />;
}
