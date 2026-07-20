/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: FacilitiesWorkspace.tsx (MÀN HÌNH CHÍNH QUẢN LÝ CƠ SỞ HẠ TẦNG & PHÂN KHU)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Không gian làm việc chính (Workspace) của Admin và Manager để quản lý toàn bộ hệ thống cơ sở hạ tầng bãi xe,
 * bao gồm mô hình phân cấp 3 tầng: Tòa nhà (Building) ➔ Tầng (Floor) ➔ Phân khu (Zone).
 *
 * 🛠️ CÁC CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * 1. 🏢 Quản lý Tòa nhà (Building Column 1): Xem danh sách, tìm kiếm, phân trang, thêm mới, chỉnh sửa, xoá Tòa nhà bãi xe.
 * 2. 📑 Quản lý Tầng đỗ xe (Floor Column 2): Chọn Tòa nhà để xem danh sách Tầng, thêm Tầng mới (với giới hạn totalFloors), sửa/xoá Tầng.
 * 3. 🚗 Quản lý Phân khu đỗ xe (Zone Column 3): Chọn Tầng để cấu hình Phân khu (Tên, mã phân khu, loại xe hỗ trợ, sức chứa Slot, tỉ lệ nhận đặt trước Booking Limit Rate, phân loại GENERAL/MONTHLY).
 * 4. 🔀 Điều hướng Phân bổ Slot (Slots Allocation Redirect): Đường dẫn nhanh sang giao diện chia Slot đỗ xe /dashboard/manager/allocate-slot.
 * 5. 🔔 Hệ thống Toast Thông báo Chung: Cập nhật trạng thái tức thời khi thực hiện bất kỳ tác vụ CRUD nào.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import Link from 'next/link';

import { useFacilities } from '../hooks/useFacilities';
import BuildingColumn from './BuildingColumn';
import FloorColumn from './FloorColumn';
import ZoneColumn from './ZoneColumn';
import FacilitiesModals from './FacilitiesModals';

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
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🔔 BỘ THÔNG BÁO POPUP TOAST (SUCCESS / ERROR)                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🏙️ KHÔNG GIAN LÀM VIỆC BỐ CỤC 3 CỘT PHÂN CẤP (BUILDING ➔ FLOOR ➔ ZONE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
          
          {/* TIÊU ĐỀ & CHUYỂN HƯỚNG SANG PHÂN BỔ SLOT */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111c2d]">Facility Structure & Zoning</h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure the organizational hierarchy: Buildings, Floors, and Parking Zones on a unified interactive workspace.
              </p>
            </div>
            {/* Đường dẫn sang trang Phân bổ Slot đỗ xe cho Manager */}
            <Link 
              href="/dashboard/manager/allocate-slot" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#006d43] text-[#006d43] hover:bg-[#F4FBF3] font-semibold text-xs rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Go to Slots Allocation
            </Link>
          </div>

          {/* BỐ CỤC CHIA 3 CỘT CHÍNH SONG SONG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT 1: CẤU HÌNH & TÁC VỤ CRUD TÒA NHÀ (BUILDINGS) */}
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

            {/* CỘT 2: CẤU HÌNH & TÁC VỤ CRUD TẦNG ĐỖ XE (FLOORS) */}
            <FloorColumn
              selectedBuilding={selectedBuilding}
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              activeFloors={activeFloors}
              handleOpenAddFloor={handleOpenAddFloor}
              handleOpenEditFloor={handleOpenEditFloor}
              handleOpenDelFloor={handleOpenDelFloor}
            />

            {/* CỘT 3: CẤU HÌNH & TÁC VỤ CRUD PHÂN KHU ĐỖ XE (ZONES) */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 📦 TẬP HỢP TẤT CẢ CÁC MODAL THỰC HIỆN CRUD (TẠO/SỬA/XÓA)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <FacilitiesModals {...facilities} />
    </div>
  );
}
