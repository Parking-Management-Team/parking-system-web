/**
 * Features Component - Section tính năng nổi bật
 *
 * Hiển thị "Our Vision" và 6 tính năng chính của NexPark:
 * 1. Real-time Occupancy Tracking - Theo dõi chỗ đỗ real-time
 * 2. Smart Booking System - Đặt chỗ trước
 * 3. Monthly Card Management - Quản lý thẻ tháng
 * 4. Dynamic Pricing Engine - Giá động theo giờ
 * 5. Integrated Payment System - Thanh toán tích hợp
 * 6. Multi-Vehicle Support - Hỗ trợ nhiều loại xe
 *
 * Component này được import vào page.tsx (landing page).
 * Sử dụng framer-motion cho animation (fade in, hover effects).
 */

'use client';

import { motion, type Variants } from 'framer-motion';
import {
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  Shield,
  Building2,
  Clock,
  BarChart3,
  Zap,
  HardHat,
  Users,
} from 'lucide-react';

// Dữ liệu cho section "Our Vision"
const visionData = {
  title: 'Our Vision',
  subtitle: 'Transforming Urban Mobility Through Intelligence',
  description: 'We envision cities where parking is seamless, sustainable, and stress-free. By integrating cutting-edge technology with urban infrastructure, we create intelligent parking solutions that reduce congestion, lower emissions, and enhance the quality of urban life for everyone.',
  icon: Zap,
  color: '#006d43',
  bgColor: '#e7f5ef',
};

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
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const visionVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const featuresVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      delay: 0.2,
    },
  },
};

export default function Features() {
  return (
    <section
      id="features"
      className="relative pt-24 pb-20 overflow-hidden"
      style={{ backgroundColor: '#f8fafc' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#e0f2fe' }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#dcfce7' }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Vision Section */}
        <motion.div
          variants={visionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mb-16 text-center"
        >
          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{
              backgroundColor: visionData.bgColor,
              color: visionData.color,
            }}
          >
            <visionData.icon className="w-4 h-4" />
            <span>{visionData.title}</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{
              color: '#1e293b',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.2',
            }}
          >
            {visionData.subtitle}
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground"
            style={{
              color: '#64748b',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6',
            }}
          >
            {visionData.description}
          </p>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={featuresVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-8"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.slice(0, 3).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    transition: { duration: 0.3, ease: 'easeOut' },
                  }}
                  className="group relative bg-white rounded-xl p-6 border border-muted/20 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Icon Container */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: feature.bgColor }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{
                      color: '#1e293b',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed text-muted-foreground"
                    style={{
                      color: '#64748b',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Hover Border Effect */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: '1px solid #006d43',
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.slice(3, 6).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index + 3}
                  variants={itemVariants}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    transition: { duration: 0.3, ease: 'easeOut' },
                  }}
                  className="group relative bg-white rounded-xl p-6 border border-muted/20 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Icon Container */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: feature.bgColor }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{
                      color: '#1e293b',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed text-muted-foreground"
                    style={{
                      color: '#64748b',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Hover Border Effect */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: '1px solid #006d43',
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
