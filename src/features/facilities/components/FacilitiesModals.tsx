/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: FacilitiesModals.tsx (TỔNG HỢP CỬA SỔ POP-UP THAO TÁC - FACILITIES MODALS HUB)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Chứa toàn bộ 10 Popup Modal thực hiện các thao tác Tạo mới, Chỉnh sửa, và Xoá (CRUD) dành cho:
 * 1. Tòa nhà (Buildings): Add, Edit, Floor Reduction Warning, Cascade Delete.
 * 2. Tầng đỗ xe (Floors): Add, Edit, Delete.
 * 3. Phân khu đỗ xe (Zones): Add, Edit, Delete.
 *
 * 🛠️ CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * - Modal 1 (Add Building): Nhập Code, Name, Address, Total Floors.
 * - Modal 2 (Edit Building): Cập nhật Code, Name, Address, Total Floors, Status (Available/Occupied/Reserved/OutOfService).
 * - Modal 3 (Warning Reduction): Cảnh báo đỏ nguy hiểm khi giảm số tầng làm mất các Tầng/Zone vượt ngưỡng.
 * - Modal 4 (Delete Building): Xác nhận xoá cascade-delete tòa nhà.
 * - Modal 5 (Add Floor): Thêm tầng với Floor Number, Name, Type (Standard, Ground, Basement, EV Dedicated), Status.
 * - Modal 6 (Edit Floor): Sửa tên, chỉ số tầng, loại tầng.
 * - Modal 7 (Delete Floor): Xác nhận xoá tầng.
 * - Modal 8 (Add Zone): Cấu hình mã Zone, tên, loại xe cho phép (Vehicle Type), sức chứa slots, tỉ lệ booking limit (%).
 * - Modal 9 (Edit Zone): Chỉnh sửa thông số Zone.
 * - Modal 10 (Delete Zone): Giải phóng sức chứa slots của Zone trên tầng.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building, BuildingStatus } from '@/lib/types/building.types';
import { Floor, Zone, VehicleType } from '../types';

interface FacilitiesModalsProps {
  // Common
  isSaving: boolean;
  
  // Building Modals
  isAddBldOpen: boolean;
  setIsAddBldOpen: (open: boolean) => void;
  handleAddBldSubmit: (e: React.FormEvent) => void;
  formBldCode: string;
  setFormBldCode: (code: string) => void;
  formBldName: string;
  setFormBldName: (name: string) => void;
  formBldAddress: string;
  setFormBldAddress: (addr: string) => void;
  formBldTotalFloor: number;
  setFormBldTotalFloor: (num: number) => void;
  
  isEditBldOpen: boolean;
  setIsEditBldOpen: (open: boolean) => void;
  setEditingBld: (bld: Building | null) => void;
  handleEditBldPreSubmit: (e: React.FormEvent) => void;
  formBldStatus: BuildingStatus;
  setFormBldStatus: (status: BuildingStatus) => void;
  
  isWarningBldOpen: boolean;
  setIsWarningBldOpen: (open: boolean) => void;
  editingBld: Building | null;
  executeEditBldSave: () => void;
  
  isDelBldOpen: boolean;
  setIsDelBldOpen: (open: boolean) => void;
  deletingBld: Building | null;
  setDeletingBld: (bld: Building | null) => void;
  executeDeleteBld: () => void;
  
  // Floor Modals
  isAddFloorOpen: boolean;
  setIsAddFloorOpen: (open: boolean) => void;
  handleAddFloorSubmit: (e: React.FormEvent) => void;
  formFloorNumber: number;
  setFormFloorNumber: (num: number) => void;
  formFloorName: string;
  setFormFloorName: (name: string) => void;
  formFloorStatus: 'Active' | 'Inactive';
  setFormFloorStatus: (status: 'Active' | 'Inactive') => void;
  formFloorType: string;
  setFormFloorType: (type: string) => void;
  
