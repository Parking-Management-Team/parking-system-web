'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { 
  Search, 
  BookOpen, 
  CreditCard, 
  QrCode, 
  ChevronDown, 
  MessageSquare, 
  Phone, 
  Volume2
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function DriverHelp() {
  const { showToast } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    { 
      question: "What should I do if the QR code doesn't scan at the entrance?", 
      answer: "First, ensure your screen brightness is at maximum. If it still fails, use the 'Help' button on the terminal to contact the gate operator, or check if your registered license plate is correctly set up for automatic plate recognition.",
      category: "access"
    },
    { 
      question: "How do I cancel my booking?", 
      answer: "You can cancel your booking anytime from your Booking Details before check-in. Note that PBMS does not issue cash or online refunds for cancelled bookings in this release.",
      category: "booking"
    },
    { 
      question: "How do I update my vehicle's license plate?", 
      answer: "Navigate to your driver profile dashboard, select your vehicle, and update the plates. Note that license plate modifications take approximately 5 minutes to synchronize with the gate sensors.",
      category: "vehicle"
    },
    { 
      question: "How do I top up my Smart Wallet?", 
      answer: "Go to the Payments page, click on 'Top Up Balance', choose or type your desired amount, and select your bank or credit card details to load funds instantly.",
      category: "payment"
    }
  ];

  const handlePopularSearch = (term: string) => {
    setSearchTerm(term);
    showToast(`Searching for popular term: ${term}`, 'info');
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Help Center</h1>
        <p className="text-sm text-slate-400 mt-1">Get immediate answers to your parking, RFID, and payment queries.</p>
      </section>

      {/* HERO HELP BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-[#1B2A41] text-white p-10 rounded-3xl shadow-md text-center max-w-4xl mx-auto space-y-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <h2 className="text-xl font-extrabold tracking-tight">How can we help you today?</h2>
        
        <div className="relative max-w-xl mx-auto group">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search for booking, payments, or RFID troubleshooting..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-none focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 text-sm font-semibold rounded-2xl shadow-lg bg-white"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs text-white/80">
          <span>Popular:</span>
          {['QR code scan failed', 'Payment dispute', 'Lost ticket'].map((term) => (
            <button
              key={term}
              onClick={() => handlePopularSearch(term)}
              className="underline hover:text-white transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: GUIDES, FAQS, VIDEOS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* QUICK GUIDES */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
              Quick Guides
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => handlePopularSearch('booking')}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5">Booking Process</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Learn how to reserve your spot ahead of time using the mobile app.</p>
              </div>

              <div 
                onClick={() => handlePopularSearch('payment')}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5">Payment Methods</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Accepted e-wallets, credit cards, and automated billing setup.</p>
              </div>

              <div 
                onClick={() => handlePopularSearch('QR')}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <QrCode className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5">QR & RFID Access</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Troubleshoot entry gates and automatic barrier recognition issues.</p>
              </div>
            </div>
          </section>

          {/* FAQS ACCORDION */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Frequently Asked Questions</h3>
            
            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-xs"
                >
                  <button 
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors focus:outline-none"
                  >
                    <span className="text-xs font-bold text-slate-700">{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-50 leading-relaxed bg-slate-50/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="p-5 text-center text-slate-400 text-xs">
                  No matches for your search. Try adjusting the keywords.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: SYSTEM STATUS & CONTACT */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CONTACT INFO */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Need more help?</h4>
            
            <div className="space-y-3">
              <a
                href="mailto:support@pbms.smartcity.vn?subject=Live%20Chat%20Support%20Request"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Live Chat / Email Support</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">support@pbms.smartcity.vn</p>
                </div>
              </a>

              <a 
                href="tel:+8419008888"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-9 h-9 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">24/7 Hotline support</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Call +84 1900 8888 (Toll Free)</p>
                </div>
              </a>
            </div>
          </div>

          {/* POPULAR TOPICS */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Topics</h4>
            <ul className="space-y-3">
              {[
                'How to extend my parking session remotely?',
                'Troubleshooting GPS location accuracy',
                'Exporting monthly parking invoices'
              ].map((q, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => handlePopularSearch(q)}
                    className="text-xs text-emerald-700 hover:underline text-left block font-semibold leading-relaxed"
                  >
                    {q}
                  </button>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Used by {idx === 0 ? '1.2k' : idx === 1 ? '850' : '420'} drivers</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SYSTEM STATUS ANNOUNCEMENTS */}
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <Volume2 className="w-4.5 h-4.5 animate-bounce" />
              <h4 className="text-xs font-bold uppercase tracking-wider">System Gate Status</h4>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></div>
                <div>
                  <p className="font-bold text-slate-700">Payment Gateways: Operational</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Credit card & wallet processing is fully functional.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 shrink-0"></div>
                <div>
                  <p className="font-bold text-slate-700">RFID Barrier Zone 4: Maintenance</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Gate will undergo sensor sync from 2:00 AM - 4:00 AM.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
