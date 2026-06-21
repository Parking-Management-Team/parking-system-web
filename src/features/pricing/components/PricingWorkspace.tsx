import React from 'react';

import { usePricing } from '../hooks/usePricing';
import PricingModals from './PricingModals';
import { validate24hCoverage, validateNoOverlap, computeTimelineSegments, isNightSlot } from '../utils/pricingValidation';


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
    handleOpenEditMembership,
    handleOpenAddFee,
    handleOpenEditFee,
    handleDeleteFee,
    handleOpenCreatePolicy,
    handleOpenActivateDialog,
    handleOpenAddWindow,
    handleDeleteTariff,
    vehicleTypes
  } = pricing;

  // Handler for primary button based on active tab
  const handlePrimaryAction = () => {
    if (activeTab === 'standard') {
      handleOpenCreatePolicy();
    } else if (activeTab === 'memberships') {
      triggerToast('Monthly membership plans are automatically synchronized from the central system.', 'error');
    } else {
      handleOpenAddFee();
    }
  };

  const getPrimaryButtonLabel = () => {
    switch (activeTab) {
      case 'standard':
        return 'Create New Pricing Policy';
      case 'memberships':
        return 'Add Monthly Membership';
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

            {/* TAB 1: STANDARD TARIFFS (POLICY CARD VIEW) */}
            {activeTab === 'standard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-[#111c2d]">Standard Pricing Policies</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006d43] animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Live Configuration</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {tariffs.map((policy, index) => {
                    const isActive = policy.pricingPolicyStatus === 'Active';
                    const matchingVehicle = vehicleTypes.find(v => v.id === policy.vehicleTypeId);
                    const isMotorbike = matchingVehicle ? matchingVehicle.name.toLowerCase().includes('motorbike') || matchingVehicle.name.toLowerCase().includes('motorcycle') : policy.vehicleTypeId === 1;
                    const vehicleTypeName = matchingVehicle ? matchingVehicle.name : (policy.vehicleTypeId === 1 ? 'Motorbike' : 'Car');

                    // Validate coverage and overlap on the fly for each policy
                    const simplifiedWindows = (policy.pricingWindows || []).map(w => ({
                      windowName: w.windowName,
                      startTime: w.startTime.substring(0, 5),
                      endTime: w.endTime.substring(0, 5),
                      baseDurationMinutes: w.baseDurationMinutes,
                      basePrice: w.basePrice,
                      incrementBlockMinutes: w.incrementBlockMinutes,
                      incrementPrice: w.incrementPrice,
                      windowCap: w.windowCap,
                      gracePeriodMinutes: w.gracePeriodMinutes
                    }));
                    const coverage = validate24hCoverage(simplifiedWindows);
                    const overlap = validateNoOverlap(simplifiedWindows);
                    const segments = computeTimelineSegments(simplifiedWindows);

                    return (
                      <div 
                        key={policy.pricingPolicyId || index} 
                        className={`bg-white border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                          isActive ? 'border-[#006d43] ring-2 ring-emerald-500/10' : 'border-slate-200'
                        }`}
                      >
                        {/* Policy Card Header */}
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  isMotorbike 
                                    ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/60' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                }`}>
                                  {vehicleTypeName}
                                </span>
                                
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                  {isActive ? 'Active' : 'Draft'}
                                </span>
                              </div>
                              <h5 className="text-slate-800 text-base font-bold mt-1.5">{policy.policyName}</h5>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-1.5">
                              {!isActive && (
                                <button 
                                  onClick={() => handleOpenActivateDialog(policy)}
                                  disabled={!coverage.isValid || !overlap.isValid}
                                  className="px-3 py-1.5 bg-[#006d43]/10 hover:bg-[#006d43] text-[#006d43] hover:text-white font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  title={coverage.isValid && overlap.isValid ? "Activate policy" : "Requires 24h coverage and no overlaps to activate"}
                                >
                                  Activate
                                </button>
                              )}
                              <button 
                                onClick={() => handleOpenAddWindow(policy.pricingPolicyId)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                              >
                                + Add Window
                              </button>
                            </div>
                          </div>

                          {/* Effective Dates info */}
                          <div className="mt-4 flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-slate-500 font-semibold text-xs">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>
                              Effective start: {new Date(policy.effectiveStart).toLocaleDateString('en-US')}
                              {policy.effectiveEnd ? ` - ${new Date(policy.effectiveEnd).toLocaleDateString('en-US')}` : ' (Indefinite)'}
                            </span>
                          </div>

                          {/* Visual mini-timeline */}
                          <div className="mt-5 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>24h Timeline</span>
                              <span className={coverage.isValid && overlap.isValid ? 'text-emerald-600' : 'text-amber-600'}>
                                {coverage.isValid && overlap.isValid ? 'Complete' : 'Incomplete / Overlaps'}
                              </span>
                            </div>
                            <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 flex items-center">
                              {segments.map((seg, idx) => {
                                const isNight = isNightSlot(seg.name, policy.pricingWindows?.[idx]?.startTime || '');
                                return (
                                  <div 
                                    key={idx}
                                    style={{
                                      left: `${seg.startPercent}%`,
                                      width: `${seg.widthPercent}%`
                                    }}
                                    className={`absolute h-full border-r flex items-center px-1.5 text-white overflow-hidden cursor-pointer transition-colors ${
                                      isNight 
                                        ? 'bg-indigo-900/95 border-indigo-950/20 hover:bg-indigo-900' 
                                        : 'bg-amber-600/95 border-amber-700/20 hover:bg-amber-600'
                                    }`}
                                    title={`${seg.name}: ${(policy.pricingWindows?.[idx]?.startTime || '').substring(0, 5)} - ${(policy.pricingWindows?.[idx]?.endTime || '').substring(0, 5)}`}
                                  >
                                    <span className="text-[8px] font-black truncate flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[8px]">
                                        {isNight ? 'dark_mode' : 'light_mode'}
                                      </span>
                                      {seg.name}
                                    </span>
                                  </div>
                                );
                              })}
                              {(policy.pricingWindows || []).length === 0 && (
                                <div className="w-full text-center text-[10px] text-slate-400 font-bold">No windows configured</div>
                              )}
                            </div>
                            {(policy.pricingWindows || []).length > 0 && (
                              <div className="flex gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-wider justify-start pl-1">
                                <div className="flex items-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded bg-amber-600"></span>
                                  <span>Day</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded bg-indigo-900"></span>
                                  <span>Night</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Pricing windows list */}
                          <div className="mt-5 space-y-2.5">
                            <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pricing Windows</h6>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {(policy.pricingWindows || []).map((win, idx) => {
                                // Prepare data format to pass to editing modal
                                const tariffRowRepresentation = {
                                  id: `${policy.pricingPolicyId}-${win.pricingWindowId}`,
                                  vehicleType: vehicleTypes.find(v => v.id === policy.vehicleTypeId)?.name || (policy.vehicleTypeId === 1 ? 'Motorbike' : 'Car'),
                                  timeSlot: `${win.startTime.substring(0, 5)} - ${win.endTime.substring(0, 5)}`,
                                  baseRate: `${win.basePrice.toLocaleString('en-US')} VND`,
                                  incrementalRate: `${win.incrementPrice.toLocaleString('en-US')} VND`,
                                  dailyCap: win.windowCap ? `${win.windowCap.toLocaleString('en-US')} VND` : 'No Cap',
                                  gracePeriod: win.gracePeriodMinutes ? `${win.gracePeriodMinutes} mins` : 'None',
                                  isActive: isActive,
                                  details: {
                                    startTime: win.startTime.substring(0, 5),
                                    endTime: win.endTime.substring(0, 5),
                                    basePrice: win.basePrice,
                                    initialDuration: (win.baseDurationMinutes / 60).toString(),
                                    blockPrice: win.incrementPrice,
                                    increment: (win.incrementBlockMinutes / 60).toString(),
                                    maxCap: win.windowCap || 0,
                                    graceVal: win.gracePeriodMinutes.toString()
                                  }
                                };

                                return (
                                  <div 
                                    key={win.pricingWindowId || idx} 
                                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-4 transition-colors"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-slate-800 truncate">{win.windowName}</span>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                          {win.startTime.substring(0, 5)} - {win.endTime.substring(0, 5)}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 flex-wrap">
                                        <span>
                                          Base Rate ({win.baseDurationMinutes / 60}h): <strong>{win.basePrice.toLocaleString('en-US')} VND</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Incremental ({win.incrementBlockMinutes >= 60 ? `${win.incrementBlockMinutes / 60}h` : `${win.incrementBlockMinutes}m`}): <strong>{win.incrementPrice.toLocaleString('en-US')} VND</strong>
                                        </span>
                                        {win.windowCap && (
                                          <>
                                            <span>•</span>
                                            <span>
                                              Cap: <strong className="text-emerald-600">{win.windowCap.toLocaleString('en-US')} VND</strong>
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1.5 shrink-0">
                                      <button 
                                        onClick={() => handleOpenEditTariff(tariffRowRepresentation)}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-400 transition-colors shadow-sm"
                                        title="Edit Window"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this pricing window? This action cannot be undone.')) {
                                            handleDeleteTariff(tariffRowRepresentation.id);
                                          }
                                        }}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-400 transition-colors shadow-sm"
                                        title="Delete Window"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                            {membership.priceNum.toLocaleString('en-US')}
                          </span>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">VND / month</span>
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
