/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: FloorManagement.tsx (MÀN HÌNH CHUYÊN SÂU QUẢN LÝ TẦNG & PHÂN KHU - FLOOR MANAGEMENT)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Cung cấp giao diện bảng quản lý chuyên sâu từng Tầng đỗ xe (Floors Configuration) của Tòa nhà,
 * tích hợp Popup Modal Quản lý Phân khu (Manage Zones Popup) với bảng chỉ số phân bổ slots đỗ xe chi tiết.
 *
 * 🛠️ CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * 1. 📑 Bảng danh sách Tầng đỗ xe (Floors Table):
 *    - Chỉ số Tầng (Floor Level: F1, F2 hoặc B1, B2 đối với tầng hầm).
 *    - Tên tầng (Floor Name), Phân loại tầng (Floor Type: Standard, VIP, EV).
 *    - Trạng thái phân bổ Phân khu (Active Zones count & Capacity Bar).
 *    - Tổng sức chứa Slot (Total Slots Capacity).
 *    - Trạng thái hoạt động (Active/Inactive status).
 * 2. ➕ Thêm Tầng Mới (Add New Floor):
 *    - Tự động kiểm tra giới hạn tầng khả dụng của Tòa nhà (`activeFloors.length < totalFloor`).
 *    - Vô hiệu hoá nút thêm khi đã đạt giới hạn tối đa tầng của Tòa nhà.
 * 3. 🔀 Quản lý Phân khu từng Tầng (Manage Zones Modal):
 *    - Mở Popup Modal tổng hợp danh sách các Zone của Tầng được chọn.
 *    - Hiển thị Thẻ Thống kê Tổng Slots (Total Floor Slots) và Số lượng Zone hoạt động (Active Zones).
 *    - Thêm/Sửa/Xoá Zone trực tiếp bên trong Modal Quản lý Phân khu.
 * 4. ✏️ Sửa / 🗑️ Xoá Tầng đỗ xe.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFacilitiesContext } from '../context/FacilitiesContext';
import { Floor } from '../types';
import FacilitiesModals from './FacilitiesModals';

