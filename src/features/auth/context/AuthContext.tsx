/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: AuthContext.tsx - TRUNG TÂM QUẢN LÝ XÁC THỰC VÀ XÁC THỰC NGƯỜI DÙNG (AUTH CONTEXT)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý tập trung toàn bộ trạng thái (State) và luồng xử lý (Flow) liên quan đến Xác thực tài khoản:
 * 1. 🔑 Luồng Đăng nhập (Login Flow): Thường (Email/Password) & Đăng nhập Google (OAuth 2.0).
 * 2. 🚪 Luồng Đăng xuất (Logout Flow): Xóa Token, Clear Cache & Reset State.
 * 3. 🔄 Luồng Phục hồi phiên làm việc (Session Hydration): Giữ trạng thái khi F5 reload trang.
 * 4. 🔑 Luồng Đổi / Đặt lại mật khẩu (Forgot & Reset Password Flow): Quy trình 3 bước OTP.
 * 5. 🛡️ Luồng Bảo vệ tuyến đường (ProtectedRoute Integration).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import * as React from 'react';
import { api } from '@/lib/api/client';

/** Kiểu dữ liệu Thông tin người dùng hiển thị trên Frontend */
export interface User {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

/** Dữ liệu nhận về từ API Backend khi Đăng nhập thành công */
interface LoginResponseDto {
  token: string;
  expiration: string;
  accountId: number;
  username: string;
  email: string;
  fullName: string;
  roleName: string;
}

/** Cấu trúc Phản hồi API chuẩn */
interface BaseResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  code?: string;
  errorCode?: string;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Cấu trúc Phản hồi API OTP */
interface OtpResponse<T = null> {
  success?: boolean;
  isSuccess?: boolean;
  code?: string;
  message?: string;
  data?: T;
}

/**
 * Hàm hỗ trợ trích xuất thông báo lỗi từ Phản hồi API của Backend
 */
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object') {
    if ('name' in error && (error as any).name === 'ApiError' && 'data' in error) {
      const body = (error as any).data;
      if (body && typeof body === 'object') {
        if (typeof body.message === 'string' && body.message.trim()) return body.message;
        if (typeof body.Message === 'string' && body.Message.trim()) return body.Message;
        if (typeof body.title === 'string' && body.title.trim()) return body.title;
        if (body.errors && typeof body.errors === 'object') {
          const firstErrKey = Object.keys(body.errors)[0];
          if (firstErrKey && Array.isArray(body.errors[firstErrKey]) && body.errors[firstErrKey][0]) {
            return body.errors[firstErrKey][0];
          }
        }
      }
    }
    if ('message' in error && typeof (error as any).message === 'string') {
      const msg = (error as any).message;
      if (msg && !msg.startsWith('API error')) {
        return msg;
      }
    }
  }
  if (error instanceof Error && !error.message.startsWith('API error')) {
    return error.message;
  }
  return defaultMessage;
};

/** Giao diện public của AuthContext */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<string>;
  register: (fullName: string, email: string, phone: string, password: string, verificationToken: string) => Promise<void>;
  loginWithGoogle: (idToken?: string) => Promise<User>;
  verifyGoogleOtp: (idToken: string, otp: string) => Promise<User>;
  verifyLoginOtp: (email: string, password: string, otp: string) => Promise<User>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<string>;
  resetPassword: (email: string, newPassword: string, verificationToken: string) => Promise<void>;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

