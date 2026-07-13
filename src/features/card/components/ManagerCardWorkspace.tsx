'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';
import { useAuth } from '@/features/auth';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Lock,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';

interface ParkingCard {
  id: number;
  cardCode: string;
  rfidCode?: string | null;
  cardType: string;
  cardStatus: string;
  createdAt: string;
}

export default function ManagerCardWorkspace() {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State for card creation
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCardCode, setNewCardCode] = useState('');
  const [newCardType, setNewCardType] = useState('PARKING_CARD');
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch cards based on current active tab
  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = activeTab === 'available' ? '/cards/available' : '/cards/assigned';
      let data: any[] = [];
      
      try {
        const res = await api.get<any>(endpoint);
        if (Array.isArray(res)) {
          data = res;
        } else if (res && res.success && Array.isArray(res.data)) {
          data = res.data;
        } else if (res && Array.isArray(res.data)) {
          data = res.data;
        }
      } catch (err) {
        console.warn(`Endpoint ${endpoint} not fully active on backend. Falling back to /cards.`, err);
        const fallbackRes = await api.get<any>('/cards');
        const allCards = Array.isArray(fallbackRes) ? fallbackRes : fallbackRes.data || [];
        
        if (activeTab === 'available') {
          data = allCards.filter((c: any) => (c.cardStatus || c.status || '').toUpperCase() === 'AVAILABLE');
        } else {
          data = allCards.filter((c: any) => {
            const st = (c.cardStatus || c.status || '').toUpperCase();
            return st === 'ASSIGNED' || st === 'ACTIVE';
          });
        }
      }

      const mapped: ParkingCard[] = data.map((item: any) => ({
        id: item.id,
        cardCode: item.cardCode || `CARD-${item.id}`,
        rfidCode: item.rfidCode,
        cardType: item.cardType || 'PARKING_CARD',
        cardStatus: item.cardStatus || item.status || (activeTab === 'available' ? 'AVAILABLE' : 'ASSIGNED'),
        createdAt: item.createdAt || new Date().toISOString()
      }));

      setCards(mapped);
    } catch (err: any) {
      console.error('Error fetching cards:', err);
      setError(err?.message || 'Failed to load cards.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Client-side filtration
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchSearch = card.cardCode.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchType = typeFilter === 'ALL' || card.cardType === typeFilter;
      return matchSearch && matchType;
    });
  }, [cards, searchTerm, typeFilter]);

  // Actions: update status or block
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api.put<any>(`/cards/${id}/status`, { status: newStatus });
      if (res.success || res.data) {
        showToast(`Card status updated to ${newStatus}.`, 'success');
        fetchCards();
      } else {
        showToast(res.message || 'Failed to update card status.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating card status.', 'error');
    }
  };

  const handleMarkLost = async (id: number) => {
    if (!window.confirm('Mark this physical card as LOST? This action is recorded in history.')) return;
    try {
      const res = await api.put<any>(`/cards/${id}/status`, { status: 'Lost' });
      if (res.success || res.data) {
        showToast('Card marked as lost.', 'success');
        fetchCards();
      } else {
        showToast(res.message || 'Failed to mark card lost.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error marking card lost.', 'error');
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardCode.trim()) return;
    setCreateLoading(true);
    try {
      const res = await api.post<any>('/cards', {
        cardCode: newCardCode.trim().toUpperCase(),
        cardType: newCardType,
        rfidCode: null
      });
      if (res.success || res.data) {
        showToast('Card created successfully!', 'success');
        setIsCreateOpen(false);
        setNewCardCode('');
        fetchCards();
      } else {
        showToast(res.message || 'Failed to create card.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error creating card.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (raw: string) => {
    try {
      return new Date(raw).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return raw;
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Physical Card Registry</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage RFID/Barcode physical cards. Maintain status tracking without breaking past subscription links.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Card
          </button>
          <button
            onClick={fetchCards}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => { setActiveTab('available'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'available' ? 'border-[#006d43] text-[#006d43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Available Cards
        </button>
        <button
          onClick={() => { setActiveTab('assigned'); setSearchTerm(''); }}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'assigned' ? 'border-[#006d43] text-[#006d43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Assigned Cards
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search card code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[10px] text-slate-500 leading-normal">
            <Lock className="w-4 h-4 text-[#006d43] shrink-0" />
            <span>Cards registered under AVAILABLE status are ready to be distributed to walk-in drivers and booking customers.</span>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading cards registry...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={fetchCards}
                className="mt-3 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Retry
              </button>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              No physical cards found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Card ID</th>
                  <th className="px-6 py-4">Card Code</th>
                  <th className="px-6 py-4">RFID Code</th>
                  <th className="px-6 py-4">Card Type</th>
                  <th className="px-6 py-4">Date Added</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCards.map((card) => {
                  const status = card.cardStatus.toUpperCase();
                  const type = card.cardType.toUpperCase();

                  return (
                    <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        #{card.id}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {card.cardCode}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {card.rfidCode || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          type === 'MONTHLY' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'
                        }`}>
                          {card.cardType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(card.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'ACTIVE' || status === 'ASSIGNED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            status === 'AVAILABLE' ? 'bg-emerald-600' : status === 'ACTIVE' || status === 'ASSIGNED' ? 'bg-blue-600' : 'bg-slate-400'
                          }`} />
                          {card.cardStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        {status === 'AVAILABLE' && (
                          <button
                            onClick={() => handleUpdateStatus(card.id, 'Blocked')}
                            className="px-2 py-1 text-slate-500 hover:text-slate-700 font-semibold text-[10px] rounded hover:bg-slate-100"
                          >
                            Block
                          </button>
                        )}
                        {status === 'BLOCKED' && (
                          <button
                            onClick={() => handleUpdateStatus(card.id, 'Available')}
                            className="px-2 py-1 text-emerald-600 hover:text-emerald-700 font-semibold text-[10px] rounded hover:bg-emerald-50"
                          >
                            Unblock
                          </button>
                        )}
                        {status !== 'LOST' && (
                          <button
                            onClick={() => handleMarkLost(card.id)}
                            className="px-2 py-1 text-rose-600 hover:text-rose-700 font-semibold text-[10px] rounded hover:bg-rose-50"
                          >
                            Mark Lost
                          </button>
                        )}
                        {status === 'LOST' && (
                          <span className="text-[10px] text-slate-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE CARD MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Add New Card</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleCreateCard} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Card Code Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CARD-VIP-999"
                  value={newCardCode}
                  onChange={(e) => setNewCardCode(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl font-mono uppercase"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {createLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
