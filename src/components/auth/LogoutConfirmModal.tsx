'use client';

import React from 'react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden transition-all transform scale-100 opacity-100 animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="flex items-center gap-3 mb-3 text-rose-600">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">logout</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Confirm Logout</h3>
            <p className="text-xs text-slate-500 font-medium">NexPark Security</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Are you sure you want to log out of your account?
        </p>

        <div className="flex gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoggingOut ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging out...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">logout</span>
                Log Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
