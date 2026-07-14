'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Car, Clock, CheckCircle, Info } from 'lucide-react'

export default function Pricing() {
  const [rateType, setRateType] = useState<'day' | 'night'>('day')

  const motorcycleRates = {
    day:   { extra: '+1,000₫/hour', cap: '10,000₫/day' },
    night: { extra: '+2,000₫/hour', cap: '20,000₫/night' },
  }
  const carRates = {
    day:   { extra: '+10,000₫/hour', cap: '100,000₫/day' },
    night: { extra: '+12,000₫/hour', cap: '120,000₫/night' },
  }

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container mx-auto px-6 lg:px-12 max-w-5xl">

        {/* ── Header ── */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: '#e7f5ef', color: '#006d43' }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Transparent Pricing — No Subscriptions
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4"
          >
            Pay Only When You Park
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-500 max-w-xl mx-auto"
          >
            Simple, time-based pricing for walk-in customers and advance bookings. No hidden fees, no commitments.
          </motion.p>
        </div>

        {/* ── Day / Night Toggle ── */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            {(['day', 'night'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRateType(t)}
                className={`px-7 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  rateType === t
                    ? t === 'day'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-800 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{t === 'day' ? '☀️' : '🌙'}</span>
                <span className="capitalize">{t === 'day' ? 'Daytime (6am–10pm)' : 'Overnight (10pm–6am)'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Rate Cards ── */}
        <div className="grid md:grid-cols-2 gap-7 mb-10">
          {/* Motorcycle */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0, ease: 'easeOut' }}
            className="group relative bg-gray-50 border border-gray-200 rounded-3xl p-8 hover:border-emerald-400 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Bike className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Motorcycle</h3>
                  <p className="text-sm text-gray-400">Zone-based parking</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-emerald-600 font-heading">5,000₫</div>
                <div className="text-xs text-gray-400 font-medium">first 4 hours</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Base duration</span>
                <span className="font-bold text-gray-800">4 hours</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">After 4 hours</span>
                <span className="font-bold text-gray-800">{motorcycleRates[rateType].extra}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500 font-medium">Daily cap</span>
                <span className="font-extrabold text-emerald-600">{motorcycleRates[rateType].cap}</span>
              </div>
            </div>

            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ border: '2px solid #10b981' }} />
          </motion.div>

          {/* Car */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="group relative bg-gray-50 border-2 border-emerald-400 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300"
          >
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-8">
              <span className="bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Most Booked
              </span>
            </div>

            <div className="flex items-start justify-between mb-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Car</h3>
                  <p className="text-sm text-gray-400">Dedicated slot parking</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-emerald-600 font-heading">30,000₫</div>
                <div className="text-xs text-gray-400 font-medium">first 4 hours</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Base duration</span>
                <span className="font-bold text-gray-800">4 hours</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">After 4 hours</span>
                <span className="font-bold text-gray-800">{carRates[rateType].extra}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500 font-medium">Daily cap</span>
                <span className="font-extrabold text-emerald-600">{carRates[rateType].cap}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Booking Perk Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center gap-5"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-3xl">📅</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold mb-1">Advance Booking Saves Your Spot</h4>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Pre-book up to 8 hours in advance. Your slot is reserved the moment you pay the deposit fee (equal to 1 pricing block). A 45-minute grace period ensures you are never penalized for minor delays.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-sm font-semibold">
            <div className="text-center">
              <div className="text-2xl font-extrabold">8h</div>
              <div className="text-emerald-200 font-medium">advance</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold">45m</div>
              <div className="text-emerald-200 font-medium">grace</div>
            </div>
          </div>
        </motion.div>

        {/* ── Grace Period Notice ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-0.5 text-sm">Grace Period Policy</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              First <strong>15 minutes</strong> of excess time: no additional block charged. Over 15 minutes: charged as one full additional pricing block.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
