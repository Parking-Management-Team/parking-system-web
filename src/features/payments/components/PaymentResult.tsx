'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TransactionDetails {
  transactionId: string;
  orderId: string;
  amount: string;
  method: string;
  message: string;
  payDate: string;
}

function PaymentSuccessView({ details }: { details: TransactionDetails }) {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Background Decorative Glow */}
      <div className="absolute -inset-1 rounded-[38px] blur-xl opacity-30 transition-all duration-500 bg-emerald-400" />

      {/* Main Card Container */}
      <div className="relative w-full bg-white/95 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden p-8 md:p-10 transition-all duration-300">
        
        {/* Colorful Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

        <div className="flex flex-col items-center text-center">
          {/* Custom SVG Icon Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-lg opacity-40 scale-125 bg-emerald-200" />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-500 hover:scale-105 bg-emerald-50 text-emerald-600 border-2 border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-dash" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'drawCheck 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards' }} />
              </svg>
            </div>
          </div>

          {/* Status Title */}
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-emerald-800">
            Payment Successful!
          </h2>
          
          <p className="text-slate-500 text-sm font-semibold mt-3 max-w-sm leading-relaxed px-2">
            {details.message || 'Deposit payment completed and booking confirmed successfully.'}
          </p>

          {/* Ticket Information Separator */}
          <div className="relative w-full my-8">
            <div className="absolute left-[-42px] w-6 h-6 bg-[#f9f9ff] rounded-full border-r border-slate-200/50 shadow-inner"></div>
            <div className="absolute right-[-42px] w-6 h-6 bg-[#f9f9ff] rounded-full border-l border-slate-200/50 shadow-inner"></div>
            <div className="w-full border-t border-dashed border-slate-200 pt-1"></div>
          </div>

          {/* Detailed Transaction Info */}
          <div className="w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-5 md:p-6 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</span>
              <span className="text-xs font-black text-slate-700 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">{details.method}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID</span>
              <span className="text-xs font-mono font-bold text-slate-700 select-all">{details.transactionId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order ID</span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{details.orderId}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</span>
              <span className="text-lg font-black text-slate-900">{details.amount}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
              <span className="text-xs font-bold text-slate-500">{details.payDate}</span>
            </div>
          </div>

          {/* Important Notice */}
          <div className="w-full mt-6 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex gap-3 text-left">
            <div className="text-emerald-600 flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-800">Important Notice</h4>
              <p className="text-[11px] text-emerald-700/80 font-medium leading-normal mt-0.5">
                Please arrive at the parking facility on time. The booking has a grace period of 15 minutes. If you exceed this grace period, your booking will be cancelled automatically and the deposit will not be refunded.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 mt-8">
            <Link
              href="/dashboard/driver"
              className="w-full py-3.5 bg-[#00a86b] hover:bg-[#00905b] text-white font-extrabold text-sm rounded-2xl text-center shadow-lg active:scale-[0.98] transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/dashboard/driver/booking"
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-2xl text-center active:scale-[0.98] transition-all"
            >
              View Booking History
            </Link>
          </div>
        </div>
      </div>
      
      {/* SVG checkmark animations */}
      <style jsx global>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

function PaymentFailedView({ details }: { details: TransactionDetails }) {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Background Decorative Glow */}
      <div className="absolute -inset-1 rounded-[38px] blur-xl opacity-30 transition-all duration-500 bg-rose-400" />

      {/* Main Card Container */}
      <div className="relative w-full bg-white/95 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden p-8 md:p-10 transition-all duration-300">
        
        {/* Colorful Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />

        <div className="flex flex-col items-center text-center">
          {/* Custom SVG Icon Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-lg opacity-40 scale-125 bg-rose-200" />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-500 hover:scale-105 bg-rose-50 text-rose-600 border-2 border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Status Title */}
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-rose-800">
            Payment Failed
          </h2>
          
          <p className="text-rose-600 text-sm font-semibold mt-3 max-w-sm leading-relaxed px-2">
            {details.message || 'Payment transaction failed. Please check your account balance or try again.'}
          </p>

          {/* Ticket Information Separator */}
          <div className="relative w-full my-8">
            <div className="absolute left-[-42px] w-6 h-6 bg-[#f9f9ff] rounded-full border-r border-slate-200/50 shadow-inner"></div>
            <div className="absolute right-[-42px] w-6 h-6 bg-[#f9f9ff] rounded-full border-l border-slate-200/50 shadow-inner"></div>
            <div className="w-full border-t border-dashed border-slate-200 pt-1"></div>
          </div>

          {/* Detailed Transaction Info */}
          <div className="w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-5 md:p-6 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</span>
              <span className="text-xs font-black text-slate-700 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">{details.method}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID</span>
              <span className="text-xs font-mono font-bold text-slate-700 select-all">{details.transactionId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order ID</span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{details.orderId}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-lg font-black text-slate-900">{details.amount}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
              <span className="text-xs font-bold text-slate-500">{details.payDate}</span>
            </div>
          </div>

          {/* Troubleshooting Tip */}
          <div className="w-full mt-6 bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 flex gap-3 text-left">
            <div className="text-rose-600 flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-800">Need Help?</h4>
              <p className="text-[11px] text-rose-700/80 font-medium leading-normal mt-0.5">
                If money was deducted from your account, please contact our support desk with your Transaction ID for manual booking verification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 mt-8">
            <Link
              href="/dashboard/driver"
              className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl text-center shadow-lg active:scale-[0.98] transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/dashboard/driver/booking"
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-2xl text-center active:scale-[0.98] transition-all"
            >
              Try Booking Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [details, setDetails] = useState<TransactionDetails | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    // Detect backend redirect parameters
    const statusParam = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    const paymentId = searchParams.get('paymentId');
    const backendMessage = searchParams.get('message');

    // Detect raw VNPay params
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_Amount = searchParams.get('vnp_Amount');
    const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
    const vnp_PayDate = searchParams.get('vnp_PayDate');

    // Detect MoMo params
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const message = searchParams.get('message');
    const transId = searchParams.get('transId');

    let isSuccess = false;
    let computedDetails: TransactionDetails = {
      transactionId: '—',
      orderId: '—',
      amount: '—',
      method: 'Online Payment',
      message: '',
      payDate: new Date().toLocaleString('en-US'),
    };

    // Helper to parse VNPay Date
    const parseVnpDate = (dateStr: string | null) => {
      if (dateStr && dateStr.length === 14) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(8, 10);
        const minute = dateStr.substring(10, 12);
        const second = dateStr.substring(12, 14);
        return `${month}/${day}/${year} ${hour}:${minute}:${second}`;
      }
      return new Date().toLocaleString('en-US');
    };

    if (statusParam !== null) {
      // 1. Backend-mediated Redirect Flow (VNPay / MoMo confirmed by backend)
      isSuccess = statusParam === 'success';
      const parsedAmount = vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' VNĐ' : '—';
      computedDetails = {
        transactionId: paymentId || '—',
        orderId: bookingId || '—',
        amount: parsedAmount,
        method: 'VNPay',
        message: backendMessage ? decodeURIComponent(backendMessage) : (isSuccess ? 'Deposit payment completed and booking confirmed successfully.' : 'Payment Failed'),
        payDate: parseVnpDate(vnp_PayDate),
      };
      
      setStatus(isSuccess ? 'success' : 'failed');
      setDetails(computedDetails);
    } else if (vnp_ResponseCode !== null) {
      // 2. Direct VNPay Redirect Flow
      isSuccess = vnp_ResponseCode === '00';
      const parsedAmount = vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' VNĐ' : '—';
      computedDetails = {
        transactionId: vnp_TransactionNo || '—',
        orderId: vnp_TxnRef || '—',
        amount: parsedAmount,
        method: 'VNPay',
        message: isSuccess ? 'Deposit payment completed and booking confirmed successfully.' : `Transaction Failed (Error Code: ${vnp_ResponseCode})`,
        payDate: parseVnpDate(vnp_PayDate),
      };
      
      setStatus(isSuccess ? 'success' : 'failed');
      setDetails(computedDetails);
    } else if (resultCode !== null) {
      // 3. Direct MoMo Redirect Flow
      isSuccess = resultCode === '0';
      const parsedAmount = amount ? parseInt(amount).toLocaleString('vi-VN') + ' VNĐ' : '—';
      computedDetails = {
        transactionId: transId || '—',
        orderId: orderId || '—',
        amount: parsedAmount,
        method: 'MoMo',
        message: message || (isSuccess ? 'Deposit payment completed successfully.' : 'Payment Failed'),
        payDate: new Date().toLocaleString('en-US'),
      };
      
      setStatus(isSuccess ? 'success' : 'failed');
      setDetails(computedDetails);
    } else {
      // 4. Direct access without query params (Failure)
      setStatus('failed');
      computedDetails = {
        transactionId: '—',
        orderId: '—',
        amount: '—',
        method: 'Unknown',
        message: 'No payment transaction details were found.',
        payDate: new Date().toLocaleString('en-US'),
      };
      setDetails(computedDetails);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-600 font-bold text-sm tracking-wide animate-pulse">Verifying transaction with payment gateway...</p>
      </div>
    );
  }

  if (status === 'success' && details) {
    return <PaymentSuccessView details={details} />;
  }

  return <PaymentFailedView details={details!} />;
}

export default function PaymentResult() {
  return <PaymentResultContent />;
}
