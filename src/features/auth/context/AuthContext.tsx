'use client';

import * as React from 'react';
import { api } from '@/lib/api/client';

export interface User {
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
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

interface AuthContextType {
  user: User | null;                          // Thông tin người dùng hiện tại (null nếu chưa đăng nhập)
  token: string | null;                        // JWT Token hiện tại (null nếu chưa đăng nhập)
  isAuthenticated: boolean;                   // Flag kiểm tra nhanh xem đã đăng nhập chưa
  isLoading: boolean;                         // Trạng thái đang tải (đang gọi API, đang hồi phục session...)
  login: (identifier: string, password: string) => Promise<User>; // Hàm đăng nhập thường
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>; // Hàm đăng ký
  loginWithGoogle: (idToken?: string) => Promise<User>; // Hàm đăng nhập Google
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

      // 2. Kiểm tra xem Backend trả về thành công không
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Login failed');
      }

      // 3. Chuẩn hóa dữ liệu user từ Backend về kiểu User hiển thị ở Frontend
      const systemUser: User = {
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
   * HÀM ĐĂNG KÝ TÀI KHOẢN (MOCK)
   * Hiện tại Backend chưa có API đăng ký, Frontend đang lưu giả lập trong localStorage
   */
  const register = React.useCallback(async (fullName: string, email: string, phone: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Giả lập độ trễ mạng 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Lưu tài khoản đăng ký tạm thời vào localStorage để phục vụ kiểm thử
      const registeredUsers = JSON.parse(localStorage.getItem('nexpark_registered_users') || '[]');
      registeredUsers.push({ fullName, email, phone, password });
      localStorage.setItem('nexpark_registered_users', JSON.stringify(registeredUsers));
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

      // 2. Kiểm tra xem Backend đăng nhập Google thành công không
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Google login failed');
      }

      // 3. Chuẩn hóa dữ liệu trả về từ Backend
      const systemUser: User = {
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
    register,
    loginWithGoogle,
    logout,
    showToast,
  }), [user, token, isLoading, login, register, loginWithGoogle, logout, showToast]);

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Sleek Floating Toast Container - Khu vực hiển thị danh sách các thông báo nổi */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slide-in flex items-center gap-3 overflow-hidden relative ${toast.type === 'success'
                ? 'bg-black/90 border-emerald-500/30 text-white'
                : toast.type === 'error'
                  ? 'bg-black/90 border-rose-500/30 text-white'
                  : 'bg-black/90 border-blue-500/30 text-white'
              }`}
          >
            {/* Vòng tròn trạng thái nhấp nháy */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping absolute opacity-75 ${toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-blue-400'
                }`} />
              <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                }`} />
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-grow space-y-0.5 select-none">
              <p className={`text-[10px] font-mono uppercase tracking-widest ${toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-rose-400' : 'text-blue-400'
                }`}>
                {toast.type === 'success' ? 'System Success' : toast.type === 'error' ? 'System Alert' : 'System Notice'}
              </p>
              <p className="text-sm font-semibold text-gray-200 leading-relaxed font-heading">
                {toast.message}
              </p>
            </div>

            {/* Thanh đếm ngược thời gian chạy dưới cùng của Toast */}
            <div className={`absolute bottom-0 left-0 h-1 animate-toast-progress w-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
              }`} />
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
