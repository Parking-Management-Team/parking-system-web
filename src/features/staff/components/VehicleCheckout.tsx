'use client';

import React, { useState } from 'react';

/**
 * VehicleCheckout Component - Module Check-out cho nhân viên vận hành
 * Tìm kiếm vé xe, so khớp hình ảnh vào/ra, tính phí và tiến hành thanh toán cho xe ra.
 */
export default function VehicleCheckout() {
  const [searchTerm, setSearchTerm] = useState('51A-123.45');
  const [sessionData, setSessionData] = useState<null | typeof MOCK_SESSION>(null);
  const [paymentMethod, setPaymentMethod] = useState('QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const MOCK_SESSION = {
    plate: '51A-123.45',
    slot: 'B1-05',
    entryTime: '2026-06-07 08:15:30',
    exitTime: '2026-06-07 11:15:30',
    duration: '3 hours',
    fee: '30,000 VND',
    entryPhoto: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=400&q=80',
    exitPhoto: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=400&q=80',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSessionData(MOCK_SESSION);
    }
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        setSessionData(null);
        setSearchTerm('');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vehicle Check-out Portal</h1>
        <p className="text-slate-500 text-sm mt-1">Verify vehicle departure details, process billing, and approve exits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Form tìm kiếm vé xe / Biển số */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">Exiting Vehicle Search</h3>

          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter License Plate or Ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Find Session
            </button>
          </form>

          {/* Chi tiết phiên đỗ xe (nếu tìm thấy) */}
          {sessionData ? (
            <div className="space-y-6 animate-fadeIn">
              {/* So khớp hình ảnh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Entry Photo Reference</span>
                  <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-200 flex items-center justify-center relative">
                    <span className="absolute top-2 left-2 bg-slate-800/80 text-white text-[9px] px-2 py-0.5 rounded">08:15:30</span>
                    <span className="material-symbols-outlined text-slate-400 text-xl">image</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Exit Photo Match</span>
                  <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-200 flex items-center justify-center relative">
                    <span className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] px-2 py-0.5 rounded">11:15:30 (Live)</span>
                    <span className="material-symbols-outlined text-slate-400 text-xl">photo_camera</span>
                  </div>
                </div>
              </div>

              {/* Thông tin thời gian và vị trí */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">License Plate</span>
                  <p className="text-sm font-bold mt-0.5">{sessionData.plate}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Slot</span>
                  <p className="text-sm font-bold mt-0.5">{sessionData.slot}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                  <p className="text-sm font-semibold mt-0.5">{sessionData.duration}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fee</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{sessionData.fee}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">no_accounts</span>
              <p className="text-sm mt-2">Search for an active ticket or vehicle plate to preview checkout options.</p>
            </div>
          )}
        </div>

        {/* Cột phải: Thanh toán và Xác nhận */}
        {sessionData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">Payment Process</h3>

              {/* Phí thanh toán */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Amount Due</span>
                <span className="text-xl font-black text-emerald-600">{sessionData.fee}</span>
              </div>

              {/* Chọn phương thức thanh toán */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'QR', label: 'QR Pay', icon: 'qr_code_2' },
                    { id: 'CASH', label: 'Cash', icon: 'payments' },
                    { id: 'CARD', label: 'POS Card', icon: 'credit_card' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{method.icon}</span>
                      <span className="text-[10px]">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Nút thanh toán */}
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">exit_to_app</span>
                    Complete Checkout
                  </>
                )}
              </button>
            </div>

            {/* Toast success thông báo khi checkout thành công */}
            {isDone && (
              <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white font-sans transition-opacity duration-300">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="font-bold mt-2">Checked Out Successfully!</p>
                <p className="text-xs text-white/80 mt-1">Gate opened.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
