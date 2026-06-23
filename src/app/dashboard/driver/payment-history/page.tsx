'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import {
  History,
  Search,
  Download,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Printer,
  QrCode,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Transaction {
  id: string | number;
  amount: number;
  paymentMethod?: string;
  status: string;
  createdAt?: string;
  bookingId?: number;
  sessionId?: number;
  description?: string;
  // raw API fields
  paymentStatus?: string;
}

function normalizeStatus(raw: string | undefined): 'success' | 'pending' | 'failed' {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'paid') return 'success';
  if (s === 'failed' || s === 'cancelled' || s === 'error') return 'failed';
  return 'pending';
}

export default function PaymentHistoryPage() {
  const { user, showToast } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthSpent, setMonthSpent] = useState(0);

  const fetchPayments = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // 1. Fetch user bookings
      let userBookings: any[] = [];
      try {
        const bookRes = await api.get<any>(`/bookings/by-account/${user.id}`);
        if (bookRes.success && Array.isArray(bookRes.data)) {
          userBookings = bookRes.data;
        }
      } catch (err) {
        console.error('Error fetching bookings for payment history:', err);
      }

      // 2. Fetch user vehicles to get plates
      let userPlates: string[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && Array.isArray(vehRes.data)) {
          userPlates = vehRes.data.map((v: any) => v.licensePlate.toUpperCase());
        }
      } catch (err) {
        console.error('Error fetching vehicles for payment history:', err);
      }

      // 3. Fetch all parking sessions and filter by user vehicles
      let userSessions: any[] = [];
      try {
        const sessRes = await api.get<any>('/parking-sessions');
        if (sessRes.success && Array.isArray(sessRes.data)) {
          userSessions = sessRes.data.filter((s: any) => 
            userPlates.includes((s.licensePlateIn || s.licensePlate || '').toUpperCase())
          );
        }
      } catch (err) {
        console.error('Error fetching sessions for payment history:', err);
      }

      // 4. Map bookings to transaction items
      const bookingTxns: Transaction[] = userBookings.map((b: any) => {
        const isPaid = b.bookingStatus === 'Confirmed' || b.bookingStatus === 'CheckedIn' || !!b.confirmedAt;
        const isPending = b.bookingStatus === 'Pending';
        const isCancelled = b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Expired';
        
        let status: 'success' | 'pending' | 'failed' = 'pending';
        if (isPaid) status = 'success';
        else if (isCancelled) status = 'failed';
        else if (isPending) status = 'pending';

        return {
          id: `bk-${b.id}`,
          amount: b.depositAmount ?? 5.00,
          paymentMethod: 'Online Banking',
          status,
          createdAt: b.confirmedAt || b.createdAt || '',
          bookingId: b.id,
          description: `Deposit for Booking #BK-${b.id}`
        };
      });

      // 5. Map completed sessions to transaction items
      const sessionTxns: Transaction[] = userSessions
        .filter((s: any) => s.sessionStatus === 'COMPLETED' || !!s.checkOutTime)
        .map((s: any) => {
          const checkIn = new Date(s.checkInTime).getTime();
          const checkOut = new Date(s.checkOutTime || new Date()).getTime();
          const diffSecs = Math.max(0, Math.floor((checkOut - checkIn) / 1000));
          let fee = parseFloat(((diffSecs / 3600) * 3.0).toFixed(2));

          // Subtract deposit if linked to booking
          if (s.bookingId) {
            const matchedBooking = userBookings.find((b: any) => b.id === s.bookingId);
            if (matchedBooking) {
              fee = Math.max(0, fee - (matchedBooking.depositAmount ?? 5.00));
            }
          }

          return {
            id: `ss-${s.id}`,
            amount: fee,
            paymentMethod: 'Online Banking',
            status: 'success',
            createdAt: s.checkOutTime || '',
            sessionId: s.id,
            description: `Parking fee for Session #SS-${s.id}`
          };
        });

      // Combine and sort newest first
      const combined = [...bookingTxns, ...sessionTxns];
      combined.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      setTransactions(combined);

      // Compute statistics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let total = 0;
      let monthTotal = 0;
      
      combined.forEach((t: Transaction) => {
        if (t.status === 'success') {
          total += t.amount;
          if (t.createdAt) {
            const d = new Date(t.createdAt);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              monthTotal += t.amount;
            }
          }
        }
      });
      
      setTotalSpent(total);
      setMonthSpent(monthTotal);

    } catch (err) {
      console.error('Error generating payment history:', err);
      setTransactions([]);
      setTotalSpent(0);
      setMonthSpent(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePrint = () => { window.print(); };

  const filteredTransactions = transactions.filter(t => {
    const id = String(t.id);
    const matchesSearch = id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginated = filteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (raw: string) => {
    if (!raw) return '—';
    try { return new Date(raw).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return raw; }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">

      {/* PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transaction History</h1>
          <p className="text-sm text-slate-400 mt-1">Review all your payments, invoices, and billing statements.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchPayments()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => { showToast('Exporting transaction list...', 'success'); window.print(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </section>

      {/* STATS TILES */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Total
            </span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Spent</p>
            <h3 className="text-2xl font-extrabold text-[#1B2A41] mt-1">
              {isLoading ? '—' : `$${totalSpent.toFixed(2)}`}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">This Month</span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Month Spending</p>
            <h3 className="text-2xl font-extrabold text-[#1B2A41] mt-1">
              {isLoading ? '—' : `$${monthSpent.toFixed(2)}`}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">All</span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Transactions</p>
            <h3 className="text-2xl font-extrabold text-[#1B2A41] mt-1">
              {isLoading ? '—' : transactions.length}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Rate</span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Success Rate</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-[#1B2A41]">
                {isLoading || transactions.length === 0 ? '—' : `${Math.round((transactions.filter(t => t.status === 'success').length / transactions.length) * 100)}%`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TABLE SECTION */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* SEARCH & FILTERS */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search ID, method, description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium rounded-xl"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-bold rounded-xl bg-white text-slate-600 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading payment history...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">#{String(t.id).slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">
                        {t.description || (t.bookingId ? `Booking #${t.bookingId}` : t.sessionId ? `Session #${t.sessionId}` : 'Parking Payment')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.paymentMethod || 'Online Banking'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                        {t.paymentMethod || 'Online'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(t.createdAt || '')}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">${t.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${t.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${t.status === 'success' ? 'bg-emerald-600' : t.status === 'pending' ? 'bg-amber-600' : 'bg-rose-600'
                          }`}></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedTxn(t)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="View Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 text-slate-300" />
                        <p className="text-slate-400 text-xs font-medium">
                          {searchTerm || statusFilter !== 'all' ? 'No matching transactions.' : 'No payment history found.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTransactions.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${currentPage === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL */}
      {mounted && selectedTxn && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-mono font-semibold tracking-wider text-emerald-400">RECEIPT #{String(selectedTxn.id).slice(0, 8)}</span>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Parking Smart Portal</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Official Electronic Receipt</p>
              </div>

              <div className="border-t border-dashed border-slate-200"></div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-bold text-slate-700 font-mono">#{String(selectedTxn.id).slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Description</span>
                  <span className="font-bold text-slate-700 text-right">
                    {selectedTxn.description || (selectedTxn.bookingId ? `Booking #${selectedTxn.bookingId}` : selectedTxn.sessionId ? `Session #${selectedTxn.sessionId}` : 'Parking Payment')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="font-bold text-slate-700">{selectedTxn.paymentMethod || 'Online Banking'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Date</span>
                  <span className="font-bold text-slate-700">{formatDate(selectedTxn.createdAt || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className={`font-bold capitalize ${selectedTxn.status === 'success' ? 'text-emerald-600' : selectedTxn.status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {selectedTxn.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200"></div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-bold text-slate-800">Total Paid</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-600">${selectedTxn.amount.toFixed(2)}</span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 pt-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <QrCode className="w-24 h-24 text-slate-800" />
                </div>
                {selectedTxn.status === 'success' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Transaction Cleared
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
