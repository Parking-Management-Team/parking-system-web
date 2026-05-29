'use client'

import React from 'react'

const steps = [
  {
    number: '01',
    title: 'Choose Building',
    description: 'Select your preferred parking building from our network of smart facilities.'
  },
  {
    number: '02',
    title: 'Book Your Spot',
    description: 'Enter your vehicle details and choose your preferred time duration.'
  },
  {
    number: '03',
    title: 'Pay & Park',
    description: 'Complete secure payment and receive your virtual parking pass.'
  }
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold font-heading mb-4 tracking-tight">How It Works</h2>
          <p className="text-gray-400 text-xl font-light">
            Three simple steps to secure your parking spot.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="absolute -left-4 top-0 text-7xl font-black text-white/5 select-none transition-colors group-hover:text-emerald-500/10">
                {step.number}
              </div>
              <div className="pl-12">
                <h3 className="text-2xl font-bold font-heading mb-4 text-white group-hover:text-emerald-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
