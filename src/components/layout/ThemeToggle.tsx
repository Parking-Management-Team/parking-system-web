'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('nexpark-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || (!saved && prefersDark);
    setIsDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('nexpark-theme', next ? 'dark' : 'light');
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className={cn(
        'relative w-9 h-9 flex items-center justify-center rounded-btn',
        'border border-[var(--color-border)] bg-[var(--color-surface)]',
        'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
        'hover:border-[var(--color-accent)] transition-all duration-200',
        'active:scale-95',
        className
      )}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
        aria-hidden
      >
        {/* Sun icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)' }}
        aria-hidden
      >
        {/* Moon icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>
    </button>
  );
}
