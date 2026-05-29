'use client'

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl font-bold font-heading tracking-tight">NexPark</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Revolutionizing parking with intelligent solutions for modern cities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" aria-label="Facebook">
                <span className="text-sm font-semibold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" aria-label="Twitter">
                <span className="text-sm font-semibold">t</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <span className="text-sm font-semibold">in</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="#home" className="text-gray-400 hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href="#about" className="text-gray-400 hover:text-emerald-400 transition-colors">About</Link></li>
              <li><Link href="#features" className="text-gray-400 hover:text-emerald-400 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-gray-400 hover:text-emerald-400 transition-colors">Pricing</Link></li>
              <li><Link href="#contact" className="text-gray-400 hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Services</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Smart Parking</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Booking System</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Monthly Passes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Management Dashboard</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold font-heading mb-6 border-b border-gray-800 pb-2">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NexPark. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
