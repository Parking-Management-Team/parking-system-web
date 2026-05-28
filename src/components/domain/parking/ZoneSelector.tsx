'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ParkingZone } from '@/lib/types/parking.types';
import { cn } from '@/lib/utils/cn';

interface ZoneSelectorProps {
  zones: ParkingZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  className?: string;
}

export function ZoneSelector({
  zones,
  selectedZoneId,
  onSelectZone,
  className,
}: ZoneSelectorProps) {
  const t = useTranslations('pricing'); // We can use pricing/common strings

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {zones.map((zone) => {
        const isActive = zone.id === selectedZoneId;
        const isFull = zone.availableSlots === 0;

        return (
          <button
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            className={cn(
              'flex flex-col items-start p-5 text-left border transition-all duration-200 select-none relative overflow-hidden',
              'rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              isActive
                ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] text-[var(--color-ink)]'
                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-muted)] text-[var(--color-ink)]'
            )}
          >
            {/* Emerald indicator bar for active state */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--color-accent)]" />
            )}

            <div className="w-full flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-lg">{zone.name}</span>
              <span
                className={cn(
                  'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider',
                  zone.vehicleType === 'CAR'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                )}
              >
                {t(zone.vehicleType === 'CAR' ? 'vehicle_car' : 'vehicle_motorbike')}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span
                className={cn(
                  'font-mono font-bold text-2xl',
                  isFull ? 'text-rose-500' : 'text-[var(--color-accent)]'
                )}
              >
                {zone.availableSlots}
              </span>
              <span className="text-[var(--color-muted)] text-sm font-mono">
                / {zone.totalSlots}
              </span>
            </div>
            <span className="text-xs text-[var(--color-muted)] mt-1 font-medium">
              {isFull ? 'Đã hết chỗ / Full' : 'còn trống / available'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
