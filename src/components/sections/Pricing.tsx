'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Pricing() {
  const [rateType, setRateType] = useState<'day' | 'night'>('day')

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4"
          >
            Pricing Policy
          </motion.h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Detailed pricing for walk-in customers and NexPark members
          </p>
        </div>

        {/* Rate Type Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-full p-1 shadow-md border border-gray-100">
            <button
              onClick={() => setRateType('day')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 ${
                rateType === 'day'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>☀️</span>
              <span>Day</span>
            </button>
            <button
              onClick={() => setRateType('night')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 ${
                rateType === 'night'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🌙</span>
              <span>Night</span>
            </button>
          </div>
        </div>

        {/* Vehicle Rate Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Motorcycle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Bike className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-heading text-emerald-600">5K₫</div>
                <div className="text-sm text-gray-500">first 4 hours</div>
              </div>
            </div>
            <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">Motorcycle</h3>
            <p className="text-gray-600 mb-4">Motorcycle Parking</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base (4h):</span>
                <span className="font-semibold">5,000₫</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">After 4h:</span>
                <span className="font-semibold">
                  {rateType === 'day' ? '+1,000₫/hour' : '+2,000₫/hour'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max cap:</span>
                <span className="font-semibold text-emerald-600">
                  {rateType === 'day' ? '10,000₫/day' : '20,000₫/night'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Standard Car Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-emerald-400 hover:border-emerald-500 hover:shadow-xl transition-all relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-heading text-emerald-600">30K₫</div>
                <div className="text-sm text-gray-500">first 4 hours</div>
              </div>
            </div>
            <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">Car</h3>
            <p className="text-gray-600 mb-4">Standard Car Parking</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base (4h):</span>
                <span className="font-semibold">30,000₫</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">After 4h:</span>
                <span className="font-semibold">
                  {rateType === 'day' ? '+10,000₫/hour' : '+12,000₫/hour'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max cap:</span>
                <span className="font-semibold text-emerald-600">
                  {rateType === 'day' ? '100,000₫/day' : '120,000₫/night'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Unlimited Access Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6">Monthly Pass</h3>

          {/* Monthly Pass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                {/* Left Side - Info */}
                <div className="flex-1">
                  <div className="inline-block bg-emerald-400 text-emerald-900 text-xs px-3 py-1 rounded-full font-bold mb-4">
                    MEMBER / VIP
                  </div>
                  <h4 className="text-4xl md:text-5xl font-bold font-heading mb-6">Monthly Pass</h4>

                  {/* Pricing Options */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <div className="flex items-center space-x-3 mb-3">
                        <Bike className="w-6 h-6" />
                        <span className="text-lg font-semibold">Motorcycle</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold font-heading">200K₫</span>
                        <span className="text-emerald-100">/month</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <div className="flex items-center space-x-3 mb-3">
                        <Car className="w-6 h-6" />
                        <span className="text-lg font-semibold">Car</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold font-heading">1.5M₫</span>
                        <span className="text-emerald-100">/month</span>
                      </div>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-emerald-50">24/7 Priority Access</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-emerald-50">Free EV Charging (Level 2)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-emerald-50">Reserved Executive Bays</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-emerald-50">Multi-Location Access</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - CTA */}
                <div className="md:text-right flex flex-col items-center md:items-end justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="shadow-lg hover:shadow-xl"
                  >
                    Upgrade Now
                  </Button>
                  <p className="text-emerald-100 text-sm mt-4">Cancel anytime. No hidden fees.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Grace Period Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start space-x-4"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold font-heading text-gray-900 mb-1">GRACE PERIOD</h4>
            <p className="text-gray-700">First 15 minutes excess time: no additional block charged. Over 15 minutes: charged as full additional block.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
