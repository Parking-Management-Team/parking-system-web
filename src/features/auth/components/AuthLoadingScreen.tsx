'use client';

import * as React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message = 'Authenticating your account...' }: AuthLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* CSS Keyframes for High-tech Animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-pulse-ring::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid #10b981; /* emerald-500 */
          animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .animate-pulse-ring::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          animation-delay: 1.25s;
        }
        .scan-overlay {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(16, 185, 129, 0) 100%);
          position: absolute;
          width: 100%;
          height: 30%;
          animation: scan-line 3s linear infinite;
        }
      `}</style>

      {/* Background Subtle Tech Grid */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1.5px, transparent 0)', 
          backgroundSize: '28px 28px' 
        }} 
      />

      {/* Atmospheric Glowing Orbs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
        
        {/* Animated High-Tech Spinner */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8 scale-110">
          {/* Outer rotating ring */}
          <div 
            className="absolute inset-0 rounded-full border-[3px] border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" 
            style={{ animationDuration: '2.5s' }} 
          />
          {/* Inner reverse rotating ring */}
          <div 
            className="absolute inset-3 rounded-full border-2 border-b-emerald-400 border-l-emerald-400 border-t-transparent border-r-transparent animate-spin" 
            style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} 
          />
          {/* Center pulsing core with icon */}
          <div className="relative w-16 h-16 bg-emerald-950/40 border border-emerald-500/30 rounded-full flex items-center justify-center animate-pulse-ring">
            <Lock className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          {/* Scan line effect over spinner */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="scan-overlay" />
          </div>
        </div>

        {/* NexPark Brand Identity */}
        <div className="flex flex-col items-center gap-1.5 mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight font-heading flex items-center gap-2">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              NexPark
            </span>
          </h1>
          <p className="text-[10px] font-semibold text-emerald-500 tracking-[0.3em] uppercase opacity-90">
            Smart Parking Management
          </p>
        </div>

        {/* Status & Progress */}
        <div className="w-full flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">
            {message}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Please wait a moment
          </p>
          
          {/* Progress Indicator (Dots) */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

      </div>

      {/* Bottom Security Badge */}
      <div className="absolute bottom-10 flex items-center gap-2 text-slate-500/80 font-medium tracking-wide">
        <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-sans">
          Secured Connection
        </span>
      </div>
    </div>
  );
}
