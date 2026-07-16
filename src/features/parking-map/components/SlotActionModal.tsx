'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';
import { Slot } from '../types';

interface SlotActionModalProps {
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
  showToastMessage
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

  // Reset form states on open or slot change
  useEffect(() => {
    if (isOpen && slot) {
      setActiveSlot(slot);
      setIsSubmitting(false);
    }
  }, [isOpen, slot]);

  // Fetch future bookings when activeSlot changes to AVAILABLE
  useEffect(() => {
    if (isOpen && activeSlot && activeSlot.status === 'AVAILABLE') {
      setLoadingFutureBookings(true);
      setFutureBookingsData(null);
      api.get<BaseResponse<any>>(`/ParkingSlots/${activeSlot.id}/future-bookings`)
        .then((res) => {
          if (res.success && res.data) {
            setFutureBookingsData(res.data);
          }
        })
        .catch((err) => console.error('Error fetching future bookings', err))
        .finally(() => setLoadingFutureBookings(false));
    } else {
      setFutureBookingsData(null);
    }
  }, [isOpen, activeSlot]);

  const handleSwitchSlot = async (newSlotId: number) => {
    try {
      setLoadingFutureBookings(true);
      const res = await api.get<BaseResponse<any>>(`/ParkingSlots/${newSlotId}`);
      if (res.success && res.data) {
        const s = res.data;
        const newSlot: Slot = {
          id: s.id,
          slotCode: s.code || `SLOT-${s.id}`,
          slotName: s.name,
          status: s.status === 0 || s.status === 'Available' ? 'AVAILABLE' :
                  s.status === 1 || s.status === 'Occupied' ? 'OCCUPIED' :
                  s.status === 2 || s.status === 'Blocked' ? 'BLOCKED' :
                  s.status === 3 || s.status === 'Maintenance' ? 'MAINTENANCE' :
                  'AVAILABLE',
          zoneId: s.zoneId,
          vehicleTypeId: s.vehicleTypeId,
          zoneName: activeSlot?.zoneName || '',
          slotType: activeSlot?.slotType || 'Standard',
          floorId: activeSlot?.floorId || 0,
          buildingId: activeSlot?.buildingId || 0
        };
        setActiveSlot(newSlot);
        showToastMessage(`Đã đổi sang vị trí đỗ ${newSlot.slotCode}`);
      }
    } catch {
      showToastMessage('Không thể chuyển sang slot mới.', 'error');
    } finally {
      setLoadingFutureBookings(false);
    }
  };

  if (!isOpen || !slot || !activeSlot) return null;





  // Toggle maintenance or block status
  const handleSetStatus = async (newStatus: 'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE') => {
    setIsSubmitting(true);
    try {
      const slotId = activeSlot.id;
      const currentStatus = activeSlot.status;
      let res: any = null;

      // Use dedicated endpoints for status changes
      if (newStatus === 'BLOCKED') {
        res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/block`, { reason: 'Blocked by staff' });
      } else if (newStatus === 'MAINTENANCE') {
        res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/maintenance`, { reason: 'Maintenance by staff' });
      } else if (newStatus === 'AVAILABLE') {
        // Available from BLOCKED or MAINTENANCE
        if (currentStatus === 'BLOCKED') {
          res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/unblock`, { reason: 'Unblocked by staff' });
        } else if (currentStatus === 'MAINTENANCE') {
          // Need to unblock from maintenance - use dedicated endpoint or fallback
          res = await api.post<BaseResponse<any>>(`/ParkingSlots/${slotId}/unblock`, { reason: 'Maintenance completed' });
        }
      }

      // Check if response indicates success
      if (res && res.success === false) {
        throw new Error(res.message || `Failed to update status to ${newStatus}`);
      }

      // Trigger Parent callback
      onSlotUpdated(activeSlot.id, newStatus, newStatus === 'AVAILABLE' ? undefined : activeSlot.assignedVehicle);
      
      // Get the message from backend or use a dynamic fallback
      const successMessage = res?.message || `Slot ${activeSlot.slotCode} status updated to ${newStatus}.`;
      showToastMessage(successMessage);
      onClose();
    } catch (err: any) {
      console.error(err);
      
      // Extract detailed error message from backend response
      let errorMsg = 'Could not update status on backend.';
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
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      {/* Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[90vh]`}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          
          {/* Drawer Mode: AVAILABLE -> New Allocation Form */}
          {activeSlot.status === 'AVAILABLE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {loadingFutureBookings && (
                <div className="flex items-center justify-center p-4">
                  <div className="w-5 h-5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-500">Checking future bookings...</span>
                </div>
              )}

              {/* Warning Banner & Recommendations */}
              {!loadingFutureBookings && futureBookingsData?.futureBookings && futureBookingsData.futureBookings.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-xs text-amber-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    Cảnh báo: Vị trí đỗ này đã có lịch đặt trước trong tương lai!
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
                      <p className="font-bold text-amber-900 mb-2">Đề xuất các vị trí trống khác an toàn hơn:</p>
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
                    Slot Available
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This parking bay is vacant and available. Entry gate systems will automatically assign and register vehicles to this slot upon check-in.
                  </p>
                </div>
              </div>

              {/* Administrative Actions */}
              {userRole === 'MANAGER' && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Administrative Controls
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSetStatus('MAINTENANCE')}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-3 text-white bg-[#d97706] hover:bg-amber-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 disabled:bg-amber-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">build</span>
                      Set Maintenance
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus('BLOCKED')}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-3 text-white bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10 disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Block Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drawer Mode: OCCUPIED -> Details and Actions */}
          {activeSlot.status === 'OCCUPIED' && activeSlot.assignedVehicle && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parked Vehicle</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{activeSlot.assignedVehicle.plate}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200/60 text-slate-700 font-bold rounded-lg text-[10px] uppercase tracking-wide">
                    Occupied
                  </span>
                </div>

                <div className="border-t border-slate-200/50 pt-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parked Since</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {activeSlot.assignedVehicle.startDate
                        ? new Date(activeSlot.assignedVehicle.startDate).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drawer Mode: BLOCKED or MAINTENANCE -> Action Panel */}
          {(activeSlot.status === 'BLOCKED' || activeSlot.status === 'MAINTENANCE') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-red-50 p-5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                <span className={`material-symbols-outlined text-2xl mt-0.5 ${activeSlot.status === 'BLOCKED' ? 'text-[#ba1a1a]' : 'text-amber-500'}`}>
                  {activeSlot.status === 'BLOCKED' ? 'block' : 'lock_clock'}
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Slot currently {activeSlot.status}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This parking bay has been marked out of service for operations/maintenance. It cannot be assigned or utilized by check-in sessions.
                  </p>
                </div>
              </div>
              
              {/* Administrative Actions */}
              {userRole === 'MANAGER' && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Switch Status
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
                    Change to {activeSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Drawer Mode: RESERVED -> Action Panel */}
          {activeSlot.status === 'RESERVED' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex items-start gap-4">
                <span className="material-symbols-outlined text-2xl mt-0.5 text-blue-600">
                  event
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Reserved for Booking
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This parking slot is reserved for an upcoming booking. It will become available after the booking is completed or cancelled.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          {activeSlot.status === 'AVAILABLE' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
            >
              Close
            </button>
          )}

          {activeSlot.status === 'OCCUPIED' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all shadow-sm"
              >
                Close
              </button>
              {userRole === 'MANAGER' && (
                <button
                  onClick={() => handleSetStatus('MAINTENANCE')}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  Maintain
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
                Cancel
              </button>
              {userRole === 'MANAGER' && (
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
                      Set Available
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
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
