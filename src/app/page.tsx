/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: page.tsx (TRANG CHỦ - LANDING PAGE NEXPARK)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Trang chính (Landing Page) giới thiệu Hệ thống Bãi đỗ xe thông minh NexPark tại Tòa nhà FPT.
 *
 * 🛠️ CẤU TRÚC THÀNH PHẦN (PAGE COMPOSITION):
 * 1. 🧭 Thanh điều hướng Top Navbar: Động theo thao tác cuộn chuột (Scrolled Glassmorphism) & Menu Mobile.
 * 2. 🎬 Hero Section (`<Hero />`): Video nền giới thiệu sinh động, hiệu ứng chữ đánh máy & Thống kê nổi bật.
 * 3. ℹ️ About Section (`<About />`): Giới thiệu tầm nhìn & Công nghệ đỗ xe thông minh.
 * 4. ⚡ Features Section (`<Features />`): Tính năng cốt lõi (Nhận diện biển số ALPR, Thanh toán VNPay, Đặt chỗ trước).
 * 5. 🛠️ How It Works (`<HowItWorks />`): Quy trình 3 bước gửi xe đơn giản.
 * 6. 💰 Pricing Section (`<Pricing />`): Bảng giá niêm yết theo giờ / lượt cho Ô tô và Xe máy.
 * 7. 📞 Contact Section (`<Contact />`): Biểu mẫu gửi phản hồi & thông tin liên hệ FPT Building.
 * 8. 🎯 Call To Action (CTA): Khối kêu gọi người dùng Đăng ký & Đặt chỗ ngay.
 * 9. 👣 Footer: Chân trang chứa liên kết nhanh & Bản quyền thương hiệu NexPark.
 * 10. 🔐 Auth Drawer (`<AuthDrawer />`): Hộp thoại Modal đăng nhập/đăng ký tích hợp sẵn.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogIn, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import WavyNavLink from '@/components/ui/WavyNavLink'
import { useAuth, AuthDrawer } from '@/features/auth'
import { Hero, About, Features, HowItWorks, Pricing, Contact } from '@/features/landing'

export default function Home() {
  // Trạng thái menu mobile đóng/mở
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Trạng thái cuộn trang để đổi kiểu dáng thanh Navbar (Glassmorphism Effect)
  const [isScrolled, setIsScrolled] = useState(false)
  // Trạng thái đóng/mở Auth Drawer (Modal Đăng nhập / Đăng ký)
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [authDrawerMode, setAuthDrawerMode] = useState<'login' | 'register'>('login')

  // Truy cập trạng thái xác thực từ AuthContext
  const { user, logout } = useAuth()
  const isLoggedIn = !!user

  // Lắng nghe sự kiện cuộn chuột để cập nhật trạng thái background cho Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hàm cuộn mượt (Smooth Scroll) tới section theo ID
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  // Mở hộp thoại Đăng nhập / Đăng ký
  const openLogin = () => { setAuthDrawerMode('login'); setIsAuthDrawerOpen(true) }
  const openRegister = () => { setAuthDrawerMode('register'); setIsAuthDrawerOpen(true) }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== 1. THANH ĐIỀU HƯỚNG TOP NAVBAR ===== */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed z-50 transition-all duration-500 ${isScrolled
          ? 'top-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl py-3 text-white'
          : 'top-0 left-0 right-0 bg-transparent shadow-none py-6 text-white'
          }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">NexPark</span>
          </Link>

          {/* Menu điều hướng dành cho màn hình Máy tính (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <WavyNavLink onClick={() => scrollToSection('home')} className="text-white/80 hover:text-white font-medium transition-colors">Home</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('about')} className="text-white/80 hover:text-white font-medium transition-colors">About</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('features')} className="text-white/80 hover:text-white font-medium transition-colors">Features</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('pricing')} className="text-white/80 hover:text-white font-medium transition-colors">Pricing</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('contact')} className="text-white/80 hover:text-white font-medium transition-colors">Contact</WavyNavLink>

            {/* Điều hướng theo trạng thái Đăng nhập */}
            {isLoggedIn ? (
              <Link
                href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard'}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={openRegister}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all cursor-pointer"
              >
                Get Started
              </button>
            )}

            <button
              onClick={isLoggedIn ? logout : openLogin}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium transition-all border cursor-pointer ${isLoggedIn
                ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'border-white/20 text-white hover:bg-white/10'
                }`}
            >
              {isLoggedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </div>

          {/* Nút Hamburger Menu trên Điện thoại (Mobile) */}
          <button className="md:hidden text-white cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu thả xuống dành cho Điện thoại (Mobile Navigation Dropdown) */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 bg-black/90 backdrop-blur-md shadow-2xl border border-white/10 rounded-2xl p-4 mt-2">
            <div className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('home')} className="text-left text-white/80 hover:text-white py-2">Home</button>
              <button onClick={() => scrollToSection('about')} className="text-left text-white/80 hover:text-white py-2">About</button>
              <button onClick={() => scrollToSection('features')} className="text-left text-white/80 hover:text-white py-2">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left text-white/80 hover:text-white py-2">Pricing</button>
              <button onClick={() => scrollToSection('contact')} className="text-left text-white/80 hover:text-white py-2">Contact</button>

              {isLoggedIn ? (
                <Link
                  href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard'}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center py-3 w-full bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Dashboard
                </Link>
              ) : (
                <button onClick={() => { setIsMenuOpen(false); openRegister(); }} className="text-center py-3 w-full bg-emerald-500 text-white rounded-lg font-semibold">
                  Get Started
                </button>
              )}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (isLoggedIn) {
                    logout();
                  } else {
                    openLogin();
                  }
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 border rounded-lg font-medium transition-all cursor-pointer ${isLoggedIn ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-white/20 text-white hover:bg-white/10'
                  }`}
              >
                {isLoggedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.nav>

      {/* ===== 2. CÁC PHẦN NỘI DUNG CHÍNH (LANDING PAGE SECTIONS) ===== */}
      <Hero scrollToSection={scrollToSection} />
      <About />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />

      {/* ===== 3. KHỐI KÊU GỌI HÀNH ĐỘNG (CTA SECTION) ===== */}
      <section id="booking" className="bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-28 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-500 mb-4">05 / Start</p>
            <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
              Ready<br />
              <span className="text-emerald-400">to park?</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={openRegister}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all cursor-pointer text-sm uppercase tracking-widest"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 border border-white/20 hover:border-white/50 text-white font-bold rounded-xl transition-all cursor-pointer text-sm"
            >
              Contact Us
            </motion.button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </section>

      {/* ===== 4. CHÂN TRANG (FOOTER) ===== */}
      <footer className="bg-[#060606] text-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-16 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <span className="text-2xl font-black tracking-tight block mb-2">NexPark</span>
            <p className="text-white/40 text-xs font-mono max-w-xs leading-relaxed">
              Smart parking infrastructure at FPT Building.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs text-white/30">
            {['home', 'about', 'features', 'pricing', 'contact'].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="hover:text-emerald-400 transition-colors capitalize cursor-pointer font-mono uppercase tracking-wider"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 mx-6 lg:mx-12">
          <div className="max-w-5xl mx-auto py-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-white/20 text-xs font-mono">© 2025 NexPark. All rights reserved.</p>
            <p className="text-white/20 text-xs font-mono">No subscription. Pay per use.</p>
          </div>
        </div>
      </footer>

      {/* ===== 5. HỘP THOẠI ĐĂNG NHẬP / ĐĂNG KÝ (AUTH DRAWER) ===== */}
      <AuthDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        initialMode={authDrawerMode}
      />
    </div>
  )
}
