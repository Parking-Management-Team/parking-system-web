'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?:    'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center gap-2',
      'font-semibold rounded-btn select-none',
      'transition-all duration-150 ease-out',
      'active:scale-[0.98]',
      'focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
    ];

    const variants = {
      primary: [
        'bg-[var(--color-accent)] text-white',
        'hover:-translate-y-px hover:bg-[var(--color-accent-hover)]',
        'active:translate-y-0',
        'focus-visible:outline-[var(--color-accent)]',
      ],
      ghost: [
        'bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)]',
        'hover:bg-[var(--color-accent-light)]',
        'focus-visible:outline-[var(--color-accent)]',
      ],
      outline: [
        'bg-transparent border border-[var(--color-border)] text-[var(--color-ink)]',
        'hover:border-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
        'focus-visible:outline-[var(--color-ink)]',
      ],
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-5 py-3 text-sm min-h-[44px]',
      lg: 'px-7 py-4 text-base min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
