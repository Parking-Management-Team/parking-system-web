/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: ForgotPasswordForm.tsx (MÀN HÌNH QUÊN MẬT KHẨU & XÁC THỰC OTP KHI ĐĂNG NHẬP)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý toàn bộ quy trình 3 bước (Wizard Flow) khôi phục mật khẩu tài khoản khi bị quên
 * hoặc khi đăng nhập bằng Google / OAuth chưa có mật khẩu khởi tạo:
 *
 * 🛠️ QUY TRÌNH 3 BƯỚC (WIZARD FLOW):
 * 1. 📧 Bước 1 (Step 1): Nhập địa chỉ Email đăng ký -> Hệ thống gửi mã xác thực OTP 6 chữ số qua SMTP Email.
 * 2. 🔐 Bước 2 (Step 2): Nhập mã OTP 6 chữ số -> Hệ thống xác minh tính hợp lệ (có đếm ngược 60s cooldown resend).
 * 3. 🔑 Bước 3 (Step 3): Nhập mật khẩu mới & xác nhận -> Đổi mật khẩu thành công và điều hướng về trang Đăng nhập.
 *
 * 💡 TÍNH NĂNG ĐẮC TRƯNG:
 * - Tự động kích hoạt kiểm tra OTP ngay khi gõ đủ 6 chữ số.
 * - Hỗ trợ dùng độc lập (Trang /forgot-password) hoặc lồng trong Hộp thoại Modal khi Đăng nhập.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';
import { OtpInput } from './OtpInput';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { motion, AnimatePresence } from 'framer-motion';

export interface ForgotPasswordFormProps {
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function ForgotPasswordForm({ isModal = false, onSuccess, onClose }: ForgotPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword, showToast } = useAuth();

  // ─── State Wizard: 1 (Nhập Email) -> 2 (Nhập OTP) -> 3 (Đặt Mật khẩu mới) ───
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState('');

