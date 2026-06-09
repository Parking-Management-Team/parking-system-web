import React from 'react';
import { UsePricingResult } from '../hooks/usePricing';
import { FeePenaltyType } from '../types';

interface PricingModalsProps {
  pricing: UsePricingResult;
}

export default function PricingModals({ pricing }: PricingModalsProps) {
  const {
    isEditTariffOpen,
    isEditMembershipOpen,
    isFeeModalOpen,

    editingTariff,
    editingMembership,
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

    // Membership States
    formMembershipVehicleType,
    formMembershipPrice,
    setFormMembershipPrice,

    // Fee States
    formFeeType,
    setFormFeeType,
    formFeeName,
    setFormFeeName,
    formFeeAmount,
    setFormFeeAmount,
    formFeeTriggerType,
    setFormFeeTriggerType,
    formFeeTriggerVal,
    setFormFeeTriggerVal,
    formFeeDescription,
    setFormFeeDescription,
    formFeeIsActive,
    setFormFeeIsActive,

    // Handlers
    handleCloseEditTariff,
    handleSaveTariff,

    handleCloseEditMembership,
    handleSaveMembership,

    handleCloseFeeModal,
    handleSaveFee
  } = pricing;

  // Render Edit Tariff Modal
  if (isEditTariffOpen && editingTariff) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Edit Pricing Policy</h2>
            <button 
              onClick={handleCloseEditTariff}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveTariff} className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            
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
                      <option value="Car">Car</option>
                      <option value="Motorbike">Motorbike</option>
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
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Base Price (VND)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formTariffBasePrice}
                      onChange={(e) => setFormTariffBasePrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
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
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
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
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Window Cap / Max Daily Charge</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formTariffMaxCap}
                      onChange={(e) => setFormTariffMaxCap(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">Specify upper limit limit per day.</p>
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

  {/* Render Edit Membership Modal */}
  if (isEditMembershipOpen && editingMembership) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Edit Membership</h2>
            <button 
              onClick={handleCloseEditMembership}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSaveMembership} className="p-6 space-y-4 bg-slate-50/50">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Vehicle Type</label>
              <input 
                type="text" 
                value={formMembershipVehicleType} 
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Monthly Price (VND)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formMembershipPrice}
                  onChange={(e) => setFormMembershipPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button 
                type="button"
                onClick={handleCloseEditMembership}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005c38] text-white font-semibold text-xs transition-all shadow-md"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  {/* Render Add/Edit Service Fee Modal */}
  if (isFeeModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {editingFee ? 'Edit Service Fee & Penalty' : 'Add New Service Fee/Penalty'}
            </h2>
            <button 
              onClick={handleCloseFeeModal}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSaveFee} className="flex-grow overflow-y-auto p-6 space-y-5 bg-slate-50/50">
            
            <div className="rounded-xl border border-emerald-500/10 bg-white p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Fee Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Fee Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={formFeeType}
                      onChange={(e) => setFormFeeType(e.target.value as FeePenaltyType)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    >
                      <option value="deposit">Deposit</option>
                      <option value="noshow">No-show</option>
                      <option value="lostcard">Lost Card</option>
                      <option value="wrongzone">Wrong Zone</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Fee Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Fee Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formFeeName}
                    onChange={(e) => setFormFeeName(e.target.value)}
                    placeholder="e.g. Booking Deposit"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>

                {/* Fee Amount */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Fee Amount (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">payments</span>
                    <input 
                      type="number" 
                      value={formFeeAmount}
                      onChange={(e) => setFormFeeAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right"
                      required
                    />
                  </div>
                </div>

                {/* Trigger conditions */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Trigger Conditions</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Time based radio */}
                    <label 
                      onClick={() => setFormFeeTriggerType('time')}
                      className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        formFeeTriggerType === 'time' 
                          ? 'border-emerald-500 bg-[#F4FBF3]' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="triggerType"
                        checked={formFeeTriggerType === 'time'}
                        onChange={() => {}}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="block text-sm font-bold text-slate-700">Time-based Trigger</span>
                        <span className="block text-xs text-slate-400 font-medium mt-0.5">Apply fee automatically after duration.</span>
                        {formFeeTriggerType === 'time' && (
                          <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs font-semibold text-slate-600">Trigger after</span>
                            <input 
                              type="number" 
                              value={formFeeTriggerVal}
                              onChange={(e) => setFormFeeTriggerVal(Number(e.target.value))}
                              className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                            />
                            <span className="text-xs font-semibold text-slate-600">mins</span>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Manual radio */}
                    <label 
                      onClick={() => setFormFeeTriggerType('manual')}
                      className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        formFeeTriggerType === 'manual' 
                          ? 'border-emerald-500 bg-[#F4FBF3]' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="triggerType"
                        checked={formFeeTriggerType === 'manual'}
                        onChange={() => {}}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="block text-sm font-bold text-slate-700">Manual Trigger</span>
                        <span className="block text-xs text-slate-400 font-medium mt-0.5">Applied manually by operations staff.</span>
                      </div>
                    </label>

                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Internal Description</label>
                  <textarea 
                    value={formFeeDescription}
                    onChange={(e) => setFormFeeDescription(e.target.value)}
                    placeholder="Add notes or rules regarding this fee..."
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                {/* Active status */}
                <div className="md:col-span-2 flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFormFeeIsActive(!formFeeIsActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formFeeIsActive ? 'bg-[#006d43]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formFeeIsActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-700">Set as Active Configuration</span>
                </div>

              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button 
                type="button"
                onClick={handleCloseFeeModal}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005c38] text-white font-semibold text-xs transition-all shadow-md shadow-[#006d43]/10"
              >
                {editingFee ? 'Save Changes' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
