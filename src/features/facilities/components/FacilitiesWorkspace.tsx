import React from 'react';
import Link from 'next/link';

import { useFacilities } from '../hooks/useFacilities';
import BuildingColumn from './BuildingColumn';
import FloorColumn from './FloorColumn';
import ZoneColumn from './ZoneColumn';
import FacilitiesModals from './FacilitiesModals';

/**
 * Màn hình làm việc chính (Workspace Layout) của phân hệ Quản lý Cơ sở vật chất (Facilities)
 */
export default function FacilitiesWorkspace() {
  const facilities = useFacilities();
  const {

    filteredBuildings,
    pageIndex,
    setPageIndex,
    totalPages,
    totalCount,
    searchBldQuery,
    setSearchBldQuery,
    selectedBuilding,
    setSelectedBuilding,
    handleOpenAddBld,
    handleOpenEditBld,
    handleOpenDelBld,
    activeFloors,
    selectedFloor,
    setSelectedFloor,
    handleOpenAddFloor,
    handleOpenEditFloor,
    handleOpenDelFloor,
    activeZones,
    handleOpenAddZone,
    handleOpenEditZone,
    handleOpenDelZone,
    showToast,
    toastMessage,
    toastType
  } = facilities;

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      
      {/* ===== TOAST THÔNG BÁO CHUNG ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
            toastType === 'success' ? 'bg-[#006d43] text-white shadow-[#006d43]/20' : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== KHÔNG GIAN LÀM VIỆC CHÍNH (3 CỘT SONG SONG) ===== */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
          
          {/* PHẦN GIỚI THIỆU TRANG */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111c2d]">Facility Structure & Zoning</h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure the organizational hierarchy: Buildings, Floors, and Parking Zones on a unified interactive workspace.
              </p>
            </div>
            {/* Redirect button to Slots Allocation */}
            <Link 
              href="/dashboard/manager/allocate-slot" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#006d43] text-[#006d43] hover:bg-[#F4FBF3] font-semibold text-xs rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Go to Slots Allocation
            </Link>
          </div>

          {/* BỐ CỤC CHIA 3 CỘT CHÍNH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT 1: DANH SÁCH TÒA NHÀ */}
            <BuildingColumn
              filteredBuildings={filteredBuildings}
              selectedBuilding={selectedBuilding}
              setSelectedBuilding={setSelectedBuilding}
              setSelectedFloor={setSelectedFloor}
              searchBldQuery={searchBldQuery}
              setSearchBldQuery={setSearchBldQuery}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              totalPages={totalPages}
              totalCount={totalCount}
              handleOpenAddBld={handleOpenAddBld}
              handleOpenEditBld={handleOpenEditBld}
              handleOpenDelBld={handleOpenDelBld}
            />

            {/* CỘT 2: CẤU HÌNH TẦNG */}
            <FloorColumn
              selectedBuilding={selectedBuilding}
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              activeFloors={activeFloors}
              handleOpenAddFloor={handleOpenAddFloor}
              handleOpenEditFloor={handleOpenEditFloor}
              handleOpenDelFloor={handleOpenDelFloor}
            />

            {/* CỘT 3: CẤU HÌNH PHÂN KHU */}
            <ZoneColumn
              selectedFloor={selectedFloor}
              activeZones={activeZones}
              handleOpenAddZone={handleOpenAddZone}
              handleOpenEditZone={handleOpenEditZone}
              handleOpenDelZone={handleOpenDelZone}
            />
          </div>
        </div>
      </main>

      {/* ===== CÁC POP-UP MODALS THỰC HIỆN TÁC VỤ CRUD ===== */}
      <FacilitiesModals {...facilities} />
    </div>
  );
}
