'use client'

import React from 'react'
import { MapPin, Clock, Users } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission here
  }

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold font-heading text-gray-900 mb-6">Get In Touch</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Have questions about our parking solutions? Our team is ready to help you.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading mb-1 text-gray-900">Our Location</h3>
                  <p className="text-gray-600">123 Smart City Plaza, Building A<br />Hanoi, Vietnam</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading mb-1 text-gray-900">Working Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 8:00 AM - 8:00 PM<br />Saturday - Sunday: 9:00 AM - 6:00 PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading mb-1 text-gray-900">Contact Us</h3>
                  <p className="text-gray-600">support@nexpark.com<br />+84 123 456 7890</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-8 md:p-10 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all text-gray-900 outline-none"
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
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all text-gray-900 outline-none"
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
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all text-gray-900 outline-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full shadow-lg"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