export default function FloorManagement() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const facilities = useFacilitiesContext();
  const {
    selectedBuilding,
    activeFloors,
    zones,
    setSelectedFloor,
    selectedFloor,
    handleOpenAddFloor,
    handleOpenEditFloor,
    handleOpenDelFloor,
    isAddZoneOpen,
    isEditZoneOpen,
    isDelZoneOpen,
    handleOpenAddZone,
    handleOpenEditZone,
    handleOpenDelZone,
    activeZones
  } = facilities;

  // Trạng thái cục bộ kiểm soát Modal Quản lý phân khu (Manage Zones Modal)
  const [isManageZonesOpen, setIsManageZonesOpen] = useState(false);
  const [wasManageZonesOpenBefore, setWasManageZonesOpenBefore] = useState(false);

  // Theo dõi trạng thái đóng/mở của các modal phân khu con để tạm ẩn và khôi phục modal quản lý chính
  useEffect(() => {
    const isAnyZoneModalOpen = isAddZoneOpen || isEditZoneOpen || isDelZoneOpen;

    if (isAnyZoneModalOpen && isManageZonesOpen) {
      setIsManageZonesOpen(false);
      setWasManageZonesOpenBefore(true);
    } else if (!isAnyZoneModalOpen && wasManageZonesOpenBefore) {
      setIsManageZonesOpen(true);
      setWasManageZonesOpenBefore(false);
    }
  }, [isAddZoneOpen, isEditZoneOpen, isDelZoneOpen, isManageZonesOpen, wasManageZonesOpenBefore]);

  // Tính toán tổng số slot đã phân bổ cho từng tầng
  const getFloorAllocatedCapacity = useCallback((floorId: number) => {
    return zones
      .filter(z => z.floorId === floorId)
      .reduce((sum, z) => sum + z.slotCapacity, 0);
  }, [zones]);

  // Đếm số lượng zone đang hoạt động trên tầng
  const getFloorZoneCount = (floorId: number) => {
    return zones.filter(z => z.floorId === floorId && z.status === 'Active').length;
  };

  // Hành động khi nhấn "Quản lý Phân khu"
  const handleOpenManageZones = (floor: Floor) => {
    setSelectedFloor(floor);
    setIsManageZonesOpen(true);
  };

  // Lấy danh sách icon tương ứng với loại phương tiện của Zone
  const getVehicleIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('car') || t.includes('xe hơi') || t.includes('xe o to') || t.includes('ô tô')) {
      return 'directions_car';
    }
    if (t.includes('motor') || t.includes('xe máy') || t.includes('xe gắn máy') || t.includes('moto')) {
      return 'motorcycle';
    }
    if (t.includes('ev') || t.includes('electric') || t.includes('điện')) {
      return 'electric_car';
    }
    return 'directions_car';
  };

  const getVehicleColorClass = (type: string) => {
    if (type) {
      return 'bg-slate-50 text-slate-600 border-slate-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Tính toán các chỉ số cho tầng đang được quản lý phân khu
  const currentFloorMetrics = useMemo(() => {
    if (!selectedFloor) return { total: 0, allocated: 0, remaining: 0, percent: 0 };
    const total = selectedFloor.totalSlots;
    const allocated = getFloorAllocatedCapacity(selectedFloor.id);
    const remaining = Math.max(0, total - allocated);
    const percent = total > 0 ? Math.min(100, Math.round((allocated / total) * 100)) : 0;
    return { total, allocated, remaining, percent };
  }, [selectedFloor, getFloorAllocatedCapacity]);

  // Kiểm tra giới hạn số tầng của Tòa nhà
  const isLimitReached = selectedBuilding ? activeFloors.length >= selectedBuilding.totalFloor : false;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 👑 HEADER TRANG & NÚT THÊM TẦNG MỚI (ADD NEW FLOOR)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#111c2d]">Floors Configurations</h2>
            {selectedBuilding && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                isLimitReached 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {activeFloors.length} / {selectedBuilding.totalFloor} Floors
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage physical levels, structural slot capacities, and parking zones layout.
          </p>
        </div>

        {/* Nút thêm tầng đỗ xe cho Admin & Manager */}
        <button
          onClick={handleOpenAddFloor}
          disabled={isLimitReached}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isLimitReached 
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70' 
              : 'bg-[#006d43] hover:bg-[#006d43]/90 text-white shadow-[#006d43]/10 cursor-pointer'
          }`}
          title={isLimitReached ? `Building floor limit of ${selectedBuilding?.totalFloor} reached` : 'Add new floor level'}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Floor
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 📑 BẢNG HIỂN THỊ DANH SÁCH TẦNG ĐỖ XE (FLOORS TABLE & ACTIONS)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {activeFloors.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">layers_clear</span>
            <h3 className="text-sm font-bold text-[#111c2d] mt-2">No Floors Configured</h3>
            <p className="text-xs text-slate-400 mt-1">Click the add button above to initialize floors for this building.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="py-4 px-6">Floor Level</th>
                  <th className="py-4 px-6">Floor Name</th>
                  <th className="py-4 px-6">Zones Allocation</th>
                  <th className="py-4 px-6">Total Slots Capacity</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {activeFloors.map((floor) => {
                  const allocated = getFloorAllocatedCapacity(floor.id);
                  const zoneCount = getFloorZoneCount(floor.id);

                  return (
                    <tr key={floor.id} className="hover:bg-slate-50/40 transition-all group">
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                          {floor.floorNumber >= 0 ? `F${floor.floorNumber}` : `B${Math.abs(floor.floorNumber)}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#111c2d]">
                        {floor.name}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 max-w-[150px]">
                          <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>{zoneCount} Active {zoneCount === 1 ? 'Zone' : 'Zones'}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500 bg-[#006d43]"
                              style={{ width: zoneCount > 0 ? '100%' : '0%' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#111c2d] font-semibold">
                        {allocated} slots
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          floor.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${floor.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {floor.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Nút Quản lý Phân khu (Manage Zones) */}
                          <button
                            onClick={() => handleOpenManageZones(floor)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#006d43] border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">grid_view</span>
                            Manage Zones
                          </button>
                          
                          {/* Nút Sửa Tầng */}
                          <button
                            onClick={(e) => handleOpenEditFloor(floor, e)}
                            className="p-1.5 text-slate-500 hover:text-[#006d43] hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Floor"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          
                          {/* Nút Xoá Tầng */}
                          <button
                            onClick={(e) => handleOpenDelFloor(floor, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Floor"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🔀 POPUP MODAL: QUẢN LÝ PHÂN KHU TỔNG THỂ (MANAGE ZONES POPUP)      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isManageZonesOpen && selectedFloor && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 max-w-2xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#111c2d] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006d43]">grid_view</span>
                  Zone Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configuring areas on level <span className="font-semibold text-[#006d43]">{selectedFloor.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsManageZonesOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Thống kê Phân bổ Tải lượng Slots của các Zone trong Tầng */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006d43] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">tag</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Floor Slots</div>
                    <div className="text-lg font-bold text-[#111c2d] mt-0.5">{currentFloorMetrics.allocated} <span className="text-xs font-normal text-slate-500">slots</span></div>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006d43] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Zones Layout</div>
                    <div className="text-lg font-bold text-[#111c2d] mt-0.5">
                      {activeZones.filter(z => z.status === 'Active').length} <span className="text-xs font-normal text-slate-500">active {activeZones.filter(z => z.status === 'Active').length === 1 ? 'zone' : 'zones'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Allocation Level</span>
                  <span className="text-[#006d43]">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300 bg-[#006d43]"
                    style={{ width: activeZones.length > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Danh sách các Zone bên trong Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#3d4a41] uppercase tracking-wider">Zones List</h4>
                <button
                  onClick={handleOpenAddZone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#006d43] hover:bg-[#006d43]/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Zone
                </button>
              </div>

              {activeZones.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-3xl text-slate-300">grid_off</span>
                  <p className="text-xs text-slate-500 font-medium mt-2">No parking zones defined on this floor.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                  {activeZones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg border ${getVehicleColorClass(zone.vehicleType)}`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {getVehicleIcon(zone.vehicleType)}
                          </span>
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{zone.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <span>{zone.vehicleType} Vehicle Type</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-bold text-slate-800">{zone.slotCapacity}</div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Slots</div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditZone(zone, e)}
                            className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Zone"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenDelZone(zone, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Zone"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsManageZonesOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Configuration
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RENDER TẤT CẢ CÁC MODAL THỰC HIỆN TÁC VỤ CRUD */}
      <FacilitiesModals {...facilities} />
    </div>
  );
}
