/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: Pricing.tsx (SECTION CHÍNH SÁCH GIÁ BÃI ĐỖ XE TỐI ƯU)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Giới thiệu biểu phí đỗ xe minh bạch, tối ưu theo từng tòa nhà và từng loại phương tiện:
 * 1. 📍 Smart Location Calibration: Mức phí được tùy chỉnh theo tiện ích hạ tầng tòa nhà.
 * 2. ⏱️ Fractional Block Billing: Tính tiền chính xác theo từng block thời gian, không làm tròn quá mức.
 * 3. 🛡️ Cap Security: Áp dụng mức trần giá tối đa theo ngày, tránh phát sinh chi phí ngoài ý muốn.
 * 4. 🔒 NexPark Guarantee: Cam kết không phí ẩn, hỗ trợ xuất hóa đơn điện tử 24/7.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Cpu } from 'lucide-react'
import Link from 'next/link'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#050505] text-white relative overflow-hidden py-32 lg:py-48">
      {/* Lớp phủ họa tiết lưới điện ảnh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Các điểm sáng màu xanh emerald tạo độ sâu cho giao diện */}
      <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full filter blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/10 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full filter blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Đường viền trang trí phát sáng phía trên */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
        
        {/* Nhãn kỹ thuật Monospace */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-ping" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">
            SYSTEM NODE: VALUE_METRICS // ACTIVE
          </p>
        </motion.div>

        {/* Tiêu đề chính phần Biểu phí */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-24">
          <motion.div {...fadeUp(0.1)} className="lg:col-span-8">
            <h2 
              className="font-black leading-[0.9] tracking-tighter text-white select-none"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
            >
              FAIR.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-200">
                TRANSPARENT. OPTIMIZED.
              </span>
            </h2>
          </motion.div>
          
          <motion.div {...fadeUp(0.2)} className="lg:col-span-4 lg:pt-8 text-white/50 space-y-4">
            <p className="text-sm font-mono leading-relaxed uppercase tracking-wider border-l border-emerald-500/40 pl-4">
              We believe parking should never be a cost burden. NexPark applies flexible, clear, and optimized pricing for every user.
            </p>
          </motion.div>
        </div>

        {/* Sơ đồ cấu trúc giá đỗ xe */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 border-t border-white/5 pt-16">
          
          {/* Cột trái: 3 bước nguyên tắc tính phí */}
          <div className="lg:col-span-7 space-y-12 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/5" />
            
            {/* Nguyên tắc 1 */}
            <motion.div {...fadeUp(0.1)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-emerald-500 bg-[#050505] flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-400" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">01 / Infrastructure Pricing</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Facility-Based Optimization
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                No rigid fee structures. Rates are dynamically adjusted to fit the features and amenities of each building.
              </p>
            </motion.div>

            {/* Nguyên tắc 2 */}
            <motion.div {...fadeUp(0.2)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-white/20 bg-[#050505] flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <div className="w-1 h-1 bg-white/40 group-hover:bg-emerald-400 transition-colors" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">02 / Fractional Block Billing</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Accurate Pay-as-You-Park
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                Say goodbye to rounding up to whole hours. Your parking session is billed based on actual duration.
              </p>
            </motion.div>

            {/* Nguyên tắc 3 */}
            <motion.div {...fadeUp(0.3)} className="relative pl-12 group">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 border border-white/20 bg-[#050505] flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <div className="w-1 h-1 bg-white/40 group-hover:bg-emerald-400 transition-colors" />
              </div>
              <div className="font-mono text-xs text-white/30 uppercase tracking-widest mb-1">03 / Daily Fee Capping</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Maximum Daily Rate Limit
              </h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xl">
                Park all day with peace of mind. The system automatically caps daily fees so you never face unexpected costs.
              </p>
            </motion.div>

          </div>

          {/* Cột phải: Thẻ cam kết bảo đảm chất lượng NexPark */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <motion.div 
              {...fadeUp(0.25)}
              className="border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 lg:p-10 relative overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">NexPark Commitments</h4>
                    <p className="text-[10px] text-white/30 font-mono">SECURE BILLING PROTOCOL</p>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">Zero hidden fees or monthly account maintenance charges.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">No surge pricing during peak hours or bad weather.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">24/7 online access to parking history and digital e-invoices.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/70">Log in to view detailed rate cards for specific facilities.</span>
                  </li>
                </ul>

                {/* Nút bấm Đăng nhập xem bảng giá */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <Link 
                    href="/login" 
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl group"
                  >
                    Sign In to View Rates
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/30">
                    <span>STATUS: READY</span>
                    <span>SECURE TRANSACTION</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Thông tin liên hệ đối tác quản lý */}
            <motion.div {...fadeUp(0.4)} className="mt-8 lg:mt-0 text-center lg:text-left">
              <p className="text-xs text-white/30">
                Are you a Building Manager interested in optimizing your parking?{' '}
                <a href="#contact" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">
                  Partner with us
                </a>
              </p>
            </motion.div>

          </div>

        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  )
}
