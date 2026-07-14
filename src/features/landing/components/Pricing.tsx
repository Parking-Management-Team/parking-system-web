'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

export default function Pricing() {
  const [mode, setMode] = useState<'day' | 'night'>('day')

  const rates = {
    moto: { day: { extra: '1,000₫/h', cap: '10,000₫' }, night: { extra: '2,000₫/h', cap: '20,000₫' } },
    car:  { day: { extra: '10,000₫/h', cap: '100,000₫' }, night: { extra: '12,000₫/h', cap: '120,000₫' } },
  }

  return (
    <section id="pricing" className="bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Editorial top border line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* ── Section label ── */}
        <motion.div {...fade()} className="mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-4">
            02 / Pricing
          </p>
          <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tight text-white">
            Pay for<br />
            <span className="text-emerald-400">what you use.</span>
          </h2>
        </motion.div>

        {/* ── Day / Night toggle ── */}
        <motion.div {...fade(0.1)} className="flex gap-1 mb-16 w-fit border border-white/10 rounded-full p-1">
          {(['day', 'night'] as const).map(t => (
            <button
              key={t}
              onClick={() => setMode(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                mode === t
                  ? t === 'day' ? 'bg-emerald-500 text-black' : 'bg-white text-black'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'day' ? '☀ Day' : '☽ Night'}
            </button>
          ))}
        </motion.div>

        {/* ── Cards ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {/* Motorcycle */}
          <motion.div
            {...fade(0.15)}
            className="group border border-white/8 rounded-2xl p-8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                <Bike className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Motorcycle</span>
            </div>

            <div className="mb-8">
              <div className="text-6xl font-black text-white leading-none">5K₫</div>
              <div className="text-white/30 text-sm mt-1 font-mono">first 4 hours</div>
            </div>

            <div className="space-y-3 text-sm border-t border-white/8 pt-6">
              <div className="flex justify-between">
                <span className="text-white/40">After 4h</span>
                <span className="text-white font-mono font-bold">+ {rates.moto[mode].extra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Daily cap</span>
                <span className="text-emerald-400 font-mono font-bold">{rates.moto[mode].cap}</span>
              </div>
            </div>
          </motion.div>

          {/* Car */}
          <motion.div
            {...fade(0.22)}
            className="group border border-emerald-500/20 rounded-2xl p-8 bg-emerald-950/20 hover:bg-emerald-950/30 hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden"
          >
            {/* Subtle corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Car className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Car</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Top Pick
              </span>
            </div>

            <div className="mb-8">
              <div className="text-6xl font-black text-white leading-none">30K₫</div>
              <div className="text-white/30 text-sm mt-1 font-mono">first 4 hours</div>
            </div>

            <div className="space-y-3 text-sm border-t border-emerald-500/10 pt-6">
              <div className="flex justify-between">
                <span className="text-white/40">After 4h</span>
                <span className="text-white font-mono font-bold">+ {rates.car[mode].extra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Daily cap</span>
                <span className="text-emerald-400 font-mono font-bold">{rates.car[mode].cap}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Grace Period footnote ── */}
        <motion.div
          {...fade(0.3)}
          className="flex items-start gap-4 border border-white/8 rounded-xl p-5 bg-white/[0.02]"
        >
          <span className="text-xl mt-0.5">⏱</span>
          <div>
            <span className="text-white font-semibold text-sm">15-min grace period. </span>
            <span className="text-white/40 text-sm">Minor overruns won't cost you a full block.</span>
          </div>
        </motion.div>

      </div>

      {/* Bottom border line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  )
}
