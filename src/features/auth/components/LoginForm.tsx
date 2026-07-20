/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: LoginForm.tsx (MÀN HÌNH ĐĂNG NHẬP NGUYÊN HỆ THỐNG - LOGIN FORM)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Cung cấp giao diện Đăng nhập hệ thống cho người dùng (Driver, Staff, Manager, Admin)
 * hỗ trợ 2 phương thức chính:
 * 1. Đăng nhập qua Username / Email & Mật khẩu chuẩn backend NexPark.
 * 2. Đăng nhập nhanh qua Google OAuth (Tự động liên kết hoặc chuyển qua tạo tài khoản mới nếu chưa có).
 *
 * 🛠️ CHẾ ĐỘ HIỂN THỊ:
 * - Standalone Page Mode (isModal=false): Hiển thị đầy đủ giao diện trên trang /login riêng biệt.
 * - Modal / Drawer Mode (isModal=true): Hiển thị gọn gàng trong Drawer hoặc Popup Modal.
 * ═══════════════════════════════════════════════════════════════════════════════
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

  const { login, loginWithGoogle, showToast } = useAuth();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  /**
   * Xử lý Đăng nhập bằng Email/Username & Mật khẩu
   */
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
      await login(identifier, password);
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Invalid username or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Xử lý kết quả trả về từ Google OAuth Sign-in Popup
   */
  const handleGoogleCredentialResponse = React.useCallback(async (response: GoogleCredentialResponse) => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle(response.credential);
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err && (err.code === 'REQUIRE_OTP_VERIFICATION' || String(err.message).includes('REQUIRE_OTP_VERIFICATION'))) {
        // Lưu token tạm vào sessionStorage để đăng ký tiếp ở RegisterForm
        sessionStorage.setItem('nexpark_google_signup', JSON.stringify({
          idToken: response.credential,
          email: err.email,
          fullName: err.fullName
        }));
        
        showToast('Google account not registered yet. Transitioning to verification...', 'info');
        
        if (isModal && onSwitchMode) {
          onSwitchMode();
        } else {
          router.push('/register');
        }
      } else {
        const errMsg = err instanceof Error ? err.message : 'Failed to sign in with Google';
        setErrors({ form: errMsg });
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, isModal, onSuccess, onSwitchMode, router, showToast]);

  /**
   * Tự động khởi tạo nút đăng nhập Google Sign In khi trang load xong
   */
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
            width: 384,
            text: 'signin_with',
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
  }, [handleGoogleCredentialResponse]);

  const googleLoadingOverlay = googleLoading && (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm mx-4 text-center border border-slate-100">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
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

  const formPanel = (
    <div className="w-full max-w-md flex flex-col">
      <div className="flex items-center gap-2.5 mb-10">
        <span className="text-xl font-extrabold tracking-tight text-[#0f172a] font-heading">
          NexPark
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-2 font-heading">
          Welcome back
        </h1>
        <p className="text-sm text-[#64748b] font-normal font-sans">
          Please enter your details to sign in to NexPark.
        </p>
      </div>

      {/* Nút Đăng nhập bằng Google */}
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

      {/* Đường phân cách */}
      <div className="flex items-center my-6 gap-3">
        <div className="flex-1 h-px bg-[#e2e8f0]" />
        <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest px-1"
          style={{ fontFamily: "'Inter', sans-serif" }}>or</span>
        <div className="flex-1 h-px bg-[#e2e8f0]" />
      </div>

      {/* Form nhập tài khoản mật khẩu */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {errors.form && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            {errors.form}
          </div>
        )}

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

  /* ── THỜI ĐIỂM HIỂN THỊ TRONG MODAL / DRAWER ── */
  if (isModal) {
    return (
      <div className="w-full h-full flex flex-col bg-[#f9f9ff] overflow-y-auto">
        {googleLoadingOverlay}
        <div className="flex flex-1 min-h-full">
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

  /* ── CHẾ ĐỘ HIỂN THỊ TRANG ĐỘC LẬP (/login) ── */
  return (
    <div className="w-full min-h-screen flex bg-white overflow-hidden">
      {googleLoadingOverlay}
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
