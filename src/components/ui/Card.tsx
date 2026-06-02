/**
 * Card Component - Thẻ container tái sử dụng
 *
 * Component card với shadow, border, và hiệu ứng hover.
 * Bao gồm các sub-component: CardHeader, CardTitle, CardDescription.
 *
 * @param hover - Bật hiệu ứng nổi lên khi hover
 * @param noPad - Bỏ padding mặc định
 *
 * @example
 * <Card hover>
 *   <CardHeader>
 *     <CardTitle>Tiêu đề</CardTitle>
 *     <CardDescription>Mô tả</CardDescription>
 *   </CardHeader>
 *   <p>Nội dung</p>
 * </Card>
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPad?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────
function Card({ hover, noPad, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-card',
        'shadow-[0_1px_3px_var(--color-shadow)]',
        !noPad && 'p-6',
        hover && [
          'transition-all duration-300 ease-out cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--color-shadow-lg)]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--color-ink)]', className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[var(--color-muted)] mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export { Card, CardHeader, CardTitle, CardDescription };
export type { CardProps };