/**
 * Provider Component - Bọc quanh ứng dụng ở Root Layout
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // State quản lý danh sách Toast thông báo nổi trên màn hình
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  /**
   * 🔄 LUỒNG PHỤC HỒI PHIÊN LÀM VIỆC (SESSION HYDRATION FLOW)
   * 
   * Bước 1: Trình duyệt hoàn tất tải trang (Mounting).
   * Bước 2: Đọc `nexpark_token` và `nexpark_user` từ localStorage.
   * Bước 3: Nếu tồn tại token & thông tin user -> Nạp vào React State `token` & `user`.
   * Bước 4: Đặt `isLoading = false` để hiển thị UI. Nếu lỗi parse -> Xóa sạch localStorage.
   */
  React.useEffect(() => {
    try {
      const storedToken = localStorage.getItem('nexpark_token');
      const storedUser = localStorage.getItem('nexpark_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Lỗi khi khôi phục phiên đăng nhập:', error);
      localStorage.removeItem('nexpark_token');
      localStorage.removeItem('nexpark_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔑 LUỒNG ĐĂNG NHẬP THƯỜNG (EMAIL + PASSWORD LOGIN FLOW)
   *
   * Bước 1: Người dùng nhập Email + Mật khẩu ở LoginForm.
   * Bước 2: Gọi `login(identifier, password)` -> Gửi POST `/auth/login`.
   * Bước 3: Backend kiểm tra thông tin -> Trả về JWT Token + Thông tin Tài khoản (Role, ID, FullName).
   * Bước 4: Lưu `nexpark_token` và `nexpark_user` vào `localStorage`.
   * Bước 5: Cập nhật State `token` & `user` -> Đăng nhập thành công.
   */
  const login = React.useCallback(async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/login', {
        email: identifier,
        password: password
      });

      const isSuccess = res.success ?? res.isSuccess;

      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Đăng nhập thất bại.');
      }

      const systemUser: User = {
        id: res.data.accountId,
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } catch (error: any) {
      const errorMsg = extractErrorMessage(error, 'Đăng nhập thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 📧 LUỒNG GỬI MÃ OTP ĐĂNG KÝ / XÁC THỰC EMAIL
   */
  const sendOtp = React.useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse>('/auth/send-otp', { email });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess) {
        throw new Error(res.message || 'Không thể gửi mã OTP.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Không thể gửi mã OTP.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔐 LUỒNG XÁC THỰC MÃ OTP
   */
  const verifyOtp = React.useCallback(async (email: string, otp: string): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse<string>>('/auth/verify-otp', { email, otp });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Xác thực OTP thất bại.');
      }
      return res.data;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Xác thực OTP thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 📝 LUỒNG ĐĂNG KÝ TÀI KHOẢN MỚI
   */
  const register = React.useCallback(async (
    fullName: string,
    email: string,
    phone: string,
    password: string,
    verificationToken: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse>('/auth/register-verified', {
        fullName,
        email,
        phone,
        password,
        verificationToken
      });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess) {
        throw new Error(res.message || 'Đăng ký tài khoản thất bại.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Đăng ký tài khoản thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🌐 LUỒNG ĐĂNG NHẬP BẰNG GOOGLE (GOOGLE OAUTH 2.0 FLOW)
   *
   * Bước 1: Google SDK đăng nhập lấy `idToken` từ Google.
   * Bước 2: Gọi `loginWithGoogle(idToken)` -> Gửi POST `/auth/google`.
   * Bước 3A (Tài khoản đã tồn tại): Backend xác thực token -> Trả về JWT Token -> Lưu Session.
   * Bước 3B (Lần đầu đăng nhập bằng Google): Backend yêu cầu xác thực OTP qua Email (code: REQUIRE_OTP_VERIFICATION).
   * Bước 4: Chuyển sang giao diện nhập OTP xác nhận email chính chủ.
   */
  const loginWithGoogle = React.useCallback(async (idToken?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const tokenToSend = idToken;

      if (!tokenToSend) {
        throw new Error('Chưa nhận được Google ID Token.');
      }

      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/google', {
        idToken: tokenToSend
      });

      const resCode = res?.errorCode ?? res?.code ?? (res?.data as any)?.code ?? (res?.data as any)?.errorCode;
      if (resCode === 'REQUIRE_OTP_VERIFICATION') {
        const email = (res?.data as any)?.email ?? (res as any)?.email;
        const fullName = (res?.data as any)?.fullName ?? (res as any)?.fullName;
        const err = new Error(res.message || 'Đăng nhập Google yêu cầu xác thực OTP email.') as any;
        err.code = 'REQUIRE_OTP_VERIFICATION';
        err.email = email;
        err.fullName = fullName;
        throw err;
      }

      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Đăng nhập Google thất bại.');
      }

      const systemUser: User = {
        id: res.data.accountId,
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } catch (error: any) {
      if (error?.code === 'REQUIRE_OTP_VERIFICATION') {
        throw error;
      }

      const body = error?.data || error?.response?.data || {};
      const errorCode = body?.errorCode ?? body?.code ?? body?.ErrorCode ?? body?.Code ?? error?.code;
      const errorMsgText = String(body?.message || error?.message || '');

      if (errorCode === 'REQUIRE_OTP_VERIFICATION' || errorMsgText.includes('REQUIRE_OTP_VERIFICATION')) {
        const email = body?.data?.email ?? body?.data?.Email ?? body?.email ?? body?.Email;
        const fullName = body?.data?.fullName ?? body?.data?.FullName ?? body?.fullName ?? body?.FullName;
        const err = new Error(body?.message || 'Đăng nhập Google yêu cầu xác thực OTP email.') as any;
        err.code = 'REQUIRE_OTP_VERIFICATION';
        err.email = email;
        err.fullName = fullName;
        throw err;
      }

      const errorMsg = extractErrorMessage(error, 'Đăng nhập Google thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🌐 LUỒNG XÁC THỰC OTP GOOGLE VÀ KHỞI TẠO TÀI KHOẢN
   */
  const verifyGoogleOtp = React.useCallback(async (idToken: string, otp: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/google-verify-otp', {
        idToken,
        otp
      });

      const isSuccess = res.success ?? res.isSuccess ?? true;

      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Xác thực OTP Google thất bại.');
      }

      const systemUser: User = {
        id: res.data.accountId,
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Xác thực OTP Google thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔐 LUỒNG XÁC THỰC OTP ĐĂNG NHẬP THƯỜNG
   */
  const verifyLoginOtp = React.useCallback(async (email: string, password: string, otp: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/login-verify-otp', {
        email,
        password,
        otp
      });

      const isSuccess = res.success ?? res.isSuccess;

      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Xác thực OTP đăng nhập thất bại.');
      }

      const systemUser: User = {
        id: res.data.accountId,
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Xác thực OTP đăng nhập thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔑 LUỒNG KHÔI PHỤC MẬT KHẨU / ĐỔI MẬT KHẨU (FORGOT & RESET PASSWORD 3-STEP WIZARD)
   *
   * 📧 BƯỚC 1: Gửi mã OTP khôi phục mật khẩu về Email.
   * Gửi POST `/auth/password-recovery/request` -> Backend tạo OTP và gửi qua Email SMTP.
   */
  const sendPasswordResetOtp = React.useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse>('/auth/password-recovery/request', { email });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess) {
        throw new Error(res.message || 'Không thể gửi mã OTP khôi phục mật khẩu.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Không thể gửi mã OTP khôi phục mật khẩu.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔑 BƯỚC 2: Xác thực mã OTP 6 chữ số khôi phục mật khẩu.
   * Gửi POST `/auth/password-recovery/verify` -> Nhận `verificationToken` tạm thời.
   */
  const verifyPasswordResetOtp = React.useCallback(async (email: string, otp: string): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse<string>>('/auth/password-recovery/verify', { email, otp });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Xác thực OTP khôi phục mật khẩu thất bại.');
      }
      return res.data;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Xác thực OTP khôi phục mật khẩu thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔑 BƯỚC 3: Đặt mật khẩu mới.
   * Gửi POST `/auth/password-recovery/reset` cùng `verificationToken` và Mật khẩu mới.
   * Backend thay đổi mật khẩu tài khoản thành công -> Người dùng điều hướng về đăng nhập với mật khẩu mới.
   */
  const resetPassword = React.useCallback(async (
    email: string,
    newPassword: string,
    verificationToken: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse>('/auth/password-recovery/reset', {
        email,
        newPassword,
        verificationToken
      });
      const isSuccess = res.success ?? res.isSuccess ?? true;
      if (!isSuccess) {
        throw new Error(res.message || 'Đặt lại mật khẩu thất bại.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Đặt lại mật khẩu thất bại.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🚪 LUỒNG ĐĂNG XUẤT (LOGOUT FLOW)
   *
   * Bước 1: Người dùng nhấn nút "Đăng xuất" / Logout ở Header / Sidebar.
   * Bước 2: Đặt State `user = null` và `token = null`.
   * Bước 3: Xóa dữ liệu lưu trữ `nexpark_token` và `nexpark_user` khỏi `localStorage`.
   * Bước 4: Ứng dụng tự động chuyển hướng về `/login` hoặc trang công khai.
   */
  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexpark_token');
    localStorage.removeItem('nexpark_user');
  }, []);

  /**
   * 🔔 HÀM HIỂN THỊ TOAST THÔNG BÁO NỔI GÓC MÀN HÌNH
   */
  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      const updated = [...prev, { id, message, type }];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = React.useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    sendOtp,
    verifyOtp,
    register,
    loginWithGoogle,
    verifyGoogleOtp,
    verifyLoginOtp,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword,
    logout,
    showToast,
  }), [user, token, isLoading, login, sendOtp, verifyOtp, register, loginWithGoogle, verifyGoogleOtp, verifyLoginOtp, sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword, logout, showToast]);

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[100000] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-[#006d43] text-white shadow-[#006d43]/20' 
                : toast.type === 'error'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-[#111c2d] text-white shadow-[#111c2d]/20'
            }`}
          >
            <span className="material-symbols-outlined text-lg shrink-0">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <div className="flex-grow">
              <span className="text-sm font-semibold leading-relaxed">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

/**
 * Custom Hook: useAuth
 * Sử dụng để truy cập trạng thái đăng nhập ở mọi Component
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
