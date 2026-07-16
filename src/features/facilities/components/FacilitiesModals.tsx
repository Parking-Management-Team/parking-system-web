import React from 'react';
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
  formFloorInitDefaultZones: boolean;
  setFormFloorInitDefaultZones: (init: boolean) => void;
  
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

/**
 * Hợp phần chứa toàn bộ các cửa sổ pop-up (Modal) phục vụ cho CRUD Tòa nhà, Tầng, Phân khu
 */
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
  formFloorInitDefaultZones,
  setFormFloorInitDefaultZones,
  
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
  return (
    <>
      {/* 1. MODAL THÊM TÒA NHÀ MỚI */}
      {isAddBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55"
                >
                  {isSaving ? 'Saving...' : 'Add Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL CHỈNH SỬA TÒA NHÀ */}
      {isEditBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
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
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CẢNH BÁO GIẢM TẦNG TÒA NHÀ (WARNING MODAL) */}
      {isWarningBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                No, Abort
              </button>
              <button 
                type="button"
                onClick={executeEditBldSave}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Yes, Delete and Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL XÁC NHẬN XÓA TÒA NHÀ */}
      {isDelBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteBld}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL THÊM TẦNG MỚI */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Under Maintenance)</option>
                </select>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="initDefaultZones"
                  checked={formFloorInitDefaultZones}
                  onChange={(e) => setFormFloorInitDefaultZones(e.target.checked)}
                  className="mt-1 rounded text-[#006d43] focus:ring-[#006d43] h-4 w-4 border-slate-300"
                />
                <label htmlFor="initDefaultZones" className="text-xs text-[#3d4a41] font-semibold leading-tight cursor-pointer">
                  Initialize with default zones
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    Automatically configure ground floor/default parking zone for this level
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddFloorOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL CHỈNH SỬA TẦNG */}
      {isEditFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formFloorStatus}
                  onChange={(e) => setFormFloorStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
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
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL XÁC NHẬN XÓA TẦNG */}
      {isDelFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteFloor}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL THÊM PHÂN KHU (ZONE) */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  Unique code for this zone (auto-generated, can be edited).
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
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
                  Percentage of capacity available for booking (1-100%). Default: 80%.
                </p>
              </div>


              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Add Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL CHỈNH SỬA PHÂN KHU (ZONE) */}
      {isEditZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
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
                  Percentage of capacity available for booking (1-100%).
                </p>
              </div>


              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditZoneOpen(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL XÁC NHẬN XÓA PHÂN KHU (ZONE) */}
      {isDelZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined">delete</span>
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteZone}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
