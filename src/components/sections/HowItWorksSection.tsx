'use client';

import { useTranslations } from 'next-intl';

export function HowItWorksSection() {
  const t = useTranslations('how_it_works');

  const steps = [
    { num: '01', titleKey: 'step1_title', descKey: 'step1_desc', icon: '📱' },
    { num: '02', titleKey: 'step2_title', descKey: 'step2_desc', icon: '🚗' },
    { num: '03', titleKey: 'step3_title', descKey: 'step3_desc', icon: '💳' },
  ] as const;

  return (
    <section className="section-spacing bg-[var(--color-canvas)]">
      <div className="container-main">
        <div className="mb-16 reveal">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">
            {t('section_label')}
          </span>
          <h2 className="text-[var(--color-ink)] whitespace-pre-line max-w-xl">
            {t('section_title')}
          </h2>
        </div>

        <div className="relative max-w-2xl">
          {/* Vertical connecting line */}
          <div className="absolute left-[28px] top-12 bottom-12 w-px bg-[var(--color-border)]" aria-hidden />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <div key={step.num} className={`relative flex gap-8 reveal stagger-${i + 1}`}>
                {/* Step number circle */}
                <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-canvas)] flex items-center justify-center">
                  <span className="font-mono font-bold text-sm text-[var(--color-accent)]">
                    {step.num}
                  </span>
                </div>

                <div className="pt-3 pb-6">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <h3 className="text-[var(--color-ink)] mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-[var(--color-muted)]">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
