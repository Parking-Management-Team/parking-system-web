import React from 'react';
import Link from 'next/link';

import { useVehicles } from '../hooks/useVehicles';
import VehicleLiveFeed from './VehicleLiveFeed';
import VehicleActivityLogs from './VehicleActivityLogs';
import VehicleModals from './VehicleModals';

/**
 * Màn hình làm việc chính (Workspace Layout) của phân hệ Chi tiết Phương tiện (Vehicle Details)
 */
export default function VehicleDetailsWorkspace() {
  const {
    loading,
    isParked,
    parkedSlot,
    showViolationModal,
    setShowViolationModal,
    showTicketModal,
    setShowTicketModal,
    violationReason,
    setViolationReason,
    violationNotes,
    setViolationNotes,
    toastMessage,
    secondsElapsed,
    vehicle,
    logs,
    formatDuration,
    handleReleaseSlot,
    submitViolation
  } = useVehicles();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-[#f9f9ff]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen relative bg-[#f9f9ff]">
      
      {/* ===== THÔNG BÁO TOAST NỔI ===== */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400">info</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== KHÔNG GIAN MAIN CANVAS ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1280px] mx-auto bg-slate-50/50">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-slate-500 font-medium mb-6 space-x-2">
          <Link href="/dashboard/manager/facilities" className="hover:text-emerald-500 transition-colors">
            Slot Management
          </Link>
          <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
          <span className="hover:text-emerald-500 transition-colors">{parkedSlot}</span>
          <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
          <span className="text-slate-800 font-semibold">Vehicle Details</span>
        </nav>

        {/* Tiêu đề xe & Các nút hành động chính */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vehicle {vehicle.licensePlate}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${isParked ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
              {isParked ? `Currently parked in ${parkedSlot}` : 'Has departed the facility'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowViolationModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all bg-white shadow-sm"
            >
              Mark Violation
            </button>
            
            <button
              onClick={handleReleaseSlot}
              disabled={!isParked}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm bg-white disabled:opacity-45 disabled:pointer-events-none"
            >
              Release Slot
            </button>

            <button
              onClick={() => setShowTicketModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Print Ticket
            </button>
          </div>
        </div>

        {/* Bố cục Bento Grid 2 hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CAMERA THEO DÕI LIVE FEED */}
          <VehicleLiveFeed />

          {/* CARD HỒ SƠ XE VÀ KHÁCH HÀNG */}
          <div className="rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col bg-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">fingerprint</span>
              Registration Profile
            </h3>

            <div className="space-y-6 flex-grow">
              
              {/* Biển số xe */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">License Plate</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">{vehicle.licensePlate}</span>
                  <span className="material-symbols-outlined text-emerald-500">verified</span>
                </div>
              </div>

              {/* Thông số xe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Vehicle Model</p>
                  <p className="text-xs font-bold text-slate-700">{vehicle.model}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{vehicle.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Colorway</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: vehicle.colorHex }}
                    ></span>
                    <p className="text-xs font-bold text-slate-700">{vehicle.color}</p>
                  </div>
                </div>
              </div>

              {/* Đường kẻ ngang */}
              <hr className="border-slate-100" />

              {/* Thông tin mốc thời gian */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Entry Timestamp</span>
                  </div>
                  <span className="font-bold text-slate-700">{vehicle.entryTime}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>Total Duration</span>
                  </div>
                  <span className="font-bold text-emerald-500 tabular-nums">
                    {isParked ? formatDuration(secondsElapsed) : 'Session Ended'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BẢNG NHẬT KÝ HOẠT ĐỘNG PHƯƠNG TIỆN */}
        <VehicleActivityLogs logs={logs} licensePlate={vehicle.licensePlate} />

      </main>

      {/* ===== CÁC POP-UP MODALS THỰC HIỆN TÁC VỤ ===== */}
      <VehicleModals
        showViolationModal={showViolationModal}
        setShowViolationModal={setShowViolationModal}
        violationReason={violationReason}
        setViolationReason={setViolationReason}
        violationNotes={violationNotes}
        setViolationNotes={setViolationNotes}
        submitViolation={submitViolation}
        showTicketModal={showTicketModal}
        setShowTicketModal={setShowTicketModal}
        vehicle={vehicle}
        parkedSlot={parkedSlot}
        secondsElapsed={secondsElapsed}
        formatDuration={formatDuration}
      />
    </div>
  );
}
