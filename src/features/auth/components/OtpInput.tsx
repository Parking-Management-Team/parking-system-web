'use client';

import * as React from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    // Allow only single digits
    if (!/^[0-9]?$/.test(val)) return;

    const valueArray = value.split('');
    valueArray[index] = val;
    const newValue = valueArray.join('');
    onChange(newValue);

    // Auto-focus next input if a value was entered
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const valueArray = value.split('');
      if (!valueArray[index] && index > 0) {
        // If current box is empty, delete previous and focus it
        valueArray[index - 1] = '';
        onChange(valueArray.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Delete current value
        valueArray[index] = '';
        onChange(valueArray.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // Ensure it is exactly 6 digits

    onChange(pastedData);
    // Focus the last input box
    inputsRef.current[5]?.focus();
  };

  // Sync inputs array length
  React.useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, 6);
  }, []);

  return (
    <div className="flex justify-between gap-2 sm:gap-2.5 my-2">
      {Array.from({ length: 6 }).map((_, index) => {
        const val = value[index] || '';
        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={val}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`OTP Digit ${index + 1}`}
            className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 focus:outline-none transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        );
      })}
    </div>
  );
}
