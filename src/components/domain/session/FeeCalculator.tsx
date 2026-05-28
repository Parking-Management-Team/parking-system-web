'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { VehicleType } from '@/constants/parking.constants';
import { calculateParkingFee } from '@/lib/utils/pricing';
import { formatVND } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface FeeCalculatorProps {
  entryTime: string;
  exitTime?: string;
  vehicleType: VehicleType;
  className?: string;
}

export function FeeCalculator({ entryTime, exitTime, vehicleType, className }: FeeCalculatorProps) {
  const t = useTranslations('pricing');
  const tCommon = useTranslations('common');

  const [simExitTime, setSimExitTime] = React.useState(exitTime || new Date().toISOString());
  const [hasLostCard, setHasLostCard] = React.useState(false);
  const [hasWrongZone, setHasWrongZone] = React.useState(false);
  const [isBooking, setIsBooking] = React.useState(false);

  // Keep simulated exit time updated if none provided
  React.useEffect(() => {
    if (!exitTime) {
      const interval = setInterval(() => {
        setSimExitTime(new Date().toISOString());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [exitTime]);

  const feeResult = calculateParkingFee(entryTime, simExitTime, vehicleType, {
    hasLostCard,
    hasWrongZone,
    isBooking,
  });

  const roundingDiff = feeResult.totalAmount - feeResult.totalBeforeRounding;

  return (
    <div className={cn('bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6', className)}>
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="font-bold text-base text-[var(--color-ink)]">
          BẢNG TÍNH TIỀN GỬI XE / FEE ESTIMATOR
        </h4>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Thời gian đỗ: {feeResult.rawHours.toFixed(2)} giờ / Hours
        </p>
      </div>

      {/* Simulation Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)]">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasLostCard}
            onChange={(e) => setHasLostCard(e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-4 h-4"
          />
          <span className="text-xs font-semibold text-[var(--color-ink)]">Mất thẻ / Lost Card</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasWrongZone}
            onChange={(e) => setHasWrongZone(e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-4 h-4"
          />
          <span className="text-xs font-semibold text-[var(--color-ink)]">Sai làn / Wrong Zone</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isBooking}
            onChange={(e) => setIsBooking(e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-4 h-4"
          />
          <span className="text-xs font-semibold text-[var(--color-ink)]">Đã đặt chỗ / Booking</span>
        </label>
      </div>

      {/* Line Item Breakdown */}
      <div className="space-y-3 text-sm">
        {/* Base 4h Rate */}
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)] font-medium">Giá 4h đầu / Base 4h:</span>
          <span className="font-mono text-[var(--color-ink)] font-bold">
            {formatVND(feeResult.basePrice)}
          </span>
        </div>

        {/* Extra Block Hours */}
        {feeResult.additionalHours > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)] font-medium">
              Phát sinh / Extra ({feeResult.additionalHours}h x {formatVND(feeResult.blockPrice)}):
            </span>
            <span className="font-mono text-[var(--color-ink)] font-bold">
              +{formatVND(feeResult.additionalHours * feeResult.blockPrice)}
            </span>
          </div>
        )}

        {/* Surcharges list */}
        {feeResult.surcharges.map((s, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-[var(--color-muted)] font-medium">{s.name}:</span>
            <span
              className={cn(
                'font-mono font-bold',
                s.amount < 0 ? 'text-emerald-500' : 'text-rose-500'
              )}
            >
              {s.amount < 0 ? '' : '+'}{formatVND(s.amount)}
            </span>
          </div>
        ))}

        {/* Rounding Difference (VND Cash Rules) */}
        {Math.abs(roundingDiff) > 0 && (
          <div className="flex justify-between text-xs border-t border-dashed border-[var(--color-border)] pt-2.5">
            <span className="text-[var(--color-muted)] font-semibold">Làm tròn tiền mặt / Rounding:</span>
            <span className={cn('font-mono font-bold', roundingDiff > 0 ? 'text-rose-500' : 'text-emerald-500')}>
              {roundingDiff > 0 ? '+' : ''}{formatVND(roundingDiff)}
            </span>
          </div>
        )}
      </div>

      {/* Final Total Amount */}
      <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-4">
        <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-ink)]">
          TỔNG THANH TOÁN / TOTAL DUE
        </span>
        <div className="text-right">
          <span className="text-2xl font-mono font-extrabold text-[var(--color-accent)]">
            {formatVND(feeResult.totalAmount)}
          </span>
          <span className="block text-[10px] text-[var(--color-muted)] font-medium">
            (Đã gồm VAT / Tax inclusive)
          </span>
        </div>
      </div>
    </div>
  );
}
