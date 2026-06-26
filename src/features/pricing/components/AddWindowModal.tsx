// src/features/pricing/components/AddWindowModal.tsx
import React from 'react';
import { UsePricingResult } from '../hooks/usePricing';

interface AddWindowModalProps {
  pricing: UsePricingResult;
}

export default function AddWindowModal({ pricing }: AddWindowModalProps) {
  const {
    isAddWindowOpen,
    handleCloseAddWindow,
    handleSaveAddWindow,

    // Form inputs S5
    formAddWindowName,
    setFormAddWindowName,
    formAddWindowStartTime,
    setFormAddWindowStartTime,
    formAddWindowEndTime,
    setFormAddWindowEndTime,
    formAddWindowBasePrice,
    setFormAddWindowBasePrice,
    formAddWindowInitialDuration,
    setFormAddWindowInitialDuration,
    formAddWindowBlockPrice,
    setFormAddWindowBlockPrice,
    formAddWindowIncrement,
    setFormAddWindowIncrement,
    formAddWindowEnableCap,
    setFormAddWindowEnableCap,
    formAddWindowMaxCap,
    setFormAddWindowMaxCap,
    formAddWindowGraceVal,
    setFormAddWindowGraceVal,
    submitError
  } = pricing;

  if (!isAddWindowOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ===== HEADER ===== */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">more_time</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Add New Pricing Window</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Add a new pricing timeframe to the current pricing policy.
              </p>
            </div>
          </div>
          <button 
            onClick={handleCloseAddWindow}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ===== FORM BODY ===== */}
        <form onSubmit={handleSaveAddWindow} className="p-6 space-y-5 flex-grow overflow-y-auto">
          
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
              <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0 mt-0.5">error</span>
              <div className="flex-grow">
                <h4 className="text-sm font-bold text-red-800">Cannot Add Window</h4>
                <p className="text-xs font-semibold text-red-700 mt-0.5 leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}
          
          {/* Tên khung giờ */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Window Name</label>
            <input 
              type="text"
              required
              value={formAddWindowName}
              onChange={(e) => setFormAddWindowName(e.target.value)}
              placeholder="e.g. Morning Rush Hour"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>

          {/* Khoảng thời gian */}
          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Effective Hours
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                <input 
                  type="time" 
                  required
                  value={formAddWindowStartTime}
                  onChange={(e) => setFormAddWindowStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
                <input 
                  type="time" 
                  required
                  value={formAddWindowEndTime}
                  onChange={(e) => setFormAddWindowEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Block đầu và block lũy tiến */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">looks_one</span>
                Base Rate (Initial Block)
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Base Price (VND)</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  value={formAddWindowBasePrice || ''}
                  onChange={(e) => setFormAddWindowBasePrice(Number(e.target.value))}
                  placeholder="VND"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Initial Duration</label>
                <select 
                  value={formAddWindowInitialDuration}
                  onChange={(e) => setFormAddWindowInitialDuration(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="1">First 1 Hour</option>
                  <option value="2">First 2 Hours</option>
                  <option value="4">First 4 Hours</option>
                  <option value="12">Flat Rate (12h)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">autorenew</span>
                Incremental Rate
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Incremental Price (VND)</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  value={formAddWindowBlockPrice || ''}
                  onChange={(e) => setFormAddWindowBlockPrice(Number(e.target.value))}
                  placeholder="VND"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Subsequent Block Size</label>
                <select 
                  value={formAddWindowIncrement}
                  onChange={(e) => setFormAddWindowIncrement(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="0.5">30 Minutes</option>
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Giá trần và Thời gian ân hạn */}
          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">settings_accessibility</span>
              Constraints & Grace
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500">Daily Cap</label>
                  <input 
                    type="checkbox"
                    id="addWindowEnableCap"
                    checked={formAddWindowEnableCap}
                    onChange={(e) => setFormAddWindowEnableCap(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                </div>
                <input 
                  type="number" 
                  disabled={!formAddWindowEnableCap}
                  value={formAddWindowEnableCap ? (formAddWindowMaxCap || '') : ''}
                  onChange={(e) => setFormAddWindowMaxCap(Number(e.target.value))}
                  placeholder="Unlimited (No Cap)"
                  className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Grace Period</label>
                <select 
                  value={formAddWindowGraceVal}
                  onChange={(e) => setFormAddWindowGraceVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="0">None</option>
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                </select>
              </div>
            </div>
          </div>

        </form>

        {/* ===== ACTION FOOTER ===== */}
        <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            onClick={handleCloseAddWindow}
            className="px-5 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSaveAddWindow}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-700/10"
          >
            Add Window
          </button>
        </div>

      </div>
    </div>
  );
}
