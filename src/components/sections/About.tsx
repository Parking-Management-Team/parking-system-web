'use client'

import { motion } from 'framer-motion'
import { Car, Bike, Shield } from 'lucide-react'

export default function About() {
  return (
    <section id="about" className="section-padding bg-white">
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
            className="card text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3">For Car Owners</h3>
            <p className="text-gray-600">
              Book parking spots in advance, pay securely, and enjoy seamless entry with our automated system.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -10 }}
            className="card text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bike className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3">For Motorcycles</h3>
            <p className="text-gray-600">
              Dedicated zones for motorcycles with easy access and secure parking solutions.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -10 }}
            className="card text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold font-heading mb-3">For Managers</h3>
            <p className="text-gray-600">
              Real-time monitoring, automated billing, and comprehensive management dashboard.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
