import React from 'react';
import { VehicleInfo } from '../types';

interface VehicleModalsProps {
  showViolationModal: boolean;
  setShowViolationModal: (show: boolean) => void;
  violationReason: string;
  setViolationReason: (reason: string) => void;
  violationNotes: string;
  setViolationNotes: (notes: string) => void;
  submitViolation: (e: React.FormEvent) => void;
  
  showTicketModal: boolean;
  setShowTicketModal: (show: boolean) => void;
  vehicle: VehicleInfo;
  parkedSlot: string;
  secondsElapsed: number;
  formatDuration: (seconds: number) => string;
}

/**
 * Hợp phần hiển thị các Modal báo lỗi vi phạm và in vé xe điện tử
 */
export default function VehicleModals({
  showViolationModal,
  setShowViolationModal,
  violationReason,
  setViolationReason,
  violationNotes,
  setViolationNotes,
  submitViolation,
  
  showTicketModal,
  setShowTicketModal,
  vehicle,
  parkedSlot,
  secondsElapsed,
  formatDuration
}: VehicleModalsProps) {
  return (
    <>
      {/* ===== MODAL: BÁO CÁO VI PHẠM (VIOLATION) ===== */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <span className="material-symbols-outlined">report_problem</span>
                <h3 className="font-bold text-base">Report Parking Violation</h3>
              </div>
              <button onClick={() => setShowViolationModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={submitViolation} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Violation Type</label>
                <select
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Parking Out of Line">Đỗ xe đè vạch / Sai vị trí</option>
                  <option value="Overstaying Permit Limit">Quá hạn thời gian cho phép</option>
                  <option value="Unauthorized VIP Zone">Đỗ trái phép khu vực VIP</option>
                  <option value="Blocking Other Vehicles">Cản trở phương tiện khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Detailed Notes</label>
                <textarea
                  value={violationNotes}
                  onChange={(e) => setViolationNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết (vị trí, hành vi vi phạm...)"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 bg-transparent hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/10"
                >
                  Confirm Violation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: BIÊN LAI IN VÉ (E-TICKET) ===== */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden font-mono text-slate-800 animate-scale-up">
            
            {/* Lớp trang trí răng cưa hóa đơn */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

            <div className="text-center pb-4 border-b border-dashed border-slate-200 mt-2">
              <h3 className="font-bold text-lg tracking-tight uppercase">NexPark System</h3>
              <p className="text-[10px] text-slate-500 uppercase">Smart Parking Receipt</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">TICKET NO:</span>
                <span className="font-bold text-slate-700">{vehicle.ticketNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LICENSE PLATE:</span>
                <span className="font-bold text-slate-700">{vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VEHICLE:</span>
                <span className="font-semibold text-slate-700">{vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ALLOCATED SLOT:</span>
                <span className="font-bold text-emerald-600">{parkedSlot}</span>
              </div>
              <hr className="border-dashed border-slate-200 my-2" />
              <div className="flex justify-between">
                <span className="text-slate-400">CHECK-IN:</span>
                <span className="font-semibold text-slate-700">{vehicle.entryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DURATION STAMP:</span>
                <span className="font-bold text-slate-700">{formatDuration(secondsElapsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RATE TIER:</span>
                <span className="font-bold text-slate-700">{vehicle.rateTier}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-200 text-center space-y-4">
              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase">Simulated Barcode</span>
                <div className="w-full h-8 bg-slate-800 mt-1 flex items-center justify-center text-white/90 text-xs font-sans tracking-[0.4em] font-bold">
                  *{vehicle.licensePlate.replace(/[^A-Z0-9]/gi, '')}*
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Đang gửi lệnh in tới máy in hóa đơn cổng North Gate...');
                    setShowTicketModal(false);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                >
                  Print
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
