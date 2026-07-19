'use client'

import { MapPin, Clock, PhoneCall, Mail } from 'lucide-react'

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-white overflow-hidden">
      {/* Top subtle border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-16" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600 mb-4">
            05 / Location & Contact
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
            NexPark • <span className="text-emerald-500">Tòa nhà FPT</span>
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Hệ thống bãi xe thông minh NexPark phục vụ tại Tòa nhà FPT. Liên hệ quản lý hoặc hỗ trợ kỹ thuật bên dưới.
          </p>
        </div>

        {/* Contact info grid - 3 cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Location */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vị Trí Bãi Xe</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-6">
                Bãi xe NexPark - Tòa nhà FPT<br />
                Khu Công Nghệ Cao, Hà Nội, Việt Nam
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Tòa+nhà+FPT+Hà+Nội"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Xem chỉ đường <MapPin className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Giờ Hoạt Động</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                Thứ 2 - Chủ Nhật: 24/7<br />
                Hỗ trợ kỹ thuật: 07:00 - 22:00
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mt-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang hoạt động
            </span>
          </div>

          {/* Card 3: Support Contact */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Kênh Hỗ Trợ</h3>
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
                Gọi Hotline
              </a>
              <a
                href="mailto:support@nexpark.vn"
                className="flex-1 py-2.5 px-3 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
              >
                Gửi Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

