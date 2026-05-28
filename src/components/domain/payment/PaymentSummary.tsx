'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { formatVND, roundCashVND } from '@/lib/utils/format';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface PaymentSummaryProps {
  durationFee: number;
  depositDeducted?: number;
  surcharges?: { name: string; amount: number }[];
  onPay: () => void;
  isPaying?: boolean;
  className?: string;
}

export function PaymentSummary({
  durationFee,
  depositDeducted = 0,
  surcharges = [],
  onPay,
  isPaying = false,
  className,
}: PaymentSummaryProps) {
  const t = useTranslations('pricing');
  const tCommon = useTranslations('common');

  const surchargeSum = surcharges.reduce((sum, s) => sum + s.amount, 0);
  const rawTotal = Math.max(0, durationFee - depositDeducted + surchargeSum);
  const roundedTotal = roundCashVND(rawTotal);
  const roundingDiff = roundedTotal - rawTotal;

  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6',
        className
      )}
    >
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="font-bold text-base text-[var(--color-ink)]">
          TỔNG HỢP THANH TOÁN / BILL SUMMARY
        </h4>
      </div>

      <div className="space-y-3.5 text-sm">
        {/* Duration Fee */}
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)] font-medium">Tiền gửi xe / Parking Fee:</span>
          <span className="font-mono text-[var(--color-ink)] font-bold">
            {formatVND(durationFee)}
          </span>
        </div>

        {/* Deposit Deducted */}
        {depositDeducted > 0 && (
          <div className="flex justify-between">
            <span className="text-emerald-500 font-medium">Khấu trừ cọc giữ chỗ / Deposit:</span>
            <span className="font-mono text-emerald-500 font-bold">
              -{formatVND(depositDeducted)}
            </span>
          </div>
        )}

        {/* Surcharges */}
        {surcharges.map((s, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-rose-500 font-medium">{s.name}:</span>
            <span className="font-mono text-rose-500 font-bold">
              +{formatVND(s.amount)}
            </span>
          </div>
        ))}

        {/* Rounding */}
        {Math.abs(roundingDiff) > 0 && (
          <div className="flex justify-between text-xs border-t border-dashed border-[var(--color-border)] pt-2.5">
            <span className="text-[var(--color-muted)] font-semibold">Làm tròn tiền mặt / Rounding:</span>
            <span className={cn('font-mono font-bold', roundingDiff > 0 ? 'text-rose-500' : 'text-emerald-500')}>
              {roundingDiff > 0 ? '+' : ''}{formatVND(roundingDiff)}
            </span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-5">
        <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-ink)]">
          TỔNG THANH TOÁN / TOTAL DUE
        </span>
        <div className="text-right">
          <span className="text-2xl font-mono font-extrabold text-[var(--color-accent)]">
            {formatVND(roundedTotal)}
          </span>
          <span className="block text-[10px] text-[var(--color-muted)] font-medium">
            (Đã gồm VAT / Tax inclusive)
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={onPay}
        variant="primary"
        size="lg"
        className="w-full mt-4"
        isLoading={isPaying}
      >
        XÁC NHẬN THANH TOÁN / PROCEED TO PAY
      </Button>
    </div>
  );
}
