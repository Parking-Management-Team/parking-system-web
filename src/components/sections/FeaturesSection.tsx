'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export function FeaturesSection() {
  const t      = useTranslations('features');
  const locale = useLocale();

  const features = [
    { key: 'f1', flipped: false },
    { key: 'f2', flipped: true  },
    { key: 'f3', flipped: false },
    { key: 'f4', flipped: true  },
    { key: 'f5', flipped: false },
  ] as const;

  // Renders custom high-fidelity visual mockups instead of cheap emojis
  const renderVisualMockup = (key: string) => {
    switch (key) {
      case 'f1':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-between font-sans text-xs">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <span className="font-bold text-[var(--color-ink)]">Khu A - Tầng 1</span>
              <span className="text-[var(--color-accent)] font-semibold">Slot 12 Khóa</span>
            </div>
            <div className="space-y-2 py-3">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Biển số:</span>
                <span className="font-mono font-bold text-[var(--color-ink)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)]">30A-888.88</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Thời gian hẹn:</span>
                <span className="text-[var(--color-ink)] font-medium">08:30 - 12:30</span>
              </div>
            </div>
            <div className="bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold p-2 rounded-lg text-center">
              Đặt Chỗ Đã Xác Nhận
            </div>
          </div>
        );
      case 'f2':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-between font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--color-ink)]">Luồng Xe Vào/Ra</span>
              <span className="bg-emerald-500/10 text-emerald-500 font-mono px-2 py-0.5 rounded-full font-bold">LIVE</span>
            </div>
            <div className="space-y-3 my-auto">
              <div className="flex items-center gap-3 bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-border)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono font-semibold">29C-445.12</span>
                <span className="text-[var(--color-muted)] ml-auto">Check-in 14:02</span>
              </div>
              <div className="flex items-center gap-3 bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-border)] opacity-60">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-mono font-semibold">30F-999.01</span>
                <span className="text-[var(--color-muted)] ml-auto">Check-out 13:58</span>
              </div>
            </div>
          </div>
        );
      case 'f3':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-between font-sans text-xs">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <span className="font-bold text-[var(--color-ink)]">Chi Tiết Cước Phí</span>
              <span className="font-mono text-[var(--color-accent)] font-bold">14:15 - 18:45 (4h 30m)</span>
            </div>
            <div className="space-y-2 py-3">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">4 Giờ Đầu (Cơ bản):</span>
                <span className="font-mono font-bold text-[var(--color-ink)]">30.000 ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Block 30m Lũy Tiến:</span>
                <span className="font-mono font-bold text-[var(--color-ink)]">10.000 ₫</span>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-bold">
                <span className="text-[var(--color-ink)]">Tổng cước thanh toán:</span>
                <span className="font-mono text-base text-[var(--color-accent)]">40.000 ₫</span>
              </div>
            </div>
          </div>
        );
      case 'f4':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-between font-sans text-xs">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="font-bold text-[var(--color-ink)]">Doanh Thu Trong Ngày</span>
              <span className="text-emerald-500 font-semibold">+18.4%</span>
            </div>
            <div className="flex items-end gap-1.5 h-20 pt-4 px-2">
              {[30, 45, 35, 60, 80, 50, 95, 70, 85, 100].map((h, index) => (
                <div
                  key={index}
                  className="flex-1 bg-[var(--color-accent)] rounded-t-sm"
                  style={{ height: `${h}%`, opacity: index === 9 ? 1 : 0.4 }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[var(--color-muted)] font-mono text-[10px] pt-1">
              <span>08:00</span>
              <span>18:00</span>
            </div>
          </div>
        );
      case 'f5':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-between font-sans text-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full bg-[var(--color-accent)]" />
            <div className="flex items-center justify-between z-10">
              <span className="font-black text-sm tracking-tight text-[var(--color-accent)]">NEXPARK PASS</span>
              <span className="bg-[var(--color-accent)] text-white font-mono px-2 py-0.5 rounded text-[10px] font-bold">VIP</span>
            </div>
            <div className="space-y-1.5 py-4 z-10">
              <p className="font-mono font-bold text-sm text-[var(--color-ink)] tracking-wider">30A-888.88</p>
              <p className="text-[var(--color-muted)] text-[10px]">Hạn dùng: 31/12/2026</p>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5 z-10">
              <span className="text-[var(--color-muted)] text-[10px]">Trạng thái thẻ:</span>
              <span className="text-emerald-500 font-bold text-[10px]">Đang hoạt động</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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

        <div className="space-y-24">
          {features.map((f, i) => (
            <div
              key={f.key}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center reveal stagger-${(i % 3) + 1}`}
            >
              {/* Text — alternating sides */}
              <div className={f.flipped ? 'lg:order-2' : ''}>
                <h3 className="text-[var(--color-ink)] mb-4 text-2xl md:text-3xl font-bold">
                  {t(`${f.key}_title` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-[var(--color-muted)] leading-relaxed text-base max-w-prose">
                  {t(`${f.key}_desc` as Parameters<typeof t>[0])}
                </p>
              </div>

              {/* Visual mockup block */}
              <div className={`h-64 rounded-[1.8rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-[0_4px_16px_var(--color-shadow)] overflow-hidden flex items-center justify-center transition-all duration-300 hover:shadow-[0_12px_32px_var(--color-shadow-lg)] hover:-translate-y-1 ${f.flipped ? 'lg:order-1' : ''}`}>
                {renderVisualMockup(f.key)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
