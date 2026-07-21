/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: SlotManagementDashboard.tsx (MÀN HÌNH SƠ ĐỒ BÃI ĐỖ XE & GIÁM SÁT TRỰC TUYẾN)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Màn hình trung tâm quản lý sơ đồ vị trí đỗ xe theo thời gian thực (Real-time Parking Map Dashboard):
 * 1. 🏢 Bộ lọc hạ tầng: Chọn Tòa nhà -> Chọn Tầng trực quan.
 * 2. 🗺️ Chế độ Sơ đồ trực quan (Visual Layout Map): Tr trình bày các ô đỗ Ô tô (Standard / EV Charging) 
 *    theo từng khu vực (Zone) đi kèm trạng thái màu tương ứng (Trống, Đang đỗ, Khoá, Bảo trì, Đặt trước).
 * 3. 🏍️ Giám sát sức chứa Xe máy (Motorbike Capacity Monitoring): Bảng tổng hợp công suất sử dụng khu xe máy.
 * 4. 📋 Danh sách phiên đỗ (Session Allocations List): Tra cứu chi tiết thẻ đỗ, biển số xe, thời gian Check-in.
 * 5. 🛡️ Bảo mật & Phân quyền (Policy Enforcer): Hỗ trợ đa vai trò (ADMIN, MANAGER, STAFF):
 *    - Quản lý / Quản trị viên: Có đầy đủ quyền thay đổi trạng thái slot và Cưỡng chế giải phóng phiên (Force Release).
 *    - Nhân viên (Staff): Chỉ xem sơ đồ & tra cứu phiên đỗ xe.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { Slot } from '../types';
import { useParkingMap } from '../hooks/useParkingMap';
import { SlotActionModal } from './SlotActionModal';

