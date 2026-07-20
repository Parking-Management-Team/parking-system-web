'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Cpu } from 'lucide-react'
import Link from 'next/link'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#050505] text-white relative overflow-hidden py-32 lg:py-48">
      {/* Cinematic grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Tech radial glowing spots */}
      <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full filter blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/10 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full filter blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
        
        {/* Monospace Tech Tag */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-ping" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">
            SYSTEM NODE: VALUE_METRICS // ACTIVE
          </p>
        </motion.div>

        {/* Asymmetric Header Layout */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-24">
          <motion.div {...fadeUp(0.1)} className="lg:col-span-8">
            <h2 
              className="font-black leading-[0.9] tracking-tighter text-white select-none"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
            >
              AFFORDABLE.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-200">
                TAILORED. TRANSPARENT.
              </span>
            </h2>
          </motion.div>
          
          <motion.div {...fadeUp(0.2)} className="lg:col-span-4 lg:pt-8 text-white/50 space-y-4">
            <p className="text-sm font-mono leading-relaxed uppercase tracking-wider border-l border-emerald-500/40 pl-4">
              We believe parking shouldn't be a financial burden. NexPark implements a flexible, building-specific pricing structure to ensure the most optimized and affordable rates.
            </p>
          </motion.div>
        </div>

        {/* Cinematic Schematic Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 border-t border-white/5 pt-16">
          
          {/* Left Column: Blueprint Schematic Flow */}
          <div className="lg:col-span-7 space-y-12 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/5" />
            
            {/* Step 1 */}
            <motion.div {...fadeUp(0.1)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-emerald-500 bg-[#050505] flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-400" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">01 / Smart Location Calibration</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Optimized by Facility
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                No rigid flat rates. Parking rates are dynamically calibrated to match the specific market, demand, and amenities of the facility you use.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div {...fadeUp(0.2)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-white/20 bg-[#050505] flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <div className="w-1 h-1 bg-white/40 group-hover:bg-emerald-400 transition-colors" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">02 / Micro-Billing</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Fractional Block Billing
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                Say goodbye to rounded-up hourly overcharges. Your parking session is calculated in precise, small increments, ensuring you only pay for your actual stay.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div {...fadeUp(0.3)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-white/20 bg-[#050505] flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <div className="w-1 h-1 bg-white/40 group-hover:bg-emerald-400 transition-colors" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">03 / Cap Security</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Daily Capping Limits
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                Park all day with absolute peace of mind. The billing engine automatically locks the maximum daily fee, preventing unexpected bill surprises.
              </p>
            </motion.div>

          </div>

          {/* Right Column: Value Guarantee Block */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <motion.div 
              {...fadeUp(0.25)}
              className="border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 lg:p-10 relative overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              {/* Subtle Tech grid background in card */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">NexPark Guarantee</h4>
                    <p className="text-[10px] text-white/30 font-mono">SECURE BILLING PROTOCOL</p>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">No hidden surcharges or account maintenance fees.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">No dynamic surge pricing during peak hours or weather events.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">Instant access to detailed parking history and e-receipts 24/7.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">Sign in to check the active real-time rate card for any specific facility.</span>
                  </li>
                </ul>

                {/* Call to action */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <Link 
                    href="/login" 
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl group"
                  >
                    Sign In to Check Rates
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/30">
                    <span>STATUS: READY</span>
                    <span>SECURE TRANSACTION</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom info link */}
            <motion.div {...fadeUp(0.4)} className="mt-8 lg:mt-0 text-center lg:text-left">
              <p className="text-xs text-white/30">
                Are you a building manager looking to optimize your facility's parking rates?{' '}
                <a href="#contact" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">
                  Partner with us
                </a>
              </p>
            </motion.div>

          </div>

        </div>

      </div>

      {/* Bottom technical border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  )
}

