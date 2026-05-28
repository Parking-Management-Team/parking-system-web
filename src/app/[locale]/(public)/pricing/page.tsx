'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Navbar } from '@/components/layout/Navbar';
import { Button, Card, PriceTag, Badge } from '@/components/ui';
import { calculateParkingFee } from '@/lib/utils/pricing';
import { formatDuration, formatDateTimeVI } from '@/lib/utils/format';
import { VehicleType, VEHICLE_TYPE } from '@/constants/parking.constants';
import { cn } from '@/lib/utils/cn';

// Localized calculator dictionary for premium multilingual experience
const dict = {
  vi: {
    title: 'Công cụ ước tính phí đỗ xe',
    desc: 'Chọn loại phương tiện và thiết lập thời gian gửi dự kiến để ước tính chi phí đỗ xe chính xác nhất theo biểu phí thông minh.',
    vehicle_type: 'Loại phương tiện',
    motorbike: 'Xe máy',
    car: 'Ô tô',
    entry_time: 'Thời gian vào',
    exit_time: 'Thời gian ra',
    options: 'Tùy chọn bổ sung',
    is_booking: 'Có đặt chỗ trực tuyến (Dự phòng slot)',
    is_booking_desc: 'Phí giữ chỗ 5.000 ₫ sẽ được tự động cấn trừ vào tổng hóa đơn cuối.',
    lost_card: 'Báo mất thẻ gửi xe',
    lost_card_desc: 'Áp dụng mức phạt mất thẻ theo quy định: 50.000 ₫.',
    wrong_zone: 'Đỗ sai khu vực quy định (>10 phút)',
    wrong_zone_desc: 'Áp dụng mức phạt đỗ sai khu vực: 100.000 ₫.',
    duration: 'Tổng thời gian gửi',
    base_charge: 'Giá cơ bản (4h đầu)',
    block_charge: 'Phí cộng thêm (lũy tiến)',
    surcharges: 'Phụ phí / Khấu trừ',
    est_total: 'Tổng thanh toán dự kiến',
    err_time: 'Thời gian ra phải sau thời gian vào ít nhất 1 phút.',
    err_duration: 'Thời gian gửi vượt quá giới hạn mô phỏng (tối đa 30 ngày).',
    rate_applied: 'Khung giờ áp dụng',
    rate_day: 'Ban ngày (Mức giá ngày)',
    rate_night: 'Ban đêm (Mức giá đêm)',
    rounding_note: 'Mức phí trên đã tự động áp dụng quy tắc làm tròn tiền mặt Việt Nam Đồng (VND).',
    deposit_deducted: 'Đã khấu trừ cọc giữ chỗ',
    day_max_applied: 'Đã áp dụng mức trần giá ngày',
    night_max_applied: 'Đã áp dụng mức trần giá đêm',
  },
  en: {
    title: 'Parking Fee Estimator',
    desc: 'Select your vehicle type and configure your scheduled duration to compute your exact parking cost based on our smart tariff.',
    vehicle_type: 'Vehicle Type',
    motorbike: 'Motorbike',
    car: 'Car',
    entry_time: 'Arrival Time',
    exit_time: 'Departure Time',
    options: 'Additional Options',
    is_booking: 'Pre-booked Online Spot',
    is_booking_desc: 'The 5,000 ₫ reservation deposit will be automatically credited to your final bill.',
    lost_card: 'Report Lost Parking Card',
    lost_card_desc: 'Standard penalty for card replacement: 50,000 ₫.',
    wrong_zone: 'Parked in incorrect zone (>10 mins)',
    wrong_zone_desc: 'Standard wrong-zone parking penalty: 100,000 ₫.',
    duration: 'Total Duration',
    base_charge: 'Base Fare (First 4h)',
    block_charge: 'Incremental Fee',
    surcharges: 'Surcharges / Deductions',
    est_total: 'Estimated Total Due',
    err_time: 'Departure time must be at least 1 minute after arrival time.',
    err_duration: 'Parking duration exceeds limit (maximum 30 days).',
    rate_applied: 'Applied Shift Rate',
    rate_day: 'Daytime Rate',
    rate_night: 'Nighttime Rate',
    rounding_note: 'Calculations automatically include Vietnamese Dong (VND) physical cash rounding rules.',
    deposit_deducted: 'Reservation deposit deducted',
    day_max_applied: 'Daytime price ceiling applied',
    night_max_applied: 'Nighttime price ceiling applied',
  }
};

