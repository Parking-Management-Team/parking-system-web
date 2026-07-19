import React from 'react';
import { UsePricingResult } from '../hooks/usePricing';
import CreatePolicyModal from './CreatePolicyModal';
import ActivatePolicyDialog from './ActivatePolicyDialog';
import AddWindowModal from './AddWindowModal';
import EditPolicyModal from './EditPolicyModal';

interface PricingModalsProps {
  pricing: UsePricingResult;
}

export default function PricingModals({ pricing }: PricingModalsProps) {
  const {
    isEditTariffOpen,
    isFeeModalOpen,

    editingTariff,
    editingFee,

    // Tariff States
    formTariffName,
    setFormTariffName,
    formTariffVehicleType,
    setFormTariffVehicleType,
    formTariffStartTime,
    setFormTariffStartTime,
    formTariffEndTime,
    setFormTariffEndTime,
    formTariffBasePrice,
    setFormTariffBasePrice,
    formTariffInitialDuration,
    setFormTariffInitialDuration,
    formTariffBlockPrice,
    setFormTariffBlockPrice,
    formTariffIncrement,
    setFormTariffIncrement,
    formTariffMaxCap,
    setFormTariffMaxCap,
    formTariffGraceVal,
    setFormTariffGraceVal,
    formTariffEnableCap,
    setFormTariffEnableCap,
    removeWindowCap,
    setRemoveWindowCap,



    // Fee States
    incidentTypes,
    formFeeIncidentTypeId,
    setFormFeeIncidentTypeId,
    formFeeType,
    setFormFeeType,
    formFeeName,
    setFormFeeName,
    formFeeAmount,
    setFormFeeAmount,
    formFeeDescription,
    setFormFeeDescription,

    // Incident Type States
    isIncidentTypeModalOpen,
    editingIncidentType,
    formIncidentCode,
    setFormIncidentCode,
    formIncidentName,
    setFormIncidentName,
    formIncidentDescription,
    setFormIncidentDescription,
    formIncidentDefaultFee,
    setFormIncidentDefaultFee,

    // Handlers
    handleCloseEditTariff,
    handleSaveTariff,



    handleCloseFeeModal,
    handleSaveFee,

    handleCloseIncidentTypeModal,
    handleSaveIncidentType,
    vehicleTypes,
    submitError
  } = pricing;


  // Render Edit Tariff Modal
  if (isEditTariffOpen && editingTariff) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Edit Pricing Window</h2>
            <button 
              onClick={handleCloseEditTariff}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveTariff} className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
                <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0 mt-0.5">error</span>
                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-red-800">Cannot Save Changes</h4>
                  <p className="text-xs font-semibold text-red-700 mt-0.5 leading-relaxed">{submitError}</p>
                </div>
              </div>
            )}

            {/* Core Details */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#F4FBF3] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/5 pb-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">info</span>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Core Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Policy Name</label>
                  <input 
                    type="text" 
                    value={formTariffName}
                    onChange={(e) => setFormTariffName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Vehicle Type</label>
                  <div className="relative">
                    <select 
                      value={formTariffVehicleType}
                      onChange={(e) => setFormTariffVehicleType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    >
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.name}>{vt.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Configuration */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#F4FBF3] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/5 pb-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">schedule</span>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Time Configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Active Time Slot Start</label>
                  <input 
                    type="time" 
                    value={formTariffStartTime}
                    onChange={(e) => setFormTariffStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Active Time Slot End</label>
                  <input 
                    type="time" 
                    value={formTariffEndTime}
                    onChange={(e) => setFormTariffEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Structure */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#F4FBF3] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/5 pb-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pricing Structure</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Base Price (đ)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formTariffBasePrice}
                      onChange={(e) => setFormTariffBasePrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Initial Duration</label>
                  <div className="relative">
                    <select 
                      value={formTariffInitialDuration}
                      onChange={(e) => setFormTariffInitialDuration(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    >
                      <option value="1">First 1 Hour</option>
                      <option value="2">First 2 Hours</option>
                      <option value="4">First 4 Hours</option>
                      <option value="12">Flat Rate (12 hrs)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Block Price (Subsequent)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formTariffBlockPrice}
                      onChange={(e) => setFormTariffBlockPrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Per Increment</label>
                  <div className="relative">
                    <select 
                      value={formTariffIncrement}
                      onChange={(e) => setFormTariffIncrement(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    >
                      <option value="0.5">30 Mins</option>
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Constraints & Limits */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#F4FBF3] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/5 pb-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">gavel</span>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Constraints & Limits</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Daily Cap (đ)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="enableCapCheckbox"
                        checked={formTariffEnableCap}
                        onChange={(e) => {
                          setFormTariffEnableCap(e.target.checked);
                          if (!e.target.checked) setRemoveWindowCap(true);
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <label htmlFor="enableCapCheckbox" className="text-[10px] font-bold text-slate-500 cursor-pointer">
                        Enable Cap
                      </label>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="number" 
                      disabled={!formTariffEnableCap || removeWindowCap}
                      value={formTariffEnableCap && !removeWindowCap ? formTariffMaxCap : ''}
                      onChange={(e) => setFormTariffMaxCap(Number(e.target.value))}
                      placeholder="No daily limit"
                      className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>

                  {editingTariff.details.maxCap > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                      <input 
                        type="checkbox" 
                        id="removeCapCheckbox"
                        checked={removeWindowCap}
                        onChange={(e) => {
                          setRemoveWindowCap(e.target.checked);
                          if (e.target.checked) setFormTariffEnableCap(false);
                        }}
                        className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                      />
                      <label htmlFor="removeCapCheckbox" className="text-[10px] font-bold text-red-600 cursor-pointer">
                        Remove existing daily cap
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Grace Period (Free Exit Time)</label>
                  <div className="relative">
                    <select 
                      value={formTariffGraceVal}
                      onChange={(e) => setFormTariffGraceVal(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    >
                      <option value="0">None</option>
                      <option value="10">10 Mins</option>
                      <option value="15">15 Mins</option>
                      <option value="30">30 Mins</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>


            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button 
                type="button"
                onClick={handleCloseEditTariff}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-all"
              >
                Discard Changes
              </button>
              <button 
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005c38] text-white font-semibold text-xs transition-all shadow-md shadow-[#006d43]/10"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Update Policy
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }



  {/* Render Add/Edit Incident Type Modal */}
  if (isIncidentTypeModalOpen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {editingIncidentType ? 'Edit Incident Type' : 'Add Incident Type'}
            </h2>
            <button 
              onClick={handleCloseIncidentTypeModal}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSaveIncidentType} className="p-6 space-y-4 bg-slate-50/50">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Incident Code</label>
              <input 
                type="text" 
                value={formIncidentCode}
                onChange={(e) => setFormIncidentCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                placeholder="e.g. TICKET_LOST"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Incident Name</label>
              <input 
                type="text" 
                value={formIncidentName}
                onChange={(e) => setFormIncidentName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                placeholder="e.g. Lost Ticket"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea 
                value={formIncidentDescription}
                onChange={(e) => setFormIncidentDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                rows={3}
                placeholder="Describe the incident..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Default Penalty Fee (đ)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formIncidentDefaultFee === 0 ? '' : formIncidentDefaultFee}
                  onChange={(e) => setFormIncidentDefaultFee(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button 
                type="button"
                onClick={handleCloseIncidentTypeModal}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005c38] text-white font-semibold text-xs transition-all shadow-md"
              >
                {editingIncidentType ? 'Save Changes' : 'Create Incident Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreatePolicyModal pricing={pricing} />
      <ActivatePolicyDialog pricing={pricing} />
      <AddWindowModal pricing={pricing} />
      <EditPolicyModal pricing={pricing} />
    </>
  );
}

