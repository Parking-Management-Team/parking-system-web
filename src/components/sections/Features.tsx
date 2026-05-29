'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar, CreditCard, Shield, Clock, Users } from 'lucide-react'

// Features dataset
const featuresList = [
  {
    icon: <MapPin className="w-8 h-8 text-emerald-600" />,
    title: 'Smart Allocation',
    description: 'Intelligent parking space allocation based on vehicle type and availability in real-time.'
  },
  {
    icon: <Calendar className="w-8 h-8 text-emerald-600" />,
    title: 'Advanced Booking',
    description: 'Book parking spots up to 8 hours in advance with secure deposit system.'
  },
  {
    icon: <CreditCard className="w-8 h-8 text-emerald-600" />,
    title: 'Flexible Payments',
    description: 'Multiple payment options including cash, online banking, and monthly subscriptions.'
  },
  {
    icon: <Shield className="w-8 h-8 text-emerald-600" />,
    title: 'Secure Management',
    description: 'Comprehensive security features with real-time monitoring and access control.'
  },
  {
    icon: <Clock className="w-8 h-8 text-emerald-600" />,
    title: 'Dynamic Pricing',
    description: 'Time-based pricing with grace periods and window caps for fair billing.'
  },
  {
    icon: <Users className="w-8 h-8 text-emerald-600" />,
    title: 'Multi-User Support',
    description: 'Support for drivers, staff, and managers with role-based access control.'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold font-heading text-gray-900 mb-4">Smart Features</h2>
          <p className="text-xl text-gray-600">
            Everything you need for seamless parking management in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
