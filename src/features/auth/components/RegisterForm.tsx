/**
 * ===================================================================================
 * 📝 FE COMPONENT: RegisterForm.tsx (Form Đăng Ký Tài Khoản / Driver Registration)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Đăng ký tài khoản tài xế (Driver Account) mới vào hệ thống.
 * - Luồng 3 bước: (1) Nhập Email -> (2) Xác nhận mã OTP 6 số -> (3) Điền thông tin Họ tên, SĐT, Mật khẩu.
 * - Validation thời gian thực: Kiểm tra định dạng Email, độ mạnh mật khẩu và khớp mật khẩu nhập lại.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - POST /Auth/send-otp     --> Gửi mã OTP xác nhận tới Email tài xế (AuthController.cs)
 * - POST /Auth/verify-otp   --> Xác minh mã OTP 6 số (AuthController.cs)
 * - POST /Auth/register     --> Khởi tạo tài khoản Driver mới (AuthController.cs)
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - Accounts (Id, Username, Email, Phone, FullName, PasswordHash, RoleId = 4 (DRIVER))
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Bước 1 & 2: Nhập email -> Gọi `/Auth/send-otp` -> Chuyển UI sang ô nhập OTP 6 số -> Gọi `/Auth/verify-otp`.
 * 2. Bước 3: Điền tên, sđt, password -> Gọi `POST /Auth/register` -> Tạo Account thành công -> Chuyển sang form Đăng nhập.
 * ===================================================================================
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';
import { OtpInput } from './OtpInput';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
  };
}

interface CustomWindow extends Window {
  google?: {
    accounts?: GoogleAccounts;
  };
}

export interface RegisterFormProps {
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchMode?: () => void;
}

export function RegisterForm({ isModal = false, onSuccess, onClose, onSwitchMode }: RegisterFormProps) {
  const router = useRouter();
  const { register, sendOtp, verifyOtp, loginWithGoogle, verifyGoogleOtp, showToast } = useAuth();

  // Wizard state
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [verificationToken, setVerificationToken] = React.useState('');

  // Google registration wizard state
  const [isGoogleFlow, setIsGoogleFlow] = React.useState(false);
  const [googleIdToken, setGoogleIdToken] = React.useState('');

  // Password visibility
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Status states
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // Cooldown hook
  const { cooldown, startCooldown, isCooldownActive } = useOtpCooldown(email);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };

  // STEP 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setErrors({ email: 'Email address is required' });
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await sendOtp(email);
      showToast('Verification code has been sent to your email.', 'success');
      startCooldown();
      setStep(2);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP
  const handleOtpVerify = React.useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (otpCode.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits of the OTP' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isGoogleFlow) {
        // Đăng ký và đăng nhập Google
        await verifyGoogleOtp(googleIdToken, otpCode);
        showToast('Welcome to NexPark! Account created successfully.', 'success');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push('/');
        }
      } else {
        // Đăng ký thường qua Token
        const token = await verifyOtp(email, otpCode);
        setVerificationToken(token);
        showToast('Email verified successfully!', 'success');
        setStep(3);
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Invalid or expired OTP. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, otpCode, isGoogleFlow, verifyGoogleOtp, googleIdToken, showToast, isModal, onSuccess, router, verifyOtp, email]);

  const handleResendOtp = async () => {
    if (isCooldownActive || isSubmitting) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isGoogleFlow) {
        // Với Google flow, gọi lại loginWithGoogle(googleIdToken) để resend OTP
        await loginWithGoogle(googleIdToken);
      } else {
        await sendOtp(email);
      }
      showToast('A new OTP has been sent to your email.', 'success');
      startCooldown();
      setOtpCode('');
    } catch (err: any) {
      // Vì backend sẽ ném exception REQUIRE_OTP_VERIFICATION, ta bắt lỗi đó để hiểu là thành công gửi OTP mới
      if (err.code === 'REQUIRE_OTP_VERIFICATION') {
        showToast('A new OTP has been sent to your email.', 'success');
        startCooldown();
        setOtpCode('');
      } else {
        showToast(err.message || 'Failed to resend OTP.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Complete registration details
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register(fullName, email, phone, password, verificationToken);
      showToast('Registration successful! Please log in.', 'success');
      if (isModal && onSwitchMode) {
        onSwitchMode();
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback khi Google Sign Up thành công
  const handleGoogleCredentialResponse = React.useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle(response.credential);
      showToast('Welcome to NexPark! Login successful.', 'success');
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err?.code === 'REQUIRE_OTP_VERIFICATION' || String(err?.message).includes('REQUIRE_OTP_VERIFICATION')) {
        setIsGoogleFlow(true);
        setGoogleIdToken(response.credential);
        if (err.email) setEmail(err.email);
        if (err.fullName) setFullName(err.fullName);
        setStep(2);
        startCooldown();
        showToast('Google registration requires verification. OTP sent to your email.', 'info');
      } else {
        setErrors({ form: err.message || 'Failed to sign up with Google' });
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, isModal, onSuccess, router, startCooldown, showToast]);


  // Khởi tạo Google Button trên RegisterForm
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initGoogleBtn = () => {
      const customWindow = window as unknown as CustomWindow;
      const google = customWindow.google;
      if (google && google.accounts && google.accounts.id && step === 1) {
        google.accounts.id.initialize({
          client_id: '768808098768-vop4tnm5u22h8stb6464bqtogse2rqvm.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });

        const btnElement = document.getElementById('google-signup-btn');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: 384,
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            locale: 'en',
          });
        }
      }
    };

    const customWindow = window as unknown as CustomWindow;
    if (customWindow.google) {
      initGoogleBtn();
    } else {
      intervalId = setInterval(() => {
        const checkWindow = window as unknown as CustomWindow;
        if (checkWindow.google) {
          initGoogleBtn();
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [handleGoogleCredentialResponse, step]);

  // Check Google signup state từ Login page chuyển qua
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem('nexpark_google_signup');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.idToken) {
          setIsGoogleFlow(true);
          setGoogleIdToken(data.idToken);
          if (data.email) setEmail(data.email);
          if (data.fullName) setFullName(data.fullName);
          setStep(2);
          startCooldown();
          showToast('Google registration requires verification. OTP sent to your email.', 'info');
        }
        sessionStorage.removeItem('nexpark_google_signup');
      }
    } catch (e) {
      console.error('Error loading Google signup state', e);
    }
  }, [startCooldown, showToast]);

  // Trigger verification automatically when 6th digit is typed
  React.useEffect(() => {
    if (otpCode.length === 6 && step === 2) {
      const timer = setTimeout(() => {
        handleOtpVerify();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otpCode, step, handleOtpVerify]);

  const googleLoadingOverlay = googleLoading && (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm mx-4 text-center border border-slate-100 animate-scale-in">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.07c-.22-.66-.35-1.36-.35-2.07s.13-1.41.35-2.07V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.86z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.86C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Google Authentication
        </h3>
        <p className="text-sm text-slate-500 font-sans">
          Verifying your credentials. Please wait...
        </p>
      </div>
    </div>
  );

  const stepVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
  };

  const formBody = (
    <div className="w-full flex flex-col justify-center py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Create Account
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                Join NexPark to manage your parking experience.
              </p>
            </div>

            {/* Google Sign Up */}
            <div className="w-full flex flex-col items-center py-0.5 gap-2">
              <div id="google-signup-btn" className="w-full flex justify-center" />
            </div>

            {/* Divider */}
            <div className="flex items-center my-2.5 gap-3">
              <div className="flex-grow h-px bg-[#e2e8f0]" />
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest px-1">or continue with email</span>
              <div className="flex-grow h-px bg-[#e2e8f0]" />
            </div>

            {/* Form Step 1 */}
            <form className="flex flex-col gap-3" onSubmit={handleEmailSubmit} noValidate>
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium animate-fade-in">
                  {errors.form}
                </div>
              )}

              <Input
                label="Email"
                id="email"
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
                className="rounded-xl py-2.5 text-sm"
              />

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/25 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer text-sm"
                disabled={isSubmitting || googleLoading}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Header */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none p-0 cursor-pointer mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Email</span>
              </button>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Verify Email
              </h2>
              <p className="text-xs text-gray-500 font-normal leading-relaxed">
                We sent a 6-digit OTP code to <strong className="text-slate-800">{email}</strong>. Please enter it below.
              </p>
            </div>

            {/* Form Step 2 */}
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

              {/* Cooldown Timer */}
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
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/25 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Complete Profile
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                Set up your profile details to finish signing up.
              </p>
            </div>

            {/* Email Confirmed Indicator */}
            <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{email}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Email Verified</p>
              </div>
            </div>

            {/* Form Step 3 */}
            <form className="flex flex-col gap-3" onSubmit={handleDetailsSubmit} noValidate>
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {errors.form}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {/* Full Name */}
                <div className="sm:col-span-1">
                  <Input
                    label="Full Name"
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.fullName;
                          return next;
                        });
                      }
                    }}
                    error={errors.fullName}
                    leftIcon={<UserIcon className="w-5 h-5 text-gray-400" />}
                    required
                    className="rounded-xl py-2.5 text-sm"
                  />
                </div>

                {/* Phone Number */}
                <div className="sm:col-span-1">
                  <Input
                    label="Phone Number"
                    id="phone"
                    type="tel"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.phone;
                          return next;
                        });
                      }
                    }}
                    error={errors.phone}
                    leftIcon={<Phone className="w-5 h-5 text-gray-400" />}
                    required
                    className="rounded-xl py-2.5 text-sm"
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-1">
                  <Input
                    label="Password"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.password;
                          return next;
                        });
                      }
                    }}
                    error={errors.password}
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
                    className="rounded-xl py-2.5 text-sm pr-12"
                  />
                </div>

                {/* Confirm Password */}
                <div className="sm:col-span-1">
                  <Input
                    label="Confirm Password"
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
                    className="rounded-xl py-2.5 text-sm pr-12"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/25 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Links (Only visible in step 1) */}
      {step === 1 && (
        <div className="mt-4 text-center select-none">
          <p className="text-xs text-gray-500 font-normal">
            Already have an account?{' '}
            {isModal && onSwitchMode ? (
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-emerald-600 font-bold hover:underline hover:text-emerald-700 transition-colors ml-1 cursor-pointer bg-transparent border-none p-0 inline text-xs"
              >
                Log in
              </button>
            ) : (
              <Link
                href="/login"
                className="text-emerald-600 font-bold hover:underline hover:text-emerald-700 transition-colors ml-1"
              >
                Log in
              </Link>
            )}
          </p>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="w-full h-full flex flex-col bg-[#f9f9ff] overflow-y-auto animate-fade-in">
        {googleLoadingOverlay}
        <div className="flex flex-1 min-h-full">
          {/* Left panel – brand */}
          <div className="hidden lg:flex w-[45%] flex-shrink-0 relative bg-[#0f172a] overflow-hidden">
            <Image
              src="/assets/placeholders/nexpark_hero_parking_1780061652243.png"
              alt="NexPark Smart City"
              fill
              sizes="45vw"
              priority
              className="object-cover brightness-[0.4] scale-105"
            />
            <div className="absolute top-1/3 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-emerald-700/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg font-extrabold tracking-tight font-heading">
                  NexPark
                </span>
              </div>

              <div className="max-w-xs">
                <h2 className="text-4xl font-extrabold leading-tight mb-4 font-heading">
                  Zero friction,{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    infinite space.
                  </span>
                </h2>
                <p className="text-sm text-white/60 leading-relaxed font-sans">
                  Experience a new standard of high-fidelity parking management. Create an account to access real-time bookings, automated allocations, and instant monthly passes.
                </p>
              </div>

              <div className="flex items-center gap-4 border-t border-white/10 pt-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono tracking-wider text-white/50 uppercase">System Active</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <span className="text-xs font-mono text-white/40 uppercase">NexPark v2.0</span>
              </div>
            </div>
          </div>

          {/* Right panel – form */}
          <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 bg-white relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50 animate-fade-in"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-md mx-auto">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="font-heading text-xl font-bold tracking-tight text-gray-900">NexPark</span>
              </div>
              {formBody}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex bg-white font-sans overflow-hidden">
      {googleLoadingOverlay}
      {/* Left Panel - Brand Showcase (Hidden on Mobile) */}
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
          <div className="flex items-center gap-3 select-none">
            <span className="font-heading text-2xl font-bold tracking-tight text-white">NexPark</span>
          </div>

          <div className="max-w-md mb-8 space-y-6">
            <h1 className="text-5xl font-extrabold font-heading tracking-tight leading-[1.1] text-white">
              Create an <br />
              <span className="bg-gradient-to-r from-emerald-400 to-[#00a86b] bg-clip-text text-transparent">
                account.
              </span>
            </h1>
            <p className="text-lg text-gray-300 font-light leading-relaxed font-sans">
              &quot;Streamlining our smart-parking logistics operations with unprecedented clarity and geometric efficiency.&quot;
            </p>
          </div>

          <div className="flex items-center gap-6 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono tracking-wider text-gray-400 uppercase">System Active</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-xs font-mono text-gray-400 uppercase">NexPark v2.0</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Full-width on Mobile) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-16 overflow-y-auto bg-[#f9f9ff] h-screen relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full max-w-md mx-auto">
          {formBody}
        </div>
      </div>
    </div>
  );
}
