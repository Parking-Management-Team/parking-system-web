'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────
type BadgeVariant = 'available' | 'occupied' | 'reserved' | 'inactive' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?:     boolean;
}

// ─── Component ─────────────────────────────────────────────────────
function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold';

  const variants: Record<BadgeVariant, string> = {
    available: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400',
    occupied:  'bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400',
    reserved:  'bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
    inactive:  'bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-400',
    default:   'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    available: 'bg-emerald-500 pulse-accent',
    occupied:  'bg-rose-500',
    reserved:  'bg-amber-500',
    inactive:  'bg-slate-400',
    default:   'bg-[var(--color-muted)]',
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
