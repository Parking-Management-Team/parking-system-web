'use client';

import * as React from 'react';
import { ParkingSlot } from '@/lib/types/parking.types';
import { SlotBadge } from './SlotBadge';
import { cn } from '@/lib/utils/cn';

interface SlotGridProps {
  slots: ParkingSlot[];
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: ParkingSlot) => void;
  interactive?: boolean;
  className?: string;
}

export function SlotGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
  interactive = true,
  className,
}: SlotGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3', className)}>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isAvailable = slot.status === 'AVAILABLE';
        const isClickable = interactive && isAvailable && onSelectSlot;

        return (
          <button
            key={slot.id}
            disabled={!isClickable}
            onClick={() => isClickable && onSelectSlot(slot)}
            className={cn(
              'border p-4 rounded-lg flex flex-col items-center justify-center min-h-[100px] transition-all relative overflow-hidden focus:outline-none',
              isAvailable
                ? isSelected
                  ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] ring-offset-2 dark:ring-offset-slate-900'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] cursor-pointer'
                : 'bg-[var(--color-surface-2)]/50 border-[var(--color-border)]/50 opacity-75 cursor-not-allowed'
            )}
          >
            {/* Slot marking line decorations (looks like a parking bay outline) */}
            <div className="absolute top-2 left-2 bottom-2 w-[1px] border-l border-dashed border-[var(--color-border)]" />
            <div className="absolute top-2 right-2 bottom-2 w-[1px] border-r border-dashed border-[var(--color-border)]" />

            <span className="font-mono font-bold text-lg text-[var(--color-ink)] mb-2">
              {slot.code}
            </span>

            <SlotBadge status={slot.status} dot={isAvailable} className="scale-90" />

            {/* Display vehicle plate if occupied */}
            {slot.status === 'OCCUPIED' && slot.occupiedBy && (
              <span className="mt-2 text-[10px] font-mono font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                {slot.occupiedBy}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
