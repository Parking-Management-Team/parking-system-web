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
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden transition-all transform scale-100 opacity-100 animate-in fade-in zoom-in duration-200 border border-slate-100 text-center">
        {/* Centered Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3.5 shadow-xs">
          <span className="material-symbols-outlined text-2xl">logout</span>
        </div>

        {/* Centered Heading */}
        <h3 className="text-lg font-extrabold text-slate-800">Confirm Logout</h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5 mb-3">NexPark Security</p>

        {/* Centered Message */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Are you sure you want to log out of your account?
        </p>

        {/* Centered Equal-Width Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
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
