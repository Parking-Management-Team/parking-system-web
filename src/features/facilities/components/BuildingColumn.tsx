import React from 'react';
import { Building, BuildingStatus } from '@/lib/types/building.types';

interface BuildingColumnProps {
  filteredBuildings: Building[];
  selectedBuilding: Building | null;
  setSelectedBuilding: (bld: Building | null) => void;
  setSelectedFloor: (floor: null) => void;
  searchBldQuery: string;
  setSearchBldQuery: (q: string) => void;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalCount: number;
  handleOpenAddBld: () => void;
  handleOpenEditBld: (bld: Building, e: React.MouseEvent) => void;
  handleOpenDelBld: (bld: Building, e: React.MouseEvent) => void;
}

/**
 * Hợp phần hiển thị Cột Danh sách Tòa nhà (Column 1)
 */
export default function BuildingColumn({
  filteredBuildings,
  selectedBuilding,
  setSelectedBuilding,
  setSelectedFloor,
  searchBldQuery,
  setSearchBldQuery,
  pageIndex,
  setPageIndex,
  totalPages,
  totalCount,
  handleOpenAddBld,
  handleOpenEditBld,
  handleOpenDelBld
}: BuildingColumnProps) {
  return (
    <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
      {/* Header Cột */}
      <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#111c2d]">
          <span className="material-symbols-outlined text-[20px] text-[#006d43]">corporate_fare</span>
          <h2 className="font-bold text-sm">1. Buildings</h2>
        </div>
        <button 
          onClick={handleOpenAddBld}
          className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Add Building
        </button>
      </div>

      {/* Ô tìm kiếm nhanh */}
      <div className="p-3 border-b border-slate-100/60 bg-slate-50/20">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">search</span>
          <input 
            type="text" 
            placeholder="Search code, name, address..."
            value={searchBldQuery}
            onChange={(e) => setSearchBldQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43]/10 transition-all text-[#111c2d]"
          />
        </div>
      </div>

      {/* Danh sách Tòa nhà */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
        {filteredBuildings.length > 0 ? (
          filteredBuildings.map(bld => {
            const isSelected = selectedBuilding?.id === bld.id;
            return (
              <div 
                key={bld.id}
                onClick={() => {
                  setSelectedBuilding(bld);
                  setSelectedFloor(null); // Reset tầng đã chọn khi đổi tòa nhà
                }}
                className={`p-4 transition-all cursor-pointer flex justify-between items-start group ${
                  isSelected 
                    ? 'bg-[#F4FBF3] border-l-4 border-[#006d43]' 
                    : 'hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#3d4a41]">
                      {bld.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      bld.status === BuildingStatus.Available ? 'bg-[#006d43]/10 text-[#006d43]' :
                      bld.status === BuildingStatus.Occupied ? 'bg-amber-100 text-amber-800' :
                      bld.status === BuildingStatus.Reserved ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bld.status === BuildingStatus.Available ? 'Available' :
                       bld.status === BuildingStatus.Occupied ? 'Occupied' :
                       bld.status === BuildingStatus.Reserved ? 'Reserved' :
                       'Maintenance'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#111c2d] truncate">{bld.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{bld.address || 'No address registered'}</p>
                  <p className="text-[11px] text-[#006d43] font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">layers</span>
                    {bld.totalFloor} parking levels
                  </p>
                </div>

                {/* Các nút CRUD tác vụ */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleOpenEditBld(bld, e)}
                    className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                    title="Edit building details"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button 
                    onClick={(e) => handleOpenDelBld(bld, e)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                    title="Delete building"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No buildings match search query.
          </div>
        )}
      </div>

      {/* Footer Phân trang tòa nhà */}
      <div className="p-3 border-t border-slate-100 bg-[#F4FBF3]/15 flex justify-between items-center text-slate-400">
        <span className="text-[10px] font-medium">
          Page {pageIndex} of {totalPages} ({totalCount} total)
        </span>
        <div className="flex gap-1">
          <button 
            disabled={pageIndex === 1}
            onClick={() => setPageIndex(p => Math.max(p - 1, 1))}
            className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[14px] block">chevron_left</span>
          </button>
          <button 
            disabled={pageIndex === totalPages}
            onClick={() => setPageIndex(p => Math.min(p + 1, totalPages))}
            className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[14px] block">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
