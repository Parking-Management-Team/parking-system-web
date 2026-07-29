/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: BuildingDetails.tsx (CHỈNH SỬA & CHI TIẾT THÔNG TIN TÒA NHÀ - BUILDING DETAILS)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Cung cấp form xem và chỉnh sửa thông tin chi tiết của Tòa nhà (Building Core Details) dành cho Admin và Manager.
 * Tích hợp tính năng Cảnh báo Nguy hiểm khi Giảm tổng số tầng (Floor Count Reduction Warning Modal).
 *
 * 🛠️ CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * 1. 📝 Form Cập nhật Thông tin Tòa nhà (Core Information Form):
 *    - Mã Tòa nhà (Building Code): Tự động viết hoa, kiểm tra định dạng.
 *    - Tên Tòa nhà (Building Name): Tên gọi đại diện.
 *    - Tổng số tầng (Total Floors): Số lượng tầng giới hạn cho tòa nhà.
 *    - Địa chỉ vật lý (Physical Address).
 * 2. ⚡ Chuyển đổi Trạng thái Hoạt động (Building Status Toggle):
 *    - Active / Inactive Operation (chuyển giữa Available 0 và OutOfService 3).
 * 3. ⚠️ Cảnh báo Xoá Tầng tự động (Floor Count Reduction Warning):
 *    - Khi giảm số lượng tầng từ N xuống M (M < N), hệ thống sẽ hiển thị cảnh báo đỏ nguy hiểm.
 *    - Cảnh báo rõ ràng các tầng vượt quá M cùng toàn bộ Zones và Slots sẽ bị XOÁ VĨNH VIỄN (Cascade Delete).
 * 4. 👁️ Chế độ Xem (View Mode):
 *    - Hỗ trợ query parameter `?mode=view` để xem thông tin dạng Read-only.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFacilitiesContext } from '../context/FacilitiesContext';
import { Building, BuildingStatus } from '@/lib/types/building.types';
import { facilityService } from '../services/facility.service';

export default function BuildingDetails() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idStr = params?.id;
  const bldId = parseInt(typeof idStr === 'string' ? idStr : '', 10);
  const isViewMode = searchParams?.get('mode') === 'view';

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

  // Tìm kiếm tòa nhà và điền dữ liệu ban đầu vào form (nếu chưa có trong context thì gọi API getById)
  useEffect(() => {
    let isMounted = true;
    if (!bldId) return;

    const bld = buildings.find(b => b.id === bldId);
    if (bld) {
      setEditingBld(bld);
      setOriginalBld(bld);
      setFormBldCode(bld.code);
      setFormBldName(bld.name);
      setFormBldAddress(bld.address || '');
      setFormBldTotalFloor(bld.totalFloor);
      setFormBldStatus(bld.status);
    } else {
      facilityService.buildings.getById(bldId).then(res => {
        if (res.success && res.data && isMounted) {
          const item = res.data;
          setEditingBld(item);
          setOriginalBld(item);
          setFormBldCode(item.code);
          setFormBldName(item.name);
          setFormBldAddress(item.address || '');
          setFormBldTotalFloor(item.totalFloor);
          setFormBldStatus(item.status);
        }
      }).catch(err => {
        console.error('Lỗi khi tải thông tin tòa nhà:', err);
      });
    }

    return () => { isMounted = false; };
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


  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🔔 TOAST THÔNG BÁO TÁC VỤ HỆ THỐNG                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 📝 FORM CẬP NHẬT THÔNG TIN TÒA NHÀ                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleEditBldPreSubmit} className="flex flex-col gap-6">
        <div className="w-full">
          {/* Thông tin cốt lõi (Core Information) */}
          <div className="bg-[#F4FBF3] border border-[#006d43]/10 rounded-2xl p-6 hover:shadow-[0_4px_12px_rgba(12,28,50,0.04)] transition-all">
            <h2 className="text-base font-bold text-[#111c2d] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006d43]">domain</span>
              Core Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã Tòa nhà (Building Code) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#3d4a41]">Building Code *</label>
                <input 
                  type="text"
                  required
                  maxLength={20}
                  value={formBldCode}
                  onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                  disabled={isViewMode}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Tên Tòa nhà (Building Name) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#3d4a41]">Building Name *</label>
                <input 
                  type="text"
                  required
                  value={formBldName}
                  onChange={(e) => setFormBldName(e.target.value)}
                  disabled={isViewMode}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Tổng số tầng (Total Floors) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#3d4a41]">Total Floors *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={formBldTotalFloor}
                  onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                  disabled={isViewMode}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Địa chỉ (Physical Address) */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[#3d4a41]">Physical Address</label>
                <input 
                  type="text"
                  value={formBldAddress}
                  onChange={(e) => setFormBldAddress(e.target.value)}
                  placeholder="Enter physical address..."
                  disabled={isViewMode}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43] transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động Lưu / Hủy */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button 
            type="button"
            onClick={handleDiscard}
            className="px-6 py-2.5 rounded-xl border border-[#006d43] text-[#006d43] hover:bg-[#006d43]/5 transition-colors font-bold text-xs cursor-pointer"
          >
            {isViewMode ? 'Back to List' : 'Discard Changes'}
          </button>
          {!isViewMode && (
            <button 
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#006d43] text-white hover:bg-[#006d43]/90 transition-all font-bold text-xs shadow-sm disabled:opacity-55 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ⚠️ MODAL CẢNH BÁO NGUY HIỂM KHI GIẢM SỐ LƯỢNG TẦNG (FLOOR REDUCTION) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isWarningBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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
                onClick={async () => {
                  await executeEditBldSave();
                  router.push(basePath);
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-55 cursor-pointer"
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
