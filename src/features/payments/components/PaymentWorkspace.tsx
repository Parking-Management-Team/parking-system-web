'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePayments } from '../hooks/usePayments';
import { api } from '@/lib/api/client';
import { Building, BaseResponse, PagedResult } from '@/lib/types/building.types';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Layers,
  FileText,
  X,
  Calendar,
  Building2,
  TrendingUp,
  Tag,
  BarChart2
} from 'lucide-react';

// --- Sparkline Chart with hover tooltip (pure SVG) ---
function RevenueSparkline({ data, formatCurrency }: {
  data: { label: string; value: number }[];
  formatCurrency: (n: number) => string;
}) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-300 italic">
        Not enough data points for chart
      </div>
    );
  }
  const W = 900; const H = 160; const PAD = { t: 20, r: 24, b: 36, l: 16 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const vals = data.map(d => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const xStep = innerW / (data.length - 1);
  const toX = (i: number) => PAD.l + i * xStep;
  const toY = (v: number) => PAD.t + innerH - ((v - minV) / range) * innerH;
  const pts = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const areaPath = `M${toX(0)},${toY(data[0].value)} ` +
    data.slice(1).map((d, i) => `L${toX(i + 1)},${toY(d.value)}`).join(' ') +
    ` L${toX(data.length - 1)},${PAD.t + innerH} L${toX(0)},${PAD.t + innerH} Z`;
  const labelStep = Math.ceil(data.length / 8);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0; let minDist = Infinity;
    data.forEach((_, i) => { const d = Math.abs(toX(i) - relX); if (d < minDist) { minDist = d; nearest = i; } });
    setTooltip({ idx: nearest });
  };

  const tip = tooltip !== null ? data[tooltip.idx] : null;
  const tipX = tooltip !== null ? toX(tooltip.idx) : 0;
  const tipY = tooltip !== null ? toY(data[tooltip.idx].value) : 0;
  // clamp tooltip box so it doesn't overflow
  const boxW = 160; const boxH = 36;
  const boxX = Math.min(Math.max(tipX - boxW / 2, PAD.l), W - PAD.r - boxW);
  const boxY = tipY - boxH - 10 < PAD.t ? tipY + 12 : tipY - boxH - 8;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#006d43" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#006d43" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
        <line key={i} x1={PAD.l} y1={PAD.t + innerH * (1 - r)}
          x2={PAD.l + innerW} y2={PAD.t + innerH * (1 - r)}
          stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#revGrad)" />
      <polyline points={pts} fill="none" stroke="#006d43" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.value)} r={tooltip?.idx === i ? 5 : 3}
          fill={tooltip?.idx === i ? '#006d43' : 'white'}
          stroke="#006d43" strokeWidth="1.5"
          style={{ transition: 'r 0.1s, fill 0.1s' }}
        />
      ))}
      {data.map((d, i) => {
        if (i % labelStep !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={toX(i)} y={H - 6}
            textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">
            {d.label}
          </text>
        );
      })}
      {/* Hover crosshair + tooltip */}
      {tip && (
        <g>
          <line x1={tipX} y1={PAD.t} x2={tipX} y2={PAD.t + innerH}
            stroke="#006d43" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="6"
            fill="#1e293b" opacity="0.92" />
          <text x={boxX + boxW / 2} y={boxY + 13}
            textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">
            {tip.label}
          </text>
          <text x={boxX + boxW / 2} y={boxY + 27}
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff" fontFamily="Inter, sans-serif">
            {formatCurrency(tip.value)}
          </text>
        </g>
      )}
    </svg>
  );
}


