'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFacilitiesContext } from '../context/FacilitiesContext';
import { Building, BuildingStatus } from '@/lib/types/building.types';

/**
 * Component chi tiết thông tin và cấu hình Tòa nhà (Building General Info)
 * Theo thiết kế screen_detail.html
 */
export default function BuildingDetails() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id;
  const bldId = parseInt(typeof idStr === 'string' ? idStr : '', 10);

  const {
    user,
    buildings,
    formBldCode,
    setFormBldCode,
    formBldName,
    setFormBldName,
    formBldAddress,
    setFormBldAddress,
    formBldTotalFloor,
    setFormBldTotalFloor,
    formBldStatus,
    setFormBldStatus,
    editingBld,
    setEditingBld,
    isSaving,
    handleEditBldPreSubmit,
    isWarningBldOpen,
    setIsWarningBldOpen,
    executeEditBldSave,
    showToast,
    toastMessage,
    toastType,
    triggerToast
  } = useFacilitiesContext();

  const basePath = user?.role === 'ADMIN' ? '/dashboard/admin/facilities' : '/dashboard/manager/facilities';

  // Trạng thái cục bộ lưu trữ tòa nhà gốc để so sánh thay đổi
  const [originalBld, setOriginalBld] = useState<Building | null>(null);

  // Tìm kiếm tòa nhà và điền dữ liệu ban đầu vào form
  useEffect(() => {
    if (bldId && buildings.length > 0) {
      const bld = buildings.find(b => b.id === bldId);
      if (bld) {
        setEditingBld(bld);
        setOriginalBld(bld);
        setFormBldCode(bld.code);
        setFormBldName(bld.name);
        setFormBldAddress(bld.address || '');
        setFormBldTotalFloor(bld.totalFloor);
        setFormBldStatus(bld.status);
      }
    }
  }, [bldId, buildings, setEditingBld, setFormBldCode, setFormBldName, setFormBldAddress, setFormBldTotalFloor, setFormBldStatus]);

  if (!editingBld) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#006d43]/20 border-t-[#006d43] animate-spin"></div>
        <p className="text-sm font-semibold text-[#54637d]">Loading building details...</p>
      </div>
    );
  }

  // Xử lý khi nhấn Hủy bỏ / Discard Changes
  const handleDiscard = () => {
    if (originalBld) {
      setFormBldCode(originalBld.code);
      setFormBldName(originalBld.name);
      setFormBldAddress(originalBld.address || '');
      setFormBldTotalFloor(originalBld.totalFloor);
      setFormBldStatus(originalBld.status);
      triggerToast('All changes discarded!', 'success');
    }
    router.push(basePath);
  };

  // Ánh xạ toggle (Active / Inactive)
  // Active -> BuildingStatus.Available (0)
  // Inactive -> BuildingStatus.OutOfService (3)
  const isActive = formBldStatus === BuildingStatus.Available;
  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormBldStatus(e.target.checked ? BuildingStatus.Available : BuildingStatus.OutOfService);
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 ${
          toastType === 'success' 
            ? 'bg-[#006d43] text-white shadow-[#006d43]/20' 
            : 'bg-red-600 text-white shadow-red-600/20'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Form Submission Wrapper */}
      <form onSubmit={handleEditBldPreSubmit} className="flex flex-col gap-6">
        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Core Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[#F4FBF3] border border-[#006d43]/10 rounded-2xl p-6 hover:shadow-[0_4px_12px_rgba(12,28,50,0.04)] transition-all">
              <h2 className="text-base font-bold text-[#111c2d] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d43]">domain</span>
                Core Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code (Read-only or editable with warning) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#3d4a41]">Building Code *</label>
                  <input 
                    type="text"
                    required
                    maxLength={20}
                    value={formBldCode}
                    onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all"
                  />
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#3d4a41]">Building Name *</label>
                  <input 
                    type="text"
                    required
                    value={formBldName}
                    onChange={(e) => setFormBldName(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all"
                  />
                </div>

                {/* Floors */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#3d4a41]">Total Floors *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={formBldTotalFloor}
                    onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all"
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[#3d4a41]">Physical Address</label>
                  <input 
                    type="text"
                    value={formBldAddress}
                    onChange={(e) => setFormBldAddress(e.target.value)}
                    placeholder="Enter physical address..."
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status Toggle */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#F4FBF3] border border-[#006d43]/10 rounded-2xl p-6 hover:shadow-[0_4px_12px_rgba(12,28,50,0.04)] transition-all">
              <h2 className="text-base font-bold text-[#111c2d] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d43]">toggle_on</span>
                Building Status
              </h2>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                <div>
                  <div className="text-sm font-bold text-[#111c2d]">Active Operation</div>
                  <div className="text-xs text-[#54637d]">Visible to parking users</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={handleToggleActive}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006d43]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button 
            type="button"
            onClick={handleDiscard}
            className="px-6 py-2.5 rounded-xl border border-[#006d43] text-[#006d43] hover:bg-[#006d43]/5 transition-colors font-bold text-xs"
          >
            Discard Changes
          </button>
          <button 
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#006d43] text-white hover:bg-[#006d43]/90 transition-all font-bold text-xs shadow-sm disabled:opacity-55"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Warning Reduction Modal */}
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
                onClick={async () => {
                  await executeEditBldSave();
                  router.push(basePath);
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-55"
              >
                {isSaving ? 'Saving...' : 'Yes, Delete and Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
