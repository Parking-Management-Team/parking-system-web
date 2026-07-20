/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: ZoneColumn.tsx (CỘT 3: QUẢN LÝ PHÂN KHU ĐỖ XE - ZONES & VEHICLE SPECS COLUMN)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Hiển thị danh sách các Phân khu đỗ xe (Zones) thuộc Tầng đỗ xe đã chọn ở Cột 2.
 * Cho phép Admin và Manager cấu hình thông số kỹ thuật của từng Zone (loại xe, sức chứa, tỉ lệ nhận đặt).
 *
 * 🛠️ CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * 1. 📊 Tiến độ Phân bổ Sức chứa (Capacity Allocation Progress): Hiển thị thanh phần trăm tổng số Slots đã được phân bổ cho các Zones so với tổng sức chứa của Tầng.
 * 2. 🚗 Cấu hình Loại xe (Vehicle Type Icon & Badge): Phân loại từng phân khu hỗ trợ Ô tô (Car), Xe máy (Motorcycle), Xe điện (EV Charger).
 * 3. 🎫 Loại hình Truy cập (Access Type): Thiết lập phân khu đỗ xe Thường (GENERAL) hoặc Vé tháng (MONTHLY).
 * 4. 📈 Tỉ lệ Giới hạn Đặt trước (Booking Limit Rate): Thiết lập tỉ lệ % nhận đặt trước online (ví dụ: 80% sức chứa zone dành cho booking trước).
 * 5. ➕ Thêm Phân khu Mới (Add Zone): Tạo mới Zone trên tầng đỗ xe được chọn.
 * 6. ✏️ Chỉnh sửa Phân khu (Edit Zone): Thay đổi tên, mã, loại xe, sức chứa slot và tỉ lệ nhận đặt trước.
 * 7. 🗑️ Xoá Phân khu (Delete Zone): Xoá phân khu đỗ xe khỏi tầng.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Floor, Zone } from '../types';

/**
 * Hàm hỗ trợ lấy biểu tượng icon phương tiện theo loại xe
 */
const getVehicleIcon = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('car') || t.includes('xe hơi') || t.includes('xe o to') || t.includes('ô tô')) {
    return 'directions_car';
  }
  if (t.includes('motor') || t.includes('xe máy') || t.includes('xe gắn máy') || t.includes('moto')) {
    return 'motorcycle';
  }
  if (t.includes('ev') || t.includes('electric') || t.includes('điện')) {
    return 'ev_charger';
  }
  return 'directions_car';
};

interface ZoneColumnProps {
  selectedFloor: Floor | null;
  activeZones: Zone[];
  handleOpenAddZone: () => void;
  handleOpenEditZone: (zone: Zone, e: React.MouseEvent) => void;
  handleOpenDelZone: (zone: Zone, e: React.MouseEvent) => void;
}

export default function ZoneColumn({
  selectedFloor,
  activeZones,
  handleOpenAddZone,
  handleOpenEditZone,
  handleOpenDelZone
}: ZoneColumnProps) {
  // Tính toán tổng số slots đã được phân bổ cho các phân khu
  const allocatedZones = Array.isArray(activeZones) ? activeZones : [];
  const allocatedSlots = allocatedZones.reduce((sum, z) => sum + z.slotCapacity, 0);
  const totalSlots = selectedFloor ? selectedFloor.totalSlots : 0;
  const allocationPercentage = totalSlots > 0 ? Math.min((allocatedSlots / totalSlots) * 100, 100) : 0;

  return (
    <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 👑 HEADER CỘT 3: TIÊU ĐỀ & NÚT THÊM PHÂN KHU MỚI (ADD ZONE)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#111c2d]">
          <span className="material-symbols-outlined text-[20px] text-[#006d43]">grid_view</span>
          <h2 className="font-bold text-sm">3. Zones & Vehicle Specs</h2>
        </div>
        
        {/* Nút thêm Phân khu (chỉ hiển thị khi đã chọn 1 Tầng) */}
        {selectedFloor && (
          <button 
            onClick={handleOpenAddZone}
            className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add Zone
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🚗 DANH SÁCH PHÂN KHU ĐỖ XE THUỘC TẦNG ĐÃ CHỌN                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedFloor ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* Thông tin Tầng được chọn & Sức chứa phân bổ */}
          <div className="p-3 bg-slate-50 text-[11px] text-[#3d4a41] font-semibold flex justify-between">
            <span>Floor Selected: <span className="text-[#006d43]">{selectedFloor.name}</span></span>
            <span>Allocated: {allocatedSlots}/{totalSlots} slots</span>
          </div>

          {/* 📊 Thanh tiến độ phân bổ sức chứa của các Zone */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              <span>Capacity Allocation Progress</span>
              <span className={allocatedSlots > totalSlots ? 'text-red-500' : 'text-[#006d43]'}>
                {allocationPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  allocatedSlots > totalSlots ? 'bg-red-500' : 'bg-[#006d43]'
                }`}
                style={{ width: `${allocationPercentage}%` }}
              />
            </div>
          </div>

          {/* Danh sách các Zone */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[490px] flex-grow">
            {allocatedZones.length > 0 ? (
              allocatedZones.map(zone => (
                <div 
                  key={zone.id}
                  className="p-4 bg-white hover:bg-slate-50 transition-all flex justify-between items-center group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                      {zone.name}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/50">
                        <span className="material-symbols-outlined text-[10px]">{getVehicleIcon(zone.vehicleType)}</span>
                        {zone.vehicleType}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${zone.status === 'Active' ? 'bg-[#006d43]' : 'bg-red-500'}`} />
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">Capacity allocation: {zone.slotCapacity} slots | Booking limit: {zone.bookingLimitRate ?? 80}%</p>
                  </div>

                  {/* ⚙️ CÁC TÁC VỤ EDIT / DELETE PHÂN KHU */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleOpenEditZone(zone, e)}
                      className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all cursor-pointer"
                      title="Edit zone"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleOpenDelZone(zone, e)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all cursor-pointer"
                      title="Delete zone"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No zones configured for this floor yet. Click Add Zone above to allocate capacity.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">layers_clear</span>
          Please select a floor level from the middle panel to configure its zoning & vehicle types.
        </div>
      )}
    </section>
  );
}
