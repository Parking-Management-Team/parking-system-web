// src/features/pricing/components/CreatePolicyModal.tsx
import React, { useMemo } from 'react';
import { UsePricingResult } from '../hooks/usePricing';
import { validate24hCoverage, validateNoOverlap, computeTimelineSegments, isNightSlot } from '../utils/pricingValidation';

interface CreatePolicyModalProps {
  pricing: UsePricingResult;
}

export default function CreatePolicyModal({ pricing }: CreatePolicyModalProps) {
  const {
    isCreatePolicyOpen,
    handleCloseCreatePolicy,
    newPolicyName,
    setNewPolicyName,
    newPriority,
    setNewPriority,
    newVehicleTypeId,
    setNewVehicleTypeId,
    newEffectiveStart,
    setNewEffectiveStart,
    newEffectiveEnd,
    setNewEffectiveEnd,
    newWindows,
    handleAddNewWindow,
    handleRemoveNewWindow,
    handleUpdateNewWindow,
    handleSaveCreatePolicy,
    vehicleTypes,
    submitError
  } = pricing;

  // Calculate timeline details
  const coverage = useMemo(() => validate24hCoverage(newWindows), [newWindows]);
  const overlap = useMemo(() => validateNoOverlap(newWindows), [newWindows]);
  const segments = useMemo(() => computeTimelineSegments(newWindows), [newWindows]);

  if (!isCreatePolicyOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ===== HEADER ===== */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006d43] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">add_card</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Create New Pricing Policy</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Establish a new 24-hour coverage pricing configuration for the facility.
              </p>
            </div>
          </div>
          <button 
            onClick={handleCloseCreatePolicy}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ===== BODY ===== */}
        <form onSubmit={handleSaveCreatePolicy} className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
              <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0 mt-0.5">error</span>
              <div className="flex-grow">
                <h4 className="text-sm font-bold text-red-800">Cannot Create Policy</h4>
                <p className="text-xs font-semibold text-red-700 mt-0.5 leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">article</span>
              General Policy Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Policy Name</label>
                <input 
                  type="text" 
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  placeholder="e.g. Weekday Motorbike Tariff"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Vehicle Type</label>
                <div className="relative">
                  <select 
                    value={newVehicleTypeId}
                    onChange={(e) => setNewVehicleTypeId(Number(e.target.value))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <span>Priority Level</span>
                  <span className="material-symbols-outlined text-[14px] text-amber-500" title="Priority: 0 = Baseline Tariff, 1+ = Event/Holiday Override">info</span>
                </label>
                <input 
                  type="number" 
                  min={0}
                  max={100}
                  value={newPriority}
                  onChange={(e) => setNewPriority(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  0 = Standard, ≥1 = Holiday / Event Override
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Effective Start Date</label>
                <input 
                  type="date" 
                  value={newEffectiveStart}
                  onChange={(e) => setNewEffectiveStart(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="md:col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="indefiniteStart"
                  checked={!newEffectiveEnd}
                  onChange={(e) => setNewEffectiveEnd(e.target.checked ? '' : newEffectiveStart)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="indefiniteStart" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  No end date constraint (Indefinite Policy)
                </label>
              </div>

              {newEffectiveEnd !== '' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Effective End Date</label>
                  <input 
                    type="date" 
                    value={newEffectiveEnd}
                    onChange={(e) => setNewEffectiveEnd(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Pricing Windows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">alarm</span>
                Configured Pricing Windows ({newWindows.length})
              </h3>
              
              <button 
                type="button"
                onClick={handleAddNewWindow}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-[#006d43] hover:bg-emerald-100 font-bold text-xs rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Add New Window
              </button>
            </div>

            {newWindows.map((win, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative group"
              >
                {/* Window card header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <input 
                      type="text"
                      value={win.windowName}
                      onChange={(e) => handleUpdateNewWindow(idx, 'windowName', e.target.value)}
                      placeholder="Window Name (e.g. Day Shift)"
                      className="border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 placeholder-slate-400 w-48 bg-transparent"
                    />
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleRemoveNewWindow(idx)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete window"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Cột 1: Time */}
                  <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Operating Hours</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Start</label>
                        <input 
                          type="time" 
                          value={win.startTime}
                          onChange={(e) => handleUpdateNewWindow(idx, 'startTime', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">End</label>
                        <input 
                          type="time" 
                          value={win.endTime}
                          onChange={(e) => handleUpdateNewWindow(idx, 'endTime', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Initial Block */}
                  <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Base Rate (Initial Block)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Rate (đ)</label>
                        <input 
                          type="number" 
                          value={win.basePrice}
                          onChange={(e) => handleUpdateNewWindow(idx, 'basePrice', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Duration</label>
                        <select 
                          value={win.baseDurationMinutes}
                          onChange={(e) => handleUpdateNewWindow(idx, 'baseDurationMinutes', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value={60}>1 Hour</option>
                          <option value={120}>2 Hours</option>
                          <option value={240}>4 Hours</option>
                          <option value={720}>Flat Rate (12h)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cột 3: Incremental */}
                  <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Incremental Rate</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Rate (đ)</label>
                        <input 
                          type="number" 
                          value={win.incrementPrice}
                          onChange={(e) => handleUpdateNewWindow(idx, 'incrementPrice', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Per Block</label>
                        <select 
                          value={win.incrementBlockMinutes}
                          onChange={(e) => handleUpdateNewWindow(idx, 'incrementBlockMinutes', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value={30}>30 Mins</option>
                          <option value={60}>1 Hour</option>
                          <option value={120}>2 Hours</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cột 4: Grace & Cap */}
                  <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Limits & Grace</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Daily Cap</label>
                        <input 
                          type="number" 
                          value={win.windowCap || ''}
                          onChange={(e) => handleUpdateNewWindow(idx, 'windowCap', e.target.value ? Number(e.target.value) : null)}
                          placeholder="No Cap"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Grace Period</label>
                        <select 
                          value={win.gracePeriodMinutes}
                          onChange={(e) => handleUpdateNewWindow(idx, 'gracePeriodMinutes', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value={0}>None</option>
                          <option value={10}>10 Mins</option>
                          <option value={15}>15 Mins</option>
                          <option value={30}>30 Mins</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: 24h Timeline & Coverage Check */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">view_timeline</span>
                24-Hour Timeline Preview
              </h3>
              
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${coverage.isValid ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className={`text-xs font-bold ${coverage.isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                  {coverage.isValid ? 'Complete 24h Coverage' : `Incomplete (${Math.floor(coverage.totalMinutes / 60)}h ${coverage.totalMinutes % 60}m / 24h)`}
                </span>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="h-10 w-full bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 flex items-center">
              {/* Render segments */}
              {segments.map((seg, idx) => {
                const isNight = isNightSlot(seg.name, newWindows[seg.originalIndex]?.startTime || '');
                return (
                  <div 
                    key={idx}
                    style={{
                      left: `${seg.startPercent}%`,
                      width: `${seg.widthPercent}%`
                    }}
                    className={`absolute h-full border-r flex flex-col justify-center px-2 text-white overflow-hidden shadow-inner cursor-pointer transition-colors ${
                      isNight 
                        ? 'bg-indigo-900/95 border-indigo-950/20 hover:bg-indigo-900' 
                        : 'bg-amber-600/95 border-amber-700/20 hover:bg-amber-600'
                    }`}
                    title={`${seg.name}: ${newWindows[seg.originalIndex]?.startTime || ''} - ${newWindows[seg.originalIndex]?.endTime || ''}`}
                  >
                    <span className="text-[9px] font-black truncate flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">
                        {isNight ? 'dark_mode' : 'light_mode'}
                      </span>
                      {seg.name}
                    </span>
                    <span className="text-[8px] font-bold opacity-80 block truncate pl-3.5">{newWindows[seg.originalIndex]?.startTime || ''}-{newWindows[seg.originalIndex]?.endTime || ''}</span>
                  </div>
                );
              })}

              {/* Empty state */}
              {newWindows.length === 0 && (
                <div className="w-full text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                  No pricing windows configured yet
                </div>
              )}
            </div>

            {/* Legend for day and night slots */}
            {newWindows.length > 0 && (
              <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider justify-start pl-1">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-amber-600"></span>
                  <span>Day Window (6:00 AM - 6:00 PM)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded bg-indigo-900"></span>
                  <span>Night Window (6:00 PM - 6:00 AM)</span>
                </div>
              </div>
            )}

            {/* Validation Errors & Alerts */}
            {(!coverage.isValid || !overlap.isValid) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span className="text-xs font-bold">Validation Error: Adjust policy rules to save</span>
                </div>
                <ul className="text-xs text-red-500 font-medium space-y-1 pl-6 list-disc">
                  {!coverage.isValid && <li>{coverage.message}</li>}
                  {!overlap.isValid && overlap.conflictPairs.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}

            {coverage.isValid && overlap.isValid && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-emerald-700">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span className="text-xs font-bold">Valid configuration. Ready to publish.</span>
              </div>
            )}
          </div>
        </form>

        {/* ===== FOOTER ===== */}
        <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            onClick={handleCloseCreatePolicy}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleSaveCreatePolicy}
              disabled={!coverage.isValid || !overlap.isValid}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006d43] text-white hover:bg-[#005c38] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs rounded-xl transition-all shadow-md shadow-[#006d43]/10"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save Policy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
