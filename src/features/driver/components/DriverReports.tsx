'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { 
  FileText, 
  HelpCircle, 
  Star, 
  Upload, 
  AlertTriangle, 
  DollarSign, 
  Car, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck
} from 'lucide-react';

interface IncidentReport {
  id: string;
  category: string;
  description: string;
  submittedAt: string;
  status: 'resolved' | 'investigating' | 'received';
  caseNumber: string;
}

export default function DriverReports() {
  const { user, showToast } = useAuth();
  const router = useRouter();

  // Form States
  const [rating, setRating] = useState<number>(4);
  const [category, setCategory] = useState<string>('general');
  const [description, setDescription] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');
  
  // Simulated Reports list
  const [reports, setReports] = useState<IncidentReport[]>([
    { id: '1', category: 'Overcharged Fee - Booking #9822', description: 'Charged for 5 hours instead of 3 hours.', submittedAt: 'Submitted Oct 12, 2026', status: 'resolved', caseNumber: 'PS-1102' },
    { id: '2', category: 'Occupied Slot - Level 3, Slot B4', description: 'Another car is parked in my reserved slot.', submittedAt: 'Submitted Today, 09:45 AM', status: 'investigating', caseNumber: 'PS-1290' },
  ]);

  const handleTileClick = (cat: string) => {
    setCategory(cat);
    showToast(`Category set to: ${cat.replace('-', ' ')}`, 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceName(e.target.files[0].name);
      showToast(`File attached: ${e.target.files[0].name}`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide a description of the issue.', 'error');
      return;
    }

    const newReport: IncidentReport = {
      id: Date.now().toString(),
      category: category === 'lost-ticket' ? 'Lost Ticket Retrieval' : 
                category === 'wrong-fee' ? 'Fee Overcharge Review' : 
                category === 'occupied-slot' ? 'Occupied Reserved Slot' : 'General Feedback',
      description,
      submittedAt: 'Submitted Just now',
      status: 'received',
      caseNumber: `PS-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setReports(prev => [newReport, ...prev]);
    setDescription('');
    setEvidenceName('');
    showToast('Your report has been submitted. A specialist will review it shortly.', 'success');
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Feedback & Incident Support</h1>
        <p className="text-sm text-slate-400 mt-1">Report parking issues or provide feedback to help us improve your commute.</p>
      </section>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FORM & ACTIVITY */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* QUICK TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => handleTileClick('lost-ticket')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                category === 'lost-ticket' 
                  ? 'border-emerald-600 bg-emerald-50/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs'
              }`}
            >
              <FileText className={`w-5 h-5 mb-2 ${category === 'lost-ticket' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
              <span className="text-xs font-bold text-slate-700">Lost Ticket</span>
              <span className="text-[10px] text-slate-400 mt-1">Start ticket recovery</span>
            </button>

            <button 
              onClick={() => handleTileClick('wrong-fee')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                category === 'wrong-fee' 
                  ? 'border-emerald-600 bg-emerald-50/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs'
              }`}
            >
              <DollarSign className={`w-5 h-5 mb-2 ${category === 'wrong-fee' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
              <span className="text-xs font-bold text-slate-700">Wrong Fee</span>
              <span className="text-[10px] text-slate-400 mt-1">Request charge review</span>
            </button>

            <button 
              onClick={() => handleTileClick('occupied-slot')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                category === 'occupied-slot' 
                  ? 'border-emerald-600 bg-emerald-50/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs'
              }`}
            >
              <Car className={`w-5 h-5 mb-2 ${category === 'occupied-slot' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
              <span className="text-xs font-bold text-slate-700">Occupied Slot</span>
              <span className="text-[10px] text-slate-400 mt-1">Report slot blockage</span>
            </button>
          </div>

          {/* MAIN FORM */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Submit Report</h2>
              
              {/* Stars selection */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 font-semibold mr-1.5">Rate Experience:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`w-4 h-4 transition-transform hover:scale-110 ${
                        star <= rating 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-slate-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Report Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-700"
                  >
                    <option value="general">General Feedback</option>
                    <option value="lost-ticket">Lost Ticket Retrieval</option>
                    <option value="wrong-fee">Wrong Charging Review</option>
                    <option value="occupied-slot">Reserved Slot Occupied</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Detailed Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details (e.g. Booking ID, Slot location, Vehicle plates, Gate number) to help us resolve it quickly..."
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium rounded-xl resize-none"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Evidence Upload (Optional)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    {evidenceName ? `Attached: ${evidenceName}` : 'Click or drag photo evidence here'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG up to 10MB</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Submit Incident Ticket
                </button>
              </div>
            </form>
          </div>

          {/* RECENT TICKETS LIST */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Active Tickets</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <div key={report.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      report.status === 'resolved' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : report.status === 'investigating'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {report.status === 'resolved' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{report.category}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{report.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wide">{report.submittedAt} · Case #{report.caseNumber}</p>
                    </div>
                  </div>

                  <span className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
                    report.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                      : report.status === 'investigating'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                      : 'bg-slate-50 text-slate-600 border-slate-200/50'
                  }`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: HOTLINE & CHAT */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* HERO BANNER CARD */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#1B2A41] text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="font-bold text-sm">Need Instant Support?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our city operators are available 24/7. Connect directly via live chat or emergency hotline.
            </p>
          </div>

          {/* CONTACT INFO WIDGET */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">Live Support Options</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Live Chat Assistant</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Average reply rate: <span className="font-bold text-emerald-600">2 mins</span></p>
                  <button 
                    onClick={() => showToast('Connecting to a live operator...', 'info')}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold mt-1.5 hover:underline"
                  >
                    Start Conversation &rarr;
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">24/7 Hotline</h4>
                  <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">+1 (800) SMART-PK</p>
                  <p className="text-[10px] text-slate-400">Toll-free emergency dispatch line</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Email Helpdesk</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">support@parkingsmart.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* HELP CENTER QUICK LINK */}
          <div 
            onClick={() => router.push('/dashboard/driver/help')}
            className="bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between cursor-pointer group transition-all"
          >
            <div>
              <p className="text-xs font-bold text-emerald-800">Frequently Asked Questions</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Find immediate answers</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>

        </div>

      </div>

    </div>
  );
}
