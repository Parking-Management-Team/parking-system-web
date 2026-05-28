'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitch } from './LanguageSwitch';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';

export function Navbar() {
  const t      = useTranslations('nav');
  const locale = useLocale();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const localePath = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: localePath(ROUTES.BOOKING),  label: t('booking') },
    { href: localePath(ROUTES.PRICING),  label: t('pricing') },
    { href: localePath(ROUTES.PARKING_MAP), label: t('map') },
    { href: localePath(ROUTES.MONTHLY_CARD), label: t('monthly') },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[var(--color-canvas)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-[0_1px_8px_var(--color-shadow)]'
          : 'bg-transparent'
      )}
    >
      <div className="container-main">
        <nav className="flex items-center justify-between h-16 md:h-18">
          {/* Logo / Wordmark */}
          <Link
            href={localePath('/')}
            className="flex items-center gap-2 group"
            aria-label="NexPark home"
          >
            {/* Emerald signal square */}
            <span className="w-7 h-7 rounded-sm bg-[var(--color-accent)] flex items-center justify-center text-white font-black text-sm select-none">
              N
            </span>
            <span className="font-extrabold text-lg tracking-tight text-[var(--color-ink)]">
              Nex<span className="text-[var(--color-accent)]">Park</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium text-[var(--color-muted)]',
                  'hover:text-[var(--color-ink)] transition-colors duration-150',
                  'relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px]',
                  'after:bg-[var(--color-accent)] after:transition-all after:duration-200',
                  'hover:after:w-full'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitch className="hidden sm:flex" />
            <ThemeToggle />
            <Button
              variant="primary"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => window.location.href = localePath(ROUTES.BOOKING)}
            >
              {t('booking')}
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-btn border border-[var(--color-border)] text-[var(--color-muted)]"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-canvas)] py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] rounded-btn transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-3 flex items-center gap-3">
              <LanguageSwitch />
              <Button variant="primary" size="sm" className="flex-1" onClick={() => window.location.href = localePath(ROUTES.BOOKING)}>
                {t('booking')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
