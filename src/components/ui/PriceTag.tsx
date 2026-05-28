import { cn } from '@/lib/utils/cn';
import { formatVND } from '@/lib/utils/format';

// ─── Types ─────────────────────────────────────────────────────────
interface PriceTagProps {
  amount:    number;
  compact?:  boolean;
  size?:     'sm' | 'md' | 'lg';
  accent?:   boolean;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────
function PriceTag({ amount, compact, size = 'md', accent, className }: PriceTagProps) {
  const formatted = formatVND(amount, compact);

  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <span
      className={cn(
        'font-mono font-semibold tabular-nums',
        sizes[size],
        accent
          ? 'text-[var(--color-accent)]'
          : 'text-[var(--color-ink)]',
        className
      )}
    >
      {formatted}
    </span>
  );
}

export { PriceTag };
export type { PriceTagProps };
