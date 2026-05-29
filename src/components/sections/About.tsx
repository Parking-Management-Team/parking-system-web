'use client'

import { motion } from 'framer-motion'
import { Car, Bike, Shield } from 'lucide-react'

export default function About() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold font-heading text-gray-900 mb-4">About NexPark</h2>
          <p className="text-xl text-gray-600">
            NexPark is revolutionizing the parking industry with intelligent solutions
            that make finding and managing parking spaces easier than ever before.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -10 }}
            className="p-8 bg-gray-50 border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">For Car Owners</h3>
            <p className="text-gray-600 leading-relaxed">
              Book parking spots in advance, pay securely, and enjoy seamless entry with our automated system.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -10 }}
            className="p-8 bg-gray-50 border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bike className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">For Motorcycles</h3>
            <p className="text-gray-600 leading-relaxed">
              Dedicated zones for motorcycles with easy access and secure parking solutions.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -10 }}
            className="p-8 bg-gray-50 border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">For Managers</h3>
            <p className="text-gray-600 leading-relaxed">
              Real-time monitoring, automated billing, and comprehensive management dashboard.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
