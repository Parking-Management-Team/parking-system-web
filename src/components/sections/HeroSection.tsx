'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Badge, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

export function HeroSection() {
  const t      = useTranslations('hero');
  const tStats = useTranslations('stats');
  const locale = useLocale();

  return (
    <section className="min-h-[100dvh] flex items-center relative overflow-hidden bg-[var(--color-canvas)]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />

      {/* Emerald glow — top left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #059669, transparent 70%)' }}
        aria-hidden
      />

      <div className="container-main pt-28 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-16 items-center">

          {/* Left — Content */}
          <div className="space-y-8">
            <Badge variant="available" dot className="reveal stagger-1">
              {t('badge')}
            </Badge>

            <h1 className="reveal stagger-2 text-[var(--color-ink)]">
              {t('headline1')}{' '}
              <span className="text-[var(--color-accent)]">{t('headline2')}</span>
            </h1>

            <p className="reveal stagger-3 text-lg text-[var(--color-muted)] max-w-[55ch]">
              {t('description')}
            </p>

            <div className="reveal stagger-4 flex items-center gap-4 flex-wrap">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = `/${locale}${ROUTES.BOOKING}`}
              >
                {t('cta_primary')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => window.location.href = `/${locale}${ROUTES.PRICING}`}
              >
                {t('cta_secondary')}
              </Button>
            </div>

            {/* Live stats strip */}
            <div className="reveal stagger-5 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-[var(--color-border)]">
              {[
                { value: tStats('value_vehicles'), label: tStats('label_vehicles') },
                { value: tStats('value_occupancy'), label: tStats('label_occupancy') },
                { value: tStats('value_buildings'), label: tStats('label_buildings') },
                { value: tStats('value_uptime'),    label: tStats('label_uptime') },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="font-mono font-bold text-2xl text-[var(--color-accent)]">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[var(--color-muted)] font-medium leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual */}
          <div className="hidden lg:flex justify-end items-center">
            <div className="relative float-anim">
              {/* Parking grid visual */}
              <div className="w-72 h-72 relative">
                <div className="absolute inset-0 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="p-5 h-full grid grid-cols-3 grid-rows-4 gap-2">
                    {[
                      'available','available','occupied',
                      'occupied','reserved','available',
                      'available','available','occupied',
                      'reserved','available','available',
                    ].map((status, i) => (
                      <div
                        key={i}
                        className={[
                          'rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-all',
                          status === 'available' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : '',
                          status === 'occupied'  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : '',
                          status === 'reserved'  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : '',
                        ].join(' ')}
                      >
                        {i + 1 < 10 ? `0${i + 1}` : i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating chip */}
                <div className="absolute -bottom-4 -right-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] pulse-accent" />
                    <span className="text-xs font-semibold text-[var(--color-ink)]">8/12 trống</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
