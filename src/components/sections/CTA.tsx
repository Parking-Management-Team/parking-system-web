'use client'

import React from 'react'
import Button from '@/components/ui/Button'

interface CTAProps {
  onNavigate: (sectionId: string) => void
}

export default function CTA({ onNavigate }: CTAProps) {
  return (
    <section id="booking" className="py-24 bg-emerald-600 text-white relative overflow-hidden">
      {/* Absolute decorative gradient circles */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 tracking-tight">
          Ready to Experience Smart Parking?
        </h2>
        <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
          Join thousands of satisfied users who have transformed their parking experience with NexPark.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <Button
            onClick={() => onNavigate('pricing')}
            variant="secondary"
            size="lg"
            className="shadow-2xl hover:scale-105"
          >
            Start Parking Now
          </Button>

          <Button
            onClick={() => onNavigate('contact')}
            variant="outline"
            size="lg"
            className="border-white/50 hover:bg-white/10"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  )
}
