/**
 * Home Page (Trang chủ) - Landing Page NexPark
 *
 * Đây là trang chính của website, chứa toàn bộ nội dung landing page.
 * URL: /
 *
 * Cấu trúc trang (theo thứ tự từ trên xuống):
 * 1. Navigation  - Thanh menu cố định trên cùng
 * 2. Hero        - Banner lớn với video nền + nút CTA
 * 3. About       - Giới thiệu NexPark (Car, Bike, Manager)
 * 4. Features    - Tính năng nổi bật (import từ features/landing)
 * 5. How It Works - 3 bước đơn giản
 * 6. Pricing     - Bảng giá (Day/Night, Motorcycle/Car, Monthly Pass)
 * 7. Contact     - Form liên hệ
 * 8. CTA         - Kêu gọi hành động cuối trang
 * 9. Footer      - Chân trang
 *
 * Lưu ý: 'use client' vì dùng useState, useEffect (React hooks)
 * Nếu không có 'use client', Next.js sẽ render component này ở server
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'  // Thư viện animation
import {
  Car,        // Icon xe hơi
  Bike,       // Icon xe máy
  Shield,     // Icon khiên (bảo mật)
  Clock,      // Icon đồng hồ
  MapPin,     // Icon địa điểm
  Users,      // Icon người dùng
  Menu,       // Icon menu hamburger (mobile)
  X,          // Icon đóng
  LogIn,      // Icon đăng nhập
  LogOut      // Icon đăng xuất
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import TypewriterText from '@/components/ui/TypewriterText'  // Hiệu ứng gõ chữ
import WavyNavLink from '@/components/ui/WavyNavLink'        // Link có hiệu ứng sóng
import Features from '@/features/landing/components/Features' // Component tính năng
import { useAuth, AuthDrawer } from '@/features/auth'         // Auth context + drawer đăng nhập

/**
 * CountUp Component - Hiệu ứng đếm số tăng dần
 *
 * Khi người dùng cuộn đến phần tử này, số sẽ tự động đếm từ 0 đến giá trị end.
 * Dùng cho thống kê: 500+, 10K+, 99.8%
 *
 * @param end - Giá trị cuối cùng (ví dụ: 500)
 * @param duration - Thời gian đếm (ms, mặc định 2000)
 * @param suffix - Ký tự thêm sau số (ví dụ: "+", "K+", "%")
 * @param decimals - Số thập phân (ví dụ: 99.8 → decimals=1)
 */
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

const CountUp = ({
  end,
  duration = 2000,
  suffix = '',
  decimals = 0
}: CountUpProps) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress * (2 - progress); // Ease out quad
            setCount(easeProgress * end);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={elementRef}>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};



// Mock data for how it works
const steps = [
  {
    number: '01',
    title: 'Choose Building',
    description: 'Select your preferred parking building from our network of smart facilities'
  },
  {
    number: '02',
    title: 'Book Your Spot',
    description: 'Enter your vehicle details and choose your preferred time duration'
  },
  {
    number: '03',
    title: 'Pay & Park',
    description: 'Complete secure payment and receive your virtual parking pass'
  }
]

/**
 * Home Component - Trang chủ NexPark
 *
 * Đây là component chính của trang landing page.
 * Chứa toàn bộ UI và logic cho trang chủ.
 */
