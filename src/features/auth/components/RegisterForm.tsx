'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';

export interface RegisterFormProps {
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchMode?: () => void;
}

export function RegisterForm({ isModal = false, onSuccess, onClose, onSwitchMode }: RegisterFormProps) {
  const router = useRouter();
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };
  const { register, loginWithGoogle, showToast } = useAuth();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
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
      await register(fullName, email, phone, password);
      showToast('Registration successful! Please log in.', 'success');
      if (isModal && onSwitchMode) {
        onSwitchMode();
      } else {
        router.push('/login');
      }
    } catch (err) {
      setErrors({ form: 'An error occurred during registration. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('Welcome to NexPark! Account created successfully.', 'success');
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (err) {
      setErrors({ form: 'Failed to sign up with Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const formBody = (
    <div className="w-full flex flex-col justify-center py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-4 space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Create Account
        </h2>
        <p className="text-xs text-gray-500 font-normal">
          Join NexPark to manage your parking experience.
        </p>
      </div>

      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#e2e8f0] rounded-xl bg-white hover:bg-[#f8fafc] text-[#0f172a] font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:border-[#cbd5e1] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <div className="w-5 h-5 border-2 border-[#cbd5e1] border-t-[#64748b] rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.07c-.22-.66-.35-1.36-.35-2.07s.13-1.41.35-2.07V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.86z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.86C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
          </svg>
        )}
        <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
      </button>

      {/* Divider */}
      <div className="flex items-center my-3.5 gap-3">
        <div className="flex-grow h-px bg-[#e2e8f0]" />
        <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest px-1">or continue with email</span>
        <div className="flex-grow h-px bg-[#e2e8f0]" />
      </div>

      {/* Form */}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-fade-in">
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
              placeholder="+1 (555) 000-0000"
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

          {/* Email */}
          <div className="sm:col-span-2">
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

        {/* Submit */}
        <button
          type="submit"
          className="w-full mt-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/25 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer text-sm"
          disabled={isSubmitting || googleLoading}
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

      {/* Footer Links */}
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
    </div>
  );

  if (isModal) {
    return (
      <div className="w-full h-full flex flex-col bg-[#f9f9ff] overflow-y-auto">
        <div className="flex flex-1 min-h-full">
          {/* Left panel – brand */}
          <div className="hidden lg:flex w-[45%] flex-shrink-0 relative bg-[#0f172a] overflow-hidden">
            <img
              src="/assets/placeholders/nexpark_hero_parking_1780061652243.png"
              alt="NexPark Smart City"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-105"
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
              className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 rounded-full transition-all duration-200 z-50"
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
      {/* Left Panel - Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 relative bg-[#0f172a] h-screen overflow-hidden">
        <img
          src="/assets/placeholders/nexpark_hero_parking_1780061652243.png"
          alt="NexPark Smart City"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-105"
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
