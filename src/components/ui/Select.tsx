/**
 * Select Component - Dropdown chọn lựa tái sử dụng
 *
 * Component select với label, error message, placeholder, và custom arrow.
 * Sử dụng React.forwardRef để có thể ref từ bên ngoài.
 *
 * @param label - Nhãn hiển thị phía trên select
 * @param error - Thông báo lỗi
 * @param helperText - Text hướng dẫn
 * @param options - Danh sách lựa chọn [{ value, label, disabled }]
 * @param placeholder - Text mặc định khi chưa chọn
 *
 * @example
 * <Select
 *   label="Loại xe"
 *   options={[
 *     { value: 'MOTORBIKE', label: 'Xe máy' },
 *     { value: 'CAR', label: 'Xe hơi' },
 *   ]}
 *   placeholder="Chọn loại xe"
 * />
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, containerClassName, placeholder, id, disabled, required, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-gray-700 select-none flex items-center gap-0.5"
          >
            {label}
            {required && <span className="text-rose-500" title="Required">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              // Base styling with native arrow styled by browser or custom appearance
              'w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-3 text-base outline-none transition-all duration-200 cursor-pointer appearance-none',
              // Focus ring
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              // Disabled styling
              disabled && 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed select-none',
              // Error state
              error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected={props.defaultValue === undefined && props.value === undefined}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom SVG dropdown chevron */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <p className="text-xs text-rose-500 font-medium animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
