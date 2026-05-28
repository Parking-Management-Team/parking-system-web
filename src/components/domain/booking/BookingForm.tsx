'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BookingInput } from '@/lib/types/booking.types';
import { VEHICLE_TYPE, VehicleType, SURCHARGE } from '@/constants/parking.constants';
import { formatVND } from '@/lib/utils/format';
import { Button } from '@/components/ui';

interface BookingFormProps {
  onSubmit: (data: BookingInput) => void;
  isLoading?: boolean;
  className?: string;
}

const BUILDINGS = [
  { id: 'b1', name: 'NexPark Center (Quận 1)' },
  { id: 'b2', name: 'Tòa nhà FPT (Quận 9)' },
  { id: 'b3', name: 'Văn phòng Sông Đà (Tân Bình)' },
  { id: 'b4', name: 'E-Town Complex (Tân Bình)' },
];

export function BookingForm({ onSubmit, isLoading, className }: BookingFormProps) {
  const t = useTranslations('pricing');
  const tHero = useTranslations('hero');
  const tCommon = useTranslations('common');

  const [plateNumber, setPlateNumber] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState<VehicleType>('CAR');
  const [buildingId, setBuildingId] = React.useState(BUILDINGS[0].id);
  const [checkInTime, setCheckInTime] = React.useState('');
  const [error, setError] = React.useState('');

  // Set default check-in time to +1 hour from now formatted for datetime-local
  React.useEffect(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCheckInTime(localIso);
  }, []);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPlateNumber(raw);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber.trim()) {
      setError(tCommon('error') + ': Biển số không được trống');
      return;
    }

    // Basic plate validation (e.g. 59A-12345, 59-A1-234.56, 59A12345)
    const plateClean = plateNumber.replace(/-/g, '');
    if (plateClean.length < 5 || plateClean.length > 10) {
      setError(tCommon('error') + ': Biển số không hợp lệ');
      return;
    }

    onSubmit({
      plateNumber: plateNumber.trim(),
      vehicleType,
      buildingId,
      checkInTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Vehicle Type Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--color-ink)]">
            Loại xe / Vehicle Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setVehicleType('CAR')}
              className={[
                'py-3.5 px-4 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none',
                vehicleType === 'CAR'
                  ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]',
              ].join(' ')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10h1m-14 0H4m14 4h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2m-10 6h-2a1 1 0 01-1-1v-4a1 1 0 011-1h2m12 12a3 3 0 100-6 3 3 0 000 6zm-10 0a3 3 0 100-6 3 3 0 000 6zm3-13H7M4 10h16M5 10v4m14-4v4" />
              </svg>
              {t('vehicle_car')}
            </button>
            <button
              type="button"
              onClick={() => setVehicleType('MOTORBIKE')}
              className={[
                'py-3.5 px-4 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none',
                vehicleType === 'MOTORBIKE'
                  ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]',
              ].join(' ')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 100-2 1 1 0 000 2zm7 3a1 1 0 100-2 1 1 0 000 2zm-7-3V7a1 1 0 011-1h4m-7 13h10M4 10h16M5 10v4m14-4v4" />
              </svg>
              {t('vehicle_motorbike')}
            </button>
          </div>
        </div>

        {/* Plate Number */}
        <div className="space-y-2">
          <label htmlFor="plateNumber" className="text-sm font-semibold text-[var(--color-ink)]">
            Biển số xe / License Plate
          </label>
          <input
            id="plateNumber"
            type="text"
            placeholder="E.g. 51A-12345"
            value={plateNumber}
            onChange={handlePlateChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] font-mono font-bold text-lg focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] transition-all uppercase"
          />
          <p className="text-xs text-[var(--color-muted)] font-medium">
            Nhập liền không dấu hoặc có gạch nối (Ví dụ: 59T1-99999 hoặc 30A-88888)
          </p>
        </div>

        {/* Building Select */}
        <div className="space-y-2">
          <label htmlFor="buildingId" className="text-sm font-semibold text-[var(--color-ink)]">
            Chọn tòa nhà / Select Building
          </label>
          <select
            id="buildingId"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
          >
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Check-In Time */}
        <div className="space-y-2">
          <label htmlFor="checkInTime" className="text-sm font-semibold text-[var(--color-ink)]">
            Thời gian đến dự kiến / Scheduled Check-in
          </label>
          <input
            id="checkInTime"
            type="datetime-local"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
          />
        </div>

        {/* Pricing Notice */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-[var(--color-muted)]">{t('booking_deposit')}</span>
            <span className="text-[var(--color-accent)] font-mono">{formatVND(SURCHARGE.BOOKING_DEPOSIT)}</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] leading-normal">
            * Phí giữ chỗ này sẽ được **khấu trừ trực tiếp** vào tổng tiền gửi xe thực tế khi check-out. Nếu quá 45 phút kể từ giờ hẹn mà xe chưa vào bãi, booking sẽ tự động hủy và không hoàn phí.
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          {tHero('cta_primary')}
        </Button>
      </div>
    </form>
  );
}
