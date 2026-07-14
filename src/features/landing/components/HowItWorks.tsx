'use client'

import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

const steps = [
  { n: '01', title: 'Find',  body: 'Browse real-time slot availability by zone and vehicle type.' },
  { n: '02', title: 'Book',  body: 'Walk in or pre-book up to 8 hours ahead with a deposit.' },
  { n: '03', title: 'Enter', body: 'Tap RFID or scan QR. Barrier lifts. Drive in.' },
  { n: '04', title: 'Pay',   body: 'Auto-calculated fee on exit. Cash or transfer.' },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#0a0a0a] text-white overflow-hidden relative">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Headline */}
        <motion.div {...fade()} className="mb-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-4">
            04 / How It Works
          </p>
          <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
            Four steps.<br />
            <span className="text-emerald-400">That's it.</span>
          </h2>
        </motion.div>

        {/* Steps — cinematic horizontal */}
        <div className="grid md:grid-cols-4 gap-0 border border-white/8 rounded-2xl overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...fade(0.08 * i)}
              className={`group p-7 hover:bg-emerald-500 transition-all duration-500 cursor-default ${
                i < steps.length - 1 ? 'border-r border-white/8' : ''
              }`}
            >
              <div className="font-mono text-[10px] text-white/20 group-hover:text-black/30 mb-8 transition-colors">{s.n}</div>
              <div className="text-3xl font-black text-white group-hover:text-black mb-3 transition-colors">{s.title}</div>
              <div className="text-xs text-white/40 group-hover:text-black/60 leading-relaxed transition-colors">{s.body}</div>
            </motion.div>
          ))}
        </div>

        {/* Bottom footnote */}
        <motion.p
          {...fade(0.4)}
          className="mt-8 text-center text-sm text-white/25 font-mono"
        >
          No subscription. No commitment. Pay per visit.
        </motion.p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  )
}
