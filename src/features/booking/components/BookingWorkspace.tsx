'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useBookings } from '../hooks/useBookings';
import { api } from '@/lib/api/client';
import { BaseResponse, PagedResult } from '@/lib/types/building.types';
import {
  Calendar,
  Search,
  Building as BuildingIcon,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

interface BuildingItem {
  id: number;
  name: string;
  code: string;
}

const FAILED_STATUSES = ['CANCELLED', 'EXPIRED', 'NOSHOW'];

export default function BookingWorkspace() {
  const {
    bookings,
    isLoading,
    error,
    fetchBookings,
    confirmBooking,
    cancelBooking,
  } = useBookings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'ALL'>('ALL');
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [hideFailed, setHideFailed] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get<BaseResponse<PagedResult<BuildingItem>>>('/Buildings/paged?pageIndex=1&pageSize=100')
      .then(res => {
        if (res.success && res.data?.items) {
          setBuildings(res.data.items);
        }
      })
      .catch(err => console.error('Error fetching buildings:', err));
  }, []);

  const triggerFetch = useCallback(() => {
    fetchBookings({
      status: statusFilter,
      buildingId: selectedBuildingId === 'ALL' ? undefined : selectedBuildingId,
      licensePlate: searchTerm || undefined
    });
  }, [fetchBookings, statusFilter, selectedBuildingId, searchTerm]);

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const allMetrics = useMemo(() => {
    const m = { total: 0, pending: 0, confirmed: 0, checkedIn: 0, cancelled: 0, expired: 0, noShow: 0 };
    bookings.forEach(b => {
      const s = (b.bookingStatus || '').toUpperCase();
      m.total++;
      if (s === 'PENDING') m.pending++;
      else if (s === 'CONFIRMED') m.confirmed++;
      else if (s === 'CHECKEDIN') m.checkedIn++;
      else if (s === 'CANCELLED') m.cancelled++;
      else if (s === 'EXPIRED') m.expired++;
      else if (s === 'NOSHOW') m.noShow++;
    });
    return m;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!hideFailed) return bookings;
    return bookings.filter(b => !FAILED_STATUSES.includes((b.bookingStatus || '').toUpperCase()));
  }, [bookings, hideFailed]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const handleAction = async () => {
    if (!activeActionId || !actionType) return;
    setActionLoading(true);
    let success = false;
    if (actionType === 'confirm') {
      success = await confirmBooking(activeActionId);
    } else {
      success = await cancelBooking(activeActionId);
    }
    setActionLoading(false);
    if (success) {
      setActiveActionId(null);
      setActionType(null);
      triggerFetch();
    }
  };

  const openActionModal = (id: number, type: 'confirm' | 'cancel') => {
    setActiveActionId(id);
    setActionType(type);
  };

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700';
      case 'CHECKEDIN':
        return 'bg-blue-50 text-blue-700';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700';
      case 'EXPIRED':
        return 'bg-orange-50 text-orange-700';
      case 'NOSHOW':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  };

  const getDotStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-600';
      case 'PENDING': return 'bg-amber-600';
      case 'CHECKEDIN': return 'bg-blue-600';
      case 'CANCELLED': return 'bg-rose-600';
      case 'EXPIRED': return 'bg-orange-600';
      case 'NOSHOW': return 'bg-slate-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bookings Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor incoming pre-booked slot reservations, confirm client payments, or cancel sessions.
          </p>
        </div>
        <button
          onClick={triggerFetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{allMetrics.total}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>All bookings</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
          <h3 className="text-3xl font-black text-amber-600 mt-2">{allMetrics.pending}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting payment</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">Confirmed</span>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{allMetrics.confirmed}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Paid & ready</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Checked In</span>
          <h3 className="text-3xl font-black text-blue-600 mt-2">{allMetrics.checkedIn}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Car className="w-3.5 h-3.5 text-blue-500" />
            <span>Active in slots</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full">Failed</span>
          <h3 className="text-3xl font-black text-rose-600 mt-2">{allMetrics.cancelled + allMetrics.expired + allMetrics.noShow}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Cancelled / Expired / NoShow</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search vehicle plate..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl"
            />
          </div>

          <div className="relative">
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBuildingId(val === 'ALL' ? 'ALL' : Number(val));
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600 appearance-none cursor-pointer"
            >
              <option value="ALL">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
              <BuildingIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-600 appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKEDIN">Checked In</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
              <option value="NOSHOW">No Show</option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={() => { setHideFailed(!hideFailed); setCurrentPage(1); }}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl border transition-all ${
              hideFailed
                ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
            }`}
          >
            {hideFailed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {hideFailed ? 'Showing Active Only' : 'Showing All'}
          </button>

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[10px] text-slate-500 leading-normal">
            <Info className="w-4 h-4 text-[#006d43] shrink-0" />
            <span>Toggle to hide failed bookings (Cancelled, Expired, NoShow).</span>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Fetching bookings list...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={triggerFetch}
                className="mt-3 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Retry Request
              </button>
            </div>
          ) : paginatedBookings.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              No matching bookings found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle Plate</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Building</th>
                  <th className="px-6 py-4">Slot</th>
                  <th className="px-6 py-4">Check-in Expected</th>
                  <th className="px-6 py-4">Deposit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedBookings.map((booking) => {
                  const status = (booking.bookingStatus || '').toUpperCase();
                  const isPending = status === 'PENDING';
                  const isConfirmed = status === 'CONFIRMED';

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        #{booking.id}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {booking.accountName || `#${booking.accountId}`}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {booking.licensePlate}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {booking.vehicleTypeName || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {booking.buildingName || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {booking.slotCode || <span className="text-slate-300 italic">Auto</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(booking.plannedCheckinTime)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {booking.depositAmount?.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${getStatusStyle(status)}`}>
                          <span className={`w-1 h-1 rounded-full ${getDotStyle(status)}`} />
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => openActionModal(booking.id, 'confirm')}
                              className="px-3 py-1.5 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-[10px] rounded-lg transition-colors shadow-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => openActionModal(booking.id, 'cancel')}
                              className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {!isPending && isConfirmed && (
                          <button
                            onClick={() => openActionModal(booking.id, 'cancel')}
                            className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {!isPending && !isConfirmed && (
                          <span className="text-slate-400 text-[10px] italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && filteredBookings.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs rounded-xl">
            <span className="text-slate-400">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredBookings.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length}
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

      {/* ACTION MODAL */}
      {activeActionId && actionType && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {actionType === 'confirm' ? 'Confirm Reservation?' : 'Cancel Booking?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {actionType === 'confirm'
                  ? 'This will transition the booking status to Confirmed, preparing the slot allocation.'
                  : 'This will cancel the booking. Releasing any allocated slot. This cannot be undone.'}
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setActiveActionId(null); setActionType(null); }}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'confirm' ? 'bg-[#006d43] hover:bg-[#005c38]' : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : actionType === 'confirm' ? (
                  'Yes, Confirm'
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
