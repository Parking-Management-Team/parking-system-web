'use client';

import React from 'react';
import Link from 'next/link';

/**
 * ShiftReportPlaceholder — Future scope component (FUT-SHIFT-001).
 * Excluded from current product release per SRS Section 1.3.
 */
export default function ShiftReportPlaceholder() {
  return (
    <div className="p-8 max-w-2xl mx-auto text-center mt-12">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Shift Reports &amp; Handover</h1>
        <p className="text-slate-600 text-sm mb-4">
          This feature is excluded from the current product release scope (SHIFT-01).
        </p>
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
