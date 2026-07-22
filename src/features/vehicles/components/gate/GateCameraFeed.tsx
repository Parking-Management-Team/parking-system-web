/**
 * ===================================================================================
 * 📹 FE COMPONENT: GateCameraFeed.tsx (Khung Camera Nhận Diện Biển Số Lối Vào/Ra)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Render giao diện viewport xem camera trực tiếp lối vào/ra bãi đỗ xe (ALPR Camera Stream).
 * - Hiển thị khung định vị nhận diện biển số tự động (ALPR Scanning Box Overlay).
 * - Hiển thị nhãn loại xe (Vehicle Type Badge: Ô tô, Xe máy, Xe điện) và chỉ báo tín hiệu camera.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - Phục vụ hiển thị dữ liệu kết quả từ CheckinSessionController.cs và CheckoutController.cs.
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - ParkingSessions (LicensePlateIn, LicensePlateOut)
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Nạp Stream: Render viewport giả lập camera thời gian thực.
 * 2. Scanned: Nhận diện biển số -> Hiển thị badge loại xe và hiệu ứng viền xanh nhấp nháy.
 * ===================================================================================
 */

'use client';

import React from 'react';
import { Camera, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface GateCameraFeedProps {
  title: string;
  cameraName?: string;
  scannedPlate?: string;
  vehicleType?: string;
  isActive?: boolean;
  onMockScan?: () => void;
  imageUrl?: string | null;
}

export default function GateCameraFeed({
  title,
  cameraName = 'CAM-ENTRY-01',
  scannedPlate,
  vehicleType = 'CAR',
  isActive = true,
  onMockScan,
  imageUrl,
}: GateCameraFeedProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition-all hover:border-emerald-500/50">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">{cameraName}</span>
      </div>

      {/* Video Viewport / Feed Frame */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-slate-950">
        {imageUrl ? (
          <img src={imageUrl} alt="Camera Feed" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <Camera className="h-10 w-10 animate-pulse text-slate-500" />
            <span className="text-xs font-semibold text-slate-400">ALPR Live Stream Engine</span>
          </div>
        )}

        {/* ALPR Scanning Bounding Box Simulation */}
        {scannedPlate && (
          <div className="absolute inset-8 rounded-xl border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 p-3 backdrop-blur-[1px] animate-fade-in flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <CheckCircle2 className="h-3 w-3" /> ALPR MATCH 99.4%
              </span>
              <span className="rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-amber-300 font-mono">
                {vehicleType}
              </span>
            </div>

            <div className="self-center rounded-lg bg-slate-950/90 px-4 py-1.5 border border-emerald-400/50 shadow-lg">
              <span className="font-mono text-base font-black tracking-widest text-emerald-400">
                {scannedPlate}
              </span>
            </div>
          </div>
        )}

        {/* Quick Mock Scan Action Button (If enabled) */}
        {onMockScan && (
          <button
            onClick={onMockScan}
            type="button"
            className="absolute bottom-3 right-3 rounded-lg bg-slate-800/80 px-3 py-1.5 text-[11px] font-bold text-slate-200 backdrop-blur-sm transition-colors hover:bg-emerald-600 hover:text-white"
          >
            Trigger Scan
          </button>
        )}
      </div>
    </div>
  );
}
