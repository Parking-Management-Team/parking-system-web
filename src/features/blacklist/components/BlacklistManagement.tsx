'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBlacklist } from '../hooks/useBlacklist';
import { AddToBlacklistRequest } from '../types';
import { useAuth } from '@/features/auth';
import {
  Search,
  Plus,
  Trash2,
  Car,
  CreditCard,
  AlertOctagon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';

interface BlacklistManagementProps {
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

export default function BlacklistManagement({ role }: BlacklistManagementProps) {
  const { showToast } = useAuth();
  const {
    items,
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    loading,
    error,
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
  } = useBlacklist(1, 10);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // Form state
  const [blockType, setBlockType] = useState<'vehicle' | 'card'>('vehicle');
  const [licensePlate, setLicensePlate] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Client-side search filtering
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) => {
      const plateMatch = item.licensePlate?.toLowerCase().includes(term);
      const cardMatch = item.cardCode?.toLowerCase().includes(term);
      const reasonMatch = item.reason.toLowerCase().includes(term);
      const incidentMatch = item.incidentId?.toString().includes(term);
      return plateMatch || cardMatch || reasonMatch || incidentMatch;
    });
  }, [items, searchTerm]);

  // Statistics calculation based on items in page (or simple summary)
  const stats = useMemo(() => {
    let vehicleCount = 0;
    let cardCount = 0;
    items.forEach((item) => {
      if (item.vehicleId || item.licensePlate) vehicleCount++;
      if (item.cardId || item.cardCode) cardCount++;
    });
    return {
      vehicles: vehicleCount,
      cards: cardCount,
    };
  }, [items]);

  const handleOpenAddModal = () => {
    setBlockType('vehicle');
    setLicensePlate('');
    setCardCode('');
    setReason('');
    setIsAddModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchBlacklist(newPage, pageSize);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!reason.trim()) {
      showToast?.('Reason is required.', 'error');
      return;
    }
    if (reason.length > 100) {
      showToast?.('Reason must be at most 100 characters.', 'error');
      return;
    }

    const requestData: AddToBlacklistRequest = {
      reason: reason.trim(),
    };

    if (blockType === 'vehicle') {
      if (!licensePlate.trim()) {
        showToast?.('License plate number is required.', 'error');
        return;
      }
      requestData.licensePlate = licensePlate.trim().toUpperCase();
    } else {
      if (!cardCode.trim()) {
        showToast?.('Card RFID Code is required.', 'error');
        return;
      }
      requestData.cardCode = cardCode.trim().toUpperCase();
    }

    setSubmitting(true);
    try {
      await addToBlacklist(requestData);
      showToast?.('Successfully added to blacklist', 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast?.(err?.message || 'An error occurred while adding to the blacklist.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (isDeletingId === null) return;
    const success = await removeFromBlacklist(isDeletingId);
    if (success) {
      showToast?.('Removed target from blacklist successfully', 'success');
    } else {
      showToast?.('Failed to remove from blacklist', 'error');
    }
    setIsDeletingId(null);
  };

  const isStaff = role === 'STAFF';

  return (
    <div className="p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Blacklist Control Workspace</h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage blocked vehicles and RFID cards. Blocked targets will be rejected automatically during Check-in/Check-out.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBlacklist(pageIndex, pageSize)}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition duration-150"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add to Blacklist
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Blocked Vehicles</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.vehicles}</h3>
          </div>
          <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100">
            Vehicle
          </span>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Blocked Cards</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.cards}</h3>
          </div>
          <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs border border-orange-100">
            Card
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by license plate, card RFID or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all text-slate-800 font-medium"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition duration-150"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Main Table and Content */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-2" />
            <p className="text-xs font-semibold">Retrieving blacklist catalog...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={() => fetchBlacklist(1, pageSize)}
              className="mt-4 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl text-slate-600 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertOctagon className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-xs font-bold">No blacklisted items found</p>
            <p className="text-[10px] text-slate-400 mt-1">Try refining your search terms or add a new block list item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Entity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Target Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Blocking</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created Date</th>
                  {!isStaff && (
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.licensePlate ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-100">
                          Vehicle Block
                        </span>
                      ) : item.cardCode ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold text-[10px] border border-orange-100">
                          Card Block
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-100">
                          Incident ID Block
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.licensePlate && (
                        <div className="font-extrabold text-slate-700 tracking-wide bg-slate-100 border border-slate-200 rounded px-2 py-0.5 inline-block text-[11px]">
                          {item.licensePlate}
                        </div>
                      )}
                      {item.cardCode && (
                        <div className="font-mono font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 inline-block text-[10px]">
                          {item.cardCode}
                        </div>
                      )}
                      {!item.licensePlate && !item.cardCode && (
                        <span className="text-slate-400 italic">Database Record ID: {item.vehicleId || item.cardId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs font-semibold text-slate-700 break-words leading-relaxed">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    {!isStaff && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setIsDeletingId(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition duration-150"
                          title="Remove from Blacklist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-slate-500 text-[11px] font-semibold">
            Showing <span className="text-slate-700">{filteredItems.length}</span> of{' '}
            <span className="text-slate-700">{totalCount}</span> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex <= 1 || loading}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition duration-150"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
              Page {pageIndex} / {totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages || loading}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition duration-150"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Add To Blacklist Modal Dialog */}
      {mounted && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Add Entity to Blacklist</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Type Switcher Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Block Target Type</label>
                <p className="text-[10px] text-slate-400 mb-2 font-medium">Choose the entity type you want to place on the blacklist:</p>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBlockType('vehicle')}
                    className={`py-2 text-[10px] font-extrabold rounded-lg transition-all ${
                      blockType === 'vehicle' ? 'bg-white text-rose-600 shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Vehicle Plate
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType('card')}
                    className={`py-2 text-[10px] font-extrabold rounded-lg transition-all ${
                      blockType === 'card' ? 'bg-white text-rose-600 shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    RFID Card
                  </button>
                </div>
              </div>

              {/* Dynamic Field Form inputs */}
              {blockType === 'vehicle' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 51G-12345"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs font-bold rounded-xl bg-white text-slate-700 placeholder:text-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">The system will resolve the database Vehicle ID automatically.</p>
                </div>
              )}

              {blockType === 'card' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">RFID Card Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CARD048"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs font-bold rounded-xl bg-white text-slate-700 placeholder:text-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">System will match this code with active database Cards and block further sessions.</p>
                </div>
              )}


              {/* Block Reason */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Reason for Blacklist</label>
                  <span className={`text-[10px] font-bold ${reason.length > 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {reason.length}/100
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={100}
                  placeholder="Explain why this vehicle/card is being placed on the blacklist..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs font-semibold rounded-xl bg-white text-slate-700"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Block
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete/Removal Confirmation Modal */}
      {mounted && isDeletingId !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Remove from Blacklist?</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed mt-1.5">
                  Are you sure you want to lift the block on this target? They will be allowed to perform check-in and check-out operations again immediately.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsDeletingId(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Yes, Remove
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
