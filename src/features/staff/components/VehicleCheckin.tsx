'use client';

import React, { useState } from 'react';

/**
 * VehicleCheckin Component - Module Check-in cho nhân viên vận hành
 * Cho phép nhân viên kiểm tra thông tin xe vào, nhận dạng biển số ALPR và cấp phát slot đỗ.
 */
export default function VehicleCheckin() {
  const [licensePlate, setLicensePlate] = useState('51A-123.45');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [assignedSlot, setAssignedSlot] = useState('B1-05');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [cardCode, setCardCode] = useState('CARD-001');
const [sessions, setSessions] = useState<any[]>([]);

  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckedIn(true);
    setTimeout(() => setIsCheckedIn(false), 3000);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vehicle Check-in Portal</h1>
        <p className="text-slate-500 text-sm mt-1">Register incoming vehicles and assign active parking slots.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Form đăng ký và Quét biển số */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">Check-in Registration</h3>

          <form onSubmit={handleCheckin} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Biển số xe */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">License Plate (ALPR Output)</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold uppercase tracking-wider text-slate-700"
                  required
                />
              </div>

              {/* Loại phương tiện */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                >
                  <option value="CAR">Car (4-7 seats)</option>
                  <option value="SUV">SUV / Pick-up</option>
                  <option value="MOTO">Motorcycle</option>
                  <option value="TRUCK">Truck / Van</option>
                </select>
              </div>

              {/* Cấp phát ô đỗ */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Recommended Slot</label>
                <input
                  type="text"
                  value={assignedSlot}
                  onChange={(e) => setAssignedSlot(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                  required
                />
              </div>

              {/* Làn check-in */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Entry Gate / Lane</label>
                <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm">
                  Gate 1 - North Entrance
                </div>
              </div>
            </div>

            {/* Checklist kiểm tra nhanh */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Gate Safety Checklist</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  Plate visible & clean
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  Standard vehicle size
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  No dangerous payload
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  Active gate camera feed
                </div>
              </div>
            </div>

            {/* Nút check-in */}
            <button
              type="submit"
              className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              Confirm Entry & Print Slip
            </button>
          </form>
        </div>

        {/* Cột phải: Live Camera Feed & Virtual Ticket */}
        <div className="space-y-8">
          {/* Giả lập camera ALPR */}
          <div className="bg-slate-900 aspect-video rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center text-slate-500">
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              LIVE - GATE 1 CAMERA
            </div>
            <span className="material-symbols-outlined text-4xl text-slate-700 animate-pulse">videocam</span>
            {/* Lớp lưới quét biển số */}
            <div className="absolute inset-x-8 bottom-4 h-12 border border-emerald-500/40 bg-emerald-500/5 rounded flex items-center justify-between px-3 text-[10px] text-emerald-400 font-mono">
              <span>SCAN ZONE</span>
              <span className="font-bold text-xs">{licensePlate || 'NO PLATE'}</span>
            </div>
          </div>

          {/* Vé xe ảo */}
          <div className="bg-amber-50 p-6 rounded-2xl border border-dashed border-amber-200 flex flex-col text-slate-800 font-mono text-sm relative overflow-hidden">
            {/* Phía trên cùng */}
            <div className="text-center pb-4 border-b border-dashed border-amber-200">
              <h4 className="font-bold text-base tracking-widest text-slate-700">NEXPARK</h4>
              <p className="text-[10px] text-slate-400 mt-1">Smart Parking System Slip</p>
            </div>

            {/* Chi tiết vé */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">PLATE:</span>
                <span className="font-bold">{licensePlate || '-------'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">SLOT:</span>
                <span className="font-bold">{assignedSlot}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">ENTRY:</span>
                <span className="font-medium">
                  {new Date().toLocaleString('en-US', { hour12: false })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">GATE:</span>
                <span className="font-medium">GATE 01</span>
              </div>
            </div>

            {/* Giả lập Barcode/QR */}
            <div className="bg-white p-3 rounded border border-amber-100 flex flex-col items-center justify-center gap-1.5 mt-2">
              <div className="h-10 w-full bg-slate-800 flex items-center justify-between px-1 tracking-widest text-[9px] text-slate-400">
                |||||| | |||| | ||||| | ||||| | ||||
              </div>
              <span className="text-[9px] text-slate-400">NP-2026-9824-7128</span>
            </div>

            {/* Toast success thông báo khi checkin thành công */}
            {isCheckedIn && (
              <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white font-sans transition-opacity duration-300">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="font-bold mt-2">Checked In Successfully!</p>
                <p className="text-xs text-white/80 mt-1">Slip printed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
