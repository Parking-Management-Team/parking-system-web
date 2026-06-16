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
  } = pricing;

  if (!isActivateDialogOpen || !activatingPolicy) return null;

  const vehicleTypeName = activatingPolicy.vehicleTypeId === 1 ? 'Motorbike' : 'Car';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ===== WARNING ICON & HEADER ===== */}
        <div className="p-6 text-center bg-amber-50/50 border-b border-slate-100 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px] animate-bounce">warning</span>
          </div>
          <h3 className="text-base font-bold text-slate-800">Confirm Policy Activation</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
            Activating this policy will immediately update the parking tariff structure for the applicable vehicle type.
          </p>
        </div>

        {/* ===== BODY CONTENT ===== */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pricing Policy Selected</span>
              <span className="text-sm font-bold text-slate-800">{activatingPolicy.policyName}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
                <span className="text-xs font-bold text-slate-700">{vehicleTypeName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Effective Start Date</span>
                <span className="text-xs font-bold text-slate-700">
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

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pricing Windows to Activate:</span>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1.5">
                {activatingPolicy.pricingWindows.map((win) => (
                  <div key={win.pricingWindowId} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-xs">
                    <span className="font-semibold text-slate-700">{win.windowName}</span>
                    <span className="font-black text-slate-500">{win.startTime.substring(0, 5)} - {win.endTime.substring(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5">info</span>
            <span className="text-[11px] font-semibold text-amber-800 leading-relaxed">
              <strong>Important Note:</strong> The system will automatically deactivate any other active pricing policies for <strong>{vehicleTypeName}</strong> to prevent conflicts.
            </span>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
          <button 
            type="button"
            onClick={handleCloseActivateDialog}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirmActivate}
            className="px-4.5 py-2.5 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-800/10"
          >
            Confirm Activation
          </button>
        </div>

      </div>
    </div>
  );
}
