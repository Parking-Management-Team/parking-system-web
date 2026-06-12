import React from 'react';

import { usePricing } from '../hooks/usePricing';
import PricingModals from './PricingModals';

export default function PricingWorkspace() {
  const pricing = usePricing();
  const {
    activeTab,
    setActiveTab,
    tariffs,
    memberships,
    fees,
    showToast,
    toastMessage,
    toastType,
    triggerToast,
    handleOpenEditTariff,
    handleToggleTariffStatus,
    handleDeleteTariff,
    handleOpenEditMembership,
    handleOpenAddFee,
    handleOpenEditFee,
    handleDeleteFee
  } = pricing;

  // Handler for primary button based on active tab
  const handlePrimaryAction = () => {
    if (activeTab === 'standard') {
      triggerToast('Standard policy creation is locked in this version.', 'error');
    } else if (activeTab === 'memberships') {
      triggerToast('Monthly membership templates are locked in this version.', 'error');
    } else {
      handleOpenAddFee();
    }
  };

  const getPrimaryButtonLabel = () => {
    switch (activeTab) {
      case 'standard':
        return 'Create New Policy';
      case 'memberships':
        return 'Add Subscription';
      case 'fees':
        return 'Add Fee/Penalty';
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      
      {/* ===== GLOBAL TOAST NOTIFICATION ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
            toastType === 'success' ? 'bg-[#006d43] text-white' : 'bg-red-600 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
          
          {/* Header Title & Action Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111c2d]">Pricing Management</h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure baseline tariffs, monthly pass subscriptions, and service fee penalties for NexPark facility.
              </p>
            </div>
            <button 
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006d43] text-white hover:bg-[#005c38] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#006d43]/10"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {getPrimaryButtonLabel()}
            </button>
          </div>

          {/* Tab Navigation Menu */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 -mb-px">
              <button
                onClick={() => setActiveTab('standard')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === 'standard'
                    ? 'border-[#006d43] text-[#006d43]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                Standard Tariffs
              </button>
              <button
                onClick={() => setActiveTab('memberships')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === 'memberships'
                    ? 'border-[#006d43] text-[#006d43]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                Monthly Memberships
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === 'fees'
                    ? 'border-[#006d43] text-[#006d43]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                Service Fees & Penalties
              </button>
            </nav>
          </div>

          {/* Tab Content Canvas */}
          <div className="mt-2">

            {/* TAB 1: STANDARD TARIFFS */}
            {activeTab === 'standard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#111c2d]">Active Tariff Policies</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006d43] animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Live Configuration</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Vehicle Type</th>
                          <th className="px-6 py-4">Time Slot</th>
                          <th className="px-6 py-4">Base Rate</th>
                          <th className="px-6 py-4">Incremental</th>
                          <th className="px-6 py-4">Daily Cap</th>
                          <th className="px-6 py-4">Grace Period</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                        {tariffs.map((tariff) => (
                          <tr key={tariff.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                              <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                {tariff.vehicleType.includes('Motorbike') ? 'two_wheeler' : 'directions_car'}
                              </span>
                              {tariff.vehicleType}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-medium">{tariff.timeSlot}</td>
                            <td className="px-6 py-4">{tariff.baseRate}</td>
                            <td className="px-6 py-4">{tariff.incrementalRate}</td>
                            <td className="px-6 py-4 text-emerald-600 font-bold">{tariff.dailyCap}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-medium">{tariff.gracePeriod}</td>
                            <td className="px-6 py-4 text-center">
                              <span 
                                onClick={() => handleToggleTariffStatus(tariff.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none transition-all ${
                                  tariff.isActive 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${tariff.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                {tariff.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-1">
                                <button 
                                  onClick={() => handleOpenEditTariff(tariff)}
                                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#006d43]"
                                  title="Edit Policy"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(tariff.id)}
                                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
                                  title="Delete Policy"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MONTHLY MEMBERSHIPS */}
            {activeTab === 'memberships' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {memberships.map((membership) => (
                    <div 
                      key={membership.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-6 relative group hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#006d43]">
                          <span className="material-symbols-outlined text-[28px]">
                            {membership.vehicleType.includes('Motorbike') ? 'two_wheeler' : 'directions_car'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleOpenEditMembership(membership)}
                          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#006d43] transition-colors"
                          title="Edit subscription rate"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>

                      <div className="mt-6">
                        <h5 className="text-slate-800 text-base font-bold">{membership.vehicleType} Passes</h5>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-black text-slate-800 tracking-tight">
                            {membership.priceNum.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">VNĐ / month</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Information Callout */}
                <div className="bg-[#F4FBF3] border border-emerald-500/10 p-5 rounded-2xl flex items-start gap-4 shadow-inner">
                  <span className="material-symbols-outlined text-[#006d43] text-[20px] mt-0.5">info</span>
                  <div>
                    <h6 className="text-sm font-bold text-slate-800">Downgrade Rule Policy</h6>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Upon subscription expiry, accounts are automatically downgraded to standard parking rate schemas unless auto-renewal is enabled and successfully processed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SERVICE FEES & PENALTIES */}
            {activeTab === 'fees' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-[#111c2d]">Service Fees & Penalty Conditions</h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {fees.map((fee) => {
                    const isPenalty = fee.type === 'lostcard' || fee.type === 'wrongzone' || fee.type === 'noshow';
                    return (
                      <div 
                        key={fee.id} 
                        className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm ${
                          isPenalty 
                            ? 'bg-[#FFF8F6] border-red-200/60' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isPenalty 
                              ? 'bg-red-50 text-red-600' 
                              : 'bg-emerald-50 text-[#006d43]'
                          }`}>
                            <span className="material-symbols-outlined text-[24px]">
                              {fee.type === 'deposit' && 'book_online'}
                              {fee.type === 'noshow' && 'history_toggle_off'}
                              {fee.type === 'lostcard' && 'credit_card_off'}
                              {fee.type === 'wrongzone' && 'warning'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-800">{fee.name}</h5>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                fee.isActive 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {fee.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1">{fee.description}</p>
                            {fee.triggerType === 'time' && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">alarm</span>
                                Time Trigger: {fee.triggerVal} mins
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-none pt-3 md:pt-0">
                          <div className={`text-lg font-black tracking-tight ${isPenalty ? 'text-red-600' : 'text-slate-800'}`}>
                            {fee.amount}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEditFee(fee)}
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#006d43]"
                              title="Edit fee policy"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteFee(fee.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500"
                              title="Delete fee policy"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* ===== POP-UP FORM MODALS ===== */}
      <PricingModals pricing={pricing} />
      
      <div className="h-20"></div> {/* Bottom footer spacing */}
    </div>
  );
}
