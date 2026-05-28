'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

export function UserTypesSection() {
  const t      = useTranslations('user_types');
  const locale = useLocale();

  return (
    <section className="section-spacing bg-[var(--color-surface)]">
      <div className="container-main">
        <div className="mb-12 reveal">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">
            {t('section_label')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6">
          {/* Driver panel */}
          <div className="reveal bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-card p-10 space-y-6">
            <div className="text-5xl">🚘</div>
            <h2 className="text-[var(--color-ink)]">{t('driver_title')}</h2>
            <p className="text-[var(--color-muted)] leading-relaxed max-w-prose">{t('driver_desc')}</p>
            <Button variant="primary" size="lg" onClick={() => window.location.href = `/${locale}${ROUTES.BOOKING}`}>
              {t('driver_cta')} →
            </Button>
          </div>

          {/* Staff panel — dark themed */}
          <div className="reveal stagger-2 rounded-card p-10 space-y-6 relative overflow-hidden" style={{ background: '#0F172A' }}>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full" style={{ background: 'radial-gradient(circle, #059669, transparent 70%)' }} aria-hidden />
            <div className="text-5xl relative z-10">🛡️</div>
            <h2 className="text-white relative z-10">{t('staff_title')}</h2>
            <p className="text-slate-400 leading-relaxed max-w-prose relative z-10">{t('staff_desc')}</p>
            <Button variant="ghost" size="lg" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 relative z-10" onClick={() => window.location.href = `/${locale}${ROUTES.DASHBOARD}`}>
              {t('staff_cta')} →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
