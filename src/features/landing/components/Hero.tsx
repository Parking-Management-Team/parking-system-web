'use client'

import { motion } from 'framer-motion'
import TypewriterText from '@/components/ui/TypewriterText'
import CountUp from '@/components/ui/CountUp'

interface HeroProps {
  scrollToSection: (id: string) => void;
}

export default function Hero({ scrollToSection }: HeroProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
      >
        <source src="/assets/videos/parking-landingpage.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35 z-10" />

      {/* Content Container */}
      <div className="container mx-auto px-6 lg:px-12 relative z-20 w-full flex justify-center">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8 flex flex-col items-center justify-center w-full"
          >
            <h1 className="text-5xl lg:text-8xl font-extrabold font-heading text-white leading-tight tracking-tight text-center">
              Park Smarter with <br/>
              <span className="gradient-text font-black">
                <TypewriterText 
                  words={["NexPark.", "Efficiency.", "Automation."]} 
                  typingSpeed={90} 
                  deletingSpeed={45} 
                  delayBetweenWords={2500}
                />
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl font-light leading-relaxed mx-auto text-center">
              Experience the ultimate luxury of space optimization. NexPark delivers artificial intelligence driven spot allocation, predictive booking, and zero-wait payments.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={() => scrollToSection('pricing')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 text-lg cursor-pointer transition-all duration-300"
              >
                Get Started
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 border-2 border-white/40 hover:border-white text-white rounded-xl font-semibold backdrop-blur-sm hover:bg-white/10 text-lg cursor-pointer transition-all duration-300"
              >
                Learn More
              </motion.button>
            </div>

            {/* Premium Monospaced Stats */}
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6 pt-10 border-t border-white/10 w-full">
              <div className="space-y-1 text-center flex flex-col items-center justify-center min-w-[160px]">
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Active spots</p>
                <p className="text-4xl font-extrabold text-white font-heading">
                  <CountUp end={500} suffix="+" />
                </p>
                <p className="text-[10px] text-gray-400 font-mono">INTELLIGENT HUBS</p>
              </div>
              <div className="space-y-1 text-center flex flex-col items-center justify-center min-w-[160px]">
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Global drivers</p>
                <p className="text-4xl font-extrabold text-white font-heading">
                  <CountUp end={10} suffix="K+" />
                </p>
                <p className="text-[10px] text-gray-400 font-mono">VERIFIED USERS</p>
              </div>
              <div className="space-y-1 text-center flex flex-col items-center justify-center min-w-[160px]">
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Optimal Rate</p>
                <p className="text-4xl font-extrabold text-white font-heading">
                  <CountUp end={99.8} decimals={1} suffix="%" />
                </p>
                <p className="text-[10px] text-gray-400 font-mono">REAL-TIME MATCHING</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
