'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Booking } from '@/lib/types/booking.types';
import { formatVND } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

export function BookingCard({ booking, className }: BookingCardProps) {
  const t = useTranslations('pricing');
  const tStatus = useTranslations('status');

  const formattedDate = new Date(booking.checkInTime).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div
      className={cn(
        'w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden relative shadow-xl',
        className
      )}
    >
      {/* Top Emerald Header */}
      <div className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)] p-6 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            VÉ ĐẶT CHỖ / PARKING TICKET
          </span>
          <h4 className="text-lg font-bold text-[var(--color-ink)] mt-1 font-mono">
            {booking.code}
          </h4>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 text-xs font-bold rounded-full uppercase font-mono tracking-wider',
            booking.status === 'CONFIRMED'
              ? 'bg-emerald-500/10 text-emerald-500'
              : booking.status === 'CHECKED_IN'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-amber-500/10 text-amber-500'
          )}
        >
          {tStatus(booking.status)}
        </span>
      </div>

      {/* Ticket Details */}
      <div className="p-6 space-y-4">
        {/* Slot Info (Optional) */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--color-border)]/50">
          <div>
            <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold block">
              Biển số xe / License Plate
            </span>
            <span className="text-lg font-mono font-bold text-[var(--color-ink)] uppercase">
              {booking.plateNumber}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold block">
              Vị trí đặt / Target Slot
            </span>
            <span className="text-lg font-mono font-bold text-[var(--color-accent)]">
              {booking.slotCode || 'AUTO'}
            </span>
          </div>
        </div>

        {/* Dynamic metadata */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)] font-semibold">Tòa nhà / Building:</span>
            <span className="text-[var(--color-ink)] font-bold text-right">
              {booking.buildingName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--color-muted)] font-semibold">Giờ hẹn / Check-in Time:</span>
            <span className="text-[var(--color-ink)] font-bold font-mono">{formattedDate}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--color-muted)] font-semibold">Tiền cọc / Paid Deposit:</span>
            <span className="text-[var(--color-accent)] font-bold font-mono">
              {formatVND(booking.depositAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Perforated ticket tear line */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent overflow-hidden">
        <div className="w-4 h-4 rounded-full border border-[var(--color-border)] bg-[var(--color-canvas)] -ml-5" />
        <div className="flex-1 border-t border-dashed border-[var(--color-border)]" />
        <div className="w-4 h-4 rounded-full border border-[var(--color-border)] bg-[var(--color-canvas)] -mr-5" />
      </div>

      {/* Simulated QR Code ticket barcode stub */}
      <div className="p-6 bg-[var(--color-surface-2)]/55 flex flex-col items-center justify-center space-y-4">
        {/* Fake modern tech barcode stripes */}
        <div className="w-full flex items-center justify-center gap-[2px] h-12 bg-transparent overflow-hidden opacity-60 hover:opacity-100 transition-opacity duration-200">
          {Array.from({ length: 48 }).map((_, i) => {
            const widthClass = i % 3 === 0 ? 'w-[4px]' : i % 5 === 0 ? 'w-[1px]' : 'w-[2px]';
            const bgClass = i % 7 === 0 ? 'bg-transparent' : 'bg-[var(--color-ink)]';
            return <div key={i} className={cn('h-full', widthClass, bgClass)} />;
          })}
        </div>
        <p className="text-[10px] font-mono text-[var(--color-muted)] tracking-widest uppercase">
          * Present barcode at terminal on arrival *
        </p>
      </div>
    </div>
  );
}
