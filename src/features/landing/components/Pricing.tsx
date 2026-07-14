'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'
import { useLandingPricing, type VehicleRate } from '../hooks/useLandingPricing'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

function formatVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M₫`
  if (value >= 1_000)    return `${(value / 1_000).toFixed(0)}K₫`
  return `${value}₫`
}

function RateCard({
  icon: Icon,
  label,
  sublabel,
  rate,
  highlight,
  delay,
}: {
  icon: typeof Car
  label: string
  sublabel: string
  rate: VehicleRate | null
  highlight?: boolean
  delay: number
}) {
  if (!rate) return null

  return (
    <motion.div
      {...fade(delay)}
      className={`group border rounded-2xl p-8 transition-all duration-500 relative overflow-hidden ${
        highlight
          ? 'border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/30 hover:border-emerald-500/50'
          : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/30'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-8">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Top Pick
          </span>
        </div>
      )}

      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12" />
      )}

      <div className={`flex items-center gap-3 mb-8 ${highlight ? 'pt-3' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
          highlight ? 'border-emerald-500/30' : 'border-white/10 group-hover:border-emerald-500/40'
        }`}>
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</span>
          <div className="text-[10px] text-white/25 font-mono">{sublabel}</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-6xl font-black text-white leading-none">{formatVND(rate.basePrice)}</div>
        <div className="text-white/30 text-sm mt-1 font-mono">
          first {rate.baseDurationHours % 1 === 0 ? rate.baseDurationHours.toFixed(0) : rate.baseDurationHours.toFixed(1)} hours
        </div>
      </div>

      <div className={`space-y-3 text-sm pt-6 border-t ${highlight ? 'border-emerald-500/10' : 'border-white/8'}`}>
        <div className="flex justify-between">
          <span className="text-white/40">After base</span>
          <span className="text-white font-mono font-bold">+ {formatVND(rate.extraPerHour)}/h</span>
        </div>
        {rate.cap !== null && (
          <div className="flex justify-between">
            <span className="text-white/40">Daily cap</span>
            <span className="text-emerald-400 font-mono font-bold">{formatVND(rate.cap)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard({ highlight }: { highlight?: boolean }) {
  return (
    <div className={`border rounded-2xl p-8 animate-pulse ${
      highlight ? 'border-emerald-500/10 bg-emerald-950/10' : 'border-white/5 bg-white/[0.02]'
    }`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-white/10 rounded-xl" />
        <div className="h-3 w-24 bg-white/10 rounded" />
      </div>
      <div className="h-14 w-32 bg-white/10 rounded mb-2" />
      <div className="h-3 w-20 bg-white/5 rounded mb-8" />
      <div className="space-y-3 pt-6 border-t border-white/5">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-14 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function Pricing() {
  const [mode, setMode] = useState<'day' | 'night'>('day')
  const { data, loading, error } = useLandingPricing()

  const motoRate = mode === 'day' ? data.motorcycle.day : data.motorcycle.night
  const carRate  = mode === 'day' ? data.car.day         : data.car.night

  return (
    <section id="pricing" className="bg-[#0a0a0a] text-white overflow-hidden relative">
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

        {/* ── Error State ── */}
        {error && (
          <motion.div {...fade(0.1)} className="mb-10 border border-red-500/20 bg-red-950/20 rounded-2xl p-6 text-red-400 text-sm font-mono">
            ⚠ {error}
          </motion.div>
        )}

        {/* ── Cards ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard highlight />
            </>
          ) : (
            <>
              <RateCard
                icon={Bike}
                label="Motorcycle"
                sublabel="Zone-based parking"
                rate={motoRate}
                delay={0.15}
              />
              <RateCard
                icon={Car}
                label="Car"
                sublabel="Dedicated slot parking"
                rate={carRate}
                highlight
                delay={0.22}
              />
            </>
          )}
        </div>

        {/* ── Grace Period footnote ── */}
        <motion.div
          {...fade(0.3)}
          className="flex items-start gap-4 border border-white/8 rounded-xl p-5 bg-white/[0.02]"
        >
          <span className="text-xl mt-0.5">⏱</span>
          <div>
            <span className="text-white font-semibold text-sm">
              {data.gracePeriodMinutes}-min grace period.{' '}
            </span>
            <span className="text-white/40 text-sm">Minor overruns won't cost you a full block.</span>
          </div>
        </motion.div>

      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  )
}