export default function PaymentWorkspace() {
  const {
    revenueItems,
    revenueDetail,
    totalCount,
    totalPages,
    pageIndex,
    isLoading,
    isDetailLoading,
    error,
    fetchRevenue,
    fetchRevenueDetail,
  } = usePayments();

  // Infrastructure lists
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  // Filters State
  const [periodType, setPeriodType] = useState<string>('DAILY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ buildingName: string; startDate: string; endDate: string; vehicleTypeName: string } | null>(null);

  // Summary metrics from ALL pages (separate call, unaffected by pagination)
  const [summaryMetrics, setSummaryMetrics] = useState({ totalRevenue: 0, totalSessions: 0, totalBookings: 0, dateRange: '' });
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Fetch full-range summary (pageSize=1000) for hero banner
  useEffect(() => {
    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('pageIndex', '1');
        params.append('pageSize', '1000');
        if (selectedBuildingId) params.append('BuildingId', selectedBuildingId.toString());
        if (startDate) params.append('StartDate', startDate);
        if (endDate) params.append('EndDate', endDate);
        if (periodType) params.append('PeriodType', periodType);
        const res = await api.get<any>(`/Revenue?${params.toString()}`);
        const items: any[] = (res?.data?.items || res?.items || []);
        const totalRows = items.filter((x: any) => x.vehicleTypeId === null || x.vehicleTypeId === undefined);
        const source = totalRows.length > 0 ? totalRows : items;
        let totalRevenue = 0, totalSessions = 0, totalBookings = 0;
        source.forEach((x: any) => { totalRevenue += x.totalRevenue || 0; totalSessions += x.totalSessions || 0; totalBookings += x.totalBookings || 0; });
        // Build date range label from min/max startDate in returned items
        const dates = source.map((x: any) => x.startDate).filter(Boolean).sort();
        let dateRange = '';
        if (dates.length > 0) {
          const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          dateRange = dates.length === 1 ? fmt(dates[0]) : `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
        }
        setSummaryMetrics({ totalRevenue, totalSessions, totalBookings, dateRange });
      } catch { /* silent */ } finally { setIsSummaryLoading(false); }
    };
    fetchSummary();
  }, [selectedBuildingId, periodType, startDate, endDate]);

  // Load buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await api.get<BaseResponse<PagedResult<Building>>>('/Buildings/paged?pageIndex=1&pageSize=100');
        if (res.success && res.data?.items) {
          setBuildings(res.data.items);
          if (res.data.items.length > 0) {
            setSelectedBuildingId(res.data.items[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load buildings in revenue workspace:', err);
      }
    };
    fetchBuildings();
  }, []);

  // Fetch revenue items
  const triggerFetch = useCallback((page = 1) => {
    fetchRevenue({
      pageIndex: page,
      pageSize: 10,
      buildingId: selectedBuildingId || undefined,
      periodType: periodType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [fetchRevenue, selectedBuildingId, periodType, startDate, endDate]);

  useEffect(() => {
    triggerFetch(currentPage);
  }, [triggerFetch, currentPage, selectedBuildingId, periodType]);

  // Aggregate metrics from current page items
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalSessions = 0;
    let totalBookings = 0;

    // Filter to rows with "Total Revenue" (vehicleTypeId is null or undefined) to get total stats
    const totalRows = revenueItems.filter(item => item.vehicleTypeId === null || item.vehicleTypeId === undefined);
    
    if (totalRows.length > 0) {
      totalRows.forEach(item => {
        totalRevenue += item.totalRevenue;
        totalSessions += item.totalSessions;
        totalBookings += item.totalBookings;
      });
    } else {
      // Fallback: sum all if there is no total row
      revenueItems.forEach(item => {
        totalRevenue += item.totalRevenue;
        totalSessions += item.totalSessions;
        totalBookings += item.totalBookings;
      });
    }

    return { totalRevenue, totalSessions, totalBookings };
  }, [revenueItems]);

  const handleOpenDetail = async (item: { id: number; buildingName: string; startDate: string; endDate: string; vehicleTypeName: string }) => {
    setSelectedItem({ buildingName: item.buildingName, startDate: item.startDate, endDate: item.endDate, vehicleTypeName: item.vehicleTypeName });
    setIsModalOpen(true);
    await fetchRevenueDetail(item.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const formatDateString = (raw: string) => {
    if (!raw) return '—';
    try {
      const date = new Date(raw);
      if (isNaN(date.getTime())) return raw;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return raw;
    }
  };

  const formatTimeString = (raw: string) => {
    if (!raw) return '—';
    try {
      const date = new Date(raw);
      if (isNaN(date.getTime())) return raw;
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Revenue Statistics & Reconciliation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track real-time revenue stats, filter by buildings, dates, and period types, and reconcile payment transactions.
          </p>
        </div>
        <button
          onClick={() => triggerFetch(currentPage)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      {/* Hero Total Revenue — from full date range, not current page */}
      <div className="bg-gradient-to-br from-[#006d43] to-emerald-700 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Total Revenue</span>
          <h2 className={`text-4xl font-black mt-2 tracking-tight transition-opacity ${isSummaryLoading ? 'opacity-50' : ''}`}>
            {formatCurrency(summaryMetrics.totalRevenue)}
          </h2>
          <p className="text-emerald-200 text-xs mt-1">
            {summaryMetrics.dateRange ? summaryMetrics.dateRange : 'All available periods'}
            {selectedBuildingId && buildings.find(b => b.id === selectedBuildingId) ? ` · ${buildings.find(b => b.id === selectedBuildingId)!.name}` : ' · All buildings'}
          </p>
        </div>
        <div className="flex gap-6 sm:text-right">
          <div>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Sessions</p>
            <p className="text-2xl font-black">{summaryMetrics.totalSessions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Bookings</p>
            <p className="text-2xl font-black">{summaryMetrics.totalBookings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* REVENUE SPARKLINE CHART */}
      {(() => {
        const totalRows = revenueItems.filter(item => item.vehicleTypeId === null || item.vehicleTypeName === 'Total Revenue');
        const chartSource = totalRows.length > 0 ? totalRows : revenueItems;
        const chartData = chartSource.map(item => ({
          label: item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
          value: item.totalRevenue
        }));
        return (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#006d43]" />
                <span className="text-xs font-bold text-slate-700">Revenue Trend</span>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full capitalize">{periodType.toLowerCase()}</span>
              </div>
              <span className="text-[10px] text-slate-400">{chartData.length} data points</span>
            </div>
            <div className="h-40">
              <RevenueSparkline data={chartData} formatCurrency={formatCurrency} />
            </div>
          </div>
        );
      })()}

      {/* FILTER CONTROL CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Building Selection */}
          <div className="relative">
            <label htmlFor="building-select" className="sr-only">Select Building</label>
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <select
              id="building-select"
              value={selectedBuildingId || ''}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value ? Number(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-700 cursor-pointer appearance-none"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Type Selection */}
          <div className="relative">
            <label htmlFor="period-type-select" className="sr-only">Select Period Type</label>
            <TrendingUp className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <select
              id="period-type-select"
              value={periodType}
              onChange={(e) => {
                setPeriodType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-700 cursor-pointer appearance-none"
            >
              <option value="DAILY">Daily Stats</option>
              <option value="MONTHLY">Monthly Stats</option>
              <option value="YEARLY">Yearly Stats</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative flex flex-col justify-center">
            <label htmlFor="start-date-input" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider absolute left-3.5 top-1">Start Date</label>
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 pt-4 pb-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-700"
            />
          </div>

          {/* End Date */}
          <div className="relative flex flex-col justify-center">
            <label htmlFor="end-date-input" className="text-[9px] font-bold text-slate-400 uppercase tracking-wider absolute left-3.5 top-1">End Date</label>
            <input
              id="end-date-input"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 pt-4 pb-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-xs font-semibold rounded-xl text-slate-700"
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPeriodType('DAILY');
              if (buildings.length > 0) setSelectedBuildingId(buildings[0].id);
              setCurrentPage(1);
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            Clear Filters
          </button>
        </div>

        {/* REVENUE STATISTICS LIST TABLE */}
        <div className="overflow-x-auto border border-slate-50 rounded-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading revenue statements...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 text-xs font-semibold">
              <p>{error}</p>
              <button
                onClick={() => triggerFetch(currentPage)}
                className="mt-3 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Retry
              </button>
            </div>
          ) : revenueItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs italic">
              No revenue reports found for this query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Building</th>
                  <th className="px-6 py-4">Vehicle Category</th>
                  <th className="px-6 py-4">Sessions</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-center">Reconcile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {revenueItems.map((item) => {
                  const isTotal = item.vehicleTypeId === null || item.vehicleTypeName === 'Total Revenue';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isTotal ? 'bg-slate-50/30 font-bold' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-600">
                        {item.startDate === item.endDate
                          ? formatDateString(item.startDate)
                          : `${formatDateString(item.startDate)} - ${formatDateString(item.endDate)}`}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.buildingName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTotal
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.vehicleTypeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.totalSessions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.totalBookings.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${isTotal ? 'text-[#006d43]' : 'text-slate-800'}`}>
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isTotal ? (
                          <button
                            onClick={() => handleOpenDetail({ id: item.id, buildingName: item.buildingName, startDate: item.startDate, endDate: item.endDate, vehicleTypeName: item.vehicleTypeName })}
                            title="View detailed transactions"
                            className="p-1 text-slate-400 hover:text-[#006d43] rounded hover:bg-slate-100 transition-all inline-flex items-center gap-1 font-bold text-[10px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Audit</span>
                          </button>
                        ) : (
                          <span className="text-slate-200 text-[10px]">—</span>
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
        {!isLoading && revenueItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs rounded-xl">
            <span className="text-slate-400">
              Showing Page {pageIndex} of {totalPages} (Total {totalCount} records)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, pageIndex - 1))}
                disabled={pageIndex === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 font-bold rounded-lg text-[11px] ${
                    pageIndex === p
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, pageIndex + 1))}
                disabled={pageIndex === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL AUDIT & RECONCILIATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006d43] mt-0.5">payments</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Revenue Reconciliation Audit</h3>
                    {selectedItem && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Building2 className="w-3 h-3" />{selectedItem.buildingName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {selectedItem.startDate === selectedItem.endDate
                            ? formatDateString(selectedItem.startDate)
                            : `${formatDateString(selectedItem.startDate)} – ${formatDateString(selectedItem.endDate)}`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                          {selectedItem.vehicleTypeName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => { setIsModalOpen(false); setSelectedItem(null); }} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 bg-white" id="printable-area">
              {/* Summary Stats inside Modal */}
              {isDetailLoading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">Loading audit statement...</p>
                </div>
              ) : revenueDetail ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Building</span>
                      <span className="font-semibold text-slate-700">{revenueDetail.buildingName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Period Type</span>
                      <span className="font-semibold text-slate-700">{revenueDetail.periodType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date Range</span>
                      <span className="font-semibold text-slate-700">
                        {revenueDetail.startDate === revenueDetail.endDate
                          ? formatDateString(revenueDetail.startDate)
                          : `${formatDateString(revenueDetail.startDate)} - ${formatDateString(revenueDetail.endDate)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                      <span className="font-semibold text-slate-700">{revenueDetail.vehicleTypeName}</span>
                    </div>
                  </div>

                  {/* Financial totals header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-l-4 border-[#006d43] bg-emerald-50/40 rounded-r-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Grand Total Period Revenue</h4>
                      <p className="text-xl font-black text-[#006d43] mt-0.5">{formatCurrency(revenueDetail.totalRevenue)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-left sm:text-right text-[11px] text-slate-500">
                      <div>Sessions: <span className="font-bold text-slate-700">{revenueDetail.totalSessions}</span></div>
                      <div>Bookings: <span className="font-bold text-slate-700">{revenueDetail.totalBookings}</span></div>
                    </div>
                  </div>

                  {/* Detailed Payments — card list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Associated Transactions</h4>
                      <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {revenueDetail.payments?.length ?? 0} payments
                      </span>
                    </div>
                    {revenueDetail.payments && revenueDetail.payments.length > 0 ? (
                      <div className="space-y-2">
                        {revenueDetail.payments.map((payment) => {
                          const methodColor: Record<string, string> = {
                            CASH: 'bg-amber-50 text-amber-700 border-amber-200',
                            CARD: 'bg-blue-50 text-blue-700 border-blue-200',
                            VNPAY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                            MOMO: 'bg-pink-50 text-pink-700 border-pink-200',
                          };
                          const mc = methodColor[payment.paymentMethod?.toUpperCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                          const srcColor: Record<string, string> = {
                            SESSION: 'bg-emerald-50 text-emerald-700',
                            BOOKING: 'bg-blue-50 text-blue-700',
                            PENALTY: 'bg-rose-50 text-rose-700',
                          };
                          const sc = srcColor[payment.sourceType?.toUpperCase()] ?? 'bg-slate-100 text-slate-600';
                          return (
                            <div key={payment.paymentId}
                              className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all"
                            >
                              {/* Left: ID + time + plate */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-black text-slate-400">#{payment.paymentId}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-mono font-bold text-sm text-slate-800 truncate">
                                    {payment.licensePlate || <span className="text-slate-300 not-italic">No plate</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {payment.paymentTime
                                      ? new Date(payment.paymentTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                      : '—'}
                                  </p>
                                </div>
                              </div>
                              {/* Right: badges + amount */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mc}`}>
                                  {payment.paymentMethod}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc}`}>
                                  {payment.sourceType}
                                </span>
                                <span className="text-sm font-black text-slate-800 ml-2 tabular-nums">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
                        No individual payments listed for this aggregate group.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 italic text-xs">
                  Failed to load details.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => { setIsModalOpen(false); setSelectedItem(null); }}
                className="w-full py-2.5 border border-slate-200 hover:bg-white text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