export function SlotManagementDashboard() {
  const { user } = useAuth();
  
  // 🛡️ BẢO MẬT & PHÂN QUYỀN (Policy Enforcer):
  const userRole = user?.role?.toUpperCase();
  const canManageSlot = userRole === 'MANAGER' || userRole === 'ADMIN';

  // Điều hướng nút quay lại theo vai trò tài khoản
  const backLink = userRole === 'STAFF' 
    ? '/dashboard/staff' 
    : userRole === 'ADMIN' 
      ? '/dashboard/admin' 
      : '/dashboard/manager/facilities';

  // Trích xuất toàn bộ state và hàm xử lý từ custom hook useParkingMap
  const {
    buildings,
    zones,
    slots,
    activeSessions,
    selectedBuildingId,
    selectedFloorId,
    activeTab,
    setActiveTab,
    loading,
    lastUpdated,
    toast,
    tableSearchQuery,
    setTableSearchQuery,
    tableTypeFilter,
    setTableTypeFilter,
    selectedSlot,
    isModalOpen,
    handleSlotClick,
    handleCloseModal,
    handleSlotUpdated,
    selectedSessionDetails,
    setSelectedSessionDetails,
    completingSessionId,
    handleForceCompleteSession,
    refreshSlotsAndSessions,
    handleBuildingChange,
    handleFloorChange,
    floorSlotSummary,
    activeFloors,
    activeCarZones,
    activeMotorbikeZones,
    effectiveMotorTotal,
    effectiveMotorOccupied,
    effectiveMotorAvailable,
    filteredSessions,
    showToastMessage,
  } = useParkingMap();

  // Ánh xạ lớp màu nền và viền cho từng trạng thái Ô đỗ xe
  const getSlotColorClass = (status: Slot['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-[#006d43] border-[#006d43] text-white hover:brightness-110';
      case 'OCCUPIED':
        return 'bg-[#263143] border-[#263143] text-white hover:brightness-110';
      case 'BLOCKED':
        return 'bg-[#ba1a1a] border-[#ba1a1a] text-white hover:brightness-110';
      case 'MAINTENANCE':
        return 'bg-[#d97706] border-[#d97706] text-white hover:brightness-110';
      case 'RESERVED':
        return 'bg-amber-400 border-amber-400 text-white hover:brightness-110';
      default:
        return 'bg-slate-300 border-slate-300 text-slate-700';
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative bg-slate-50/50">

      {/* ===== THÔNG BÁO POPUP (TOAST NOTIFICATION) ===== */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3.5 text-white px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 transform scale-100 border border-white/10 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' ? 'bg-[#ba1a1a] shadow-red-600/30' : 'bg-[#006d43] shadow-[#006d43]/30'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="text-base font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* ===== HEADER & BỘ LỌC HẠ TẦNG (BUILDING / FLOOR) ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={backLink}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Back to Dashboard"
              >
                ←
              </Link>
              <h1 className="text-2xl font-bold text-slate-855 tracking-tight">Slot Management Map</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1 ml-8">Monitor capacity, allocation, and real-time status of car and motorbike parking slots.</p>
          </div>

          {/* Thanh chọn Tòa nhà -> Tầng */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm ml-8 md:ml-0">
            <div className="flex flex-col min-w-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Building</span>
              <select
                value={selectedBuildingId || ''}
                onChange={handleBuildingChange}
                className="bg-transparent border-0 py-0.5 pl-1 pr-6 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none"
              >
                {buildings.map(bld => (
                  <option key={bld.id} value={bld.id}>{bld.name}</option>
                ))}
              </select>
            </div>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Floor</span>
              <select
                value={selectedFloorId || ''}
                onChange={handleFloorChange}
                disabled={activeFloors.length === 0}
                className="bg-transparent border-0 py-0.5 pl-1 pr-6 font-semibold text-sm text-slate-700 focus:ring-0 focus:outline-none disabled:opacity-50"
              >
                {activeFloors.map(fl => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ===== THANH CHUYỂN TAB CÔNG VIỆC ===== */}
        <div className="mb-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('map')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'map'
                  ? 'text-[#006d43] border-[#006d43]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Visual Layout Map
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'list'
                  ? 'text-[#006d43] border-[#006d43]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              Active Sessions ({activeSessions.filter(s => zones.find(z => z.id === s.zoneId)?.floorId === selectedFloorId).length})
            </button>
          </div>

          <div className="flex items-center gap-3 pb-3">
            {loading && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <div className="w-3.5 h-3.5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
                Syncing...
              </div>
            )}
            {lastUpdated && !loading && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006d43] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006d43]"></span>
                </span>
                LIVE · Updated {lastUpdated.toLocaleTimeString('en-US')}
              </div>
            )}
            <button
              onClick={refreshSlotsAndSessions}
              title="Refresh Now"
              className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-[#006d43] hover:bg-emerald-50 transition-colors text-xs font-bold"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ===== THANH TỔNG QUAN CÔNG SUẤT THEO TẦNG ===== */}
        {selectedFloorId && floorSlotSummary && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorSlotSummary.vehicleTypeSummaries
              .filter(vt => {
                const name = (vt.vehicleTypeName || '').toUpperCase();
                return name.includes('MOTOR') || name.includes('BIKE') || name.includes('STANDARD') || name.includes('CAR');
              })
              .map((vehicleType) => {
                const { vehicleTypeName, totalSlots, statusCounts } = vehicleType;
                const occupied = statusCounts?.Occupied ?? 0;
                const blocked = statusCounts?.Blocked ?? 0;
                const maintenance = statusCounts?.Maintenance ?? 0;
                const available = statusCounts?.Available ?? 0;
                const isMotorbike = vehicleTypeName?.toUpperCase().includes('MOTOR') || vehicleTypeName?.toUpperCase().includes('BIKE');

                let effectiveOccupied = occupied;
                let effectiveAvailable = available;
                let effectiveTotal = totalSlots ?? 0;
                if (isMotorbike) {
                  effectiveOccupied = effectiveMotorOccupied;
                  effectiveAvailable = effectiveMotorAvailable;
                  effectiveTotal = effectiveMotorTotal;
                }

                // Tìm Zone của phương tiện này để tính tỷ lệ giới hạn đặt chỗ (Booking Limit Rate)
                const zoneForType = zones.find(z => {
                  if (z.floorId !== selectedFloorId) return false;
                  if (isMotorbike) return z.vehicleType === 'Motorbike';
                  return z.vehicleType !== 'Motorbike';
                });
                const bookingLimitRate = zoneForType?.bookingLimitRate ?? 80;

                // Tính toán công suất đặt chỗ trước khả dụng
                const maxBookable = Math.floor(Math.max(0, effectiveTotal - blocked - maintenance) * bookingLimitRate / 100);
                const reservedCount = activeSessions.filter(s => {
                  const zone = zones.find(z => z.id === s.zoneId);
                  if (!zone || zone.floorId !== selectedFloorId) return false;
                  if (isMotorbike) return zone.vehicleType === 'Motorbike';
                  return zone.vehicleType !== 'Motorbike';
                }).length;
                const remainingBookable = Math.max(0, maxBookable - reservedCount);

                const effectiveOccupiedPct = effectiveTotal > 0 ? Math.round((effectiveOccupied / effectiveTotal) * 100) : 0;
                const effectiveAvailablePct = effectiveTotal > 0 ? Math.round((effectiveAvailable / effectiveTotal) * 100) : 0;
                const blockedPct = effectiveTotal > 0 ? Math.round((blocked / effectiveTotal) * 100) : 0;
                const maintenancePct = effectiveTotal > 0 ? Math.round((maintenance / effectiveTotal) * 100) : 0;

                return (
                  <div key={vehicleType.vehicleTypeId} className="bg-white border-2 border-slate-200 shadow-md rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                          {isMotorbike ? 'Motorbike' : 'Car'} · Floor {floorSlotSummary.floorNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        Booking Limit: {bookingLimitRate}%
                      </span>
                    </div>
                    
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#006d43]">{effectiveAvailable}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Available</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#263143]">{effectiveOccupied}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Occupied</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#ba1a1a]">{blocked}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Blocked</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-[#d97706]">{maintenance}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Maintenance</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100"></div>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-black text-slate-600">{effectiveTotal}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total</p>
                      </div>
                    </div>

                    {/* Khung giám sát ngưỡng Đặt chỗ tương lai (Booking Capacity) */}
                    {(() => {
                      const usedBookable = Math.min(reservedCount, maxBookable);
                      const bookingUsagePct = maxBookable > 0 ? Math.round((usedBookable / maxBookable) * 100) : 0;
                      const isCritical = bookingUsagePct >= 90;
                      const isWarning = bookingUsagePct >= 70 && bookingUsagePct < 90;
                      const barColor = isCritical ? '#ba1a1a' : isWarning ? '#d97706' : '#006d43';
                      
                      const statusColor = isCritical 
                        ? { text: 'text-red-600', bg: 'bg-red-50 border-red-200/50', icon: 'warning' }
                        : isWarning 
                          ? { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200/50', icon: 'info' }
                          : { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200/50', icon: 'check_circle' };

                      return (
                        <div className="border border-slate-100 bg-slate-50/55 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`material-symbols-outlined text-base ${statusColor.text}`}>{statusColor.icon}</span>
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Reservation Capacity</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${statusColor.bg} ${statusColor.text}`}>
                              {bookingUsagePct}% Used
                            </span>
                          </div>
                          
                          <div className="flex items-baseline justify-between">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Bookable Remaining
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-slate-800">{remainingBookable}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">/ {maxBookable} slots</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${bookingUsagePct}%`, backgroundColor: barColor }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>Limit: {bookingLimitRate}% of total floor capacity</span>
                            <span className="text-slate-500 font-extrabold">{usedBookable} reserved</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Thanh tiến trình tỷ lệ lấp đầy */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-wider">Occupancy Rate</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#006d43]">{effectiveAvailablePct}% free</span>
                          <span className="text-[#263143]">{effectiveOccupiedPct}% filled</span>
                          {blocked > 0 && <span className="text-[#ba1a1a]">{blockedPct}% blocked</span>}
                          {maintenance > 0 && <span className="text-[#d97706]">{maintenancePct}% main.</span>}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#006d43] transition-all duration-700" style={{ width: `${effectiveAvailablePct}%` }} />
                        <div className="h-full bg-[#263143] transition-all duration-700" style={{ width: `${effectiveOccupiedPct}%` }} />
                        <div className="h-full bg-[#ba1a1a] transition-all duration-700" style={{ width: `${blockedPct}%` }} />
                        <div className="h-full bg-[#d97706] transition-all duration-700" style={{ width: `${maintenancePct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== TAB CONTENT 1: SƠ ĐỒ TRỰC QUAN (VISUAL LAYOUT MAP) ===== */}
        {activeTab === 'map' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Chú thích màu sắc (Legend) */}
            <div className="flex flex-wrap items-center gap-6 bg-white px-6 py-3.5 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-2">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#006d43]"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#263143]"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#ba1a1a]"></div>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-[#d97706]"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-amber-400"></div>
                <span>Reserved</span>
              </div>
            </div>

            {/* Lưới các Ô đỗ Xe Ô tô theo từng Khu vực (Car Zones) */}
            {activeCarZones.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <h3 className="text-sm font-bold text-slate-600">No Car Zones Configured</h3>
                <p className="text-xs text-slate-400 mt-1">Please set up zones and parking slots in the Facilities Management section first.</p>
              </div>
            ) : (
              activeCarZones.map(zone => {
                const zoneSlots = slots.filter(s => s.zoneId === zone.id);
                const availableCount = zoneSlots.filter(s => s.status === 'AVAILABLE').length;

                return (
                  <div key={zone.id} className="bg-[#fcfdfc] p-6 rounded-2xl border border-emerald-500/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800">
                          {zone.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-[#006d43] border border-emerald-500/10">
                            Car Zone
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        {availableCount} / {zoneSlots.length} Available
                      </span>
                    </div>

                    {zoneSlots.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold italic text-center py-6 col-span-full">No slots created in this zone yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3.5">
                        {zoneSlots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            title={slot.status === 'RESERVED' ? 'Reserved in advance' : undefined}
                            className={`h-24 border rounded-xl flex flex-col items-center justify-center py-3 px-3.5 shadow-sm transition-all hover:scale-[1.03] active:scale-95 group font-bold text-sm ${getSlotColorClass(
                              slot.status
                            )}`}
                          >
                            <span className="truncate w-full text-center px-1">{slot.slotCode}</span>
                            {slot.status === 'OCCUPIED' && slot.assignedVehicle && (
                              <span className="block text-[9px] font-extrabold mt-1 opacity-90 truncate leading-tight">
                                {slot.assignedVehicle.plate}
                              </span>
                            )}
                            {slot.status === 'RESERVED' && (
                              <span className="block text-[8px] font-extrabold mt-1 opacity-80 uppercase">
                                Reserved
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Bảng Giám sát Công suất Khu vực Xe máy */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Motorbike Area Capacity Monitoring</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time occupancy rate of motorbike zones</p>
                </div>
              </div>

              {activeMotorbikeZones.length === 0 ? (
                floorSlotSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1">
                      <h4 className="text-sm font-extrabold text-slate-700">General Motorbike Area</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">No individual motorbike zones configured, showing floor summary.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                      <div className="bg-emerald-50/40 border border-emerald-500/10 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider mb-1">Available</span>
                        <span className="text-2xl font-black text-[#006d43]">{effectiveMotorAvailable}</span>
                      </div>
                      
                      <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-1">Occupied</span>
                        <span className="text-2xl font-black text-[#263143]">{effectiveMotorOccupied}</span>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-1">Total Capacity</span>
                        <span className="text-2xl font-black text-slate-600">{effectiveMotorTotal}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No motorbike capacity data available.
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-extrabold">Zone Name</th>
                        <th className="pb-3 font-extrabold text-center">Available</th>
                        <th className="pb-3 font-extrabold text-center">Occupied</th>
                        <th className="pb-3 font-extrabold text-center">Total Capacity</th>
                        <th className="pb-3 font-extrabold text-right w-1/3">Occupancy Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeMotorbikeZones.map((zone) => {
                        const zoneSlots = slots.filter(s => s.zoneId === zone.id);
                        const capacity = zone.slotCapacity || zoneSlots.length || 0;
                        const occupiedSlotsCount = zoneSlots.filter(s => s.status === 'OCCUPIED').length;
                        const activeSessionsCount = activeSessions.filter(s => s.zoneId === zone.id).length;
                        const occupied = Math.max(occupiedSlotsCount, activeSessionsCount);
                        const available = Math.max(0, capacity - occupied);
                        const percentage = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                        
                        let progressColorClass = 'bg-[#00a86b]';
                        if (percentage >= 90) {
                          progressColorClass = 'bg-[#ba1a1a]';
                        } else if (percentage >= 75) {
                          progressColorClass = 'bg-[#d97706]';
                        }

                        return (
                          <tr key={zone.id} className="text-sm font-semibold text-slate-700">
                            <td className="py-3.5 font-extrabold text-slate-800">
                              {zone.name}
                            </td>
                            <td className="py-3.5 text-center font-black text-[#006d43]">{available}</td>
                            <td className="py-3.5 text-center font-black text-[#263143]">{occupied}</td>
                            <td className="py-3.5 text-center font-bold text-slate-500">{capacity}</td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-xs font-extrabold text-slate-600">{percentage}%</span>
                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${progressColorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB CONTENT 2: DANH SÁCH PHIÊN ĐANG ĐỖ (SESSION ALLOCATIONS) ===== */}
        {activeTab === 'list' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Thanh tìm kiếm & lọc dữ liệu bảng */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-72">
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Search by Slot code, License plate, or Booking ID..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <select
                  value={tableTypeFilter}
                  onChange={(e) => setTableTypeFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none"
                >
                  <option value="All">All Vehicle Types</option>
                  <option value="Standard">Standard Car</option>
                  <option value="EV Charging">EV Charging Car</option>
                  <option value="Motorbike">Motorbike</option>
                </select>
              </div>
            </div>

            {/* Bảng danh sách phiên đỗ xe */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Slot / Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">License Plate</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Card ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Allocation Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check-in Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                          No active parking sessions found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map(session => {
                        const zone = zones.find(z => z.id === session.zoneId);
                        const slot = slots.find(s => s.id === session.slotId);
                        return (
                          <tr key={session.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4 font-extrabold text-slate-800">
                              {slot ? (
                                <span>{slot.slotCode}</span>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold italic">
                                  General Motorbike Area
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">{zone?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4 font-mono text-sm font-bold text-[#006d43]">
                              <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-50/50 rounded-lg">
                                {session.licensePlateIn}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-600 font-mono">#{session.cardId}</td>
                            <td className="px-6 py-4">
                              {session.bookingId ? (
                                <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                  Reserved (#{session.bookingId})
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                  Walk-in Customer
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                              {new Date(session.checkInTime).toLocaleString('en-US')}
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => setSelectedSessionDetails(session)}
                                className="text-[#006d43] font-bold text-xs hover:underline"
                              >
                                Details
                              </button>
                              {/* Cưỡng chế giải phóng phiên (Manager & Admin) */}
                              {canManageSlot && (
                                <button
                                  onClick={() => handleForceCompleteSession(session.id)}
                                  disabled={completingSessionId === session.id}
                                  className="text-[#ba1a1a] font-bold text-xs hover:underline disabled:opacity-50"
                                >
                                  {completingSessionId === session.id ? 'Releasing...' : 'Force Release'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== HỘP THOẠI MODAL LÀM VIỆC VỚI SLOT (SLOT ACTION MODAL) ===== */}
      <SlotActionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        slot={selectedSlot}
        selectedBuildingId={selectedBuildingId}
        userRole={userRole}
        onSlotUpdated={handleSlotUpdated}
        showToastMessage={showToastMessage}
      />

      {/* ===== HỘP THOẠI MODAL XEM CHI TIẾT PHIÊN ĐỖ XE ===== */}
      {selectedSessionDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Parking Session Details</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Session ID: #{selectedSessionDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-6 space-y-6">
              {/* Hiển thị biển số xe dạng khung định dạng */}
              <div className="flex flex-col items-center py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="border-[2px] border-slate-800 rounded-lg bg-white px-6 py-2.5 shadow-sm text-center min-w-[200px]">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-0.5 block mb-1">
                    NexPark Parking Session
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-800 tracking-wide">
                    {selectedSessionDetails.licensePlateIn}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                  Recorded Vehicle License Plate
                </span>
              </div>

              {/* Chi tiết theo lưới Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {zones.find(z => z.id === selectedSessionDetails.zoneId)?.name || 'Unassigned'}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slot Code</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {slots.find(s => s.id === selectedSessionDetails.slotId)?.slotCode || 'General Motorbike Area'}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFID Card ID</p>
                  <p className="font-extrabold font-mono text-emerald-600 mt-1">
                    #{selectedSessionDetails.cardId}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Type</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {selectedSessionDetails.bookingId ? 'Reserved Customer' : 'Walk-in Customer'}
                  </p>
                </div>

                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Time</p>
                  <p className="font-extrabold text-slate-700 mt-1">
                    {new Date(selectedSessionDetails.checkInTime).toLocaleString('en-US')}
                  </p>
                </div>

                {selectedSessionDetails.bookingId && (
                  <div className="col-span-2 bg-emerald-50/20 p-3 rounded-xl border border-emerald-500/10">
                    <p className="text-[10px] font-bold text-[#006d43] uppercase tracking-wider">Reference Booking ID</p>
                    <p className="font-extrabold text-[#006d43] mt-1">
                      Booking ID #{selectedSessionDetails.bookingId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Nút hành động Footer Modal */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors shadow-sm"
              >
                Close
              </button>
              {/* Giải phóng khẩn cấp phiên đỗ xe (Manager & Admin) */}
              {canManageSlot && (
                <button
                  onClick={() => handleForceCompleteSession(selectedSessionDetails.id)}
                  disabled={completingSessionId === selectedSessionDetails.id}
                  className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
                >
                  {completingSessionId === selectedSessionDetails.id ? 'Releasing...' : 'Force Release'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
