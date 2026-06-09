'use client';

import React, { useState } from 'react';

const MOCK_SLOTS_ZONE_A = Array.from({ length: 24 }).map((_, i) => ({
  id: `A-${String(i + 1).padStart(2, '0')}`,
  status: i % 4 === 0 ? 'OCCUPIED' : i % 7 === 0 ? 'RESERVED' : i === 11 ? 'BLOCKED' : 'AVAILABLE',
  type: i % 6 === 0 ? 'VIP' : 'STANDARD',
}));

/**
 * SlotMonitoring Component - Module giám sát ô đỗ thực tế
 * Cho phép nhân viên thay đổi trạng thái hoạt động của từng ô đỗ và quản lý chuyển xe.
 */
export default function SlotMonitoring() {
  const [selectedSlot, setSelectedSlot] = useState<typeof MOCK_SLOTS_ZONE_A[0] | null>(null);
  const [slotStatus, setSlotStatus] = useState('AVAILABLE');
  const [relocateDestination, setRelocateDestination] = useState('');

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlot) {
      alert(`Updated ${selectedSlot.id} status to ${slotStatus}`);
      setSelectedSlot(null);
    }
  };

  const handleRelocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlot && relocateDestination) {
      alert(`Relocating vehicle from ${selectedSlot.id} to ${relocateDestination}`);
      setSelectedSlot(null);
      setRelocateDestination('');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Real-time Slot Monitoring</h1>
        <p className="text-slate-500 text-sm mt-1">Supervise physical parking slots in Zone A, update statuses, and relocate vehicles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bản đồ bãi đỗ Zone A */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Zone A Grid Map</h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-100"></span>Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span>Reserved</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500"></span>Blocked</span>
            </div>
          </div>

          {/* Grid hiển thị các slot đỗ */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {MOCK_SLOTS_ZONE_A.map((slot) => {
              let bgClass = 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
              if (slot.status === 'OCCUPIED') bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
              if (slot.status === 'RESERVED') bgClass = 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
              if (slot.status === 'BLOCKED') bgClass = 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';

              const isSelected = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setSlotStatus(slot.status);
                  }}
                  className={`aspect-square p-3 border rounded-xl flex flex-col items-center justify-between text-xs transition-all relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-emerald-500 scale-95 shadow-md' : ''
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-bold">{slot.type}</span>
                  <span className="text-sm font-bold mt-1">{slot.id}</span>
                  <span className="text-[9px] font-medium tracking-wider mt-0.5">{slot.status}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Control Panel chi tiết */}
        <div className="space-y-6">
          {selectedSlot ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-800">Slot Controls: {selectedSlot.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Configure active status or issue relocations.</p>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase">Operational Status</label>
                <select
                  value={slotStatus}
                  onChange={(e) => setSlotStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied (Manual override)</option>
                  <option value="RESERVED">Reserved / VIP</option>
                  <option value="BLOCKED">Blocked (Under maintenance)</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                >
                  Save Status Override
                </button>
              </form>

              {/* Vehicle Relocation Form */}
              <form onSubmit={handleRelocate} className="space-y-4 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Relocate Vehicle</h4>
                  <p className="text-[10px] text-slate-400">Shift parked vehicle to a new vacant slot.</p>
                </div>
                <input
                  type="text"
                  placeholder="Enter Destination Slot (e.g. A-14)..."
                  value={relocateDestination}
                  onChange={(e) => setRelocateDestination(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-700"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  Confirm Relocation
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl">touch_app</span>
              <p className="text-sm mt-2">Select any slot on the grid to open the override control panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
