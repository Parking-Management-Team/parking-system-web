/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: SlotActionModal.tsx (HỘP THOẠI QUẢN LÝ & CHI TIẾT Ô ĐỖ XE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Hộp thoại Modal làm việc trực tiếp với từng Ô đỗ xe (Slot) trên bản đồ:
 * 1. 🔍 Xem thông tin chi tiết ô đỗ: Mã slot, Khu vực, Loại slot, Trạng thái hiện tại.
 * 2. ⚠️ Kiểm tra & Cảnh báo Đặt chỗ tương lai (Future Bookings): Cho phép gợi ý/đổi vị trí đỗ an toàn hơn.
 * 3. 🚗 Quản lý phương tiện đang đỗ: Biển số xe, Thời gian đỗ (Status OCCUPIED).
 * 4. 🛡️ Quyền Quản trị (Policy Enforcer): Chỉ Quản lý (MANAGER) hoặc Quản trị viên (ADMIN) 
 *    mới có quyền thay đổi trạng thái slot (Bảo trì / Khoá / Mở trống). Staff chỉ được xem.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Slot } from '../types';
import { parkingMapService } from '../services/parkingMapService';

export interface SlotActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  selectedBuildingId: number | null;
  userRole?: string;
  onSlotUpdated: (
    slotId: number,
    newStatus: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE' | 'RESERVED',
    assignedVehicle?: Slot['assignedVehicle']
  ) => void;
  showToastMessage: (message: string, type?: 'success' | 'error') => void;
}

