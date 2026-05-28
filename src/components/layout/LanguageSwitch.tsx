'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface LanguageSwitchProps {
  className?: string;
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  const switchTo = (nextLocale: string) => {
    if (nextLocale === locale) return;
    // Replace locale prefix in pathname
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    router.push(segments.join('/'));
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-btn',
        'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      {(['vi', 'en'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          aria-pressed={locale === lang}
          className={cn(
            'px-3 py-1 rounded text-xs font-semibold transition-all duration-150',
            locale === lang
              ? 'bg-[var(--color-accent)] text-white shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
