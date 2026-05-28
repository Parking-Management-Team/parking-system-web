'use client';

import { useTranslations } from 'next-intl';
import { PriceTag } from '@/components/ui';
import { STANDARD_PRICING, MONTHLY_PRICING, SURCHARGE } from '@/constants/parking.constants';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

type PricingTab = 'standard' | 'monthly' | 'booking';

export function PricingSection() {
  const t = useTranslations('pricing');
  const [activeTab, setActiveTab] = useState<PricingTab>('standard');

  const tabs: { id: PricingTab; label: string }[] = [
    { id: 'standard', label: t('tab_standard') },
    { id: 'monthly',  label: t('tab_monthly') },
    { id: 'booking',  label: t('tab_booking') },
  ];

  return (
    <section id="pricing" className="section-spacing bg-[var(--color-canvas)]">
      <div className="container-main">

        {/* Header */}
        <div className="mb-12 reveal">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">
            {t('section_label')}
          </span>
          <h2 className="text-[var(--color-ink)] whitespace-pre-line">
            {t('section_title')}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 mb-10 rounded-card bg-[var(--color-surface-2)] border border-[var(--color-border)] w-fit reveal stagger-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-2.5 rounded-btn text-sm font-semibold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Standard pricing ────────────────────────────── */}
        {activeTab === 'standard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Motorbike */}
            {(['DAY', 'NIGHT'] as const).map((window) => {
              const p = STANDARD_PRICING.MOTORBIKE[window];
              return (
                <div key={`moto-${window}`} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                        {t('vehicle_motorbike')}
                      </p>
                      <h3 className="text-base font-semibold text-[var(--color-ink)]">
                        {window === 'DAY' ? t('time_day') : t('time_night')}
                      </h3>
                    </div>
                    <span className="text-2xl">🏍️</span>
                  </div>
                  <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-[var(--color-muted)]">{t('base_price')} (4h)</span>
                      <PriceTag amount={p.basePrice} accent size="md" />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-[var(--color-muted)]">{t('block_price')} /h</span>
                      <PriceTag amount={p.blockPrice} size="sm" />
                    </div>
                    <div className="flex justify-between items-baseline font-semibold border-t border-[var(--color-border)] pt-3">
                      <span className="text-sm text-[var(--color-ink)]">{t('max_cap')}</span>
                      <PriceTag amount={p.windowCap} accent size="md" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Car */}
            {(['DAY', 'NIGHT'] as const).map((window) => {
              const p = STANDARD_PRICING.CAR[window];
              return (
                <div key={`car-${window}`} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                        {t('vehicle_car')}
                      </p>
                      <h3 className="text-base font-semibold text-[var(--color-ink)]">
                        {window === 'DAY' ? t('time_day') : t('time_night')}
                      </h3>
                    </div>
                    <span className="text-2xl">🚗</span>
                  </div>
                  <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-[var(--color-muted)]">{t('base_price')} (4h)</span>
                      <PriceTag amount={p.basePrice} accent size="md" />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-[var(--color-muted)]">{t('block_price')} /h</span>
                      <PriceTag amount={p.blockPrice} size="sm" />
                    </div>
                    <div className="flex justify-between items-baseline font-semibold border-t border-[var(--color-border)] pt-3">
                      <span className="text-sm text-[var(--color-ink)]">{t('max_cap')}</span>
                      <PriceTag amount={p.windowCap} accent size="md" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 2: Monthly pass ────────────────────────────────── */}
        {activeTab === 'monthly' && (
          <div className="animate-fade-in">
            <p className="text-[var(--color-muted)] mb-8 max-w-prose">{t('monthly_desc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-card p-8 text-center">
                <div className="text-4xl mb-4">🏍️</div>
                <p className="text-sm font-semibold text-[var(--color-muted)] mb-2">{t('vehicle_motorbike')}</p>
                <PriceTag amount={MONTHLY_PRICING.MOTORBIKE} accent size="lg" />
                <p className="text-xs text-[var(--color-muted)] mt-2">/ tháng</p>
              </div>
              <div className="bg-[var(--color-accent)] rounded-card p-8 text-center text-white relative overflow-hidden">
                <div className="text-4xl mb-4">🚗</div>
                <p className="text-sm font-semibold opacity-80 mb-2">{t('vehicle_car')}</p>
                <span className="font-mono font-bold text-3xl">1.500.000 ₫</span>
                <p className="text-xs opacity-70 mt-2">/ tháng</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Booking & Surcharges ────────────────────────── */}
        {activeTab === 'booking' && (
          <div className="space-y-4 animate-fade-in">
            {[
              {
                title: t('booking_deposit'),
                amount: SURCHARGE.BOOKING_DEPOSIT,
                desc: 'Thanh toán trước qua Web/App để khóa slot. Được cấn trừ vào hóa đơn cuối.',
                color: 'emerald',
              },
              {
                title: t('booking_noshow'),
                amount: SURCHARGE.BOOKING_DEPOSIT,
                desc: 'Quá 45 phút kể từ giờ hẹn không check-in → hủy tự động, không hoàn cọc.',
                color: 'amber',
              },
              {
                title: t('penalty_lostcard'),
                amount: SURCHARGE.LOST_CARD_PENALTY,
                desc: 'Phí phạt khi mất thẻ. Phải đóng cùng cước gửi xe để lấy xe ra.',
                color: 'rose',
              },
              {
                title: t('penalty_wrongzone'),
                amount: SURCHARGE.WRONG_ZONE_PENALTY,
                desc: 'Phạt đỗ sai khu vực > 10 phút, được Staff/Camera xác nhận.',
                color: 'rose',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-card"
              >
                <div className="flex-1 pr-8">
                  <h4 className="font-semibold text-[var(--color-ink)] mb-1">{item.title}</h4>
                  <p className="text-sm text-[var(--color-muted)]">{item.desc}</p>
                </div>
                <PriceTag amount={item.amount} accent size="lg" className="shrink-0" />
              </div>
            ))}

            {/* Rounding rules note */}
            <div className="mt-6 p-5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-card">
              <h4 className="font-semibold text-[var(--color-ink)] mb-3">{t('rounding_title')}</h4>
              <ul className="space-y-2 text-sm text-[var(--color-muted)]">
                <li>⏱ Ân hạn 15 phút — lố ≤ 15 phút không tính block mới</li>
                <li>💵 Tiền mặt: làm tròn đến 1.000 ₫ (lẻ &lt; 500 → xuống, ≥ 500 → lên)</li>
                <li>📱 Online (QR/ví điện tử): giữ nguyên từng đồng</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