export function SlotActionModal({
  isOpen,
  onClose,
  slot,
  userRole,
  onSlotUpdated,
  showToastMessage,
}: SlotActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [futureBookingsData, setFutureBookingsData] = useState<{
    slotId: number;
    slotCode: string;
    futureBookings: any[];
    recommendedSlots: any[];
  } | null>(null);
  const [loadingFutureBookings, setLoadingFutureBookings] = useState(false);

  // 🛡️ BẢO MẬT & PHÂN QUYỀN (Policy Enforcer):
  // Cả Quản lý (MANAGER) và Quản trị viên (ADMIN) đều có quyền Quản trị vị trí đỗ.
  const userRoleUpper = userRole?.toUpperCase();
  const canManageSlot = userRoleUpper === 'MANAGER' || userRoleUpper === 'ADMIN';

  // 🔄 Reset trạng thái form khi mở Modal hoặc thay đổi Slot được chọn
  useEffect(() => {
    if (isOpen && slot) {
      setActiveSlot(slot);
      setIsSubmitting(false);
    }
  }, [isOpen, slot]);

  // 📧 Tải danh sách lịch đặt chỗ trong tương lai nếu slot đang ở trạng thái AVAILABLE
  useEffect(() => {
    if (isOpen && activeSlot && activeSlot.status === 'AVAILABLE') {
      setLoadingFutureBookings(true);
      setFutureBookingsData(null);
      parkingMapService
        .getFutureBookings(activeSlot.id)
        .then((data) => {
          if (data) {
            setFutureBookingsData(data);
          }
        })
        .catch((err) => console.error('Lỗi khi tải lịch đặt trước tương lai:', err))
        .finally(() => setLoadingFutureBookings(false));
    } else {
      setFutureBookingsData(null);
    }
  }, [isOpen, activeSlot]);

  // 🔀 Hàm chuyển đổi sang vị trí đỗ khác được gợi ý an toàn hơn
  const handleSwitchSlot = async (newSlotId: number) => {
    try {
      setLoadingFutureBookings(true);
      const newSlot = await parkingMapService.getSlotById(newSlotId);
      if (newSlot) {
        const fullSlot: Slot = {
          ...newSlot,
          zoneName: activeSlot?.zoneName || '',
          slotType: activeSlot?.slotType || 'Standard',
          floorId: activeSlot?.floorId || 0,
          buildingId: activeSlot?.buildingId || 0,
        };
        setActiveSlot(fullSlot);
        showToastMessage(`Đã chuyển sang vị trí đỗ ${fullSlot.slotCode}`);
      }
    } catch {
      showToastMessage('Không thể chuyển sang vị trí đỗ mới.', 'error');
    } finally {
      setIsSubmitting(false);
      setLoadingFutureBookings(false);
    }
  };

  if (!isOpen || !slot || !activeSlot) return null;

  // 🛠️ Thay đổi trạng thái vị trí đỗ (Bảo trì / Khoá / Mở hoạt động)
  const handleSetStatus = async (newStatus: 'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE') => {
    if (!canManageSlot) {
      showToastMessage('Bạn không có quyền thay đổi trạng thái vị trí đỗ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const slotId = activeSlot.id;
      const currentStatus = activeSlot.status;

      const res = await parkingMapService.updateSlotStatus(slotId, newStatus, currentStatus, {
        code: activeSlot.slotCode,
        name: activeSlot.slotName,
        vehicleTypeId: activeSlot.vehicleTypeId,
      });

      // Kiểm tra xem phản hồi có thông báo lỗi từ backend không
      if (res && res.success === false) {
        throw new Error(res.message || `Không thể cập nhật trạng thái vị trí đỗ sang ${newStatus}`);
      }

      // Gọi callback cập nhật State ở Component cha
      onSlotUpdated(activeSlot.id, newStatus, newStatus === 'AVAILABLE' ? undefined : activeSlot.assignedVehicle);

      const successMessage = res?.message || `Vị trí đỗ ${activeSlot.slotCode} đã được cập nhật sang trạng thái ${newStatus}.`;
      showToastMessage(successMessage);
      onClose();
    } catch (err: any) {
      console.error(err);

      let errorMsg = 'Không thể cập nhật trạng thái vị trí đỗ trên máy chủ.';
      if (err && err.data) {
        const data = err.data;
        if (typeof data === 'object' && data !== null) {
          if (data.message) {
            errorMsg = data.message;
          } else if (data.errors) {
            if (Array.isArray(data.errors) && data.errors.length > 0) {
              errorMsg = data.errors.join(', ');
            } else if (typeof data.errors === 'object') {
              errorMsg = Object.values(data.errors).flat().join(', ');
            }
          } else if (data.detail) {
            errorMsg = data.detail;
          }
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      showToastMessage(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      {/* Backdrop mờ nền xung quanh Modal */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Nguồn nội dung Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[90vh]`}
      >
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Slot {activeSlot.slotCode}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {activeSlot.zoneName} • {activeSlot.slotType}
            </p>
          </div>
          <button
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px] align-middle">close</span>
          </button>
        </div>

        {/* Nội dung chính Modal */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          {/* TRẠNG THÁI: TRỐNG (AVAILABLE) */}
          {activeSlot.status === 'AVAILABLE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {loadingFutureBookings && (
                <div className="flex items-center justify-center p-4">
                  <div className="w-5 h-5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-500">Đang kiểm tra lịch đặt chỗ tương lai...</span>
                </div>
              )}

              {/* Cảnh báo Đặt chỗ Tương lai & Vị trí đỗ thay thế được gợi ý */}
              {!loadingFutureBookings && futureBookingsData?.futureBookings && futureBookingsData.futureBookings.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-xs text-amber-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    Cảnh báo: Vị trí đỗ này đã có lịch đặt chỗ trước sắp tới!
                  </div>
                  <ul className="list-disc pl-4 space-y-1 font-semibold text-amber-700">
                    {futureBookingsData.futureBookings.map((b: any) => (
                      <li key={b.id}>
                        {new Date(b.plannedCheckinTime).toLocaleString('vi-VN')} - {new Date(b.plannedCheckoutTime).toLocaleString('vi-VN')}
                      </li>
                    ))}
                  </ul>
                  {futureBookingsData.recommendedSlots && futureBookingsData.recommendedSlots.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/50">
                      <p className="font-bold text-amber-900 mb-2">Gợi ý các vị trí đỗ trống an toàn hơn:</p>
                      <div className="flex flex-wrap gap-2">
                        {futureBookingsData.recommendedSlots.map((rec: any) => (
                          <button
                            key={rec.slotId}
                            type="button"
                            onClick={() => handleSwitchSlot(rec.slotId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/55 transition font-black text-amber-900 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm text-amber-600">swap_horiz</span>
                            {rec.slotCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-500/10 flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-600 text-2xl mt-0.5">
                  check_circle
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-[#006d43] uppercase tracking-wide">
                    Vị trí đỗ trống
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Vị trí đỗ này hiện đang sẵn sàng. Hệ thống cổng vào sẽ tự động gán phương tiện vào vị trí này khi xe Check-in.
                  </p>
                </div>
              </div>

              {/* Thao tác Quản trị (Chỉ dành cho Manager & Admin) */}
              {canManageSlot && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quyền Quản trị Trạng thái Slot
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSetStatus('MAINTENANCE')}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-3 text-white bg-[#d97706] hover:bg-amber-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 disabled:bg-amber-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">build</span>
                      Chuyển Bảo trì
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus('BLOCKED')}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-3 text-white bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Khoá vị trí
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI: ĐANG ĐỖ XE (OCCUPIED) */}
          {activeSlot.status === 'OCCUPIED' && activeSlot.assignedVehicle && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phương tiện đang đỗ</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{activeSlot.assignedVehicle.plate}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200/60 text-slate-700 font-bold rounded-lg text-[10px] uppercase tracking-wide">
                    Đang sử dụng
                  </span>
                </div>

                <div className="border-t border-slate-200/50 pt-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời điểm vào bãi</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {activeSlot.assignedVehicle.startDate
                        ? new Date(activeSlot.assignedVehicle.startDate).toLocaleString('vi-VN')
                        : 'Không có dữ liệu'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: KHOÁ HOẶC BẢO TRÌ (BLOCKED / MAINTENANCE) */}
          {(activeSlot.status === 'BLOCKED' || activeSlot.status === 'MAINTENANCE') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-red-50 p-5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                <span className={`material-symbols-outlined text-2xl mt-0.5 ${activeSlot.status === 'BLOCKED' ? 'text-[#ba1a1a]' : 'text-amber-500'}`}>
                  {activeSlot.status === 'BLOCKED' ? 'block' : 'lock_clock'}
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Vị trí đỗ hiện đang {activeSlot.status === 'BLOCKED' ? 'KHOÁ' : 'BẢO TRÌ'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ô đỗ này đã được đánh dấu dừng phục vụ để vận hành/bảo trì. Xe Check-in sẽ không thể phân bổ vào vị trí này.
                  </p>
                </div>
              </div>

              {/* Quản trị chuyển đổi qua lại giữa Khoá và Bảo trì (Manager & Admin) */}
              {canManageSlot && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Đổi trạng thái bảo trì/khoá
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(activeSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED')}
                    disabled={isSubmitting}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white hover:brightness-110 shadow-md disabled:cursor-not-allowed ${
                      activeSlot.status === 'BLOCKED'
                        ? 'bg-[#d97706] hover:bg-amber-700 shadow-amber-500/10'
                        : 'bg-[#ba1a1a] hover:bg-red-700 shadow-red-500/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeSlot.status === 'BLOCKED' ? 'build' : 'block'}
                    </span>
                    Chuyển sang {activeSlot.status === 'BLOCKED' ? 'BẢO TRÌ' : 'KHOÁ (BLOCKED)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI: ĐÃ ĐẶT TRƯỚC (RESERVED) */}
          {activeSlot.status === 'RESERVED' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex items-start gap-4">
                <span className="material-symbols-outlined text-2xl mt-0.5 text-blue-600">
                  event
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Đã đặt chỗ trước
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Vị trí đỗ này đã được khách hàng đặt giữ trước qua hệ thống Booking. Slot sẽ sẵn sàng sau khi phiên gửi kết thúc hoặc đơn bị hủy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nút thao tác dưới Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          {activeSlot.status === 'AVAILABLE' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
            >
              Đóng
            </button>
          )}

          {activeSlot.status === 'OCCUPIED' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
              >
                Đóng
              </button>
              {canManageSlot && (
                <button
                  onClick={() => handleSetStatus('MAINTENANCE')}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  Bảo trì
                </button>
              )}
            </>
          )}

          {(activeSlot.status === 'BLOCKED' || activeSlot.status === 'MAINTENANCE') && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
              >
                Hủy
              </button>
              {canManageSlot && (
                <button
                  onClick={() => handleSetStatus('AVAILABLE')}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-[#006d43] hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Mở hoạt động (Available)
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {activeSlot.status === 'RESERVED' && (
            <button
              onClick={onClose}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
