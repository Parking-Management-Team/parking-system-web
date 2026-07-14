'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Car, PhoneCall } from 'lucide-react'
import { useLandingPricing, type VehicleRate } from '../hooks/useLandingPricing'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

// ── Fallback rates (shown when API is unavailable) ──────────────────────────
const FALLBACK: {
  motorcycle: { day: VehicleRate; night: VehicleRate }
  car:        { day: VehicleRate; night: VehicleRate }
  gracePeriodMinutes: number
  isFallback: true
} = {
  motorcycle: {
    day:   { basePrice: 5_000,  baseDurationHours: 4, extraPerHour: 1_000,  cap: 10_000,  gracePeriodMinutes: 15, windowName: 'Day' },
    night: { basePrice: 5_000,  baseDurationHours: 4, extraPerHour: 2_000,  cap: 20_000,  gracePeriodMinutes: 15, windowName: 'Night' },
  },
  car: {
    day:   { basePrice: 30_000, baseDurationHours: 4, extraPerHour: 10_000, cap: 100_000, gracePeriodMinutes: 15, windowName: 'Day' },
    night: { basePrice: 30_000, baseDurationHours: 4, extraPerHour: 12_000, cap: 120_000, gracePeriodMinutes: 15, windowName: 'Night' },
  },
  gracePeriodMinutes: 15,
  isFallback: true,
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtVND(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M₫`
  if (v >= 1_000)     return `${Math.round(v / 1_000)}K₫`
  return `${v}₫`
}

function fmtHours(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

// ── Rate Card ────────────────────────────────────────────────────────────────
function RateCard({
  icon: Icon, label, sublabel, rate, highlight, delay,
}: {
  icon: typeof Car; label: string; sublabel: string
  rate: VehicleRate; highlight?: boolean; delay: number
}) {
  return (
    <motion.div
      {...fade(delay)}
      className={`group relative border rounded-2xl p-8 transition-all duration-500 overflow-hidden ${
        highlight
          ? 'border-emerald-500/25 bg-emerald-950/20 hover:bg-emerald-950/35 hover:border-emerald-500/60'
          : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-emerald-500/30'
      }`}
    >
      {/* Corner glow */}
      {highlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.06] rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
      )}

      {/* Top badge */}
      {highlight && (
        <div className="absolute -top-3.5 left-8">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            Most Booked
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center gap-3 mb-10 ${highlight ? 'pt-3' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
          highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 group-hover:border-emerald-500/40'
        }`}>
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-white/50">{label}</div>
          <div className="text-[10px] text-white/25 font-mono leading-tight">{sublabel}</div>
        </div>
      </div>

      {/* Price hero — oversized, always visible */}
      <div className="mb-9">
        <div
          className="font-black text-white leading-none tracking-tight select-none"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          {fmtVND(rate.basePrice)}
        </div>
        <div className="text-white/30 text-[11px] mt-2 font-mono uppercase tracking-widest">
          first {fmtHours(rate.baseDurationHours)}
        </div>
      </div>

      {/* Rate breakdown */}
      <div className={`space-y-3 pt-5 border-t text-sm ${highlight ? 'border-emerald-500/10' : 'border-white/8'}`}>
        <div className="flex justify-between items-center">
          <span className="text-white/35 font-mono text-xs uppercase tracking-wider">After base</span>
          <span className="text-white font-bold font-mono">+{fmtVND(rate.extraPerHour)}/h</span>
        </div>
        {rate.cap !== null && (
          <div className="flex justify-between items-center">
            <span className="text-white/35 font-mono text-xs uppercase tracking-wider">Daily cap</span>
            <span className="text-emerald-400 font-bold font-mono">{fmtVND(rate.cap)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ highlight }: { highlight?: boolean }) {
  return (
    <div className={`border rounded-2xl p-8 ${highlight ? 'border-emerald-500/10 bg-emerald-950/10' : 'border-white/5 bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-white/8 rounded-xl animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-20 bg-white/8 rounded animate-pulse" />
          <div className="h-2 w-14 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-14 w-28 bg-white/8 rounded-lg animate-pulse mb-2" />
      <div className="h-2.5 w-20 bg-white/5 rounded animate-pulse mb-9" />
      <div className="pt-5 border-t border-white/5 space-y-3">
        <div className="flex justify-between">
          <div className="h-2.5 w-16 bg-white/5 rounded animate-pulse" />
          <div className="h-2.5 w-20 bg-white/8 rounded animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-2.5 w-14 bg-white/5 rounded animate-pulse" />
          <div className="h-2.5 w-18 bg-white/8 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Pricing() {
  const [mode, setMode] = useState<'day' | 'night'>('day')
  const { data, loading, error } = useLandingPricing()

  // Use real data if available, else fallback silently
  const hasMotoDay  = !!data.motorcycle.day
  const hasCarDay   = !!data.car.day
  const hasRealData = hasMotoDay || hasCarDay

  const display = hasRealData ? data : FALLBACK
  const isFallback = !hasRealData

  const moto = mode === 'day' ? display.motorcycle.day  : display.motorcycle.night
  const car  = mode === 'day' ? display.car.day          : display.car.night

  // If night window doesn't exist in real data, fall back to day rate for that vehicle
  const motoRate = moto ?? display.motorcycle.day
  const carRate  = car  ?? display.car.day

  return (
    <section id="pricing" className="bg-[#0a0a0a] text-white overflow-hidden relative">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Section label */}
        <motion.div {...fade()} className="mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-4">02 / Pricing</p>
          <h2 className="font-black leading-none tracking-tight text-white" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
            Pay for<br />
            <span className="text-emerald-400">what you use.</span>
          </h2>
        </motion.div>

        {/* Fallback notice — only if using hardcoded data & API had an error */}
        {!loading && (error || isFallback) && (
          <motion.div {...fade(0.08)} className="mb-10 flex items-center gap-3 border border-white/10 rounded-xl px-5 py-3.5 bg-white/[0.02]">
            <span className="text-white/30 text-lg">📋</span>
            <p className="text-white/35 text-xs font-mono leading-relaxed">
              Showing reference rates — contact us for the latest active pricing.
            </p>
            <a
              href="#contact"
              className="ml-auto shrink-0 flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 text-xs font-bold transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              Contact
            </a>
          </motion.div>
        )}

        {/* Day / Night toggle */}
        <motion.div {...fade(0.1)} className="flex gap-1 mb-14 w-fit border border-white/10 rounded-full p-1">
          {(['day', 'night'] as const).map(t => (
            <button
              key={t}
              onClick={() => setMode(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer select-none ${
                mode === t
                  ? t === 'day' ? 'bg-emerald-500 text-black' : 'bg-white text-black'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'day' ? '☀ Day' : '☽ Night'}
            </button>
          ))}
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {loading ? (
            <>
              <Skeleton />
              <Skeleton highlight />
            </>
          ) : (
            <>
              {motoRate && (
                <RateCard icon={Bike} label="Motorcycle" sublabel="Zone-based parking" rate={motoRate} delay={0.15} />
              )}
              {carRate && (
                <RateCard icon={Car} label="Car" sublabel="Dedicated slot parking" rate={carRate} highlight delay={0.22} />
              )}
            </>
          )}
        </div>

        {/* Grace period footnote */}
        <motion.div
          {...fade(0.3)}
          className="flex items-start gap-4 border border-white/8 rounded-xl px-5 py-4 bg-white/[0.02]"
        >
          <span className="text-xl shrink-0">⏱</span>
          <p className="text-sm leading-relaxed">
            <span className="text-white font-semibold">{display.gracePeriodMinutes}-min grace period. </span>
            <span className="text-white/35">Minor overruns won&apos;t cost you a full block.</span>
          </p>
        </motion.div>

      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  )
}
