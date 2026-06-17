'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { FacilitiesProvider, useFacilitiesContext } from '@/features/facilities';

function BuildingConfigInnerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const idStr = params?.id;
  const bldId = parseInt(typeof idStr === 'string' ? idStr : '', 10);

  const { buildings, selectedBuilding, setSelectedBuilding } = useFacilitiesContext();

  // Find the building to show in the breadcrumbs and set as selected building
  const building = buildings.find(b => b.id === bldId);

  useEffect(() => {
    if (building && (!selectedBuilding || selectedBuilding.id !== building.id)) {
      setSelectedBuilding(building);
    }
  }, [building, selectedBuilding, setSelectedBuilding]);

  // Tab path definitions
  const basePath = `/dashboard/manager/facilities/${bldId}`;
  const isGeneralActive = pathname === basePath;
  const isFloorsActive = pathname === `${basePath}/floors`;
  const isAccessActive = pathname === `${basePath}/access`;

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-2xl text-[#111c2d]">{building?.name || 'Building Configuration'}</h1>
          <Link 
            href="/dashboard/manager/facilities"
            className="flex items-center gap-1 text-xs font-bold text-[#006d43] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-6">
        <Link 
          href={basePath}
          className={`px-1 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
            isGeneralActive 
              ? 'text-[#006d43] border-[#006d43]' 
              : 'text-[#54637d] border-transparent hover:text-[#006d43]'
          }`}
        >
          General Info
        </Link>
        <Link 
          href={`${basePath}/floors`}
          className={`px-1 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
            isFloorsActive 
              ? 'text-[#006d43] border-[#006d43]' 
              : 'text-[#54637d] border-transparent hover:text-[#006d43]'
          }`}
        >
          Floor Management
        </Link>
        <Link 
          href={`${basePath}/access`}
          className={`px-1 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
            isAccessActive 
              ? 'text-[#006d43] border-[#006d43]' 
              : 'text-[#54637d] border-transparent hover:text-[#006d43]'
          }`}
        >
          Access Control
        </Link>
      </div>

      {/* Content wrapper */}
      <div>
        {children}
      </div>
    </div>
  );
}

export default function BuildingConfigLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <FacilitiesProvider>
      <BuildingConfigInnerLayout>{children}</BuildingConfigInnerLayout>
    </FacilitiesProvider>
  );
}
