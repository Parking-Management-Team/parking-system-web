'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

export function CTASection() {
  const t      = useTranslations('cta');
  const tFoot  = useTranslations('footer');
  const locale = useLocale();

  return (
    <>
      {/* CTA */}
      <section className="section-spacing bg-[var(--color-accent)]">
        <div className="container-main text-center reveal">
          <h2 className="text-white whitespace-pre-line mb-6">{t('headline')}</h2>
          <p className="text-emerald-100 mb-10 max-w-lg mx-auto">{t('description')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" size="lg" className="bg-white text-[var(--color-accent)] border-white hover:bg-white/90"
              onClick={() => window.location.href = `/${locale}${ROUTES.BOOKING}`}>
              {t('btn_primary')}
            </Button>
            <Button variant="ghost" size="lg" className="border-white/40 text-white hover:bg-white/10">
              {t('btn_secondary')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] text-slate-400 py-12">
        <div className="container-main">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-8 border-b border-white/10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-sm bg-[var(--color-accent)] flex items-center justify-center text-white font-black text-sm">N</span>
                <span className="font-extrabold text-lg text-white tracking-tight">Nex<span className="text-[var(--color-accent)]">Park</span></span>
              </div>
              <p className="text-sm max-w-xs">{tFoot('tagline')}</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-3">
                <p className="text-white font-semibold">{tFoot('links_product')}</p>
                <ul className="space-y-2">
                  <li><a href={`/${locale}${ROUTES.BOOKING}`} className="hover:text-white transition-colors">Đặt chỗ</a></li>
                  <li><a href={`/${locale}${ROUTES.PRICING}`} className="hover:text-white transition-colors">Bảng giá</a></li>
                  <li><a href={`/${locale}${ROUTES.MONTHLY_CARD}`} className="hover:text-white transition-colors">Vé tháng</a></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 pt-6">{tFoot('copyright')}</p>
        </div>
      </footer>
    </>
  );
}