  isEditFloorOpen: boolean;
  setIsEditFloorOpen: (open: boolean) => void;
  setEditingFloor: (floor: Floor | null) => void;
  handleEditFloorSubmit: (e: React.FormEvent) => void;
  editingFloor: Floor | null;
  
  isDelFloorOpen: boolean;
  setIsDelFloorOpen: (open: boolean) => void;
  deletingFloor: Floor | null;
  setDeletingFloor: (floor: Floor | null) => void;
  executeDeleteFloor: () => void;

  // Zone Modals
  isAddZoneOpen: boolean;
  setIsAddZoneOpen: (open: boolean) => void;
  handleAddZoneSubmit: (e: React.FormEvent) => void;
  formZoneCode: string;
  setFormZoneCode: (code: string) => void;
  formZoneName: string;
  setFormZoneName: (name: string) => void;
  vehicleTypes: VehicleType[];
  formZoneVehicleTypeId: number | '';
  setFormZoneVehicleTypeId: (id: number | '') => void;
  formZoneAccessType: 'GENERAL' | 'MONTHLY';
  setFormZoneAccessType: (type: 'GENERAL' | 'MONTHLY') => void;
  formZoneSlotCapacity: number;
  setFormZoneSlotCapacity: (num: number) => void;
  formZoneBookingLimitRate: number;
  setFormZoneBookingLimitRate: (num: number) => void;
  formZoneStatus: 'Active' | 'Inactive';
  setFormZoneStatus: (status: 'Active' | 'Inactive') => void;
  
  isEditZoneOpen: boolean;
  setIsEditZoneOpen: (open: boolean) => void;
  setEditingZone: (zone: Zone | null) => void;
  handleEditZoneSubmit: (e: React.FormEvent) => void;
  editingZone: Zone | null;
  
  isDelZoneOpen: boolean;
  setIsDelZoneOpen: (open: boolean) => void;
  deletingZone: Zone | null;
  setDeletingZone: (zone: Zone | null) => void;
  executeDeleteZone: () => void;
}

