'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePayments } from '../hooks/usePayments';
import {
  Search,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Briefcase,
  Layers,
  FileText,
  Printer,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function PaymentWorkspace() {
  const {
    payments,
    totalCount,
    totalPages,
    pageIndex,
    isLoading,
    error,
    fetchPayments,
    fetchPaymentsBySession,
    fetchPaymentsByAccount,
  } = usePayments();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  // Custom lookups
  const [lookupType, setLookupType] = useState<'advanced' | 'session' | 'account'>('advanced');
  const [lookupId, setLookupId] = useState('');

  // Selected Transaction for Invoice Modal
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);

  const triggerFetch = useCallback((page = 1) => {
    if (lookupType === 'session') {
      const sid = Number(lookupId);
      if (sid) fetchPaymentsBySession(sid);
    } else if (lookupType === 'account') {
      const aid = Number(lookupId);
      if (aid) fetchPaymentsByAccount(aid);
    } else {
      fetchPayments({
        pageIndex: page,
        pageSize: 10,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        method: methodFilter
      });
    }
  }, [fetchPayments, fetchPaymentsBySession, fetchPaymentsByAccount, lookupType, lookupId, fromDate, toDate, methodFilter]);

  useEffect(() => {
    triggerFetch(1);
  }, [triggerFetch]);

  // Compute metrics from current transactions
  const metrics = useMemo(() => {
    let total = 0;
    let cash = 0;
    let online = 0;
    let successCount = 0;

    payments.forEach(p => {
      total += p.amount;
      const method = (p.paymentMethod || '').toUpperCase();
      if (method === 'CASH') {
        cash += p.amount;
      } else {
        online += p.amount;
      }
      if (p.status.toUpperCase() === 'SUCCESS') {
        successCount++;
      }
    });

    return { total, cash, online, successCount };
  }, [payments]);

  // Client-side text filter on payments table for advanced search
  const activeStatuses = ['SUCCESS', 'COMPLETED', 'PENDING'];
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (showActiveOnly) {
      result = result.filter(p => activeStatuses.includes((p.status || '').toUpperCase()));
    }
    if (!searchTerm) return result;
    const searchVal = searchTerm.toLowerCase().trim();
    return result.filter(p => 
      (p.referenceCode || '').toLowerCase().includes(searchVal) ||
      (p.licensePlate || '').toLowerCase().includes(searchVal) ||
      (p.fullName || '').toLowerCase().includes(searchVal)
    );
  }, [payments, searchTerm, showActiveOnly]);

  const formatDate = (raw: string) => {
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return raw;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payments & Transactions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review client transaction records, filter cash or online bank transfers, and print invoices.
          </p>
        </div>
        <button
          onClick={() => triggerFetch(pageIndex)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* REVENUE TILES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume (Set)</span>
            <h3 className="text-3xl font-black text-slate-800 mt-2">{metrics.total.toLocaleString()} đ</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Aggregate transactions</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-[#006d43] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cash Payments</span>
            <h3 className="text-3xl font-black text-[#006d43] mt-2">{metrics.cash.toLocaleString()} đ</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Briefcase className="w-3.5 h-3.5 text-[#006d43]" />
            <span>Over-the-counter payments</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Online Banking</span>
            <h3 className="text-3xl font-black text-blue-600 mt-2">{metrics.online.toLocaleString()} đ</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>VNPAY & wire transfers</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Completed Swaps</span>
            <h3 className="text-3xl font-black text-slate-700 mt-2">{metrics.successCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Successful status count</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => { setLookupType('advanced'); setLookupId(''); }}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 -mb-px ${lookupType === 'advanced' ? 'border-[#006d43] text-[#006d43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          General Transactions
        </button>
        <button
          onClick={() => { setLookupType('session'); setLookupId(''); }}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 -mb-px ${lookupType === 'session' ? 'border-[#006d43] text-[#006d43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Search by Session ID
        </button>
        <button
          onClick={() => { setLookupType('account'); setLookupId(''); }}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 -mb-px ${lookupType === 'account' ? 'border-[#006d43] text-[#006d43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Search by Account ID
        </button>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        {lookupType === 'advanced' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search reference or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl"
              />
            </div>

            {/* Method Filter */}
            <div className="relative">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600 appearance-none cursor-pointer"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">CASH</option>
                <option value="ONLINE_BANKING">ONLINE_BANKING</option>
              </select>
              <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* From Date */}
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600"
              />
            </div>

            {/* To Date */}
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600"
              />
            </div>

            {/* Show Active Only Toggle */}
            <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={() => setShowActiveOnly(!showActiveOnly)}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-colors ${showActiveOnly ? 'bg-[#006d43]' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showActiveOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600">Show Active Only</span>
            </label>
          </div>
        ) : (
          <div className="flex gap-4 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                placeholder={lookupType === 'session' ? 'Enter Session ID (e.g. 24)...' : 'Enter Customer Account ID (e.g. 5)...'}
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl font-mono"
              />
            </div>
            <button
              onClick={() => triggerFetch(1)}
              className="px-5 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Search
            </button>
          </div>
        )}

        {/* PAYMENT LIST TABLE */}
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading transaction reports...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={() => triggerFetch(pageIndex)}
                className="mt-3 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Retry
              </button>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              No transactions matching the query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Reference Code</th>
                  <th className="px-6 py-4">Vehicle Plate</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Date Time</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((p) => {
                  const status = (p.status || '').toUpperCase();
                  const method = (p.paymentMethod || '').toUpperCase();

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        #{p.id}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                        {p.referenceCode}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {p.licensePlate || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {p.fullName || 'Driver'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          method === 'CASH' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">
                        {p.amount.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          status === 'SUCCESS' || status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            status === 'SUCCESS' || status === 'COMPLETED' ? 'bg-emerald-600' : status === 'PENDING' ? 'bg-amber-600' : 'bg-rose-600'
                          }`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedTxn(p)}
                          className="p-1 text-slate-400 hover:text-[#006d43] rounded hover:bg-slate-100 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {lookupType === 'advanced' && !isLoading && payments.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs rounded-xl">
            <span className="text-slate-400">
              Showing Page {pageIndex} of {totalPages} (Total {totalCount} records)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => triggerFetch(Math.max(1, pageIndex - 1))}
                disabled={pageIndex === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => triggerFetch(p)}
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${pageIndex === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => triggerFetch(Math.min(totalPages, pageIndex + 1))}
                disabled={pageIndex === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
              <span className="text-xs font-bold text-slate-500">Transaction Receipt</span>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Bill Layout */}
            <div id="printable-area" className="p-8 flex-1 space-y-6 text-slate-700 bg-white">
              {/* Header Bill */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-800">PBMS PARKING PORTAL</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Official Payment Voucher</p>
                <div className="h-px bg-dashed bg-slate-200 my-2" />
              </div>

              {/* Bill Attributes */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-800">#{selectedTxn.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference No</span>
                  <span className="font-mono text-slate-800">{selectedTxn.referenceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License Plate</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTxn.licensePlate || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer</span>
                  <span className="font-semibold text-slate-800">{selectedTxn.fullName || 'VIP Driver'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Date</span>
                  <span className="font-medium text-slate-600">{formatDate(selectedTxn.paymentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Type</span>
                  <span className="font-bold text-slate-800">{selectedTxn.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-600">{selectedTxn.status}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Grand Total</span>
                  <span className="text-lg font-black text-slate-800">
                    {selectedTxn.amount.toLocaleString()} đ
                  </span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-400 font-medium">
                Thank you for using PBMS services.<br />
                Please keep this receipt for verification.
              </div>
            </div>

            {/* Print button footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 print:hidden">
              <button
                onClick={() => setSelectedTxn(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