  // Tự động điền Email nếu có tham số trên URL (?email=...)
  React.useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const [otpCode, setOtpCode] = React.useState('');
  const [verificationToken, setVerificationToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Trạng thái lỗi và đang xử lý
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Hook đếm ngược thời gian đếm ngược gửi lại OTP (Cooldown 60s)
  const { cooldown, startCooldown, isCooldownActive } = useOtpCooldown(email);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/login');
    }
  };

  // ─── BƯỚC 1: Gửi Email để nhận mã OTP xác thực ───────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setErrors({ email: 'Email address is required' });
      return;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await sendPasswordResetOtp(email.trim());
      showToast('Verification OTP has been sent to your email.', 'success');
      startCooldown();
      setStep(2);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to send OTP code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ref lưu mã OTP đã từng thử xác thực để tránh lặp vô hạn khi sai OTP
  const lastAttemptedOtpRef = React.useRef<string>('');

  // ─── BƯỚC 2: Xác nhận mã OTP 6 chữ số ────────────────────────────────────
  const handleOtpVerify = React.useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (otpCode.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits of the OTP' });
      return;
    }

    lastAttemptedOtpRef.current = otpCode;
    setErrors({});
    setIsSubmitting(true);

    try {
      const token = await verifyPasswordResetOtp(email, otpCode);
      setVerificationToken(token);
      showToast('Email verified successfully! Set your new password.', 'success');
      setStep(3);
    } catch (err: any) {
      setErrors({ form: err.message || 'Invalid or expired OTP code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, otpCode, verifyPasswordResetOtp, email, showToast]);

  // Gửi lại mã OTP khi hết đếm ngược
  const handleResendOtp = async () => {
    if (isCooldownActive || isSubmitting) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      await sendPasswordResetOtp(email);
      showToast('A new OTP code has been sent to your email.', 'success');
      startCooldown();
      lastAttemptedOtpRef.current = '';
      setOtpCode('');
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP code.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── BƯỚC 3: Đặt mật khẩu mới ─────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await resetPassword(email, newPassword, verificationToken);
      showToast('Password reset successfully! Please sign in with your new password.', 'success');
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to reset password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tự động kiểm tra OTP duy nhất 1 lần khi người dùng nhập đủ 6 chữ số
  React.useEffect(() => {
    if (otpCode.length === 6 && step === 2 && otpCode !== lastAttemptedOtpRef.current && !isSubmitting) {
      const timer = setTimeout(() => {
        handleOtpVerify();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otpCode, step, handleOtpVerify, isSubmitting]);

  const stepVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
  };

  const formBody = (
    <div className="w-full flex flex-col justify-center py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        {/* LAYOUT STEP 1: NHẬP EMAIL */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006d43] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Forgot Password?
              </h1>
              <p className="text-sm text-slate-500 font-normal leading-relaxed">
                Enter your registered email address and we will send you a verification code to reset your password.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit} noValidate>
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium animate-fade-in">
                  {errors.form}
                </div>
              )}

              <Input
                label="Email Address"
                id="forgot-email"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                required
                className="rounded-xl py-3 text-sm"
              />

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* LAYOUT STEP 2: NHẬP MÃ OTP 6 CHỮ SỐ */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Email</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006d43] mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Verify OTP Code
              </h2>
              <p className="text-sm text-slate-500 font-normal leading-relaxed">
                We sent a 6-digit OTP verification code to <strong className="text-slate-800">{email}</strong>. Please enter it below.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleOtpVerify} noValidate>
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {errors.form}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verification Code</label>
                <OtpInput
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    if (val !== lastAttemptedOtpRef.current) {
                      lastAttemptedOtpRef.current = '';
                    }
                    if (errors.otp) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.otp;
                        return next;
                      });
                    }
                  }}
                  disabled={isSubmitting}
                />
                {errors.otp && (
                  <span className="text-xs text-red-500 font-medium">{errors.otp}</span>
                )}
              </div>

              <div className="text-center py-1">
                {isCooldownActive ? (
                  <p className="text-xs text-slate-500 font-medium">
                    Resend code in <span className="font-bold text-emerald-600">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors bg-transparent border-none cursor-pointer p-0 inline"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* LAYOUT STEP 3: ĐẶT MẬT KHẨU MỚI */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Reset Password
              </h2>
              <p className="text-sm text-slate-500 font-normal">
                Please create a strong new password for your account.
              </p>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{email}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Email Verified</p>
              </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit} noValidate>
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {errors.form}
                </div>
              )}

              <Input
                label="New Password"
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="•••••••• (min. 6 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.newPassword;
                      return next;
                    });
                  }
                }}
                error={errors.newPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto select-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
                className="rounded-xl py-3 text-sm pr-12"
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.confirmPassword;
                      return next;
                    });
                  }
                }}
                error={errors.confirmPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto select-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
                className="rounded-xl py-3 text-sm pr-12"
              />

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-none cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex bg-white overflow-hidden">
      {/* Banner bên trái NexPark Hero */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 relative bg-[#0f172a] h-screen overflow-hidden">
        <Image
          src="/assets/placeholders/nexpark_hero_parking_1780061652243.png"
          alt="NexPark Smart City"
          fill
          sizes="45vw"
          priority
          className="object-cover brightness-[0.4] scale-105"
        />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-emerald-700/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight font-heading">
              NexPark
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold leading-tight mb-5 font-heading">
              Account recovery,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="text-base text-white/60 leading-relaxed font-sans">
              Securely reset your credentials using email OTP verification and regain seamless access to your smart parking workspace.
            </p>
          </div>

          <div className="flex items-center gap-6 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono tracking-wider text-white/50 uppercase">System Active</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-mono text-white/40 uppercase">NexPark v2.0</span>
          </div>
        </div>
      </div>

      {/* Frame Form làm việc phía bên phải */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-16 overflow-y-auto bg-[#f9f9ff] h-screen relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-md flex flex-col">
          <div className="flex items-center gap-2.5 mb-10">
            <span className="text-xl font-extrabold tracking-tight text-[#0f172a] font-heading">
              NexPark
            </span>
          </div>
          {formBody}
        </div>
      </div>
    </div>
  );
}
