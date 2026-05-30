'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Hero,
  About,
  Features,
  HowItWorks,
  Pricing,
  Contact
} from '../index'

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLoginToggle = () => {
    setIsLoggedIn(!isLoggedIn)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Layout Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        onLoginToggle={handleLoginToggle}
        scrollToSection={scrollToSection}
      />

      {/* Main Landing Sections */}
      <Hero scrollToSection={scrollToSection} />
      <About />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />

      {/* Shared Layout Footer */}
      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
