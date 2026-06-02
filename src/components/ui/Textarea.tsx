/**
 * Textarea Component - Ô nhập liệu nhiều dòng
 *
 * Component textarea với label, error message, helper text.
 * Có thể kéo giãn (resize-y) theo chiều dọc.
 *
 * @param label - Nhãn hiển thị phía trên
 * @param error - Thông báo lỗi
 * @param helperText - Text hướng dẫn
 *
 * @example
 * <Textarea label="Tin nhắn" placeholder="Nhập tin nhắn..." rows={4} />
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, containerClassName, id, disabled, required, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold text-gray-700 select-none flex items-center gap-0.5"
          >
            {label}
            {required && <span className="text-rose-500" title="Required">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <textarea
            id={textareaId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              // Base styling
              'w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-3 text-base outline-none transition-all duration-200 resize-y min-h-[100px]',
              // Focus ring
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              // Disabled styling
              disabled && 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed select-none',
              // Error state
              error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
              className
            )}
            {...props}
          />
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

Textarea.displayName = 'Textarea';

export { Textarea };
