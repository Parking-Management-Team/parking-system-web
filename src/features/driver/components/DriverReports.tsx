'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail, 
  Loader2
} from 'lucide-react';

interface IncidentReport {
  id: string;
  category: string;
  description: string;
  submittedAt: string;
  status: 'resolved' | 'investigating' | 'received';
  caseNumber: string;
}

interface IncidentType {
  id: number;
  incidentCode: string;
  incidentName: string;
  description?: string;
}

interface Vehicle {
  id: number;
  licensePlate: string;
}

export default function DriverReports() {
  const { user, showToast } = useAuth();
  const router = useRouter();

  // Form States
  const [rating, setRating] = useState<number>(4);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');
  
  // Real DB data states
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load vehicles, active sessions, incident types, and past reports
  const fetchReportData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Fetch user's registered vehicles
      const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
      let userPlates: string[] = [];
      if (vehRes.success && Array.isArray(vehRes.data)) {
        userPlates = vehRes.data.map((v: any) => v.licensePlate);
      }

      // 2. Fetch active sessions for this user
      const activeRes = await api.get<any>('/parking-sessions/active');
      let foundSessions: any[] = [];
      if (activeRes.success && Array.isArray(activeRes.data)) {
        foundSessions = activeRes.data.filter((s: any) => userPlates.includes(s.licensePlateIn));
        setActiveSessions(foundSessions);
        // Auto-select if only 1 session
        setSelectedSession(foundSessions.length === 1 ? foundSessions[0] : null);
      }

      // 3. Fetch Incident Types from DB
      const typeRes = await api.get<any>('/IncidentType');
      if (typeRes.success && Array.isArray(typeRes.data)) {
        setIncidentTypes(typeRes.data);
        if (typeRes.data.length > 0) {
          setSelectedTypeId(typeRes.data[0].id);
        }
      }

      // 4. Fetch all incidents and filter by user's license plates
      const incRes = await api.get<any>('/Incident?pageIndex=1&pageSize=100');
      if (incRes.success && incRes.data?.items && Array.isArray(incRes.data.items)) {
        const filteredIncidents = incRes.data.items.filter((inc: any) => 
          userPlates.includes(inc.licensePlate)
        );

        const mappedReports: IncidentReport[] = filteredIncidents.map((inc: any) => {
          let uiStatus: 'resolved' | 'investigating' | 'received' = 'received';
          if (inc.status === 2) uiStatus = 'resolved';
          else if (inc.status === 1) uiStatus = 'investigating';
          
          return {
            id: inc.id.toString(),
            category: inc.incidentName || 'Incident Report',
            description: inc.description || '',
            submittedAt: `Submitted at: ${new Date(inc.createdAt).toLocaleString('en-US')}`,
            status: uiStatus,
            caseNumber: `INC-${inc.id}`
          };
        });

        setReports(mappedReports);
      }
    } catch (err) {
      console.error('Error loading incident data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceName(e.target.files[0].name);
      showToast(`File attached successfully: ${e.target.files[0].name}`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter a detailed description of the incident.', 'error');
      return;
    }

    if (!selectedTypeId) {
      showToast('Please select an incident category.', 'error');
      return;
    }

    if (!selectedSession) {
      showToast('Please select the parking session to report.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sessionId: selectedSession.id,
        incidentTypeId: Number(selectedTypeId),
        description: description.trim()
      };

      const res = await api.post<any>('/Incident', payload);
      if (res.success) {
        showToast('Your incident report has been submitted successfully!', 'success');
        setDescription('');
        setEvidenceName('');
        // Reload data from DB
        fetchReportData();
      } else {
        showToast(res.message || 'Error submitting incident report.', 'error');
      }
    } catch (err) {
      console.error('Incident API error:', err);
      showToast('Failed to send data to the server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Incident Report</h1>
        <p className="text-sm text-slate-400 mt-1">Report parking issues or submit an incident to help us resolve your concern quickly.</p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        /* GRID LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: FORM & ACTIVITY */}
          <div className="lg:col-span-8 space-y-6">
            

            {/* MAIN FORM */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Submit Report</h2>
                
                {/* Active Session Info / Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Active Session:</span>
                  {activeSessions.length === 0 ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-red-50 text-red-600">Not Found</span>
                  ) : (
                    <select
                      value={selectedSession?.id ?? ''}
                      onChange={(e) => {
                        const s = activeSessions.find(x => String(x.id) === e.target.value);
                        setSelectedSession(s ?? null);
                      }}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer font-sans"
                    >
                      <option value="">-- Select Session --</option>
                      {activeSessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.licensePlateIn} ({s.slotCode || 'Parked'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Report Category</label>
                    <select
                      value={selectedTypeId}
                      onChange={(e) => setSelectedTypeId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-700"
                    >
                      {incidentTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.incidentName}</option>
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
                    placeholder="Provide details and description of the incident here..."
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
                    disabled={isSubmitting || !selectedSession}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                {reports.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No incident reports found for your vehicles.
                  </div>
                ) : (
                  reports.map((report) => (
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
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INFO & SUPPORT */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Need Immediate Help?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                If you have an urgent parking loop blockage or barrier hardware emergency, please contact the security counter directly.
              </p>
              
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <a href="tel:0943059948" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group">
                  <Phone className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Phone Hotline</div>
                    <div className="text-xs font-bold text-slate-700">0943059948</div>
                  </div>
                </a>

                <a href="mailto:support@pbms.com" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group">
                  <Mail className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Email Support</div>
                    <div className="text-xs font-bold text-slate-700">support@pbms.com</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Incident Policy</h3>
              <div className="space-y-3">
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <p className="text-slate-500 font-medium leading-relaxed">Lost parking card or ticket is subject to a penalty fee of 100,000 VND.</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <p className="text-slate-500 font-medium leading-relaxed">Overstaying past the registered time window is subject to overstay penalty rates.</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <p className="text-slate-500 font-medium leading-relaxed">Response time for banking transaction verification queries is 24 business hours.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
