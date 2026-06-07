'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

const LINKS = [
  {
    href: ROUTES.MANAGER_FACILITIES,
    icon: 'location_city',
    label: 'Parking Facilities',
    description: 'View slots and occupancy',
  },
  {
    href: ROUTES.MANAGER_ALLOCATE,
    icon: 'local_parking',
    label: 'Allocate Slot',
    description: 'Register and assign slots',
  },
  {
    href: ROUTES.MANAGER_VEHICLES,
    icon: 'directions_car',
    label: 'Monitor Vehicles',
    description: 'View live feeds & tickets',
  },
] as const;

/**
 * QuickLinks - 3 thẻ truy cập nhanh các chức năng quản trị chính
 * Sử dụng ROUTES constants để tránh hardcode URL.
 */
export function QuickLinks() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Management Links</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
          >
            <span className="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition-transform">
              {link.icon}
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-800">{link.label}</div>
              <div className="text-[11px] text-slate-400">{link.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
