/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: Features.tsx (SECTION TÍNH NĂNG CỐT LÕI CỦA NEXPARK)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Trình bày 6 tính năng nổi bật vượt trội của hệ thống quản lý bãi đỗ xe thông minh:
 * 1. 📍 Live slot tracking: Giám sát sơ đồ ô đỗ theo thời gian thực từng giây.
 * 2. 📅 Book up to 8h ahead: Đặt chỗ giữ vị trí trước tối đa 8 tiếng.
 * 3. 🎫 RFID & QR entry: Cổng kiểm soát ra/vào nhanh qua thẻ RFID và mã QR.
 * 4. ⏳ Time-block billing: Tính phí thông minh theo block thời gian và khung giờ ngày/đêm.
 * 5. 💳 Cash & Bank transfer: Hỗ trợ thanh toán linh hoạt (Tiền mặt, VNPay, Ngân hàng).
 * 6. 🚘 Cars & Motorbikes: Quản lý tập trung cả Ô tô và Xe máy trên một nền tảng duy nhất.
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

const features = [
  { tag: 'Access',   title: 'Sơ đồ vị trí đỗ trực tuyến',  body: 'Cập nhật trạng thái từng ô đỗ xe máy và ô tô theo từng giây.' },
  { tag: 'Booking',  title: 'Giữ chỗ trước đến 8 giờ',     body: 'Đặt trước vị trí mong muốn, tự động phân bổ slot an toàn.' },
  { tag: 'Sessions', title: 'Quẹt thẻ RFID & Quét mã QR',   body: 'Vào bãi không qua rào cản thủ công, tự động nhận diện biển số.' },
  { tag: 'Pricing',  title: 'Tính phí theo khung giờ',     body: 'Biểu phí rõ ràng theo khung ngày/đêm với mức trần tối đa hợp lý.' },
  { tag: 'Payment',  title: 'Thanh toán trực tuyến & VNPay', body: 'Tự động tính phí khi xe check-out, khấu trừ tiền cọc linh hoạt.' },
  { tag: 'Fleet',    title: 'Quản lý Ô tô & Xe máy tập trung', body: 'Quy trình xử lý chuyên biệt cho từng dòng xe trên một hệ thống.' },
]

export default function Features() {
  return (
    <section id="features" className="bg-[#f5f5f0] overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28">

        {/* Tiêu đề section Tính năng */}
        <motion.div {...fade()} className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600 mb-4">03 / Features</p>
            <h2 className="text-5xl md:text-6xl font-black text-[#0a0a0a] leading-none tracking-tight">
              Tính năng tối ưu.<br />
              <span className="text-emerald-500">Toàn diện.</span>
            </h2>
          </div>
          <p className="text-[#707070] text-sm leading-relaxed max-w-xs md:text-right">
            Nền tảng quản lý hạ tầng bãi đỗ hiện đại hàng đầu.
          </p>
        </motion.div>

        {/* Danh sách 6 tính năng hàng đầu */}
        <div className="divide-y divide-[#e0e0d8]">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fade(0.05 * i)}
              className="group flex items-start gap-6 py-7 hover:bg-[#0a0a0a]/[0.03] -mx-4 px-4 rounded-xl transition-colors duration-300 cursor-default"
            >
              {/* Thứ tự số */}
              <span className="font-mono text-[10px] text-[#c0c0c0] w-6 shrink-0 mt-1">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Phân loại Tag */}
              <span className="shrink-0 w-20 text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                {f.tag}
              </span>

              {/* Tiêu đề tính năng */}
              <h3 className="flex-1 text-[#0a0a0a] font-bold text-base group-hover:text-emerald-600 transition-colors duration-300">
                {f.title}
              </h3>

              {/* Nội dung chi tiết */}
              <p className="hidden md:block flex-1 text-sm text-[#707070] leading-relaxed max-w-xs">
                {f.body}
              </p>

              {/* Mũi tên tương tác */}
              <span className="text-[#d0d0d0] group-hover:text-emerald-500 transition-colors duration-300 text-xl shrink-0">
                →
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
