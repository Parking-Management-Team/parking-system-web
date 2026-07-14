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
    fees,
    incidentTypes,
    showToast,
    toastMessage,
    toastType,
    handleOpenEditTariff,
    handleOpenAddFee,
    handleOpenEditFee,
    handleOpenCreatePolicy,
    handleOpenActivateDialog,
    handleOpenAddWindow,
    handleDeleteTariff,
    handleOpenEditPolicy,
    handleOpenAddIncidentType,
    handleOpenEditIncidentType,
    handleDeleteIncidentType,
    handleDeactivatePolicy,
    isCleaningUp,
    handleCleanupExpiredPolicies,
    vehicleTypes
  } = pricing;

  const isAdminOrManager = pricing.user?.role === 'ADMIN' || pricing.user?.role === 'MANAGER';

  const [showOnlyActive, setShowOnlyActive] = React.useState(false);

  // Handler for primary button based on active tab
  const handlePrimaryAction = () => {
    if (activeTab === 'standard') {
      handleOpenCreatePolicy();
    } else if (activeTab === 'incident-types') {
      handleOpenAddIncidentType();
    } else {
      handleOpenAddFee();
    }
  };

  const getPrimaryButtonLabel = () => {
    switch (activeTab) {
      case 'standard':
        return 'Create New Pricing Policy';
      case 'incident-types':
        return 'Add Incident Type';
      default:
        return 'Add Penalty Configuration';
    }
  };


  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      
      {/* ===== GLOBAL TOAST NOTIFICATION ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
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
                Configure baseline tariffs, incident types, and service fee penalties for NexPark facility.
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
                onClick={() => setActiveTab('incident-types')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === 'incident-types'
                    ? 'border-[#006d43] text-[#006d43]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                Incident Types
              </button>
            </nav>
          </div>

          {/* Tab Content Canvas */}
          <div className="mt-2">

            {/* TAB 1: STANDARD TARIFFS (POLICY CARD VIEW) */}
            {activeTab === 'standard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 className="text-base font-bold text-[#111c2d]">Standard Pricing Policies</h4>
                  <div className="flex items-center gap-4 flex-wrap">
                    {isAdminOrManager && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to clean up all expired pricing policies?')) {
                            handleCleanupExpiredPolicies();
                          }
                        }}
                        disabled={isCleaningUp}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cleanup Expired Policies"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500">
                          {isCleaningUp ? 'progress_activity' : 'delete_sweep'}
                        </span>
                        {isCleaningUp ? 'Cleaning up...' : 'Cleanup Expired Policies'}
                      </button>
                    )}
                    <label className="inline-flex items-center gap-2 cursor-pointer group bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-1.5 transition-all shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={showOnlyActive}
                        onChange={(e) => setShowOnlyActive(e.target.checked)}
                        className="rounded text-[#006d43] focus:ring-[#006d43]/20 border-slate-300 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-wide transition-colors select-none">
                        Show Active Only
                      </span>
                    </label>
                    <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#006d43] animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Live Configuration</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {tariffs
                    .filter(policy => !showOnlyActive || policy.pricingPolicyStatus === 'Active')
                    .map((policy, index) => {
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
                        className="bg-white border border-[#d8e3fb] p-6 rounded-xl flex flex-col justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all"
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
                                
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#006d43]' : 'bg-slate-400'}`}></span>
                                  {isActive ? 'Active' : 'Draft'}
                                </span>
                              </div>
                              <h5 className="text-[#111c2d] text-base font-bold mt-1.5">{policy.policyName}</h5>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-1.5">
                              {!isActive && (
                                <button 
                                  onClick={() => handleOpenActivateDialog(policy)}
                                  disabled={!coverage.isValid || !overlap.isValid}
                                  className="px-3 py-1.5 bg-[#006d43]/10 hover:bg-[#006d43] text-[#006d43] hover:text-white font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  title={coverage.isValid && overlap.isValid ? "Activate policy" : "Requires 24h coverage and no overlaps to activate"}
                                >
                                  Activate
                                </button>
                              )}
                              {isActive && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Set policy "${policy.policyName}" to Inactive?`)) {
                                      handleDeactivatePolicy(policy);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-xs rounded-lg transition-all border border-red-200 hover:border-red-600"
                                  title="Deactivate this policy"
                                >
                                  Set Inactive
                                </button>
                              )}
                              <button 
                                onClick={() => handleOpenAddWindow(policy.pricingPolicyId)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-all"
                              >
                                + Add Window
                              </button>
                              <button 
                                onClick={() => handleOpenEditPolicy(policy)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-[#006d43]/10 text-slate-600 hover:text-[#006d43] transition-colors"
                                title="Edit Policy Details"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            </div>
                          </div>

                          {/* Effective Dates info */}
                          <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-500 font-semibold text-xs">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>
                              Effective start: <strong className="text-slate-700">{new Date(policy.effectiveStart).toLocaleDateString('en-US')}</strong>
                              {policy.effectiveEnd ? ` - ${new Date(policy.effectiveEnd).toLocaleDateString('en-US')}` : ' (Indefinite)'}
                            </span>
                          </div>

                          {/* Visual mini-timeline */}
                          <div className="mt-5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                              <span>24h Timeline</span>
                              <span className={`inline-flex items-center gap-1 font-bold ${coverage.isValid && overlap.isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                <span className="material-symbols-outlined text-[14px]">
                                  {coverage.isValid && overlap.isValid ? 'check_circle' : 'pending'}
                                </span>
                                {coverage.isValid && overlap.isValid ? 'Complete' : 'Incomplete / Overlaps'}
                              </span>
                            </div>
                            <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200 flex items-center">
                              {segments.map((seg, idx) => {
                                const isNight = isNightSlot(seg.name, policy.pricingWindows?.[seg.originalIndex]?.startTime || '');
                                return (
                                  <div 
                                    key={idx}
                                    style={{
                                      left: `${seg.startPercent}%`,
                                      width: `${seg.widthPercent}%`
                                    }}
                                    className={`absolute h-full border-r border-white/20 flex items-center px-2 text-white overflow-hidden cursor-pointer transition-colors ${
                                      isNight 
                                        ? 'bg-indigo-900 border-indigo-950/20 hover:bg-indigo-950' 
                                        : 'bg-amber-600 border-amber-700/20 hover:bg-amber-700'
                                    }`}
                                    title={`${seg.name}: ${(policy.pricingWindows?.[seg.originalIndex]?.startTime || '').substring(0, 5)} - ${(policy.pricingWindows?.[seg.originalIndex]?.endTime || '').substring(0, 5)}`}
                                  >
                                    <span className="text-[8px] font-black truncate flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[10px] shrink-0">
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
                              <div className="flex gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider justify-start pl-1">
                                <div className="flex items-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded bg-gradient-to-r from-amber-500 to-orange-500"></span>
                                  <span>Day</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded bg-gradient-to-r from-indigo-950 to-slate-800"></span>
                                  <span>Night</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Pricing windows list */}
                          <div className="mt-6 space-y-2">
                            <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider pl-1">Pricing Windows</h6>
                            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                              {(policy.pricingWindows || []).map((win, idx) => {
                                const isNightWin = isNightSlot(win.windowName, win.startTime);
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
                                    className="py-3 flex items-center justify-between gap-4 transition-colors"
                                  >
                                    <div className="space-y-1.5 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`material-symbols-outlined text-[16px] shrink-0 ${isNightWin ? 'text-indigo-500' : 'text-amber-500'}`}>
                                          {isNightWin ? 'dark_mode' : 'light_mode'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 truncate">{win.windowName}</span>
                                        <span className="text-[10px] font-semibold text-slate-400">
                                          ({win.startTime.substring(0, 5)} - {win.endTime.substring(0, 5)})
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 flex-wrap">
                                        <span>
                                          Base ({win.baseDurationMinutes / 60}h): <strong className="text-slate-700">{win.basePrice.toLocaleString('en-US')} đ</strong>
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>
                                          Inc ({win.incrementBlockMinutes >= 60 ? `${win.incrementBlockMinutes / 60}h` : `${win.incrementBlockMinutes}m`}): <strong className="text-slate-700">{win.incrementPrice.toLocaleString('en-US')} đ</strong>
                                        </span>
                                        {win.windowCap && (
                                          <>
                                            <span className="text-slate-300">•</span>
                                            <span>
                                              Cap: <strong className="text-emerald-700">{win.windowCap.toLocaleString('en-US')} đ</strong>
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                      <button 
                                        onClick={() => handleOpenEditTariff(tariffRowRepresentation)}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
                                        className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
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



            {/* TAB 3: INCIDENT TYPES */}
            {activeTab === 'incident-types' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-[#111c2d]">Incident Types Management</h4>
                  <button
                    onClick={handleOpenAddIncidentType}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Add Incident Type
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incidentTypes.map((it) => (
                    <div 
                      key={it.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                              {it.incidentCode}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenEditIncidentType(it)}
                            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#006d43] transition-colors"
                            title="Edit incident type"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteIncidentType(it.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete incident type"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-bold text-slate-800">{it.incidentName}</h5>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{it.description || 'No description'}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Default Fee</span>
                          <span className="text-sm font-bold text-red-600">
                            {(it.defaultPenaltyFee ?? 0).toLocaleString('en-US')} VND
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {incidentTypes.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-slate-300 text-[48px]">add_circle</span>
                    <p className="text-slate-400 text-sm mt-2 font-medium">No incident types yet</p>
                    <button
                      onClick={handleOpenAddIncidentType}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Incident Type
                    </button>
                  </div>
                )}
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
