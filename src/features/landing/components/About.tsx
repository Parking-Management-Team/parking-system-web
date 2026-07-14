'use client'

import { motion } from 'framer-motion'
import { Car, Bike, LayoutDashboard, Zap, Clock, ShieldCheck } from 'lucide-react'

const cards = [
  {
    icon: Car,
    title: 'For Car Drivers',
    description: 'Book a dedicated parking slot up to 8 hours in advance, pay via app, and drive straight in with automated gate access — no waiting, no hassle.',
    stat: '30K₫',
    statLabel: 'starting price',
    color: '#006d43',
    bg: '#e7f5ef',
  },
  {
    icon: Bike,
    title: 'For Motorcycles',
    description: 'Access dedicated motorcycle zones with RFID or QR entry. Compact, secure, and priced just right for daily commuters.',
    stat: '5K₫',
    statLabel: 'starting price',
    color: '#006d43',
    bg: '#e7f5ef',
  },
  {
    icon: LayoutDashboard,
    title: 'For Facility Managers',
    description: 'Full real-time visibility across all lots, floors, and gates. Monitor sessions, manage incidents, and generate revenue reports from a single dashboard.',
    stat: '100%',
    statLabel: 'real-time',
    color: '#006d43',
    bg: '#e7f5ef',
  },
]

const badges = [
  { icon: Zap, label: 'Instant booking confirmation' },
  { icon: Clock, label: 'Pay-per-use, no subscriptions' },
  { icon: ShieldCheck, label: 'Secure RFID/QR access' },
]

export default function About() {
  return (
    <section id="about" className="section-padding bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
            style={{ background: '#e7f5ef', color: '#006d43' }}
          >
            Who We Serve
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl font-bold font-heading text-gray-900 mb-4"
          >
            Built for Drivers &amp; Managers Alike
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-gray-500 leading-relaxed"
          >
            NexPark connects drivers who need reliable parking with facility managers who want smarter operations — all in one intelligent platform.
          </motion.p>
        </div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {badges.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600 hover:border-emerald-400 transition-all"
              >
                <Icon className="w-4 h-4 text-emerald-500" />
                {b.label}
              </div>
            )
          })}
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="group relative bg-white border border-gray-200 rounded-3xl p-7 hover:shadow-xl transition-all duration-300 hover:border-emerald-300 flex flex-col"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: card.bg }}
                >
                  <Icon className="w-7 h-7" style={{ color: card.color }} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{card.description}</p>

                <div className="mt-6 pt-5 border-t border-gray-100 flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-extrabold font-heading" style={{ color: card.color }}>{card.stat}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{card.statLabel}</div>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                    style={{ background: card.bg }}
                  >
                    <span style={{ color: card.color }} className="text-sm font-bold">→</span>
                  </div>
                </div>

                {/* Hover border */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ border: '2px solid #10b981' }}
                />
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
