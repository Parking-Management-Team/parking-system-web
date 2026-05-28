'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { PaymentMethod } from '@/constants/parking.constants';
import { cn } from '@/lib/utils/cn';

interface PaymentMethodSelectProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelect({
  selectedMethod,
  onChange,
  className,
}: PaymentMethodSelectProps) {
  const t = useTranslations('pricing');

  const methods: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'QR_CODE',
      label: 'Cổng VNPAY-QR / QR Instant',
      desc: 'Quét mã chuyển khoản tức thì 24/7.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      id: 'EWALLET',
      label: 'Ví MoMo / E-Wallet',
      desc: 'Thanh toán tự động bằng ví MoMo.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'CASH',
      label: 'Tiền mặt tại quầy / Cash',
      desc: 'Thanh toán trực tiếp cho nhân viên trực bốt.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <label className="text-sm font-semibold text-[var(--color-ink)] block">
        Phương thức thanh toán / Payment Method
      </label>

      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={cn(
                'flex items-center gap-4 p-4 text-left border rounded-xl transition-all duration-200 focus:outline-none w-full relative overflow-hidden select-none',
                isSelected
                  ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] ring-offset-1 dark:ring-offset-slate-900'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-muted)]'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center border transition-colors',
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--color-accent)]'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]'
                )}
              >
                {method.icon}
              </div>

              <div className="flex-1">
                <span className="font-bold text-sm text-[var(--color-ink)] block">{method.label}</span>
                <span className="text-xs text-[var(--color-muted)] mt-0.5 block">{method.desc}</span>
              </div>

              <div
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                  isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]' : 'border-[var(--color-border)] bg-transparent'
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Simulated content based on method selection */}
      {selectedMethod === 'QR_CODE' && (
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex flex-col sm:flex-row items-center gap-4 mt-4">
          <div className="w-24 h-24 bg-white p-1 rounded-lg border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {/* Visual pattern representing QR */}
            <div className="w-full h-full border-4 border-slate-900 bg-slate-100 flex flex-col justify-between p-1">
              <div className="flex justify-between">
                <div className="w-4 h-4 bg-slate-900" />
                <div className="w-4 h-4 bg-slate-900" />
              </div>
              <div className="w-full h-2 bg-slate-900 opacity-60 self-center" />
              <div className="flex justify-between">
                <div className="w-4 h-4 bg-slate-900" />
                <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-xs text-[var(--color-ink)]">QUÉT MÃ VNPAY-QR ĐỂ THANH TOÁN</h5>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 leading-normal">
              Dùng ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay) để quét mã. Giao dịch sẽ tự động xác nhận sau khi chuyển khoản thành công.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
