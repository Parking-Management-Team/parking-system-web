'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '🔍',
    title: 'Find Available Parking',
    description: 'Browse our map of smart parking facilities. See real-time slot availability by zone, floor, and vehicle type — all in seconds.',
  },
  {
    number: '02',
    icon: '📅',
    title: 'Book or Walk In',
    description: 'Reserve up to 8 hours ahead with a one-block deposit, or simply drive in as a walk-in customer. Your choice, your pace.',
  },
  {
    number: '03',
    icon: '🔑',
    title: 'Enter & Park',
    description: 'Present your QR code or registered RFID card at the gate. The barrier lifts automatically — no tickets, no queues.',
  },
  {
    number: '04',
    icon: '💳',
    title: 'Exit & Pay',
    description: 'On exit, fees are calculated automatically. Pay by cash or instant bank transfer. A 15-minute grace period protects against minor overruns.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section-padding bg-zinc-950 text-white relative overflow-hidden">
      {/* Glow bg */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 bg-emerald-500/10 text-emerald-400"
          >
            Simple 4-Step Process
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-heading mb-4 text-white"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 text-xl font-light"
          >
            From finding a spot to driving away — parking has never been this smooth.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.12 }}
              className="relative group"
            >
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-emerald-500/40 to-transparent z-0 pointer-events-none" style={{ width: '100%' }} />
              )}

              {/* Card */}
              <div className="relative bg-zinc-900/60 border border-zinc-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-emerald-500/5">
                {/* Step number watermark */}
                <div className="absolute -top-7 right-4 text-7xl font-black font-mono text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-300 select-none">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-5">{step.icon}</div>

                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-zinc-800 pt-12"
        >
          <p className="text-zinc-400 text-base font-light">No subscription required. Pay only for the time you use.</p>
          <span className="text-2xl">✅</span>
        </motion.div>
      </div>
    </section>
  )
}
