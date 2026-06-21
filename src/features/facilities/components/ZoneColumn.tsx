import React from 'react';
import { Floor, Zone } from '../types';

const getVehicleIcon = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('car') || t.includes('xe hơi') || t.includes('xe o to') || t.includes('ô tô')) {
    return 'directions_car';
  }
  if (t.includes('motor') || t.includes('xe máy') || t.includes('xe gắn máy') || t.includes('moto')) {
    return 'motorcycle';
  }
  if (t.includes('ev') || t.includes('electric') || t.includes('điện')) {
    return 'ev_charger';
  }
  return 'directions_car';
};

interface ZoneColumnProps {
  selectedFloor: Floor | null;
  activeZones: Zone[];
  handleOpenAddZone: () => void;
  handleOpenEditZone: (zone: Zone, e: React.MouseEvent) => void;
  handleOpenDelZone: (zone: Zone, e: React.MouseEvent) => void;
}

/**
 * Hợp phần hiển thị Cột Danh sách Phân khu (Column 3)
 */
export default function ZoneColumn({
  selectedFloor,
  activeZones,
  handleOpenAddZone,
  handleOpenEditZone,
  handleOpenDelZone
}: ZoneColumnProps) {
  // Tính toán tổng số slots đã được phân bổ cho các phân khu
  const allocatedZones = Array.isArray(activeZones) ? activeZones : [];
  const allocatedSlots = allocatedZones.reduce((sum, z) => sum + z.slotCapacity, 0);
  const totalSlots = selectedFloor ? selectedFloor.totalSlots : 0;
  const allocationPercentage = totalSlots > 0 ? Math.min((allocatedSlots / totalSlots) * 100, 100) : 0;

  return (
    <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
      {/* Header Cột */}
      <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#111c2d]">
          <span className="material-symbols-outlined text-[20px] text-[#006d43]">grid_view</span>
          <h2 className="font-bold text-sm">3. Zones & Vehicle Specs</h2>
        </div>
        {selectedFloor && (
          <button 
            onClick={handleOpenAddZone}
            className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add Zone
          </button>
        )}
      </div>

      {/* Danh sách Phân khu thuộc Tầng đã chọn */}
      {selectedFloor ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="p-3 bg-slate-50 text-[11px] text-[#3d4a41] font-semibold flex justify-between">
            <span>Floor Selected: <span className="text-[#006d43]">{selectedFloor.name}</span></span>
            <span>Allocated: {allocatedSlots}/{totalSlots} slots</span>
          </div>

          {/* Thanh hiển thị tiến độ phân bổ */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              <span>Capacity Allocation Progress</span>
              <span className={allocatedSlots > totalSlots ? 'text-red-500' : 'text-[#006d43]'}>
                {allocationPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  allocatedSlots > totalSlots ? 'bg-red-500' : 'bg-[#006d43]'
                }`}
                style={{ width: `${allocationPercentage}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[490px] flex-grow">
            {allocatedZones.length > 0 ? (
              allocatedZones.map(zone => (
                <div 
                  key={zone.id}
                  className="p-4 bg-white hover:bg-slate-50 transition-all flex justify-between items-center group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                      {zone.name}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/50">
                        <span className="material-symbols-outlined text-[10px]">{getVehicleIcon(zone.vehicleType)}</span>
                        {zone.vehicleType}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        zone.zoneAccessType === 'MONTHLY' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {zone.zoneAccessType === 'MONTHLY' ? 'Monthly' : 'General'}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${zone.status === 'Active' ? 'bg-[#006d43]' : 'bg-red-500'}`} />
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">Capacity allocation: {zone.slotCapacity} slots</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleOpenEditZone(zone, e)}
                      className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                      title="Edit zone"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleOpenDelZone(zone, e)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                      title="Delete zone"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No zones configured for this floor yet. Click Add Zone above to allocate capacity.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">layers_clear</span>
          Please select a floor level from the middle panel to configure its zoning & vehicle types.
        </div>
      )}
    </section>
  );
}
