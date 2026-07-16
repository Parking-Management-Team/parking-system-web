'use client';

import React, { Suspense } from 'react';
import { BuildingDetails } from '@/features/facilities';

/**
 * Trang chi tiết tòa nhà (cấu hình chung) dành cho Manager.
 * Đường dẫn: /dashboard/manager/facilities/[id]
 */
export default function BuildingDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#006d43]/20 border-t-[#006d43] animate-spin"></div>
        <p className="text-sm font-semibold text-[#54637d]">Loading building details...</p>
      </div>
    }>
      <BuildingDetails />
    </Suspense>
  );
}

