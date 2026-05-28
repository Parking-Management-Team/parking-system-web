'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BookingStatus as BookingStatusType } from '@/constants/parking.constants';
import { cn } from '@/lib/utils/cn';

interface BookingStatusProps {
  currentStatus: BookingStatusType;
  className?: string;
}

export function BookingStatus({ currentStatus, className }: BookingStatusProps) {
  const t = useTranslations('status');

  const steps: { key: BookingStatusType; title: string; desc: string }[] = [
    {
      key: 'PENDING',
      title: 'Đăng ký / Pending',
      desc: 'Yêu cầu đặt chỗ đang chờ xác nhận từ hệ thống.',
    },
    {
      key: 'CONFIRMED',
      title: 'Xác nhận / Confirmed',
      desc: 'Giữ chỗ thành công. Hãy đến bãi đỗ trước hạn 45 phút.',
    },
    {
      key: 'CHECKED_IN',
      title: 'Vào bãi / Checked In',
      desc: 'Xe đã vào bãi. Phiên gửi xe đang được ghi nhận.',
    },
  ];

  const getStepIndex = (status: BookingStatusType): number => {
    if (status === 'PENDING') return 0;
    if (status === 'CONFIRMED') return 1;
    if (status === 'CHECKED_IN') return 2;
    return -1;
  };

  const activeIndex = getStepIndex(currentStatus);
  const isTerminalState = currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED';

  return (
    <div className={cn('w-full py-4', className)}>
      {isTerminalState ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-bold text-sm uppercase tracking-wider">
              {currentStatus === 'CANCELLED' ? 'Đã hủy / Cancelled' : 'Đã quá hạn / Expired'}
            </h5>
            <p className="text-xs text-rose-500/80 mt-1 leading-normal">
              {currentStatus === 'CANCELLED'
                ? 'Booking này đã được hủy bởi khách hàng hoặc người điều hành.'
                : 'Phiếu giữ chỗ đã tự động hết hạn do không check-in đúng giờ hẹn.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute left-8 right-8 top-6 h-[2px] bg-[var(--color-border)] z-0" />
          {/* Connector Line Highlight (Desktop) */}
          {activeIndex > 0 && (
            <div
              className="hidden md:block absolute left-8 top-6 h-[2px] bg-[var(--color-accent)] z-0 transition-all duration-500"
              style={{ width: `${(activeIndex / (steps.length - 1)) * 90}%` }}
            />
          )}

          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isFuture = idx > activeIndex;

            return (
              <div
                key={step.key}
                className={cn(
                  'flex flex-row md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2 flex-1 z-10 relative',
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-50'
                )}
              >
                {/* Node circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300',
                    isCompleted
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : isActive
                      ? 'bg-[var(--color-surface-2)] border-[var(--color-accent)] text-[var(--color-accent)] ring-4 ring-emerald-500/10'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Text details */}
                <div className="flex flex-col md:items-center">
                  <h6
                    className={cn(
                      'text-sm font-bold',
                      isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                    )}
                  >
                    {step.title}
                  </h6>
                  <p className="text-xs text-[var(--color-muted)] max-w-[200px] mt-1 leading-normal md:text-center">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
