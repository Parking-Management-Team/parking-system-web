'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ParkingSession } from '@/lib/types/session.types';
import { calculateParkingFee } from '@/lib/utils/pricing';
import { formatVND, formatDuration } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface SessionCardProps {
  session: ParkingSession;
  className?: string;
}

export function SessionCard({ session, className }: SessionCardProps) {
  const t = useTranslations('pricing');
  const tStatus = useTranslations('status');

  const [durationString, setDurationString] = React.useState('');
  const [estimatedFee, setEstimatedFee] = React.useState(0);

  const entryDate = new Date(session.entryTime);
  const formattedEntry = entryDate.toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const formattedExit = session.exitTime
    ? new Date(session.exitTime).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  React.useEffect(() => {
    const updateTime = () => {
      const currentEnd = session.exitTime ? new Date(session.exitTime) : new Date();

      // Update formatted duration
      setDurationString(formatDuration(entryDate, currentEnd));

      // Calculate estimated fee
      if (session.status === 'ACTIVE') {
        const feeObj = calculateParkingFee(session.entryTime, currentEnd.toISOString(), session.vehicleType);
        setEstimatedFee(feeObj.totalAmount);
      }
    };

    updateTime();
    if (session.status === 'ACTIVE') {
      const interval = setInterval(updateTime, 10000); // update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [session, entryDate]);

  const isActive = session.status === 'ACTIVE';

  return (
    <div
      className={cn(
        'w-full bg-[var(--color-surface)] border rounded-xl overflow-hidden shadow-md relative transition-all duration-200 hover:shadow-lg',
        isActive ? 'border-[var(--color-accent)]/30' : 'border-[var(--color-border)]',
        className
      )}
    >
      {/* Decorative side bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[4px]',
          isActive ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-muted)]'
        )}
      />

      <div className="p-5 pl-7">
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">
              {t(session.vehicleType === 'CAR' ? 'vehicle_car' : 'vehicle_motorbike')} • {session.slotCode}
            </span>
            <h4 className="text-xl font-mono font-extrabold text-[var(--color-ink)] uppercase mt-1">
              {session.plateNumber}
            </h4>
          </div>

          <span
            className={cn(
              'px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider font-mono',
              isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--color-border)] text-[var(--color-muted)]'
            )}
          >
            {tStatus(session.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm pb-4 border-b border-[var(--color-border)]/50">
          <div>
            <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold block">
              Thời gian vào / Entry
            </span>
            <span className="font-mono font-semibold text-[var(--color-ink)]">{formattedEntry}</span>
          </div>

          {session.exitTime ? (
            <div>
              <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold block">
                Thời gian ra / Exit
              </span>
              <span className="font-mono font-semibold text-[var(--color-ink)]">{formattedExit}</span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold block">
                Thời lượng / Duration
              </span>
              <span className="font-mono font-semibold text-[var(--color-accent)]">
                {durationString || 'Calculating...'}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-baseline mt-4">
          <span className="text-xs font-semibold text-[var(--color-muted)]">
            {isActive ? 'Chi phí tạm tính / Estimated Fee' : 'Chi phí thực tế / Actual Fee'}
          </span>
          <span className="text-xl font-mono font-extrabold text-[var(--color-ink)]">
            {isActive ? formatVND(estimatedFee) : formatVND(session.totalFee || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
