import React from 'react';
import Image from 'next/image';

/**
 * Hợp phần hiển thị luồng Camera trực tiếp theo dõi xe đỗ
 */
export default function VehicleLiveFeed() {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-slate-900 relative group min-h-[380px] flex items-center justify-center">
      <Image
        src="https://images.unsplash.com/photo-1506521788701-1e13a4e33c10?q=80&w=1000&auto=format&fit=crop"
        alt="Vehicle Entry Camera Viewport"
        fill
        priority
        className="object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Overlay Gradient tối bên dưới */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-16 z-10">
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">videocam</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">ENTRY CAMERA 04 • ZONE A1</span>
          </div>
          <div className="text-[9px] font-mono text-slate-300 tracking-wider">
            COORD: 10.7626 N, 106.6602 E
          </div>
        </div>
      </div>

      {/* Trạng thái LIVE nổi góc trên */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-10">
        <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1 rounded-lg flex items-center gap-2 font-bold text-[10px] tracking-tight uppercase">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          LIVE FEED
        </div>
        <div className="bg-slate-950/40 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded-md text-[9px] font-mono">
          60 FPS • 4K HDR
        </div>
      </div>
    </div>
  );
}
