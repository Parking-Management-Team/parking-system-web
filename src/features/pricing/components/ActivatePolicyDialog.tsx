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
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ===== WARNING ICON & HEADER ===== */}
        <div className="p-8 text-center bg-amber-50/50 border-b border-slate-100 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[36px] animate-bounce">warning</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Confirm Policy Activation</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1 max-w-md">
            Activating this policy will immediately update the parking tariff structure for the applicable vehicle type.
          </p>
        </div>

        {/* ===== BODY CONTENT ===== */}
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pricing Policy Selected</span>
              <span className="text-base font-bold text-slate-800">{activatingPolicy.policyName}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle Type</span>
                <span className="text-sm font-bold text-slate-700">{vehicleTypeName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Effective Start Date</span>
                <span className="text-sm font-bold text-slate-700">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pricing Windows to Activate:</span>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {(activatingPolicy.pricingWindows || []).map((win, idx) => (
                  <div key={win.pricingWindowId || idx} className="flex justify-between items-center bg-white border border-slate-100 px-4 py-2.5 rounded-xl text-xs shadow-sm">
                    <span className="font-bold text-slate-700">{win.windowName}</span>
                    <span className="font-extrabold text-slate-500">{(win.startTime || '').substring(0, 5)} - {(win.endTime || '').substring(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">info</span>
            <span className="text-xs font-semibold text-amber-800 leading-relaxed">
              <strong>Important Note:</strong> The system will automatically deactivate any other active pricing policies for <strong>{vehicleTypeName}</strong> to prevent conflicts.
            </span>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
          <button 
            type="button"
            onClick={handleCloseActivateDialog}
            className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirmActivate}
            className="px-6 py-2.5 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-800/10 min-w-[155px] text-center"
          >
            Confirm Activation
          </button>
        </div>

      </div>
    </div>
  );
}
