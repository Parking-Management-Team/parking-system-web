'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Features from '@/components/sections/Features'
import HowItWorks from '@/components/sections/HowItWorks'
import Pricing from '@/components/sections/Pricing'
import Contact from '@/components/sections/Contact'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/layout/Footer'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Reusable Navigation Bar */}
      <Navbar 
        isLoggedIn={isLoggedIn} 
        onToggleLogin={() => setIsLoggedIn(prev => !prev)} 
        onNavigate={scrollToSection} 
      />

      {/* Main Content Sections */}
      <main>
        {/* Hero Section with video background & real-time stats countups */}
        <Hero onNavigate={scrollToSection} />

        {/* Brand overview and user type separations */}
        <About />

        {/* Feature grid with clean interactive state transitions */}
        <Features />

        {/* Cinematic step-by-step workflow flow */}
        <HowItWorks />

        {/* Pricing grids with day/night shift toggle switches */}
        <Pricing />

        {/* Contact fields validated for messaging triggers */}
        <Contact />

        {/* Call to action panel optimized for reservations */}
        <CTA onNavigate={scrollToSection} />
      </main>

      {/* Global Brand Footer */}
      <Footer />
    </div>
  )
}
