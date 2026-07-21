/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: Hero.tsx (KHỐI HERO BANNER CHÍNH CỦA LANDING PAGE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Banner ấn tượng đầu tiên của website NexPark tại Tòa nhà FPT:
 * 1. 🎬 Video nền tự động phát (`parking-landingpage.mp4`) với các lớp phủ mờ tối ưu hiển thị chữ.
 * 2. ✍️ Chữ chạy đa dạng (Typewriter Text) thay đổi từ khóa "with NexPark.", "at FPT Building.", "with AI.".
 * 3. 📊 Thống kê ấn tượng dạng số nhảy tăng dần (`CountUp` Component): 500+ vị trí đỗ, 10K+ tài xế tin dùng, 99.8% khớp thời gian thực.
 * 4. 🔗 Điều hướng cuộn mượt đến các section tiếp theo.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Zap, Shield } from 'lucide-react'
import TypewriterText from '@/components/ui/TypewriterText'
import CountUp from '@/components/ui/CountUp'

interface HeroProps {
  scrollToSection: (id: string) => void
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export default function Hero({ scrollToSection }: HeroProps) {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col overflow-hidden bg-black"
    >
      {/* Lớp phủ lưới thiết kế điện ảnh (Cinematic Grid Overlay) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-10" />

      {/* Video nền chạy tự động lặp lại */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-55"
      >
        <source src="/assets/videos/parking-landingpage.mp4" type="video/mp4" />
      </video>

      {/* Lớp phủ dải màu chuyển mờ để chữ nổi bật chuẩn tương phản */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

      {/* Đường viền phát sáng ở trên cùng */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent z-20" />

      {/* ===== NỘI DUNG CHÍNH HERO ===== */}
      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 lg:px-16 pt-40 pb-12 max-w-[1400px] mx-auto w-full">

        {/* ── Nhan đề Tiêu đề lớn ── */}
        <div className="mb-10">
          {/* Nhãn nhỏ mô tả dự án */}
          <motion.div {...fadeUp(0.15)} className="mb-6">
            <span className="font-mono text-xs text-white/60 uppercase tracking-[0.3em] border-l-2 border-emerald-500 pl-3">
              NexPark • Smart Parking Infrastructure • FPT Building
            </span>
          </motion.div>

          {/* Tiêu đề khổng lồ kết hợp chữ đánh máy */}
          <motion.h1
            {...fadeUp(0.2)}
            className="font-black text-white leading-[0.88] tracking-tighter uppercase select-none"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 7.5rem)' }}
          >
            Park Smarter
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500">
              <TypewriterText
                words={['with NexPark.', 'at FPT Building.', 'with AI.']}
                typingSpeed={80}
                deletingSpeed={40}
                delayBetweenWords={2800}
              />
            </span>
          </motion.h1>
        </div>

        {/* ── CỘT PHỤ: Đoạn mô tả ngắn & Các thẻ tính năng nổi bật ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-white/5 pt-10">

          {/* Mô tả giải pháp đỗ xe NexPark */}
          <motion.div {...fadeUp(0.3)} className="lg:col-span-5">
            <p className="text-base lg:text-lg text-white/50 font-light leading-relaxed max-w-md">
              Smart parking management system designed for FPT Building.
              Support spot reservation, automatic ALPR license plate recognition, and contactless payments.
            </p>
          </motion.div>

          {/* Các nút bấm & Nhãn micro-tags */}
          <motion.div {...fadeUp(0.4)} className="lg:col-span-7 flex flex-col gap-6">
            {/* Các thẻ tiêu biểu */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: MapPin, label: 'Real-time Tracking' },
                { icon: Zap, label: 'Instant Payment' },
                { icon: Shield, label: 'Zero Hidden Fees' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] font-mono text-[10px] uppercase tracking-widest text-white/50"
                  style={{ borderRadius: '2px' }}
                >
                  <Icon className="w-3 h-3 text-emerald-400" />
                  {label}
                </div>
              ))}
            </div>

            {/* Nút bấm chuyển hướng xuống các tính năng */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => scrollToSection('features')}
              className="group inline-flex items-center gap-3 cursor-pointer"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400 group-hover:text-emerald-300 transition-colors relative">
                Explore NexPark
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-400 group-hover:w-full transition-all duration-300" />
              </span>
              <span className="w-7 h-7 rounded-full border border-emerald-500/40 flex items-center justify-center group-hover:border-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                <ArrowRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ── BẢNG THỐNG KÊ ẤN TƯỢNG (SCHEMATIC STATS BAR) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative z-20 w-full border-t border-white/5 bg-black/60"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 grid grid-cols-3 divide-x divide-white/5">
          {/* Chỉ số 1: Số vị trí đỗ */}
          <div className="flex flex-col items-center justify-center py-7 gap-1 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/70">
              Active spots
            </p>
            <p
              className="font-black text-white leading-none tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              <CountUp end={500} suffix="+" duration={2200} />
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/20">
              INTELLIGENT HUBS
            </p>
          </div>

          {/* Chỉ số 2: Số người dùng */}
          <div className="flex flex-col items-center justify-center py-7 gap-1 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/70">
              Global drivers
            </p>
            <p
              className="font-black text-white leading-none tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              <CountUp end={10} suffix="K+" duration={2000} />
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/20">
              VERIFIED USERS
            </p>
          </div>

          {/* Chỉ số 3: Tỷ lệ chính xác */}
          <div className="flex flex-col items-center justify-center py-7 gap-1 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/70">
              Optimal rate
            </p>
            <p
              className="font-black text-white leading-none tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              <CountUp end={99.8} decimals={1} suffix="%" duration={2400} />
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/20">
              REAL-TIME MATCHING
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