export default function PricingCalculatorPage() {
  const locale = useLocale() as 'vi' | 'en';
  const c = dict[locale] || dict.vi;
  const t = useTranslations('pricing');

  // Helper to format ISO dates for local input values
  const getLocalDateTimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  // State initialization
  const [vehicleType, setVehicleType] = useState<VehicleType>(VEHICLE_TYPE.MOTORBIKE);
  
  // Set default entry to current hour, and exit to 6 hours later
  const [entryString, setEntryString] = useState('');
  const [exitString, setExitString] = useState('');
  
  const [isBooking, setIsBooking] = useState(false);
  const [hasLostCard, setHasLostCard] = useState(false);
  const [hasWrongZone, setHasWrongZone] = useState(false);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(Math.round(now.getMinutes() / 15) * 15, 0, 0); // Round to nearest 15 mins
    
    const defaultExit = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
    
    setEntryString(getLocalDateTimeString(now));
    setExitString(getLocalDateTimeString(defaultExit));
  }, []);

  // Compute fee dynamically
  const estimation = useMemo(() => {
    if (!entryString || !exitString) return null;
    const entryDate = new Date(entryString);
    const exitDate = new Date(exitString);
    
    const diffMs = exitDate.getTime() - entryDate.getTime();
    if (diffMs <= 0) {
      return { error: c.err_time };
    }
    
    // limit simulation to 30 days to avoid UI crashes
    if (diffMs > 30 * 24 * 60 * 60 * 1000) {
      return { error: c.err_duration };
    }

    const result = calculateParkingFee(entryDate, exitDate, vehicleType, {
      isBooking,
      hasLostCard,
      hasWrongZone,
    });

    const formattedDuration = formatDuration(entryDate, exitDate);

    // Detect if cap limit was reached for day/night standard rates
    // Motorbike Day: base 5k + extra. cap is 10k
    // Motorbike Night: base 5k + extra. cap is 20k
    // Car Day: base 30k + extra. cap is 100k
    // Car Night: base 30k + extra. cap is 120k
    let capAppliedText = '';
    const capValue = result.isNightRate 
      ? (vehicleType === 'MOTORBIKE' ? 20000 : 120000)
      : (vehicleType === 'MOTORBIKE' ? 10000 : 100000);

    // Sum base price + block price before limits are applied
    const preCapValue = result.basePrice + (result.additionalHours * result.blockPrice);
    if (preCapValue >= capValue) {
      capAppliedText = result.isNightRate ? c.night_max_applied : c.day_max_applied;
    }

    return {
      error: null,
      durationText: formattedDuration,
      isNightRate: result.isNightRate,
      basePrice: result.basePrice,
      blockPrice: result.blockPrice,
      additionalHours: result.additionalHours,
      surcharges: result.surcharges,
      totalAmount: result.totalAmount,
      capAppliedText,
    };
  }, [entryString, exitString, vehicleType, isBooking, hasLostCard, hasWrongZone, c]);

  if (!entryString || !exitString) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] flex items-center justify-center font-mono">
        {c.motorbike}...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <div className="container-main max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <Badge variant="default" className="mb-3 border border-[var(--color-accent)] bg-transparent text-[var(--color-accent)] font-semibold uppercase tracking-wider px-3.5 py-1">
              Calculator
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-ink)] mb-4 tracking-tight">
              {c.title}
            </h1>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {c.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── FORM ────────────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 md:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-[1.8rem]">
                <div className="space-y-6">
                  {/* Vehicle Type Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                      {c.vehicle_type}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVehicleType(VEHICLE_TYPE.MOTORBIKE)}
                        className={cn(
                          'py-3.5 px-5 text-sm font-semibold rounded-btn border transition-all duration-150',
                          vehicleType === VEHICLE_TYPE.MOTORBIKE
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-ink)] border-[var(--color-border)] hover:bg-[var(--color-border)]/50'
                        )}
                      >
                        {c.motorbike}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType(VEHICLE_TYPE.CAR)}
                        className={cn(
                          'py-3.5 px-5 text-sm font-semibold rounded-btn border transition-all duration-150',
                          vehicleType === VEHICLE_TYPE.CAR
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-ink)] border-[var(--color-border)] hover:bg-[var(--color-border)]/50'
                        )}
                      >
                        {c.car}
                      </button>
                    </div>
                  </div>

                  {/* Dates / Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                        {c.entry_time}
                      </label>
                      <input
                        type="datetime-local"
                        value={entryString}
                        onChange={(e) => setEntryString(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-btn px-4 py-3 text-sm font-medium focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                        {c.exit_time}
                      </label>
                      <input
                        type="datetime-local"
                        value={exitString}
                        onChange={(e) => setExitString(e.target.value)}
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-btn px-4 py-3 text-sm font-medium focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                      />
                    </div>
                  </div>

                  <hr className="border-[var(--color-border)]" />

                  {/* Extra options */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">
                      {c.options}
                    </label>

                    <div className="space-y-4">
                      {/* Online Booking Checkbox */}
                      <label className="flex items-start gap-3.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBooking}
                          onChange={(e) => setIsBooking(e.target.checked)}
                          className="mt-1 w-4.5 h-4.5 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] accent-[var(--color-accent)]"
                        />
                        <div>
                          <span className="text-sm font-semibold text-[var(--color-ink)] block">
                            {c.is_booking}
                          </span>
                          <span className="text-xs text-[var(--color-muted)] mt-0.5 block leading-relaxed">
                            {c.is_booking_desc}
                          </span>
                        </div>
                      </label>

                      {/* Lost Card Checkbox */}
                      <label className="flex items-start gap-3.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasLostCard}
                          onChange={(e) => setHasLostCard(e.target.checked)}
                          className="mt-1 w-4.5 h-4.5 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] accent-[var(--color-accent)]"
                        />
                        <div>
                          <span className="text-sm font-semibold text-[var(--color-ink)] block">
                            {c.lost_card}
                          </span>
                          <span className="text-xs text-[var(--color-muted)] mt-0.5 block leading-relaxed">
                            {c.lost_card_desc}
                          </span>
                        </div>
                      </label>

                      {/* Wrong Zone Checkbox */}
                      <label className="flex items-start gap-3.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasWrongZone}
                          onChange={(e) => setHasWrongZone(e.target.checked)}
                          className="mt-1 w-4.5 h-4.5 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] accent-[var(--color-accent)]"
                        />
                        <div>
                          <span className="text-sm font-semibold text-[var(--color-ink)] block">
                            {c.wrong_zone}
                          </span>
                          <span className="text-xs text-[var(--color-muted)] mt-0.5 block leading-relaxed">
                            {c.wrong_zone_desc}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── DETAILS PREVIEW ──────────────────────────────────── */}
            <div className="lg:col-span-5">
              <Card className="p-6 md:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-[1.8rem] relative overflow-hidden">
                {estimation?.error ? (
                  <div className="py-8 text-center text-[var(--color-muted)] font-mono text-sm leading-relaxed">
                    {estimation.error}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                        {c.duration}
                      </h3>
                      <div className="text-2xl font-bold text-[var(--color-ink)] font-sans tracking-tight">
                        {estimation?.durationText}
                      </div>
                    </div>

                    <div className="space-y-3.5 border-t border-[var(--color-border)] pt-5">
                      {/* Rate Type Badge */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-muted)]">{c.rate_applied}</span>
                        <Badge variant="default" className={cn(
                          'font-semibold border',
                          estimation?.isNightRate 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        )}>
                          {estimation?.isNightRate ? c.rate_night : c.rate_day}
                        </Badge>
                      </div>

                      {/* Base charge */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--color-muted)]">{c.base_charge}</span>
                        <span className="font-mono font-semibold text-[var(--color-ink)]">
                          <PriceTag amount={estimation?.basePrice || 0} size="sm" />
                        </span>
                      </div>

                      {/* Incremental blocks charge */}
                      {(estimation?.additionalHours || 0) > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[var(--color-muted)]">
                            {c.block_charge} (+{estimation?.additionalHours}h)
                          </span>
                          <span className="font-mono font-semibold text-[var(--color-ink)]">
                            <PriceTag amount={(estimation?.additionalHours || 0) * (estimation?.blockPrice || 0)} size="sm" />
                          </span>
                        </div>
                      )}

                      {/* Max cap note */}
                      {estimation?.capAppliedText && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 p-2.5 rounded-xl text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{estimation.capAppliedText}</span>
                        </div>
                      )}

                      {/* Surcharges list if any */}
                      {(estimation?.surcharges?.length || 0) > 0 && (
                        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
                          <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                            {c.surcharges}
                          </span>
                          {estimation?.surcharges?.map((sur, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className={cn(sur.amount < 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500')}>
                                {sur.amount < 0 ? c.deposit_deducted : sur.name}
                              </span>
                              <span className={cn('font-mono font-bold', sur.amount < 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500')}>
                                {sur.amount < 0 ? '-' : '+'}<PriceTag amount={Math.abs(sur.amount)} size="sm" />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total Estimated Price Card */}
                    <div className="border-t border-[var(--color-border)] pt-6 bg-slate-500/5 -mx-8 px-8 pb-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-bold text-[var(--color-ink)]">
                          {c.est_total}
                        </span>
                        <PriceTag amount={estimation?.totalAmount || 0} accent size="lg" />
                      </div>
                      <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                        * {c.rounding_note}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="primary"
                        className="w-full text-center py-3.5"
                        onClick={() => window.location.href = `/${locale}/booking`}
                      >
                        {dict[locale].is_booking.split(' (')[0]}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Sleek inline footer */}
      <footer className="bg-[#020617] text-slate-400 py-8 border-t border-slate-900 mt-auto">
        <div className="container-main text-center text-xs">
          <p className="mb-2">© 2026 NexPark. All rights reserved.</p>
          <p className="text-slate-600">Smart City Parking Solutions & Technologies</p>
        </div>
      </footer>
    </div>
  );
}
