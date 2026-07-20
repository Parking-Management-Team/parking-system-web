'use client'

import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

const pillars = [
  { num: '01', label: 'Drivers', headline: 'Park. Pay. Go.', sub: 'Walk-in or pre-book. Entry via QR or RFID. Zero paperwork.' },
  { num: '02', label: 'Bikes',   headline: 'Zone-based, fair.', sub: 'Dedicated motorcycle zones with time-based flat pricing.' },
  { num: '03', label: 'Ops',     headline: 'Full visibility.', sub: 'Real-time dashboards, automated billing, incident management.' },
]

export default function About() {
  return (
    <section id="about" className="bg-white overflow-hidden">
      {/* Top separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Section label + headline */}
        <motion.div {...fade()} className="mb-20 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600 mb-4">01 / About NexPark</p>
          <h2 className="text-5xl md:text-6xl font-black text-[#0a0a0a] leading-none tracking-tight">
            Smart operations<br />
            <span className="text-emerald-500">at FPT Building.</span>
          </h2>
        </motion.div>

        {/* 3 pillars — horizontal editorial layout */}
        <div className="grid md:grid-cols-3 gap-0 border border-[#e8e8e8] rounded-2xl overflow-hidden">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              {...fade(0.1 + i * 0.1)}
              className={`group p-8 hover:bg-[#0a0a0a] transition-all duration-500 cursor-default relative ${
                i < pillars.length - 1 ? 'border-r border-[#e8e8e8]' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-10">
                <span className="font-mono text-[10px] text-[#a0a0a0] group-hover:text-white/30 transition-colors">{p.num}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#c0c0c0] group-hover:text-emerald-500 transition-colors">{p.label}</span>
              </div>

              <h3 className="text-2xl font-black text-[#0a0a0a] group-hover:text-white transition-colors leading-tight mb-3">
                {p.headline}
              </h3>
              <p className="text-sm text-[#707070] group-hover:text-white/50 transition-colors leading-relaxed">
                {p.sub}
              </p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>

        {/* Key stat strip */}
        <motion.div
          {...fade(0.35)}
          className="mt-10 grid grid-cols-3 gap-6"
        >
          {[
            { val: '500+', label: 'Parking slots' },
            { val: '45m',  label: 'Booking grace' },
            { val: '8h',   label: 'Max advance booking' },
          ].map((s, i) => (
            <div key={i} className="text-center border-t-2 border-[#e8e8e8] pt-6 hover:border-emerald-500 transition-colors duration-300">
              <div className="text-4xl font-black text-[#0a0a0a]">{s.val}</div>
              <div className="text-xs text-[#a0a0a0] font-mono uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
