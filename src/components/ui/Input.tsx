'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-gray-700 select-none flex items-center gap-0.5"
          >
            {label}
            {required && <span className="text-rose-500" title="Required">*</span>}
          </label>
        )}

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-gray-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              // Base styling
              'w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-3 text-base outline-none transition-all duration-200',
              // Focus ring
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              // Dynamic padding for icons
              hasLeftIcon && 'pl-11',
              hasRightIcon && 'pr-11',
              // Disabled styling
              disabled && 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed select-none',
              // Error state
              error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 text-gray-400 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export { Input };
