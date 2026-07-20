import React from 'react';
import { Building } from '@/lib/types/building.types';
import { Floor } from '../types';

interface FloorColumnProps {
  selectedBuilding: Building | null;
  selectedFloor: Floor | null;
  setSelectedFloor: (floor: Floor | null) => void;
  activeFloors: Floor[];
  handleOpenAddFloor: () => void;
  handleOpenEditFloor: (floor: Floor, e: React.MouseEvent) => void;
  handleOpenDelFloor: (floor: Floor, e: React.MouseEvent) => void;
}

/**
 * Hợp phần hiển thị Cột Danh sách Tầng (Column 2)
 */
export default function FloorColumn({
  selectedBuilding,
  selectedFloor,
  setSelectedFloor,
  activeFloors,
  handleOpenAddFloor,
  handleOpenEditFloor,
  handleOpenDelFloor
}: FloorColumnProps) {
  return (
    <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
      {/* Header Cột */}
      <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#111c2d]">
          <span className="material-symbols-outlined text-[20px] text-[#006d43]">layers</span>
          <h2 className="font-bold text-sm">2. Floor Structure</h2>
        </div>
        {selectedBuilding && (
          <button 
            onClick={handleOpenAddFloor}
            className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add Floor
          </button>
        )}
      </div>

      {/* Danh sách các Tầng của Tòa nhà đã chọn */}
      {selectedBuilding ? (
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[570px] flex-grow">
          <div className="p-3 bg-slate-50 text-[11px] text-[#3d4a41] font-semibold">
            Building Selected: <span className="text-[#006d43]">{selectedBuilding.name}</span>
          </div>
          {activeFloors.length > 0 ? (
            activeFloors.map(floor => {
              const isSelected = selectedFloor?.id === floor.id;
              return (
                <div 
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor)}
                  className={`p-4 transition-all cursor-pointer flex justify-between items-center group ${
                    isSelected 
                      ? 'bg-[#F4FBF3] border-l-4 border-[#006d43]' 
                      : 'hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                      {floor.name}
                      <span className={`w-1.5 h-1.5 rounded-full ${floor.status === 'Active' ? 'bg-[#006d43]' : 'bg-red-500'}`} />
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Floor index: {floor.floorNumber} • Type: <span className="font-medium text-slate-600">{floor.floorType || 'Standard'}</span>
                    </p>
                    <p className="text-[11px] text-[#3d4a41]/75 font-medium mt-0.5">
                      Max capacity: {floor.totalSlots} slots
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleOpenEditFloor(floor, e)}
                      className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                      title="Edit floor"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleOpenDelFloor(floor, e)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                      title="Delete floor"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No floors configured for this building. Click Add Floor above.
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">apartment</span>
          Please select a building from the left panel to configure its floors.
        </div>
      )}
    </section>
  );
}
