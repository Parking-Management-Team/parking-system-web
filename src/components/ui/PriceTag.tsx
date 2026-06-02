/**
 * PriceTag Component - Hiển thị giá tiền VNĐ
 *
 * Component hiển thị giá tiền với định dạng Việt Nam (VNĐ).
 * Hỗ trợ compact mode cho số lớn (ví dụ: "1,5 triệu ₫").
 *
 * @param amount - Số tiền (đơn vị VNĐ)
 * @param compact - Hiển thị ngắn gọn cho số lớn
 * @param size - Kích thước: sm, md, lg
 * @param accent - Dùng màu nhấn (xanh lá)
 *
 * @example
 * <PriceTag amount={30000} />              → "30.000 ₫"
 * <PriceTag amount={1500000} compact />    → "1,5 triệu ₫"
 * <PriceTag amount={5000} size="lg" accent />
 */

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
