/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: Contact.tsx (SECTION THÔNG TIN LIÊN HỆ & ĐỊA ĐIỂM FPT BUILDING)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Cung cấp thông tin vị trí địa lý, thời gian vận hành và kênh hỗ trợ kỹ thuật:
 * 1. 📍 Địa điểm: Tòa nhà FPT, Khu Công nghệ Cao, Hà Nội (kèm đường dẫn Google Maps).
 * 2. ⏰ Giờ hoạt động: Mở cửa 24/7, kỹ thuật viên trực từ 07:00 - 22:00.
 * 3. 📞 Kênh hỗ trợ: Hotline trực tiếp & Email phản hồi sự cố nhanh `support@nexpark.vn`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { MapPin, Clock, PhoneCall, Mail } from 'lucide-react'

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-white overflow-hidden">
      {/* Đường phân cách nhạt phía trên */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-16" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Tiêu đề section Liên hệ */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600 mb-4">
            05 / Location & Contact
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
            NexPark • <span className="text-emerald-500">FPT Building</span>
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Smart parking management system serving FPT Building. Contact building management or technical support team below.
          </p>
        </div>

        {/* Lưới 3 thẻ thông tin liên hệ */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Thẻ 1: Vị trí địa lý bãi đỗ xe */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Parking Location</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-6">
                NexPark Parking Facility - FPT Building<br />
                High-Tech Park, Hanoi, Vietnam
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Tòa+nhà+FPT+Hà+Nội"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Get Directions <MapPin className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Thẻ 2: Thời gian vận hành bãi đỗ */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Operating Hours</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                Monday - Sunday: 24/7 Access<br />
                Technical Support: 07:00 - 22:00
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mt-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Now
            </span>
          </div>

          {/* Thẻ 3: Kênh hỗ trợ trực tuyến */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Support</h3>
              <div className="space-y-3 text-sm text-gray-600 font-light mb-6">
                <a
                  href="mailto:support@nexpark.vn"
                  className="flex items-center gap-2.5 hover:text-emerald-600 transition-colors font-medium"
                >
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>support@nexpark.vn</span>
                </a>
                <a
                  href="tel:+84123456789"
                  className="flex items-center gap-2.5 hover:text-emerald-600 transition-colors font-medium"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hotline: +84 123 456 789</span>
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:+84123456789"
                className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold text-center transition-all shadow-sm cursor-pointer"
              >
                Call Hotline
              </a>
              <a
                href="mailto:support@nexpark.vn"
                className="flex-1 py-2.5 px-3 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
              >
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
