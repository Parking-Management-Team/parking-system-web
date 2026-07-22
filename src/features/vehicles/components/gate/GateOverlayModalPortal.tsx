/**
 * ===================================================================================
 * 🚪 FE COMPONENT: GateOverlayModalPortal.tsx (Modal Phản Hồi Mở Cổng Barie 100% Full-Screen)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Render Modal thông báo phản hồi trạng thái quẹt thẻ & mở rào chắn Barie (Full-screen Overlay Modal).
 * - Sử dụng `createPortal(..., document.body)` để đảm bảo lớp mờ tối `backdrop-blur-md` phủ kín 100% màn hình qua Sidebar và Header.
 * - Trực quan hóa kết quả:
 *   + Success (Xanh lá) : Mở Barie cho xe vào/ra bãi đỗ.
 *   + Error (Đỏ/Vàng)   : Cảnh báo xe vi phạm Blacklist hoặc thẻ không hợp lệ.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - Hiển thị phản hồi từ CheckinSessionController.cs và CheckoutController.cs.
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - ParkingSessions, ParkingCards
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Client Mount: Kiểm tra `mounted = true` trước khi render vào `document.body`.
 * 2. Auto-close: Tự động đóng modal sau 3.5 giây hoặc bấm nút xác nhận.
 * ===================================================================================
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, X, ArrowRight, ShieldAlert } from 'lucide-react';

export interface GateOverlayData {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  licensePlate?: string;
  slotCode?: string;
  cardCode?: string;
  fee?: number;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface GateOverlayModalPortalProps {
  data: GateOverlayData | null;
  onClose: () => void;
}

export default function GateOverlayModalPortal({ data, onClose }: GateOverlayModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data) return null;

  const isSuccess = data.type === 'success';
  const isError = data.type === 'error';

  const modalJSX = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* 100% Full screen backdrop overlay over Sidebar & Header */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Main Dialog Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white p-6 shadow-2xl animate-scale-in z-10 space-y-5">
        {/* Status Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform ${
              isSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : isError
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-amber-500 text-white shadow-amber-500/30'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-10 w-10" />
            ) : isError ? (
              <ShieldAlert className="h-10 w-10" />
            ) : (
              <AlertTriangle className="h-10 w-10" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800">{data.title}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">{data.message}</p>
          </div>
        </div>

        {/* Plate / Slot Summary Grid */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
          {data.licensePlate && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase">License Plate</span>
              <span className="font-mono text-sm font-black text-slate-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {data.licensePlate}
              </span>
            </div>
          )}

          {data.slotCode && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase">Assigned Slot</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {data.slotCode}
              </span>
            </div>
          )}

          {data.cardCode && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase">RFID Card</span>
              <span className="font-mono text-slate-700 font-bold">{data.cardCode}</span>
            </div>
          )}

          {data.fee !== undefined && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-600 uppercase">Total Fee</span>
              <span className="font-bold text-emerald-600 text-sm font-mono">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.fee)}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
            isSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              : isError
              ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
          }`}
        >
          <span>Confirm Barrier Gate Action</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