export default function FacilitiesModals({
  isSaving,
  isAddBldOpen,
  setIsAddBldOpen,
  handleAddBldSubmit,
  formBldCode,
  setFormBldCode,
  formBldName,
  setFormBldName,
  formBldAddress,
  setFormBldAddress,
  formBldTotalFloor,
  setFormBldTotalFloor,
  
  isEditBldOpen,
  setIsEditBldOpen,
  setEditingBld,
  handleEditBldPreSubmit,
  formBldStatus,
  setFormBldStatus,
  
  isWarningBldOpen,
  setIsWarningBldOpen,
  editingBld,
  executeEditBldSave,
  
  isDelBldOpen,
  setIsDelBldOpen,
  deletingBld,
  setDeletingBld,
  executeDeleteBld,

  isAddFloorOpen,
  setIsAddFloorOpen,
  handleAddFloorSubmit,
  formFloorNumber,
  setFormFloorNumber,
  formFloorName,
  setFormFloorName,
  formFloorStatus,
  setFormFloorStatus,
  formFloorType,
  setFormFloorType,
  
  isEditFloorOpen,
  setIsEditFloorOpen,
  setEditingFloor,
  handleEditFloorSubmit,
  
  isDelFloorOpen,
  setIsDelFloorOpen,
  deletingFloor,
  setDeletingFloor,
  executeDeleteFloor,

  isAddZoneOpen,
  setIsAddZoneOpen,
  handleAddZoneSubmit,
  formZoneCode,
  setFormZoneCode,
  formZoneName,
  setFormZoneName,
  vehicleTypes,
  formZoneVehicleTypeId,
  setFormZoneVehicleTypeId,
  formZoneAccessType,
  setFormZoneAccessType,
  formZoneSlotCapacity,
  setFormZoneSlotCapacity,
  formZoneBookingLimitRate,
  setFormZoneBookingLimitRate,
  formZoneStatus,
  setFormZoneStatus,
  
  isEditZoneOpen,
  setIsEditZoneOpen,
  setEditingZone,
  handleEditZoneSubmit,
  
  isDelZoneOpen,
  setIsDelZoneOpen,
  deletingZone,
  setDeletingZone,
  executeDeleteZone
}: FacilitiesModalsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. MODAL THÊM TÒA NHÀ MỚI (ADD BUILDING MODAL)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddBldOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add New Building</h3>
            <form onSubmit={handleAddBldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  maxLength={20}
                  placeholder="e.g. BLD-MAIN" 
                  value={formBldCode}
                  onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Main Central Tower" 
                  value={formBldName}
                  onChange={(e) => setFormBldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Physical Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 123 Parking Avenue" 
                  value={formBldAddress}
                  onChange={(e) => setFormBldAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Total Parking Floors (1-100) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formBldTotalFloor}
                  onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddBldOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Add Building'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MODAL CHỈNH SỬA TÒA NHÀ (EDIT BUILDING MODAL)                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isEditBldOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Building Configuration</h3>
            <form onSubmit={handleEditBldPreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  maxLength={20}
                  value={formBldCode}
                  onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  value={formBldName}
                  onChange={(e) => setFormBldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Physical Address</label>
                <input 
                  type="text" 
                  value={formBldAddress}
                  onChange={(e) => setFormBldAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Total Parking Floors *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formBldTotalFloor}
                  onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formBldStatus}
                  onChange={(e) => setFormBldStatus(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value={BuildingStatus.Available}>Available</option>
                  <option value={BuildingStatus.Occupied}>Occupied</option>
                  <option value={BuildingStatus.Reserved}>Reserved</option>
                  <option value={BuildingStatus.OutOfService}>Maintenance (Out Of Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditBldOpen(false);
                    setEditingBld(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. MODAL CẢNH BÁO GIẢM TẦNG TÒA NHÀ (FLOOR REDUCTION WARNING MODAL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isWarningBldOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-lg font-bold">Confirm Floor Count Reduction</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              You are reducing the floor count for <span className="font-bold text-[#111c2d]">{editingBld?.name}</span> from {editingBld?.totalFloor} to {formBldTotalFloor} levels.
              <br /><br />
              <span className="text-red-600 font-bold">CRITICAL WARNING:</span> All floors above level {formBldTotalFloor}, as well as their configured zones and parking spaces, will be <span className="font-bold">PERMANENTLY DELETED</span>. This action cannot be undone. Do you wish to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsWarningBldOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                No, Abort
              </button>
              <button 
                type="button"
                onClick={executeEditBldSave}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Yes, Delete and Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MODAL XÁC NHẬN XÓA TÒA NHÀ (DELETE BUILDING MODAL)               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDelBldOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="text-lg font-bold">Delete Building</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-[#111c2d]">{deletingBld?.name} ({deletingBld?.code})</span>?
              <br /><br />
              All floors and zones registered to this facility will also be cascade-deleted. This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelBldOpen(false);
                  setDeletingBld(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteBld}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. MODAL THÊM TẦNG MỚI (ADD FLOOR MODAL)                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddFloorOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add Floor level</h3>
            <form onSubmit={handleAddFloorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Number (Index) *</label>
                <input 
                  type="number" 
                  required
                  value={formFloorNumber}
                  onChange={(e) => setFormFloorNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Name *</label>
                <input 
                  type="text" 
                  required
                  value={formFloorName}
                  onChange={(e) => setFormFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Type *</label>
                <select
                  value={formFloorType}
                  onChange={(e) => setFormFloorType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Standard">Standard Floor</option>
                  <option value="Ground">Ground Floor</option>
                  <option value="Basement">Basement</option>
                  <option value="Roof">Roof</option>
                  <option value="EV Dedicated">EV Dedicated Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formFloorStatus}
                  onChange={(e) => setFormFloorStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Under Maintenance)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddFloorOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. MODAL CHỈNH SỬA TẦNG (EDIT FLOOR MODAL)                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isEditFloorOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Floor Structure</h3>
            <form onSubmit={handleEditFloorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Number (Index) *</label>
                <input 
                  type="number" 
                  required
                  value={formFloorNumber}
                  onChange={(e) => setFormFloorNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Name *</label>
                <input 
                  type="text" 
                  required
                  value={formFloorName}
                  onChange={(e) => setFormFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Type *</label>
                <select
                  value={formFloorType}
                  onChange={(e) => setFormFloorType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Standard">Standard Floor</option>
                  <option value="Ground">Ground Floor</option>
                  <option value="Basement">Basement</option>
                  <option value="Roof">Roof</option>
                  <option value="EV Dedicated">EV Dedicated Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formFloorStatus}
                  onChange={(e) => setFormFloorStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditFloorOpen(false);
                    setEditingFloor(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. MODAL XÁC NHẬN XÓA TẦNG (DELETE FLOOR MODAL)                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDelFloorOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined">delete</span>
              <h3 className="text-lg font-bold">Delete Floor Level</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-[#111c2d]">{deletingFloor?.name}</span>?
              <br /><br />
              All zones registered on this floor will also be permanently deleted. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelFloorOpen(false);
                  setDeletingFloor(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteFloor}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. MODAL THÊM PHÂN KHU (ADD ZONE MODAL)                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddZoneOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add Parking Zone</h3>
            <form onSubmit={handleAddZoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Code *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. ZM01"
                  value={formZoneCode}
                  onChange={(e) => setFormZoneCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique code for this zone (can be edited).
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zone A"
                  value={formZoneName}
                  onChange={(e) => setFormZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Allowed Vehicle Type *</label>
                <select
                  required
                  value={formZoneVehicleTypeId}
                  onChange={(e) => setFormZoneVehicleTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="">Select Allowed Vehicle Type...</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Slot Capacity Allocation *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formZoneSlotCapacity}
                  onChange={(e) => setFormZoneSlotCapacity(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Booking Limit Rate (%) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formZoneBookingLimitRate}
                  onChange={(e) => setFormZoneBookingLimitRate(parseInt(e.target.value, 10) || 80)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Percentage available for booking. Default: 80%.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Status *</label>
                <select
                  value={formZoneStatus}
                  onChange={(e) => setFormZoneStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Active">Active (Available)</option>
                  <option value="Inactive">Inactive (Out of Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add Zone
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. MODAL CHỈNH SỬA PHÂN KHU (EDIT ZONE MODAL)                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isEditZoneOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Zone Details</h3>
            <form onSubmit={handleEditZoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Code *</label>
                <input 
                  type="text" 
                  required
                  value={formZoneCode}
                  onChange={(e) => setFormZoneCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  required
                  value={formZoneName}
                  onChange={(e) => setFormZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Allowed Vehicle Type *</label>
                <select
                  required
                  value={formZoneVehicleTypeId}
                  onChange={(e) => setFormZoneVehicleTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="">Select Allowed Vehicle Type...</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Slot Capacity Allocation *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formZoneSlotCapacity}
                  onChange={(e) => setFormZoneSlotCapacity(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Booking Limit Rate (%) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formZoneBookingLimitRate}
                  onChange={(e) => setFormZoneBookingLimitRate(parseInt(e.target.value, 10) || 80)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Percentage of capacity available for booking.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Status *</label>
                <select
                  value={formZoneStatus}
                  onChange={(e) => setFormZoneStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] cursor-pointer"
                >
                  <option value="Active">Active (Available)</option>
                  <option value="Inactive">Inactive (Out of Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditZoneOpen(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. MODAL XÁC NHẬN XÓA PHÂN KHU (DELETE ZONE MODAL)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDelZoneOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-[#111c2d]/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">delete</span>
              <h3 className="text-lg font-bold">Delete Zone</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete parking <span className="font-bold text-[#111c2d]">{deletingZone?.name}</span>?
              <br /><br />
              This action will release its allocated capacity of {deletingZone?.slotCapacity} slots from the floor level.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelZoneOpen(false);
                  setDeletingZone(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteZone}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
