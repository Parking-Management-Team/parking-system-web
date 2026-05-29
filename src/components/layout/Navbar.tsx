'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Menu, X, LogIn, LogOut } from 'lucide-react'
import WavyNavLink from '@/components/ui/WavyNavLink'
import Button from '@/components/ui/Button'

interface NavbarProps {
  isLoggedIn: boolean
  onToggleLogin: () => void
  onNavigate: (sectionId: string) => void
}

export default function Navbar({ isLoggedIn, onToggleLogin, onNavigate }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (id: string) => {
    onNavigate(id)
    setIsMenuOpen(false)
  }

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? 'top-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl py-3 text-white' 
          : 'top-0 left-0 right-0 bg-transparent shadow-none py-6 text-white'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">NexPark</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <WavyNavLink onClick={() => handleNavClick('home')} className="text-white/80 hover:text-white font-medium transition-colors">Home</WavyNavLink>
          <WavyNavLink onClick={() => handleNavClick('about')} className="text-white/80 hover:text-white font-medium transition-colors">About</WavyNavLink>
          <WavyNavLink onClick={() => handleNavClick('features')} className="text-white/80 hover:text-white font-medium transition-colors">Features</WavyNavLink>
          <WavyNavLink onClick={() => handleNavClick('pricing')} className="text-white/80 hover:text-white font-medium transition-colors">Pricing</WavyNavLink>
          <WavyNavLink onClick={() => handleNavClick('contact')} className="text-white/80 hover:text-white font-medium transition-colors">Contact</WavyNavLink>
          
          <Button
            onClick={() => handleNavClick('booking')}
            variant="primary"
            size="sm"
          >
            Get Started
          </Button>

          <Button
            onClick={onToggleLogin}
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 border ${
              isLoggedIn 
                ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                : 'border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {isLoggedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-emerald-400 transition-colors focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 bg-black/90 backdrop-blur-md shadow-2xl border border-white/10 rounded-2xl p-4 mt-2">
          <div className="flex flex-col space-y-4">
            <button onClick={() => handleNavClick('home')} className="text-left text-white/80 hover:text-white py-2 font-medium">Home</button>
            <button onClick={() => handleNavClick('about')} className="text-left text-white/80 hover:text-white py-2 font-medium">About</button>
            <button onClick={() => handleNavClick('features')} className="text-left text-white/80 hover:text-white py-2 font-medium">Features</button>
            <button onClick={() => handleNavClick('pricing')} className="text-left text-white/80 hover:text-white py-2 font-medium">Pricing</button>
            <button onClick={() => handleNavClick('contact')} className="text-left text-white/80 hover:text-white py-2 font-medium">Contact</button>
            
            <Button
              onClick={() => handleNavClick('booking')}
              variant="primary"
              size="md"
              className="w-full text-center"
            >
              Get Started
            </Button>
            
            <Button
              onClick={() => { onToggleLogin(); setIsMenuOpen(false); }}
              variant="outline"
              size="md"
              className={`w-full flex items-center justify-center gap-2 ${
                isLoggedIn 
                  ? 'border-red-500/30 text-red-400 bg-red-500/10' 
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {isLoggedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </Button>
          </div>
        </div>
      )}
    </motion.nav>
  )
}
