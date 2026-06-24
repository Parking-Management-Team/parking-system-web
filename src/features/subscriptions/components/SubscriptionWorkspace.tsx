'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { MonthlySubscription, SubscriptionStatus } from '../types';
import { RegisterSubscriptionModal, UpdateCardModal } from './SubscriptionModals';

export default function SubscriptionWorkspace() {
  const {
    subscriptions,
    totalCount,
    totalPages,
    pageIndex,
    isLoading,
    error,
    buildings,
    cards,
    drivers,
    vehicles,
    priceConfigs,
    fetchSubscriptions,
    loadResources,
    registerSubscription,
    updateCard,
    activateSubscription,
    cancelSubscription,
    cleanupSubscriptions,
  } = useSubscriptions();

  // Search & Filters state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');
  const [licensePlateSearch, setLicensePlateSearch] = useState<string>('');
  const [cardCodeSearch, setCardCodeSearch] = useState<string>('');
  
  // Dialog / Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isUpdateCardOpen, setIsUpdateCardOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<MonthlySubscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailSub, setDetailSub] = useState<MonthlySubscription | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Query executor
  const loadData = useCallback(() => {
    fetchSubscriptions({
      page: currentPage,
      pageSize: 10,
      status: statusFilter !== 'ALL' ? (statusFilter as SubscriptionStatus) : undefined,
      buildingId: buildingFilter !== 'ALL' ? parseInt(buildingFilter) : undefined,
      licensePlate: licensePlateSearch.trim() || undefined,
      cardCode: cardCodeSearch.trim() || undefined,
    });
  }, [fetchSubscriptions, currentPage, statusFilter, buildingFilter, licensePlateSearch, cardCodeSearch]);

  // Initial load
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh trigger
  const handleRefresh = () => {
    loadData();
    loadResources();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setBuildingFilter('ALL');
    setLicensePlateSearch('');
    setCardCodeSearch('');
    setCurrentPage(1);
  };

  // Cleanup handler
  const handleCleanup = async () => {
    const minStr = prompt('Enter timeout minutes for cleanup (default is 10 minutes):', '10');
    if (minStr === null) return; // cancelled
    
    const minutes = parseInt(minStr);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid positive number for minutes.');
      return;
    }

    setIsCleaning(true);
    const success = await cleanupSubscriptions(minutes);
    setIsCleaning(false);
    if (success) {
      loadData();
    }
  };

  // Status Badge Mapper
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            PENDING
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
            EXPIRED
          </span>
        );
      case 'CANCELLED':
      case 'DOWNGRADED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Date Formatting helper
  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Drivers lookup
  const getDriverName = (accountId: number) => {
    const drv = drivers.find((d) => d.id === accountId);
    return drv ? drv.fullName || drv.username : `User ID: ${accountId}`;
  };

  // Vehicles lookup
  const getVehicleLicense = (vehicleId: number) => {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    return v ? v.licensePlate : `Vehicle ID: ${vehicleId}`;
  };

  const getBuildingName = (buildingId: number) => {
    const b = buildings.find((bl) => bl.id === buildingId);
    return b ? b.name : `Building ID: ${buildingId}`;
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff] p-6 lg:p-8">
      {/* ===== HEADER & PRIMARY ACTIONS ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111c2d]">Monthly Subscription Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Activate, register, update card passes, and view details of monthly customer subscriptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cleanup Trigger */}
          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-700 font-bold text-xs rounded-xl border border-slate-200 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
            {isCleaning ? 'Cleaning...' : 'Cleanup Expired Pending'}
          </button>

          {/* Register Trigger */}
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#006d43] text-white hover:bg-[#005c38] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#006d43]/10"
          >
            <span className="material-symbols-outlined text-[18px]">add_card</span>
            Register New Subscription
          </button>
        </div>
      </div>

      {/* ===== FILTERS CONTROL BOX ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-3 py-2 focus:border-[#006d43] focus:ring-0 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="DOWNGRADED">Downgraded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Building filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Building</span>
            <select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-3 py-2 focus:border-[#006d43] focus:ring-0 focus:outline-none"
            >
              <option value="ALL">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* License Plate Search */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License Plate</span>
            <input
              type="text"
              placeholder="e.g. 51G-12345"
              value={licensePlateSearch}
              onChange={(e) => {
                setLicensePlateSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-3 py-2 focus:border-[#006d43] focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Card Code Search */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Code</span>
            <input
              type="text"
              placeholder="e.g. MONTHLY001"
              value={cardCodeSearch}
              onChange={(e) => {
                setCardCodeSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-3 py-2 focus:border-[#006d43] focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Action button inside filter */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin" />
                Querying backend...
              </span>
            ) : (
              <span>Found {totalCount} subscription entries</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 text-slate-500 hover:text-[#006d43] hover:bg-slate-100 font-bold text-xs rounded-lg transition-all"
            >
              Reset Filters
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Sync List
            </button>
          </div>
        </div>
      </div>

      {/* ===== TABLE CONTAINER ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-grow flex flex-col justify-between">
        <div className="overflow-x-auto">
          {error && (
            <div className="m-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">ID</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver / Account</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Plate</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Card</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Slot</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (VND)</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valid Range</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400 font-medium italic text-sm">
                    No monthly subscription records found matching your filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors group"
                  >
                    <td className="p-4 font-bold text-slate-500 text-center text-xs">#{sub.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700 text-sm">{getDriverName(sub.accountId)}</div>
                      <span className="text-[10px] text-slate-400 font-bold">Building: {getBuildingName(sub.buildingId)}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
                        {getVehicleLicense(sub.vehicleId)}
                      </span>
                    </td>
                    <td className="p-4">
                      {sub.cardCode ? (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#006d43]">credit_card</span>
                          <span className="text-xs font-semibold text-slate-700">{sub.cardCode}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600 font-bold">
                      {sub.slotCode || <span className="text-slate-400 font-normal italic">Unallocated</span>}
                    </td>
                    <td className="p-4 font-extrabold text-xs text-slate-700">
                      {sub.monthlyPrice.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          From: {formatDate(sub.activatedAt)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          To: {formatDate(sub.expiredAt)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(sub.monthlySubscriptionStatus)}</td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Detail Trigger */}
                        <button
                          onClick={() => {
                            setDetailSub(sub);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 hover:border-[#006d43] hover:text-[#006d43] text-slate-450 transition-colors shadow-sm"
                          title="View subscription details"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>

                        {/* Activate trigger for Pending */}
                        {sub.monthlySubscriptionStatus === 'PENDING' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to ACTIVATE Subscription #${sub.id}? This will start billing validation and active dates.`)) {
                                const success = await activateSubscription(sub.id);
                                if (success) loadData();
                              }
                            }}
                            className="px-2.5 py-1.5 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                            title="Activate Subscription"
                          >
                            Activate
                          </button>
                        )}

                        {/* Update Card trigger for Active */}
                        {sub.monthlySubscriptionStatus === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setIsUpdateCardOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:text-emerald-700 text-slate-450 transition-colors shadow-sm"
                            title="Change assigned card pass"
                          >
                            <span className="material-symbols-outlined text-[16px]">credit_card_heart</span>
                          </button>
                        )}

                        {/* Cancel trigger for Pending & Active */}
                        {(sub.monthlySubscriptionStatus === 'PENDING' || sub.monthlySubscriptionStatus === 'ACTIVE') && (
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to CANCEL / REVOKE Subscription #${sub.id}?`)) {
                                const success = await cancelSubscription(sub.id);
                                if (success) loadData();
                              }
                            }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-450 transition-colors shadow-sm"
                            title="Cancel / Deallocate pass"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION BAR ===== */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
            <span className="text-xs font-semibold text-slate-400">
              Page {pageIndex} of {totalPages}
            </span>
            
            <div className="flex gap-1">
              <button
                disabled={pageIndex <= 1}
                onClick={() => setCurrentPage(pageIndex - 1)}
                className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                Prev
              </button>
              <button
                disabled={pageIndex >= totalPages}
                onClick={() => setCurrentPage(pageIndex + 1)}
                className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== POP-UP DETAIL MODAL ===== */}
      {isDetailOpen && detailSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d43]">assignment_ind</span>
                <h3 className="text-lg font-bold text-slate-800">Subscription Detail</h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Details Panel */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscription ID</span>
                  <p className="text-sm font-black text-slate-700 mt-0.5">SUB-{detailSub.id}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <p className="text-sm mt-0.5">{getStatusBadge(detailSub.monthlySubscriptionStatus)}</p>
                </div>
                
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver / Holder</span>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{getDriverName(detailSub.accountId)}</p>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Driver ID: #{detailSub.accountId}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Building Location</span>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{getBuildingName(detailSub.buildingId)}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</span>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{getVehicleLicense(detailSub.vehicleId)}</p>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Vehicle ID: #{detailSub.vehicleId}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Slot Code</span>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">
                    {detailSub.slotCode || 'Unallocated'}
                  </p>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Slot ID: {detailSub.assignedSlotId || 'N/A'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Card</span>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{detailSub.cardCode || 'Unassigned'}</p>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Card ID: {detailSub.assignedCardId || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Configuration</span>
                  <p className="text-sm font-black text-slate-700 mt-0.5">
                    {detailSub.monthlyPrice.toLocaleString('vi-VN')} VND/mo
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Created On</span>
                  <span className="font-semibold text-slate-600">{formatDate(detailSub.createdAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Activated On</span>
                  <span className="font-semibold text-slate-600">{formatDate(detailSub.activatedAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Expires On</span>
                  <span className="font-semibold text-[#ba1a1a]">{formatDate(detailSub.expiredAt)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REGISTRATION & UPDATE CARD MODALS ===== */}
      <RegisterSubscriptionModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRefresh}
        buildings={buildings}
        cards={cards}
        drivers={drivers}
        vehicles={vehicles}
        priceConfigs={priceConfigs}
        registerSubscription={registerSubscription}
      />

      <UpdateCardModal
        isOpen={isUpdateCardOpen}
        onClose={() => {
          setIsUpdateCardOpen(false);
          setSelectedSub(null);
        }}
        onSuccess={handleRefresh}
        subscription={selectedSub}
        cards={cards}
        updateCard={updateCard}
      />

      <div className="h-20"></div> {/* Bottom footer spacing */}
    </div>
  );
}
