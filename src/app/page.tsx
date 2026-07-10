/**
 * Home Page (Trang chủ) - Landing Page NexPark
 *
 * Đây là trang chính của website. Sau khi refactor, file này chỉ chứa:
 * - Navbar (có state scrolled + menu mobile)
 * - Ghép các section từ features/landing/components/
 * - AuthDrawer (popup đăng nhập/đăng ký)
 *
 * Mọi nội dung section đều nằm trong features/landing/components/.
 * URL: /
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [authDrawerMode, setAuthDrawerMode] = useState<'login' | 'register'>('login')

  const { user, logout } = useAuth()
  const isLoggedIn = !!user

  // Lắng nghe sự kiện cuộn để đổi style Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cuộn mượt đến section theo id
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  const openLogin = () => { setAuthDrawerMode('login'); setIsAuthDrawerOpen(true) }
  const openRegister = () => { setAuthDrawerMode('register'); setIsAuthDrawerOpen(true) }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== NAVBAR ===== */}
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <WavyNavLink onClick={() => scrollToSection('home')} className="text-white/80 hover:text-white font-medium transition-colors">Home</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('about')} className="text-white/80 hover:text-white font-medium transition-colors">About</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('features')} className="text-white/80 hover:text-white font-medium transition-colors">Features</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('pricing')} className="text-white/80 hover:text-white font-medium transition-colors">Pricing</WavyNavLink>
            <WavyNavLink onClick={() => scrollToSection('contact')} className="text-white/80 hover:text-white font-medium transition-colors">Contact</WavyNavLink>

            {isLoggedIn ? (
              <Link
                href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : '/dashboard'}
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

          {/* Mobile Hamburger */}
          <button className="md:hidden text-white cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
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
                  href={user?.role === 'MANAGER' ? '/dashboard/manager/facilities' : '/dashboard'}
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

      {/* ===== LANDING PAGE SECTIONS ===== */}
      <Hero scrollToSection={scrollToSection} />
      <About />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />

      {/* ===== CTA SECTION ===== */}
      <section id="booking" className="section-padding bg-emerald-600 text-white">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Ready to Experience Smart Parking?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their parking experience with NexPark.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={openRegister}
              className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold shadow-lg hover:bg-emerald-50 hover:shadow-xl cursor-pointer transition-all"
            >
              Start Parking Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold cursor-pointer hover:bg-white/10 transition-all"
            >
              Contact Sales
            </motion.button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <span className="text-2xl font-bold font-heading block mb-6">NexPark</span>
              <p className="text-gray-400 mb-6">Revolutionizing parking with intelligent solutions for modern cities.</p>
              <div className="flex space-x-4">
                {['f', 't', 'in'].map((s) => (
                  <a key={s} href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <span className="text-sm">{s}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {['home', 'about', 'features', 'pricing', 'contact'].map((id) => (
                  <li key={id}>
                    <button onClick={() => scrollToSection(id)} className="text-gray-400 hover:text-emerald-400 transition-colors capitalize cursor-pointer">
                      {id.charAt(0).toUpperCase() + id.slice(1)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Services</h3>
              <ul className="space-y-3 text-gray-400">
                {['Smart Parking', 'Booking System', 'Monthly Passes', 'Management Dashboard', 'Analytics'].map((s) => (
                  <li key={s}><a href="#" className="hover:text-emerald-400 transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading mb-6">Legal</h3>
              <ul className="space-y-3 text-gray-400">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((s) => (
                  <li key={s}><a href="#" className="hover:text-emerald-400 transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NexPark. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ===== AUTH DRAWER ===== */}
      <AuthDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        initialMode={authDrawerMode}
      />
    </div>
  )
}
