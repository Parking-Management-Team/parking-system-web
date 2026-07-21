/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: HowItWorks.tsx (SECTION QUY TRÌNH HƯỚNG DẪN 4 BƯỚC GỬI XE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Hướng dẫn trực quan quy trình 4 bước gửi xe đơn giản dành cho tài xế:
 * 1. 🔍 01. Tìm kiếm (Find): Tra cứu ô đỗ khả dụng theo tầng và khu vực.
 * 2. 📅 02. Đặt trước (Book): Đặt giữ vị trí trước tối đa 8 tiếng hoặc gửi vãng lai.
 * 3. 🚗 03. Vào bãi (Enter): Quẹt thẻ RFID / Quét mã QR, barie tự động mở.
 * 4. 💳 04. Thanh toán (Pay): Tự động tính tiền khi ra khỏi bãi qua tiền mặt / chuyển khoản.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
})

const steps = [
  { n: '01', title: 'Find', body: 'View online parking availability in real-time.' },
  { n: '02', title: 'Book', body: 'Park walk-in or reserve your preferred spot up to 8 hours ahead.' },
  { n: '03', title: 'Enter',   body: 'Tap your RFID card or scan QR code, entry barrier opens automatically.' },
  { n: '04', title: 'Pay', body: 'Automatic precise fee calculation upon check-out at the gate.' },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#0a0a0a] text-white overflow-hidden relative">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Tiêu đề phần Quy trình gửi xe */}
        <motion.div {...fade()} className="mb-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-4">
            04 / How It Works
          </p>
          <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
            Just 4 simple steps.<br />
            <span className="text-emerald-400">Fast & Secure.</span>
          </h2>
        </motion.div>

        {/* 4 Bước dạng ngang 4 cột */}
        <div className="grid md:grid-cols-4 gap-0 border border-white/8 rounded-2xl overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...fade(0.08 * i)}
              className={`group p-7 hover:bg-emerald-500 transition-all duration-500 cursor-default ${
                i < steps.length - 1 ? 'border-r border-white/8' : ''
              }`}
            >
              <div className="font-mono text-[10px] text-white/20 group-hover:text-black/30 mb-8 transition-colors">{s.n}</div>
              <div className="text-3xl font-black text-white group-hover:text-black mb-3 transition-colors">{s.title}</div>
              <div className="text-xs text-white/40 group-hover:text-black/60 leading-relaxed transition-colors">{s.body}</div>
            </motion.div>
          ))}
        </div>

        {/* Chú thích cam kết */}
        <motion.p
          {...fade(0.4)}
          className="mt-8 text-center text-sm text-white/25 font-mono"
        >
          No pre-paid account required. Pay per use with exact calculation.
        </motion.p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  )
}
