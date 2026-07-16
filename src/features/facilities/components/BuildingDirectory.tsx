'use client';

import React from 'react';
import Link from 'next/link';

import { useFacilities } from '../hooks/useFacilities';
import { BuildingStatus } from '@/lib/types/building.types';

/**
 * BuildingDirectory Component
 * Xây dựng giao diện Danh sách Tòa nhà (Step 1) chuẩn NexPark Stitch Theme
 */
export default function BuildingDirectory() {
  const {
    user,

    // Buildings & Pagination
    filteredBuildings,
    searchBldQuery,
    setSearchBldQuery,
    pageIndex,
    setPageIndex,
    totalPages,
    totalCount,
    
    // Floors (dùng để tính toán dung lượng)
    floors,
    buildings,

    // Delete handlers
    isDelBldOpen,
    setIsDelBldOpen,
    deletingBld,
    setDeletingBld,
    executeDeleteBld,

    // Toast
    showToast,
    toastMessage,
    toastType,
    isSaving
  } = useFacilities();

  // Quyền chỉnh sửa: Chỉ Manager hoặc Admin mới được phép thao tác thay đổi dữ liệu cơ sở vật chất
  const canEdit = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  // Base path based on role
  const basePath = user?.role === 'ADMIN' ? '/dashboard/admin/facilities' : '/dashboard/manager/facilities';

  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  const displayedBuildings = React.useMemo(() => {
    return filteredBuildings.filter(bld => {
      if (statusFilter === 'ALL') return true;
      return bld.status.toString() === statusFilter;
    });
  }, [filteredBuildings, statusFilter]);

  // Tính toán số liệu thống kê (Summary stats)
  const totalCapacity = floors.reduce((acc, f) => acc + f.totalSlots, 0);
  const activeMaintenanceCount = buildings.filter(
    b => b.status === BuildingStatus.OutOfService
  ).length;


  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      {/* ===== TOAST THÔNG BÁO CHUNG ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
            toastType === 'success' ? 'bg-[#006d43] text-white shadow-[#006d43]/20' : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== MAIN CONTENT CANVAS ===== */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
          
          {/* Page Title & CTA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#111c2d]">Managed Buildings</h2>
              <p className="text-sm text-slate-500 mt-1">Configure and monitor facility structures and zoning.</p>
            </div>
            {canEdit && (
              <Link 
                href={`${basePath}/new`}
                className="bg-[#006d43] hover:bg-[#006d43]/90 text-white font-semibold text-sm py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                Add New Building
              </Link>
            )}
          </div>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Buildings */}
            <div className="bg-white border border-[#d8e3fb] p-6 rounded-xl flex flex-col gap-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Buildings</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[#111c2d]">{totalCount}</span>
                <span className="text-[#006d43] text-xs font-bold mb-1.5 flex items-center">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +1
                </span>
              </div>
            </div>

            {/* Card 2: Total Capacity */}
            <div className="bg-white border border-[#d8e3fb] p-6 rounded-xl flex flex-col gap-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Capacity</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[#111c2d]">{totalCapacity.toLocaleString()}</span>
                <span className="text-slate-400 text-xs font-medium mb-1.5">Slots</span>
              </div>
            </div>

            {/* Card 3: Active Maintenance */}
            <div className="bg-white border border-[#d8e3fb] p-6 rounded-xl flex flex-col gap-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Maintenance</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-600">{activeMaintenanceCount}</span>
                <span className="text-slate-400 text-xs font-medium mb-1.5">Issues</span>
              </div>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="bg-white border border-[#d8e3fb] rounded-xl overflow-hidden flex flex-col shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
            {/* Table Utilities Bar */}
            <div className="px-6 py-4 border-b border-[#d8e3fb] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input 
                  type="text"
                  placeholder="Quick search..."
                  value={searchBldQuery}
                  onChange={(e) => setSearchBldQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 bg-white border border-[#bccabe] rounded-lg text-sm text-[#111c2d] placeholder:text-slate-400 focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-44">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#bccabe] rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#006d43] appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="0">Available</option>
                    <option value="1">Occupied</option>
                    <option value="2">Reserved</option>
                    <option value="3">Out of Service</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">filter_list</span>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">arrow_drop_down</span>
                </div>
              </div>
            </div>

            {/* Actual Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-[#d8e3fb]">
                    <th className="px-6 py-3.5 w-[15%]">Code</th>
                    <th className="px-6 py-3.5 w-[25%]">Name</th>
                    <th className="px-6 py-3.5 w-[30%]">Address</th>
                    <th className="px-6 py-3.5 text-right w-[10%]">Floors</th>
                    <th className="px-6 py-3.5 w-[10%]">Status</th>
                    <th className="px-6 py-3.5 text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e3fb] text-slate-700 text-sm">
                  {displayedBuildings.length > 0 ? (
                    displayedBuildings.map(bld => (
                      <tr 
                        key={bld.id}
                        className="hover:bg-slate-50/40 transition-colors group"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">{bld.code}</td>
                        <td className="px-6 py-4 font-semibold text-[#111c2d]">{bld.name}</td>
                        <td className="px-6 py-4 text-slate-500 truncate max-w-[280px]">
                          {bld.address || 'No address registered'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold font-mono text-slate-600">{bld.totalFloor}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            bld.status === BuildingStatus.Available ? 'bg-emerald-50 text-[#006d43] border-emerald-200/50' :
                            bld.status === BuildingStatus.Occupied ? 'bg-slate-900 text-white border-slate-900' :
                            bld.status === BuildingStatus.Reserved ? 'bg-blue-50 text-blue-800 border-blue-200/50' :
                            'bg-red-50 text-red-700 border-red-200/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              bld.status === BuildingStatus.Available ? 'bg-[#006d43]' :
                              bld.status === BuildingStatus.Occupied ? 'bg-white/70' :
                              bld.status === BuildingStatus.Reserved ? 'bg-blue-600' :
                              'bg-red-600'
                            }`} />
                            {bld.status === BuildingStatus.Available ? 'Available' :
                             bld.status === BuildingStatus.Occupied ? 'Occupied' :
                             bld.status === BuildingStatus.Reserved ? 'Reserved' :
                             'Out of Service'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <>
                                <Link 
                                  href={`${basePath}/${bld.id}`}
                                  className="p-1.5 text-slate-400 hover:text-[#006d43] hover:bg-slate-100 rounded transition-all"
                                  title="Edit"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </Link>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeletingBld(bld);
                                    setIsDelBldOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">
                        No buildings found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Utilities */}
            <div className="px-6 py-4 border-t border-[#d8e3fb] flex justify-between items-center text-slate-500 bg-slate-50/50">
              <span className="text-xs">
                Showing {displayedBuildings.length > 0 ? (pageIndex - 1) * 10 + 1 : 0} to{' '}
                {Math.min(pageIndex * 10, totalCount)} of {totalCount} entries
              </span>
              <div className="flex gap-1">
                <button 
                  disabled={pageIndex === 1}
                  onClick={() => setPageIndex(p => Math.max(p - 1, 1))}
                  className="px-3 py-1 border border-[#bccabe] rounded-md bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPageIndex(idx + 1)}
                    className={`px-3 py-1 border rounded-md text-xs font-semibold transition-colors ${
                      pageIndex === idx + 1
                        ? 'border-[#006d43] bg-[#006d43] text-white'
                        : 'border-[#bccabe] bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  disabled={pageIndex === totalPages}
                  onClick={() => setPageIndex(p => Math.min(p + 1, totalPages))}
                  className="px-3 py-1 border border-[#bccabe] rounded-md bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== DELETE BUILDING CONFIRMATION MODAL ===== */}
      {isDelBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="text-lg font-bold">Delete Building</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-[#111c2d]">{deletingBld?.name} ({deletingBld?.code})</span>?
              <br /><br />
              All floors and zones registered to this facility will also be cascade-deleted. This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelBldOpen(false);
                  setDeletingBld(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteBld}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
