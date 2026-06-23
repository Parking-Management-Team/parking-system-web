'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useAccounts } from '../hooks/useAccounts';
import { 
  History, 
  User, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Activity, 
  Clock, 
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';
import { AuditLogDto } from '../types/audit-log';

const FRIENDLY_TABLES = [
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'pricing_policy', label: 'Pricing Policies' },
  { value: 'blacklist', label: 'Blacklist Control' },
  { value: 'account', label: 'User Accounts' },
  { value: 'incident', label: 'Incidents' },
  { value: 'device', label: 'Devices' },
  { value: 'slot', label: 'Parking Slots' }
];

export default function AuditLogsWorkspace() {
  const {
    items,
    totalCount,
    totalPages,
    pageIndex,
    loading,
    error,
    setSelectedAccountId,
    selectedAction,
    setSelectedAction,
    selectedTable,
    setSelectedTable,
    fetchLogs,
    setPageIndex,
  } = useAuditLogs(1, 10);

  const { accounts } = useAccounts();
  const [mounted, setMounted] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<AuditLogDto | null>(null);

  // Auto-complete suggestions state
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle outside clicks to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter accounts list for suggestions
  const accountSuggestions = useMemo(() => {
    const query = searchAccountQuery.trim().toLowerCase();
    if (!query) return [];
    return accounts.filter(
      (acc) =>
        (acc.fullName || '').toLowerCase().includes(query) ||
        acc.username.toLowerCase().includes(query)
    );
  }, [accounts, searchAccountQuery]);

  const handleQueryChange = (val: string) => {
    setSearchAccountQuery(val);
    if (!val) {
      setSelectedAccountId(undefined);
    }
    setShowSuggestions(true);
  };

  const handleClearAccount = () => {
    setSearchAccountQuery('');
    setSelectedAccountId(undefined);
    setShowSuggestions(false);
  };

  const handleSelectAccount = (id: number, name: string) => {
    setSelectedAccountId(id);
    setSearchAccountQuery(name);
    setShowSuggestions(false);
  };

  // Helper: map database raw table to user-friendly label
  const getFriendlyTableLabel = (rawTable: string | null) => {
    if (!rawTable) return 'System';
    const found = FRIENDLY_TABLES.find((t) => t.value === rawTable.toLowerCase());
    return found ? found.label : rawTable;
  };

  // Action badge colors
  const getActionBadgeClass = (action: string) => {
    const normalized = action.toUpperCase();
    if (normalized === 'CREATE') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (normalized === 'UPDATE') {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    if (normalized === 'DELETE') {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            System Audit Logs
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Audit trailing and historical system operation logs. Inspected records are queryable by actor, action type, and table target.
          </p>
        </div>
        <div>
          <button
            onClick={() => fetchLogs()}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-slate-600 transition duration-150 shadow-sm bg-white"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Control panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          Filter Operations
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account Selector (Auto-Complete suggestions) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Operator Account
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchAccountQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search operator name or username..."
                className="w-full pl-9 pr-9 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 text-xs font-semibold rounded-xl bg-white text-slate-700 placeholder:text-slate-400 transition"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              {searchAccountQuery && (
                <button
                  type="button"
                  onClick={handleClearAccount}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions drop block */}
            {showSuggestions && accountSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-lg divide-y divide-slate-50">
                {accountSuggestions.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc.id, acc.fullName || acc.username)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{acc.fullName || 'Unnamed Account'}</div>
                      <div className="text-[10px] text-slate-400">@{acc.username}</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-mono">
                      ID: {acc.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && searchAccountQuery.trim() !== '' && accountSuggestions.length === 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 p-3 bg-white border border-slate-100 rounded-xl shadow-lg text-center text-[10px] text-slate-400">
                No matching accounts found
              </div>
            )}
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 text-xs font-bold rounded-xl bg-white text-slate-700 transition"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* Target Table Dropdown */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Entity Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 text-xs font-bold rounded-xl bg-white text-slate-700 transition"
            >
              <option value="">All Tables</option>
              {FRIENDLY_TABLES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Operator</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Entity</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target ID</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wide text-right">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8" /></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-10" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded-xl w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                    No matching audit records found. Try clearing your filters.
                  </td>
                </tr>
              ) : (
                items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {log.accountName ? log.accountName.charAt(0) : 'S'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {log.accountName || 'System Generated'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {log.accountId ? `User ID: ${log.accountId}` : 'Auto Daemon'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      {getFriendlyTableLabel(log.targetTable)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-500">
                      {log.targetId ? log.targetId : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveDetailItem(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-bold text-slate-600 transition-all duration-150"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-semibold">
              Showing page <span className="text-slate-700">{pageIndex}</span> of{' '}
              <span className="text-slate-700">{totalPages}</span> ({totalCount} records total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pageIndex <= 1}
                onClick={() => setPageIndex(pageIndex - 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPageIndex(pageNum)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      pageIndex === pageNum
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={pageIndex >= totalPages}
                onClick={() => setPageIndex(pageIndex + 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide Drawer for details inspection */}
      {mounted && activeDetailItem !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={() => setActiveDetailItem(null)} />

          {/* Drawer Body container */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h3 className="font-extrabold text-slate-800 text-sm">Audit Log Inspection</h3>
              </div>
              <button
                onClick={() => setActiveDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Log ID & Badge */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Log Sequence ID</div>
                  <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">#{activeDetailItem.id}</div>
                </div>
                <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border ${getActionBadgeClass(activeDetailItem.action)}`}>
                  {activeDetailItem.action}
                </span>
              </div>

              {/* Operator details card */}
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Operator Profile
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                    {activeDetailItem.accountName ? activeDetailItem.accountName.charAt(0) : 'S'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {activeDetailItem.accountName || 'System Generated'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {activeDetailItem.accountId ? `Account ID: ${activeDetailItem.accountId}` : 'Automated Daemon Agent'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity targets metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Target Table
                  </span>
                  <span className="text-xs font-bold text-slate-800 block pt-1">
                    {getFriendlyTableLabel(activeDetailItem.targetTable)}
                  </span>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Target Record ID
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 block pt-1">
                    {activeDetailItem.targetId ? activeDetailItem.targetId : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Created Timestamp */}
              <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Action Executed At
                </span>
                <span className="text-xs text-slate-700 font-bold block pt-1">
                  {new Date(activeDetailItem.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                  })}
                </span>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Audit Activity Description
                </label>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 font-semibold leading-relaxed whitespace-pre-wrap">
                  {activeDetailItem.description || 'No supplementary activity description available.'}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveDetailItem(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Close Inspection Panel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
