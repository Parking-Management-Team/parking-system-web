'use client';

import { motion, type Variants } from 'framer-motion';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  MapPin,
  Clock,
  Shield,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Real-time Occupancy Tracking',
    description:
      'Zone-based management for motorcycles and slot-specific allocation for cars. Multi-floor, multi-building support with live capacity monitoring.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: Calendar,
    title: 'Smart Booking System',
    description:
      'Pre-book parking spots 1-8 hours in advance. Deposit fee equals first pricing block. Automatic slot allocation with 45-minute grace period.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: CreditCard,
    title: 'Monthly Card Management',
    description:
      'Guaranteed capacity for motorcycles, dedicated slots for cars. Unlimited daily entries with auto-downgrade when expired.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: DollarSign,
    title: 'Dynamic Pricing Engine',
    description:
      'Time window-based pricing with base duration and increment blocks. Window caps per time period with grace period rounding.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: Shield,
    title: 'Integrated Payment System',
    description:
      'Cash payment with rounding and online bank transfers with exact amounts. Automated deposit handling and refund processing.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: Building2,
    title: 'Multi-Vehicle Support',
    description:
      'Motorcycles and cars with different allocation logic. Expandable structure for additional vehicle types and custom rules.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: Clock,
    title: '24/7 Operation',
    description:
      'Continuous operation without session resets at midnight. Cross-window pricing calculation for multi-day parking sessions.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
  {
    icon: BarChart3,
    title: 'Operation Dashboard',
    description:
      'Real-time occupancy rates, revenue tracking, and session monitoring. Comprehensive zone and slot status overview for managers.',
    color: '#006d43',
    bgColor: '#e7f5ef',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export default function Features() {
  return (
    <section
      id="features"
      className="relative pt-32 pb-24 overflow-hidden"
      style={{ backgroundColor: '#f0f3ff' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#d8e3fb' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#dee8ff' }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12 mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: '#111c2d', fontFamily: 'Inter, sans-serif' }}
          >
            Intelligent Core Systems
          </h2>
          <p
            className="text-lg md:text-xl max-w-3xl mx-auto"
            style={{ color: '#3d4a41', fontFamily: 'Inter, sans-serif' }}
          >
            Advanced technology modules integrated into a single, seamless
            ecosystem for smarter cities.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: 'easeOut' },
                }}
                className="group relative bg-white rounded-[1.5rem] p-6 transition-all duration-300"
                style={{
                  boxShadow: '0 4px 20px -2px rgba(27, 42, 65, 0.08)',
                }}
              >
                {/* Icon Container */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                    strokeWidth={2}
                  />
                </div>

                {/* Content */}
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{
                    color: '#111c2d',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: '#3d4a41',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {feature.description}
                </p>

                {/* Hover Border Effect */}
                <div
                  className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    border: '2px solid #006d43',
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
            style={{
              backgroundColor: '#e7f5ef',
              color: '#006d43',
              fontFamily: 'Inter, sans-serif',
            }}
          >


          </div>
        </motion.div>
      </div>
    </section>
  );
}
