'use client'

import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

const features = [
  { tag: 'Access',   title: 'Live slot tracking',         body: 'Zone + floor. Car or bike. Updated every second.' },
  { tag: 'Booking',  title: 'Book up to 8h ahead',        body: '45-min grace. 1-block deposit. Auto-allocated.' },
  { tag: 'Sessions', title: 'RFID & QR entry',             body: 'Frictionless gate access — no ticket, no queue.' },
  { tag: 'Pricing',  title: 'Time-block billing',          body: 'Base rate + increments. Day & night windows. Hard cap.' },
  { tag: 'Payment',  title: 'Cash or bank transfer',       body: 'Auto-calculated on exit. Deposit auto-applied.' },
  { tag: 'Fleet',    title: 'Bikes & cars, one platform',  body: 'Different logic. Same system. Expandable.' },
]

export default function Features() {
  return (
    <section id="features" className="bg-[#f5f5f0] overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Headline */}
        <motion.div {...fade()} className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600 mb-4">03 / Features</p>
            <h2 className="text-5xl md:text-6xl font-black text-[#0a0a0a] leading-none tracking-tight">
              Every edge.<br />
              <span className="text-emerald-500">Covered.</span>
            </h2>
          </div>
          <p className="text-[#707070] text-sm leading-relaxed max-w-xs md:text-right">
            Six systems. One platform. Nothing missing.
          </p>
        </motion.div>

        {/* Feature list — numbered editorial */}
        <div className="divide-y divide-[#e0e0d8]">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fade(0.05 * i)}
              className="group flex items-start gap-6 py-7 hover:bg-[#0a0a0a]/[0.03] -mx-4 px-4 rounded-xl transition-colors duration-300 cursor-default"
            >
              {/* Number */}
              <span className="font-mono text-[10px] text-[#c0c0c0] w-6 shrink-0 mt-1">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Tag */}
              <span className="shrink-0 w-20 text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                {f.tag}
              </span>

              {/* Title */}
              <h3 className="flex-1 text-[#0a0a0a] font-bold text-base group-hover:text-emerald-600 transition-colors duration-300">
                {f.title}
              </h3>

              {/* Body */}
              <p className="hidden md:block flex-1 text-sm text-[#707070] leading-relaxed max-w-xs">
                {f.body}
              </p>

              {/* Arrow */}
              <span className="text-[#d0d0d0] group-hover:text-emerald-500 transition-colors duration-300 text-xl shrink-0">
                →
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