export default function Home() {
  /* ===== STATE - Trạng thái của component ===== */
  const [isMenuOpen, setIsMenuOpen] = useState(false)           // Menu mobile đang mở/đóng
  const [isScrolled, setIsScrolled] = useState(false)           // Đã cuộn trang chưa (đổi style navbar)
  const { user, logout } = useAuth()                            // Lấy thông tin user từ AuthContext
  const isLoggedIn = !!user                                     // !! chuyển giá trị thành boolean
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false) // Drawer đăng nhập đang mở/đóng
  const [authDrawerMode, setAuthDrawerMode] = useState<'login' | 'register'>('login') // Drawer ở chế độ login hay register
  const [rateType, setRateType] = useState<'day' | 'night'>('day') // Bảng giá đang hiển thị ngày hay đêm

  // Lắng nghe sự kiện cuộn trang để đổi style navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)  // Cuộn quá 20px → đổi style
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)  // Cleanup khi unmount
  }, [])

  // Cuộn mượt đến section khi click nav link
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })  // Cuộn mượt
      setIsMenuOpen(false)  // Đóng menu mobile sau khi click
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== NAVIGATION - Thanh menu cố định trên cùng ===== */}
      {/* motion.nav = nav + animation (framer-motion) */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed z-50 transition-all duration-500 ${isScrolled ? 'top-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl py-3 text-white' : 'top-0 left-0 right-0 bg-transparent shadow-none py-6 text-white'}`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">NexPark</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <WavyNavLink onClick={() => scrollToSection('home')} className="text-white/80 hover:text-white font-medium transition-colors">Home</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('about')} className="text-white/80 hover:text-white font-medium transition-colors">About</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('features')} className="text-white/80 hover:text-white font-medium transition-colors">Features</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('pricing')} className="text-white/80 hover:text-white font-medium transition-colors">Pricing</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('contact')} className="text-white/80 hover:text-white font-medium transition-colors">Contact</WavyNavLink>
            {/* Hiển thị nút Dashboard nếu đã đăng nhập, ngược lại hiển thị nút Get Started */}
            {isLoggedIn ? (
              <Link
                href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : '/dashboard'}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all text-center flex items-center justify-center"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => {
                  setAuthDrawerMode('register')
                  setIsAuthDrawerOpen(true)
                }}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all"
              >
                Get Started
              </button>
            )}
            <button
              onClick={() => {
                if (isLoggedIn) {
                  logout()
                } else {
                  setAuthDrawerMode('login')
                  setIsAuthDrawerOpen(true)
                }
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium transition-all border ${isLoggedIn ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              {isLoggedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 bg-black/90 backdrop-blur-md shadow-2xl border border-white/10 rounded-2xl p-4 mt-2">
            <div className="flex flex-col space-y-4">
              <button onClick={() => { scrollToSection('home'); setIsMenuOpen(false); }} className="text-left text-white/80 hover:text-white py-2">Home</button>
              <button onClick={() => { scrollToSection('about'); setIsMenuOpen(false); }} className="text-left text-white/80 hover:text-white py-2">About</button>
              <button onClick={() => { scrollToSection('features'); setIsMenuOpen(false); }} className="text-left text-white/80 hover:text-white py-2">Features</button>
              <button onClick={() => { scrollToSection('pricing'); setIsMenuOpen(false); }} className="text-left text-white/80 hover:text-white py-2">Pricing</button>
              <button onClick={() => { scrollToSection('contact'); setIsMenuOpen(false); }} className="text-left text-white/80 hover:text-white py-2">Contact</button>
              {/* Menu mobile: Hiển thị nút Dashboard nếu đã đăng nhập, ngược lại hiển thị Get Started */}
              {isLoggedIn ? (
                <Link
                  href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : '/dashboard'}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center py-3 w-full bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all flex items-center justify-center"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setAuthDrawerMode('register')
                    setIsAuthDrawerOpen(true)
                  }}
                  className="text-center py-3 w-full bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all"
                >
                  Get Started
                </button>
              )}
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  if (isLoggedIn) {
                    logout()
                  } else {
                    setAuthDrawerMode('login')
                    setIsAuthDrawerOpen(true)
                  }
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 border rounded-lg font-medium transition-all ${isLoggedIn ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                {isLoggedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.nav>

      {/* ===== HERO SECTION - Banner lớn đầu trang ===== */}
      {/* Video nền + gradient overlay + tiêu đề + nút CTA + thống kê */}
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
                Park Smarter with <br />
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
                  onClick={() => {
                    setAuthDrawerMode('register')
                    setIsAuthDrawerOpen(true)
                  }}
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

      {/* ===== ABOUT SECTION - Giới thiệu NexPark ===== */}
      {/* 3 thẻ card: Car Owners, Motorcycles, Managers */}
      <section id="about" className="section-padding bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold font-heading text-gray-900 mb-4">About NexPark</h2>
            <p className="text-xl text-gray-600">
              NexPark is revolutionizing the parking industry with intelligent solutions
              that make finding and managing parking spaces easier than ever before.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">For Car Owners</h3>
              <p className="text-gray-600">
                Book parking spots in advance, pay securely, and enjoy seamless entry with our automated system.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bike className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">For Motorcycles</h3>
              <p className="text-gray-600">
                Dedicated zones for motorcycles with easy access and secure parking solutions.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="card text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">For Managers</h3>
              <p className="text-gray-600">
                Real-time monitoring, automated billing, and comprehensive management dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION - Tính năng nổi bật ===== */}
      {/* Component riêng, import từ features/landing/components/Features */}
      <Features />

      {/* ===== HOW IT WORKS - 3 bước đơn giản ===== */}
      {/* Choose Building → Book Your Spot → Pay & Park */}
      <section className="section-padding bg-primary-900 text-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold font-heading mb-4">How It Works</h2>
            <p className="text-primary-200 text-xl">
              Three simple steps to secure your parking spot
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-12 top-0 text-6xl font-bold text-primary-800 opacity-50">
                  {step.number}
                </div>
                <div className="pl-16">
                  <h3 className="text-2xl font-bold font-heading mb-4">{step.title}</h3>
                  <p className="text-primary-200 text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION - Bảng giá ===== */}
      {/* Day/Night toggle + Motorcycle/Car cards + Monthly Pass */}
      <section id="pricing" className="section-padding bg-gray-50">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4"
            >
              Pricing Policy
            </motion.h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Detailed pricing for walk-in customers and NexPark members
            </p>
          </div>

          {/* Rate Type Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white rounded-full p-1 shadow-md">
              <button
                onClick={() => setRateType('day')}
                className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 ${rateType === 'day'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span>☀️</span>
                <span>Day</span>
              </button>
              <button
                onClick={() => setRateType('night')}
                className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center space-x-2 ${rateType === 'night'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span>🌙</span>
                <span>Night</span>
              </button>
            </div>
          </div>

          {/* Vehicle Rate Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Motorcycle Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Bike className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-heading text-emerald-600">5K₫</div>
                  <div className="text-sm text-gray-500">first 4 hours</div>
                </div>
              </div>
              <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">Motorcycle</h3>
              <p className="text-gray-600 mb-4">Motorcycle Parking</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base (4h):</span>
                  <span className="font-semibold">5,000₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">After 4h:</span>
                  <span className="font-semibold">
                    {rateType === 'day' ? '+1,000₫/hour' : '+2,000₫/hour'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max cap:</span>
                  <span className="font-semibold text-emerald-600">
                    {rateType === 'day' ? '10,000₫/day' : '20,000₫/night'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Standard Car Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border-2 border-emerald-400 hover:border-emerald-500 hover:shadow-xl transition-all relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-heading text-emerald-600">30K₫</div>
                  <div className="text-sm text-gray-500">first 4 hours</div>
                </div>
              </div>
              <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">Car</h3>
              <p className="text-gray-600 mb-4">Standard Car Parking</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base (4h):</span>
                  <span className="font-semibold">30,000₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">After 4h:</span>
                  <span className="font-semibold">
                    {rateType === 'day' ? '+10,000₫/hour' : '+12,000₫/hour'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max cap:</span>
                  <span className="font-semibold text-emerald-600">
                    {rateType === 'day' ? '100,000₫/day' : '120,000₫/night'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Unlimited Access Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-6">Monthly Pass</h3>

            {/* Monthly Pass Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                  {/* Left Side - Info */}
                  <div className="flex-1">
                    <div className="inline-block bg-emerald-400 text-emerald-900 text-xs px-3 py-1 rounded-full font-bold mb-4">
                      MEMBER / VIP
                    </div>
                    <h4 className="text-4xl md:text-5xl font-bold font-heading mb-6">Monthly Pass</h4>

                    {/* Pricing Options */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <Bike className="w-6 h-6" />
                          <span className="text-lg font-semibold">Motorcycle</span>
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-bold font-heading">200K₫</span>
                          <span className="text-emerald-100">/month</span>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center space-x-3 mb-3">
                          <Car className="w-6 h-6" />
                          <span className="text-lg font-semibold">Car</span>
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-bold font-heading">1.5M₫</span>
                          <span className="text-emerald-100">/month</span>
                        </div>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-emerald-50">24/7 Priority Access</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-emerald-50">Free EV Charging (Level 2)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-emerald-50">Reserved Executive Bays</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-emerald-50">Multi-Location Access</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - CTA */}
                  <div className="md:text-right">
                    <button className="w-full md:w-auto px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                      Upgrade Now
                    </button>
                    <p className="text-emerald-100 text-sm mt-4">Cancel anytime. No hidden fees.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Grace Period Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start space-x-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold font-heading text-gray-900 mb-1">GRACE PERIOD</h4>
              <p className="text-gray-700">First 15 minutes excess time: no additional block charged. Over 15 minutes: charged as full additional block.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CONTACT SECTION - Form liên hệ ===== */}
      {/* Thông tin liên hệ + Form gửi tin nhắn */}
      <section id="contact" className="section-padding bg-gray-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold font-heading text-gray-900 mb-6">Get In Touch</h2>
              <p className="text-xl text-gray-600 mb-8">
                Have questions about our parking solutions? Our team is ready to help you.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-heading mb-1">Our Location</h3>
                    <p className="text-gray-600">123 Smart City Plaza, Building A<br />Hanoi, Vietnam</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-heading mb-1">Working Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 8:00 PM<br />Saturday - Sunday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-heading mb-1">Contact Us</h3>
                    <p className="text-gray-600">support@nexpark.com<br />+84 123 456 7890</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button type="submit" className="w-full btn-primary">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION - Kêu gọi hành động ===== */}
      {/* Nút "Start Parking Now" và "Contact Sales" */}
      <section id="booking" className="section-padding bg-primary-600 text-white">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Ready to Experience Smart Parking?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their parking experience with NexPark.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: 'white',
                color: '#059669',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              Start Parking Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Contact Sales
            </motion.button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER - Chân trang ===== */}
      {/* Logo + Quick Links + Services + Legal + Copyright */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl font-bold font-heading">NexPark</span>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing parking with intelligent solutions for modern cities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <span className="text-sm">t</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <span className="text-sm">in</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#home" className="text-gray-400 hover:text-primary-400 transition-colors">Home</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-primary-400 transition-colors">About</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-primary-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-primary-400 transition-colors">Pricing</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-primary-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Services</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Smart Parking</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Booking System</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Monthly Passes</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Management Dashboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Analytics</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NexPark. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ===== AUTH DRAWER - Drawer đăng nhập/đăng ký ===== */}
      {/* Hiện ra khi click "Login", "Get Started" */}
      <AuthDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}  // Đóng drawer
        initialMode={authDrawerMode}                  // 'login' hoặc 'register'
      />
    </div>
  )
}
