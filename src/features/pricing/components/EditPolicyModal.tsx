// src/features/pricing/components/EditPolicyModal.tsx
import React from 'react';
import { UsePricingResult } from '../hooks/usePricing';

interface EditPolicyModalProps {
  pricing: UsePricingResult;
}

export default function EditPolicyModal({ pricing }: EditPolicyModalProps) {
  const {
    isEditPolicyOpen,
    handleCloseEditPolicy,
    editPolicyTarget,
    editPolicyName,
    setEditPolicyName,
    editPriority,
    setEditPriority,
    editEffectiveStart,
    setEditEffectiveStart,
    editEffectiveEnd,
    setEditEffectiveEnd,
    handleSaveEditPolicy,
    vehicleTypes,
    submitError
  } = pricing;

  if (!isEditPolicyOpen || !editPolicyTarget) return null;

  const isActive = editPolicyTarget.pricingPolicyStatus?.toLowerCase() === 'active';
  const vehicleTypeName = vehicleTypes.find(v => v.id === editPolicyTarget.vehicleTypeId)?.name || 'Vehicle Type';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ===== HEADER ===== */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Pricing Policy</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Update general configuration settings for this policy.
            </p>
          </div>
          <button 
            onClick={handleCloseEditPolicy}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ===== BODY ===== */}
        <form onSubmit={handleSaveEditPolicy} className="p-6 space-y-4 bg-slate-50/50">
          
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
              <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0 mt-0.5">error</span>
              <div className="flex-grow">
                <h4 className="text-sm font-bold text-red-800">Cannot Update Policy</h4>
                <p className="text-xs font-semibold text-red-700 mt-0.5 leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}

          {/* Policy Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Policy Name</label>
            <input 
              type="text" 
              value={editPolicyName}
              onChange={(e) => setEditPolicyName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle Type (Read only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Vehicle Type</label>
              <input 
                type="text" 
                value={vehicleTypeName}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 outline-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <span>Priority Level</span>
                <span className="material-symbols-outlined text-[14px] text-amber-500" title="Priority: 0 = Baseline Tariff, 1+ = Event/Holiday Override">info</span>
              </label>
              <input 
                type="number" 
                min={0}
                max={100}
                value={editPriority}
                onChange={(e) => setEditPriority(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                0 = Standard, ≥1 = Holiday / Event Override
              </span>
            </div>
          </div>

          {/* Effective Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              Effective Start Date {isActive && <span className="text-[10px] text-slate-400 font-medium">(Locked - Policy Active)</span>}
            </label>
            <input 
              type="date" 
              value={editEffectiveStart}
              disabled={isActive}
              onChange={(e) => setEditEffectiveStart(e.target.value)}
              className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Indefinite Policy Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="editIndefiniteStart"
              checked={editEffectiveEnd === ''}
              onChange={(e) => setEditEffectiveEnd(e.target.checked ? '' : editEffectiveStart || new Date().toISOString().split('T')[0])}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="editIndefiniteStart" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
              No end date constraint (Indefinite Policy)
            </label>
          </div>

          {/* Effective End Date */}
          {editEffectiveEnd !== '' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Effective End Date</label>
              <input 
                type="date" 
                value={editEffectiveEnd}
                onChange={(e) => setEditEffectiveEnd(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
            <button 
              type="button"
              onClick={handleCloseEditPolicy}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-all"
            >
              Discard Changes
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005c38] text-white font-semibold text-xs transition-all shadow-md"
            >
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
