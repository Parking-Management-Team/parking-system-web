'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export function FeaturesSection() {
  const t      = useTranslations('features');
  const locale = useLocale();

  const features = [
    { key: 'f1', icon: '📍', flipped: false },
    { key: 'f2', icon: '✅', flipped: true  },
    { key: 'f3', icon: '🧮', flipped: false },
    { key: 'f4', icon: '📊', flipped: true  },
    { key: 'f5', icon: '🎫', flipped: false },
  ] as const;

  return (
    <section className="section-spacing bg-[var(--color-surface)]">
      <div className="container-main">
        <div className="mb-16 reveal">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">
            {t('section_label')}
          </span>
          <h2 className="text-[var(--color-ink)] whitespace-pre-line max-w-xl">
            {t('section_title')}
          </h2>
        </div>

        <div className="space-y-20">
          {features.map((f, i) => (
            <div
              key={f.key}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center reveal stagger-${(i % 3) + 1}`}
            >
              {/* Text — alternating sides */}
              <div className={f.flipped ? 'lg:order-2' : ''}>
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-[var(--color-ink)] mb-3">
                  {t(`${f.key}_title` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-[var(--color-muted)] leading-relaxed">
                  {t(`${f.key}_desc` as Parameters<typeof t>[0])}
                </p>
              </div>

              {/* Visual placeholder */}
              <div className={`h-48 rounded-card bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center ${f.flipped ? 'lg:order-1' : ''}`}>
                <span className="text-6xl opacity-20">{f.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
