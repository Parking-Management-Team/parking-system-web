// src/features/pricing/components/ActivatePolicyDialog.tsx
import React from 'react';
import { UsePricingResult } from '../hooks/usePricing';

interface ActivatePolicyDialogProps {
  pricing: UsePricingResult;
}

export default function ActivatePolicyDialog({ pricing }: ActivatePolicyDialogProps) {
  const {
    isActivateDialogOpen,
    handleCloseActivateDialog,
    activatingPolicy,
    handleConfirmActivate,
    vehicleTypes,
  } = pricing;

  if (!isActivateDialogOpen || !activatingPolicy) return null;

  const matchingVehicle = vehicleTypes.find(v => v.id === activatingPolicy.vehicleTypeId);
  const vehicleTypeName = matchingVehicle ? matchingVehicle.name : (activatingPolicy.vehicleTypeId === 1 ? 'Motorbike' : 'Car');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#d8e3fb] p-6 animate-in zoom-in-95 duration-200 flex flex-col gap-5">
        
        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-2 text-[#006d43]">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <h3 className="text-lg font-bold text-[#111c2d]">Confirm Policy Activation</h3>
        </div>

        {/* ===== BODY CONTENT ===== */}
        <div className="space-y-4 text-sm text-slate-600">
          <p className="leading-relaxed">
            Activating this policy will immediately update the active parking tariff structure.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Policy Name</span>
              <span className="font-bold text-[#111c2d]">{activatingPolicy.policyName}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Vehicle Type</span>
              <span className="font-bold text-[#111c2d]">{vehicleTypeName}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Effective Start</span>
              <span className="font-bold text-[#111c2d]">
                {new Date(activatingPolicy.effectiveStart).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Pricing Windows to Activate</span>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 pr-1">
              {(activatingPolicy.pricingWindows || []).map((win, idx) => (
                <div key={win.pricingWindowId || idx} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">{win.windowName}</span>
                  <span className="font-semibold text-slate-500">{(win.startTime || '').substring(0, 5)} - {(win.endTime || '').substring(0, 5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-amber-600 bg-amber-50/50 rounded-lg p-3 border border-amber-100/50 mt-2 flex gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
            <span>
              <strong>Note:</strong> Other active pricing policies for <strong>{vehicleTypeName}</strong> will be automatically set to draft status to avoid conflicts.
            </span>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button 
            type="button"
            onClick={handleCloseActivateDialog}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-bold text-xs rounded-lg transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirmActivate}
            className="px-5 py-2 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-lg transition-all shadow-sm"
          >
            Confirm Activation
          </button>
        </div>

      </div>
    </div>
  );
}
