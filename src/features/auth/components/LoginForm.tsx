/**
 * LoginForm Component - Form đăng nhập
 *
 * Component form đăng nhập với 2 chế độ hiển thị:
 * 1. Modal mode (isModal=true): Hiển thị trong AuthDrawer (split layout)
 * 2. Standalone mode (isModal=false): Hiển thị trên trang /login riêng
 *
 * Tính năng:
 * - Đăng nhập bằng username hoặc email
 * - Đăng nhập bằng Google (mock)
 * - Show/hide password
 * - Validation (kiểm tra dữ liệu trước khi submit)
 * - Responsive: ẩn brand panel trên mobile
 *
 * @param isModal - Có phải đang hiển thị trong drawer/modal không
 * @param onSuccess - Callback khi đăng nhập thành công (modal mode)
 * @param onClose - Callback đóng form
 * @param onSwitchMode - Callback chuyển sang register
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Mail, Lock, X } from 'lucide-react';
import { useAuth } from '@/features/auth';

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

export interface LoginFormProps {
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchMode?: () => void;
}

export function LoginForm({ isModal = false, onSuccess, onClose, onSwitchMode }: LoginFormProps) {
  const router = useRouter();
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };
  const { login, loginWithGoogle } = useAuth();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!identifier.trim()) newErrors.identifier = 'Username or email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(identifier, password);
      // Chuyển hướng người dùng dựa trên vai trò (role)
      if (loggedInUser.role === 'MANAGER') {
        router.push('/dashboard/manager/facilities');
        if (isModal && onSuccess) {
          onSuccess();
        }
      } else {
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push('/');
        }
      }
    } catch {
      setErrors({ form: 'Invalid username or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback xử lý kết quả trả về từ popup Google Đăng nhập thành công
  const handleGoogleCredentialResponse = React.useCallback(async (response: GoogleCredentialResponse) => {
    setGoogleLoading(true);
    setErrors({});
    try {
      // Gửi token nhận được từ Google lên Context để login qua Backend
      const loggedInUser = await loginWithGoogle(response.credential);
      // Chuyển hướng người dùng dựa trên vai trò (role) sau khi đăng nhập Google
      if (loggedInUser.role === 'MANAGER') {
        router.push('/dashboard/manager/facilities');
        if (isModal && onSuccess) {
          onSuccess();
        }
      } else {
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push('/');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setErrors({ form: errMsg });
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, isModal, onSuccess, router]);

  // Khởi tạo Google Sign In Button
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initGoogleBtn = () => {
      const customWindow = window as unknown as CustomWindow;
      const google = customWindow.google;
      if (google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: '768808098768-vop4tnm5u22h8stb6464bqtogse2rqvm.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });

        const btnElement = document.getElementById('google-signin-btn');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: 384, // Phù hợp với kích thước của Form Panel
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      }
    };

    // Kiểm tra định kỳ xem SDK Google đã load xong chưa
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
  }, [handleGoogleCredentialResponse]);

  const formPanel = (
    <div className="w-full max-w-md flex flex-col">
      {/* NexPark Brand Title (Text only, no logo) */}
      <div className="flex items-center gap-2.5 mb-10">
        <span className="text-xl font-extrabold tracking-tight text-[#0f172a] font-heading">
          NexPark
        </span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-2 font-heading">
          Welcome back
        </h1>
        <p className="text-sm text-[#64748b] font-normal font-sans">
          Please enter your details to sign in to NexPark.
        </p>
      </div>

      {/* Google Sign In Button Container */}
      <div className="w-full flex justify-center min-h-[44px]">
        {googleLoading ? (
          <div className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#e2e8f0] rounded-xl bg-[#f8fafc] text-[#64748b] font-medium text-sm">
            <div className="w-5 h-5 border-2 border-[#cbd5e1] border-t-[#64748b] rounded-full animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          <div id="google-signin-btn" className="w-full flex justify-center" />
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center my-6 gap-3">
        <div className="flex-1 h-px bg-[#e2e8f0]" />
        <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest px-1"
          style={{ fontFamily: "'Inter', sans-serif" }}>or</span>
        <div className="flex-1 h-px bg-[#e2e8f0]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {errors.form && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            {errors.form}
          </div>
        )}

        {/* Username / Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-identifier"
            className="text-sm font-semibold text-[#0f172a]"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            Username or Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              placeholder="jane@company.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors(prev => { const n = { ...prev }; delete n.identifier; return n; });
              }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#0f172a] placeholder:text-[#94a3b8] bg-white transition-all duration-200 outline-none
                focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                ${errors.identifier ? 'border-red-400 bg-red-50/30' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-red-500 font-medium mt-0.5">{errors.identifier}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password"
              className="text-sm font-semibold text-[#0f172a]"
              style={{ fontFamily: "'Inter', sans-serif" }}>
              Password
            </label>
            <Link href="/forgot-password"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}>
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => { const n = { ...prev }; delete n.password; return n; });
              }}
              className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm text-[#0f172a] placeholder:text-[#94a3b8] bg-white transition-all duration-200 outline-none
                focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 font-medium mt-0.5">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="w-full mt-1 py-3.5 rounded-xl font-bold text-sm text-white
            bg-gradient-to-r from-[#059669] to-[#10b981]
            hover:from-[#047857] hover:to-[#059669]
            shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40
            active:scale-[0.98] transition-all duration-200
            flex items-center justify-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-7 text-center">
        <p className="text-sm text-[#64748b]" style={{ fontFamily: "'Inter', sans-serif" }}>
          Don&apos;t have an account?{' '}
          {isModal && onSwitchMode ? (
            <button
              type="button"
              onClick={onSwitchMode}
              className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors ml-1 bg-transparent border-none p-0 cursor-pointer text-sm"
            >
              Register
            </button>
          ) : (
            <Link href="/register"
              className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors ml-1">
              Register
            </Link>
          )}
        </p>
      </div>
    </div>
  );

  /* ── MODAL MODE ── */
  if (isModal) {
    return (
      <div className="w-full h-full flex flex-col bg-[#f9f9ff] overflow-y-auto">
        {/* Split layout inside drawer */}
        <div className="flex flex-1 min-h-full">
          {/* Left panel – brand */}
          <div className="hidden lg:flex w-[45%] flex-shrink-0 relative bg-[#0f172a] overflow-hidden">
            {/* Background city image */}
            <Image
              src="/assets/placeholders/nexpark_hero_parking_1780061652243.png"
              alt="NexPark Smart City"
              fill
              sizes="45vw"
              priority
              className="object-cover brightness-[0.4] scale-105"
            />
            {/* Emerald ambient */}
            <div className="absolute top-1/3 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-emerald-700/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Brand content */}
            <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg font-extrabold tracking-tight font-heading">
                  NexPark
                </span>
              </div>

              <div className="max-w-xs">
                <h2 className="text-4xl font-extrabold leading-tight mb-4 font-heading">
                  Intelligent flow,{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    secured.
                  </span>
                </h2>
                <p className="text-sm text-white/60 leading-relaxed font-sans">
                  Manage high-stakes parking logistics with a premium utility designed for enterprise administration and daily drivers alike.
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
          <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-white relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            {formPanel}
          </div>
        </div>
      </div>
    );
  }

  /* ── STANDALONE PAGE MODE ── */
  return (
    <div className="w-full min-h-screen flex bg-white overflow-hidden">
      {/* Left – Brand Panel */}
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
              Intelligent flow,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                secured.
              </span>
            </h1>
            <p className="text-base text-white/60 leading-relaxed font-sans">
              Manage high-stakes parking logistics with a premium utility designed for enterprise administration and daily drivers alike.
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

      {/* Right – Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-16 overflow-y-auto bg-[#f9f9ff] h-screen relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
        {formPanel}
      </div>
    </div>
  );
}
