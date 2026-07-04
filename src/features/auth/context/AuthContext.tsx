'use client';

import * as React from 'react';
import { api } from '@/lib/api/client';

export interface User {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

interface LoginResponseDto {
  token: string;
  expiration: string;
  accountId: number;
  username: string;
  email: string;
  fullName: string;
  roleName: string;
}

interface BaseResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  code?: string;
  errorCode?: string;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface OtpResponse<T = null> {
  isSuccess: boolean;
  code: string;
  message: string;
  data: T;
}

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object') {
    if ('name' in error && (error as any).name === 'ApiError' && 'data' in error) {
      const body = (error as any).data;
      if (body && typeof body === 'object') {
        return body.message || body.Message || defaultMessage;
      }
    }
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface AuthContextType {
  user: User | null;                          // Thông tin người dùng hiện tại (null nếu chưa đăng nhập)
  token: string | null;                        // JWT Token hiện tại (null nếu chưa đăng nhập)
  isAuthenticated: boolean;                   // Flag kiểm tra nhanh xem đã đăng nhập chưa
  isLoading: boolean;                         // Trạng thái đang tải (đang gọi API, đang hồi phục session...)
  login: (identifier: string, password: string) => Promise<User>; // Hàm đăng nhập thường
  sendOtp: (email: string) => Promise<void>; // Hàm gửi mã OTP
  verifyOtp: (email: string, otp: string) => Promise<string>; // Hàm xác thực mã OTP
  register: (fullName: string, email: string, phone: string, password: string, verificationToken: string) => Promise<void>; // Hàm đăng ký bằng OTP
  loginWithGoogle: (idToken?: string) => Promise<User>; // Hàm đăng nhập Google
  verifyGoogleOtp: (idToken: string, otp: string) => Promise<User>; // Hàm xác thực mã OTP đăng ký Google
  verifyLoginOtp: (email: string, password: string, otp: string) => Promise<User>; // Hàm xác thực mã OTP đăng nhập thường
  logout: () => void;                         // Hàm đăng xuất
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void; // Hàm hiển thị thông báo nhanh
}

// Khởi tạo React Context
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

/**
 * Provider Component - Bọc quanh ứng dụng ở file layout gốc
 * Chứa logic quản lý State và thực hiện các cuộc gọi API.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State lưu thông tin User và JWT Token
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // State quản lý danh sách Toast thông báo nổi trên góc màn hình
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  /**
   * EFFECT: Khôi phục Session tự động (Hydration)
   * Chạy duy nhất 1 lần khi trang web vừa được tải xong trên trình duyệt.
   * Giúp người dùng không bị mất trạng thái đăng nhập khi bấm F5 reload trang.
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
      console.error('Failed to restore login session:', error);
      // Xóa dữ liệu lỗi nếu có lỗi parse JSON để tránh bị lỗi lặp lại ở lần sau
      localStorage.removeItem('nexpark_token');
      localStorage.removeItem('nexpark_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM ĐĂNG NHẬP THƯỜNG (EMAIL + PASSWORD)
   * Gọi POST request đến API `/auth/login` của Backend.
   */
  const login = React.useCallback(async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // 1. Gọi API đến Backend. baseUrl tự động gắn ở api client (ví dụ http://localhost:5029/api)
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/login', {
        email: identifier, // 'identifier' từ form đăng nhập đóng vai trò làm email gửi lên
        password: password
      });

      const isSuccess = res.success ?? res.isSuccess;
      const errorCode = res.errorCode ?? res.code;

      // 2. Kiểm tra xem Backend trả về thành công không
      if (!isSuccess || !res.data) {
        if (errorCode === 'REQUIRE_LOGIN_OTP_VERIFICATION') {
          const err = new Error(res.message || 'Login requires email verification.') as any;
          err.code = 'REQUIRE_LOGIN_OTP_VERIFICATION';
          err.email = res.data?.email;
          throw err;
        }
        throw new Error(res.message || 'Login failed');
      }

      // 3. Chuẩn hóa dữ liệu user từ Backend về kiểu User hiển thị ở Frontend
      const systemUser: User = {
        id: res.data.accountId, // Gán ID từ Api phản hồi
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      // 4. Lưu JWT Token và thông tin User vào localStorage để lưu trữ lâu dài
      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      // 5. Cập nhật State để các Component React vẽ lại giao diện đăng nhập thành công
      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM GỬI MÃ OTP VỀ EMAIL
   * Gọi POST request đến API `/auth/send-otp` của Backend.
   */
  const sendOtp = React.useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse>('/auth/send-otp', { email });
      if (!res.isSuccess) {
        throw new Error(res.message || 'Failed to send OTP code.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Failed to send OTP code.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM XÁC THỰC MÃ OTP
   * Gửi mã OTP lên để nhận về verification token tạm thời.
   */
  const verifyOtp = React.useCallback(async (email: string, otp: string): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await api.post<OtpResponse<string>>('/auth/verify-otp', { email, otp });
      if (!res.isSuccess || !res.data) {
        throw new Error(res.message || 'OTP verification failed.');
      }
      return res.data;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'OTP verification failed.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM ĐĂNG KÝ TÀI KHOẢN (VỚI TOKEN XÁC MINH OTP)
   * Gọi POST request đến API `/auth/register-verified` của Backend.
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
      if (!res.isSuccess) {
        throw new Error(res.message || 'Registration failed.');
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error, 'Registration failed.');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM ĐĂNG NHẬP GOOGLE
   * Nhận ID Token từ SDK Google ở Frontend -> Gửi lên API Backend `/auth/google`.
   */
  const loginWithGoogle = React.useCallback(async (idToken?: string): Promise<User> => {
    setIsLoading(true);
    try {
      let tokenToSend = idToken;

      // Hỗ trợ kiểm thử UI: Nếu click nút mà chưa cấu hình SDK Google lấy token thật,
      // hệ thống sẽ tự động dùng Token giả lập gửi lên Backend để bạn kiểm thử luồng API.
      if (!tokenToSend) {
        console.warn('Warning: Google ID Token not received. Automatically using mock token.');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        tokenToSend = "mock_google_id_token_from_frontend";
      }

      // 1. Gửi ID Token nhận từ Google lên API của bạn
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/google', {
        idToken: tokenToSend
      });

      const isSuccess = res.success ?? res.isSuccess;
      const errorCode = res.errorCode ?? res.code;

      // 2. Kiểm tra xem Backend đăng nhập Google thành công không
      if (!isSuccess || !res.data) {
        if (errorCode === 'REQUIRE_OTP_VERIFICATION') {
          const err = new Error(res.message || 'Google signup requires email verification.') as any;
          err.code = 'REQUIRE_OTP_VERIFICATION';
          err.email = res.data?.email;
          err.fullName = res.data?.fullName;
          throw err;
        }
        throw new Error(res.message || 'Google login failed');
      }

      // 3. Chuẩn hóa dữ liệu trả về từ Backend
      const systemUser: User = {
        id: res.data.accountId, // Gán ID từ Api phản hồi
        fullName: res.data.fullName || res.data.username,
        email: res.data.email || '',
        role: res.data.roleName ? res.data.roleName.toUpperCase() : '',
      };

      // 4. Lưu trữ vào localStorage
      localStorage.setItem('nexpark_token', res.data.token);
      localStorage.setItem('nexpark_user', JSON.stringify(systemUser));

      // 5. Cập nhật State
      setToken(res.data.token);
      setUser(systemUser);

      return systemUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM XÁC THỰC OTP GOOGLE VÀ ĐĂNG KÝ
   * Gửi Google ID Token và mã OTP lên API `/auth/google-verify-otp` để tạo tài khoản và đăng nhập.
   */
  const verifyGoogleOtp = React.useCallback(async (idToken: string, otp: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post<BaseResponse<LoginResponseDto>>('/auth/google-verify-otp', {
        idToken,
        otp
      });

      const isSuccess = res.success ?? res.isSuccess;

      if (!isSuccess || !res.data) {
        throw new Error(res.message || 'Google OTP verification failed');
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
      const errorMsg = extractErrorMessage(error, 'Google OTP verification failed');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM XÁC THỰC OTP ĐĂNG NHẬP THƯỜNG
   * Gửi Email, Password, và mã OTP lên API `/auth/login-verify-otp` để hoàn tất đăng nhập.
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
        throw new Error(res.message || 'OTP verification failed');
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
      const errorMsg = extractErrorMessage(error, 'OTP verification failed');
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * HÀM ĐĂNG XUẤT
   * Xóa sạch các thông tin đăng nhập ở cả Local Storage và State của ứng dụng.
   */
  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexpark_token');
    localStorage.removeItem('nexpark_user');
  }, []);

  /**
   * HÀM HIỂN THỊ TOAST THÔNG BÁO (SUCCESS / ERROR / INFO)
   * Tạo ra các thông báo nổi ở góc màn hình và tự biến mất sau 4 giây.
   */
  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Đóng gói tất cả các State và hàm vào 1 object duy nhất để truyền xuống các Component con
  const value = React.useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user, // Đã đăng nhập khi có cả token và thông tin user
    isLoading,
    login,
    sendOtp,
    verifyOtp,
    register,
    loginWithGoogle,
    verifyGoogleOtp,
    verifyLoginOtp,
    logout,
    showToast,
  }), [user, token, isLoading, login, sendOtp, verifyOtp, register, loginWithGoogle, verifyGoogleOtp, verifyLoginOtp, logout, showToast]);

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Sleek Floating Toast Container - Khu vực hiển thị danh sách các thông báo nổi */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
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
 * Dùng để gọi nhanh thông tin đăng nhập trong các Component con.
 * Tránh việc phải gọi React.useContext(AuthContext) thủ công ở mọi nơi.
 * 
 * @example
 * const { user, logout } = useAuth();
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
