'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { useIncidentTypes } from '@/features/incident-type';
import { incidentService } from '@/features/incident';
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
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ParkingSessionOption {
  id: number;
  licensePlate: string;
  checkInTime: string;
  slotCode?: string;
  status: string;
}

interface IncidentDisplay {
  id: number;
  category: string;
  description: string;
  submittedAt: string;
  status: 'Open' | 'Processing' | 'Resolved' | 'Cancelled';
  caseNumber: string;
  penaltyFee: number;
}

export default function ReportsPage() {
  const { user, showToast } = useAuth();
  const router = useRouter();

  // API Data Hooks & States
  const { incidentTypes, loading: loadingTypes } = useIncidentTypes();
  const [sessions, setSessions] = useState<ParkingSessionOption[]>([]);
  const [driverIncidents, setDriverIncidents] = useState<IncidentDisplay[]>([]);
  const [userPlates, setUserPlates] = useState<string[]>([]);
  
  // Loading states
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [rating, setRating] = useState<number>(5);
  const [selectedIncidentTypeId, setSelectedIncidentTypeId] = useState<number>(0);
  const [selectedSessionId, setSelectedSessionId] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');

  // Fetch driver plates & sessions
  const fetchDriverData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingSessions(true);
    try {
      // 1. Get driver's vehicle plates
      let plates: string[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          plates = vehRes.data.map((v: any) => v.licensePlate);
          setUserPlates(plates);
        }
      } catch (err) {
        console.error('Error loading vehicles:', err);
      }

      // 2. Get active sessions matching plates
      const sessionOptions: ParkingSessionOption[] = [];
      try {
        const sessRes = await api.get<any>('/parking-sessions/active');
        if (sessRes.success && Array.isArray(sessRes.data)) {
          const activeMatched = sessRes.data.filter((s: any) => 
            plates.includes(s.licensePlateIn)
          );
          activeMatched.forEach((s: any) => {
            sessionOptions.push({
              id: s.id,
              licensePlate: s.licensePlateIn,
              checkInTime: s.checkInTime,
              slotCode: s.slotCode,
              status: 'Active'
            });
          });
        }
      } catch (err) {
        console.error('Error loading active sessions:', err);
      }

      // 3. Get completed/past sessions matching plates
      try {
        const sessRes = await api.get<any>(`/parking-sessions/by-account/${user.id}`);
        if (sessRes.success && Array.isArray(sessRes.data)) {
          sessRes.data.forEach((s: any) => {
            // Avoid duplicates
            if (!sessionOptions.some(item => item.id === s.id)) {
              sessionOptions.push({
                id: s.id,
                licensePlate: s.licensePlateIn || s.licensePlate || '',
                checkInTime: s.checkInTime,
                slotCode: s.slotCode,
                status: s.sessionStatus || 'Completed'
              });
            }
          });
        }
      } catch (err) {
        // Fallback or ignore
      }

      setSessions(sessionOptions);
      if (sessionOptions.length > 0) {
        setSelectedSessionId(sessionOptions[0].id);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  // Fetch driver incidents
  const fetchIncidentsData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingIncidents(true);
    try {
      // Fetch all incidents
      const allIncidents = await incidentService.getAll();
      
      // Get driver plates first if not already loaded
      let plates = userPlates;
      if (plates.length === 0) {
        try {
          const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
          if (vehRes.success && vehRes.data) {
            plates = vehRes.data.map((v: any) => v.licensePlate);
            setUserPlates(plates);
          }
        } catch { /* ignore */ }
      }

      // Filter client-side by driver license plates
      const filtered = allIncidents
        .filter((inc) => inc.licensePlate && plates.includes(inc.licensePlate))
        .map((inc) => {
          // Normalize status
          let normStatus: 'Open' | 'Processing' | 'Resolved' | 'Cancelled' = 'Open';
          if (inc.status === 'Processing' || inc.status === 1) normStatus = 'Processing';
          else if (inc.status === 'Resolved' || inc.status === 2) normStatus = 'Resolved';
          else if (inc.status === 'Cancelled' || inc.status === 3) normStatus = 'Cancelled';

          return {
            id: inc.id,
            category: inc.incidentName || 'Incident Support',
            description: inc.description || 'No description provided.',
            submittedAt: new Date(inc.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: normStatus,
            caseNumber: `PS-INC-${inc.id}`,
            penaltyFee: inc.penaltyFee
          };
        });

      // Sort newest first
      filtered.sort((a, b) => b.id - a.id);
      setDriverIncidents(filtered);
    } catch (err) {
      console.error('Error fetching driver incidents:', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [user, userPlates]);

  useEffect(() => {
    if (user?.id) {
      fetchDriverData();
    }
  }, [user, fetchDriverData]);

  useEffect(() => {
    if (user?.id) {
      fetchIncidentsData();
    }
  }, [user, fetchIncidentsData]);

  // Handle selected type changes to set default dropdown value
  useEffect(() => {
    if (incidentTypes.length > 0 && selectedIncidentTypeId === 0) {
      setSelectedIncidentTypeId(incidentTypes[0].id);
    }
  }, [incidentTypes, selectedIncidentTypeId]);

  const handleTileClick = (typeName: string) => {
    const matched = incidentTypes.find(t => 
      t.incidentName?.toLowerCase().includes(typeName.toLowerCase())
    );
    if (matched) {
      setSelectedIncidentTypeId(matched.id);
      showToast(`Category set to: ${matched.incidentName}`, 'info');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceName(e.target.files[0].name);
      showToast(`File attached: ${e.target.files[0].name}`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      showToast('You must have a parking session selected to submit a ticket.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Please provide a description of the issue.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedType = incidentTypes.find(t => t.id === selectedIncidentTypeId);
      const fee = selectedType?.defaultPenaltyFee ?? 0;
      const matchedSession = sessions.find(s => s.id === selectedSessionId);

      const success = await incidentService.create({
        sessionId: selectedSessionId,
        incidentTypeId: selectedIncidentTypeId,
        description: description,
        penaltyFee: fee,
        licensePlate: matchedSession?.licensePlate
      } as any);

      if (success) {
        showToast('Your report has been submitted. An operator will review it shortly.', 'success');
        setDescription('');
        setEvidenceName('');
        // Refresh list
        fetchIncidentsData();
      } else {
        showToast('Failed to submit incident ticket. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      const errMsg = err?.data?.message || err?.message || 'Failed to submit report. Please check details.';
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
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
              type="button"
              onClick={() => handleTileClick('ticket')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-xs`}
            >
              <FileText className="w-5 h-5 mb-2 text-slate-400 group-hover:text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Lost Ticket</span>
              <span className="text-[10px] text-slate-400 mt-1">Start ticket recovery</span>
            </button>

            <button 
              type="button"
              onClick={() => handleTileClick('charge')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-xs`}
            >
              <DollarSign className="w-5 h-5 mb-2 text-slate-400 group-hover:text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Wrong Fee</span>
              <span className="text-[10px] text-slate-400 mt-1">Request charge review</span>
            </button>

            <button 
              type="button"
              onClick={() => handleTileClick('slot')}
              className={`group flex flex-col p-4 rounded-xl border text-left transition-all active:scale-[0.98] bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-xs`}
            >
              <Car className="w-5 h-5 mb-2 text-slate-400 group-hover:text-emerald-600" />
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

            {loadingTypes || isLoadingSessions ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-slate-400 text-xs">Loading incident settings & sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No active or past parking sessions found for your account.</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To report an incident, it must be linked to a parking session. If you have questions, please use our Hotline or Email helpdesk.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parking Session Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Select Parking Session</label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-700"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          Session #{s.id} — {s.licensePlate} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Incident Type Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Report Category</label>
                    <select
                      value={selectedIncidentTypeId}
                      onChange={(e) => setSelectedIncidentTypeId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-700"
                    >
                      {incidentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.incidentName} {(type.defaultPenaltyFee ?? 0) > 0 ? `(${(type.defaultPenaltyFee ?? 0).toLocaleString()} VND penalty)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide precise details to help us resolve it quickly..."
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
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Submit Incident Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RECENT TICKETS LIST */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Active Tickets</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {isLoadingIncidents ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs">Loading reported tickets...</p>
                </div>
              ) : driverIncidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  You haven't submitted any incident tickets yet.
                </div>
              ) : (
                driverIncidents.map((report) => (
                  <div key={report.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        report.status === 'Resolved' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : report.status === 'Processing'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {report.status === 'Resolved' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{report.category}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{report.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wide">
                          {report.submittedAt} · Case #{report.caseNumber} {report.penaltyFee > 0 ? `· Fine: ${report.penaltyFee.toLocaleString()} VND` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        : report.status === 'Processing'
                        ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                        : 'bg-slate-50 text-slate-600 border-slate-200/50'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                ))
              )}
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
                    type="button"
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
