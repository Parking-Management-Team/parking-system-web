'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [details, setDetails] = useState<{
    transactionId: string;
    orderId: string;
    amount: string;
    method: string;
    message: string;
    payDate: string;
  } | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    // 1. Detect VNPay params
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_Amount = searchParams.get('vnp_Amount');
    const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
    const vnp_PayDate = searchParams.get('vnp_PayDate');

    // 2. Detect Momo params
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const message = searchParams.get('message');
    const transId = searchParams.get('transId');

    let isSuccess = false;
    let computedDetails = {
      transactionId: '—',
      orderId: '—',
      amount: '—',
      method: 'Online Payment',
      message: '',
      payDate: new Date().toLocaleString('vi-VN'),
    };

    if (vnp_ResponseCode !== null) {
      isSuccess = vnp_ResponseCode === '00';
      const parsedAmount = vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' VND' : '—';
      
      // Parse VNPay date (YYYYMMDDHHMMSS)
      let formattedDate = '—';
      if (vnp_PayDate && vnp_PayDate.length === 14) {
        const year = vnp_PayDate.substring(0, 4);
        const month = vnp_PayDate.substring(4, 6);
        const day = vnp_PayDate.substring(6, 8);
        const hour = vnp_PayDate.substring(8, 10);
        const minute = vnp_PayDate.substring(10, 12);
        const second = vnp_PayDate.substring(12, 14);
        formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
      }

      computedDetails = {
        transactionId: vnp_TransactionNo || '—',
        orderId: vnp_TxnRef || '—',
        amount: parsedAmount,
        method: 'VNPay',
        message: isSuccess ? 'Giao dịch thành công' : `Giao dịch thất bại (Lỗi ${vnp_ResponseCode})`,
        payDate: formattedDate !== '—' ? formattedDate : new Date().toLocaleString('vi-VN'),
      };
      
      setStatus(isSuccess ? 'success' : 'failed');
      setDetails(computedDetails);
    } else if (resultCode !== null) {
      isSuccess = resultCode === '0';
      const parsedAmount = amount ? parseInt(amount).toLocaleString('vi-VN') + ' VND' : '—';
      computedDetails = {
        transactionId: transId || '—',
        orderId: orderId || '—',
        amount: parsedAmount,
        method: 'MoMo',
        message: message || (isSuccess ? 'Giao dịch thành công' : 'Giao dịch thất bại'),
        payDate: new Date().toLocaleString('vi-VN'),
      };
      
      setStatus(isSuccess ? 'success' : 'failed');
      setDetails(computedDetails);
    } else {
      // If accessed directly without params
      setStatus('failed');
      computedDetails.message = 'Không tìm thấy thông tin giao dịch.';
      setDetails(computedDetails);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold text-sm">Đang xác thực giao dịch...</p>
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col items-center text-center">
        {/* Status Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'
        }`}>
          <span className="material-symbols-outlined text-[48px] font-semibold">
            {isSuccess ? 'check_circle' : 'cancel'}
          </span>
        </div>

        {/* Status Text */}
        <h2 className={`text-2xl font-black tracking-tight ${
          isSuccess ? 'text-emerald-700' : 'text-red-700'
        }`}>
          {isSuccess ? 'Thanh Toán Thành Công' : 'Thanh Toán Thất Bại'}
        </h2>
        <p className="text-sm text-slate-500 font-semibold mt-2 px-4">
          {details?.message}
        </p>

        {/* Separator line */}
        <div className="w-full border-t border-dashed border-slate-200 my-6"></div>

        {/* Details List */}
        <div className="w-full space-y-4 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Phương thức</span>
            <span className="font-extrabold text-slate-700">{details?.method}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Mã giao dịch</span>
            <span className="font-mono font-extrabold text-slate-700">{details?.transactionId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Mã đơn hàng</span>
            <span className="font-mono font-extrabold text-slate-700">{details?.orderId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Số tiền</span>
            <span className="text-sm font-black text-slate-900">{details?.amount}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Thời gian</span>
            <span className="font-extrabold text-slate-650">{details?.payDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3 mt-8">
          <Link
            href="/dashboard/driver/parking-utils"
            className="w-full py-3 bg-[#006d43] hover:bg-[#005c38] text-white font-extrabold text-sm rounded-2xl text-center shadow-lg shadow-[#006d43]/10 transition-all"
          >
            Tiếp tục đặt chỗ
          </Link>
          <Link
            href="/dashboard/driver"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-2xl text-center transition-all"
          >
            Về Trang chủ Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResult() {
  return <PaymentResultContent />;
}
