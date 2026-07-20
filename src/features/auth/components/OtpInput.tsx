/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: OtpInput.tsx (COMPONENT NHẬP MÃ XÁC THỰC OTP 6 CHỮ SỐ)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Cung cấp giao diện 6 ô nhập mã OTP tách biệt cho tính năng Khôi phục mật khẩu / Xác thực Email.
 *
 * 🛠️ CÁC TÍNH NĂNG TƯƠNG TÁC THÔNG MINH:
 * 1. 🔀 Auto Focus Next Box: Nhập xong 1 chữ số tự động chuyển con trỏ sang ô tiếp theo.
 * 2. ⌫ Backspace Handling: Xoá chữ số hiện tại hoặc tự lùi về ô trước đó để xoá tiếp.
 * 3. 📋 Fast Paste: Dán trực tiếp chuỗi 6 chữ số từ Clipboard (Ví dụ: Copy từ Email "123456" rồi Paste).
 * 4. ⌨️ Keyboard Navigation: Hỗ trợ phím mũi tên Trái / Phải để di chuyển con trỏ qua lại giữa các ô.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import * as React from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  // Mảng tham chiếu Ref lưu các ô Input HTML
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  /**
   * Xử lý thay đổi giá trị nhập vào từng ô
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    // Ràng buộc chỉ nhận chữ số (0-9)
    if (!/^[0-9]?$/.test(val)) return;

    const valueArray = value.split('');
    valueArray[index] = val;
    const newValue = valueArray.join('');
    onChange(newValue);

    // Tự động focus sang ô kế tiếp nếu đã điền chữ số
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /**
   * Xử lý di chuyển phím điều hướng & phím xoá Backspace
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const valueArray = value.split('');
      if (!valueArray[index] && index > 0) {
        // Nếu ô hiện tại trống, xoá ô trước đó và focus lùi về
        valueArray[index - 1] = '';
        onChange(valueArray.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Xoá ký tự ô hiện tại
        valueArray[index] = '';
        onChange(valueArray.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /**
   * Xử lý dán chuỗi OTP (Paste from clipboard)
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // Đảm bảo đúng 6 chữ số

    onChange(pastedData);
    // Tự động focus ô cuối cùng
    inputsRef.current[5]?.focus();
  };

  // Đồng bộ độ dài mảng Ref
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
