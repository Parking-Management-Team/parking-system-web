'use client';

import React, { Suspense } from 'react';
import { PaymentResult } from '@/features/payments';

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-bold text-sm">Đang tải...</p>
        </div>
      }>
        <PaymentResult />
      </Suspense>
    </div>
  );
}
