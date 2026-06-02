/**
 * AuthContext - Context quản lý xác thực (authentication)
 *
 * Cung cấp thông tin đăng nhập cho toàn bộ ứng dụng thông qua React Context.
 *
 * Chức năng chính:
 * 1. Lưu thông tin user (fullName, email, phone, role)
 * 2. Lưu JWT token vào localStorage (key: nexpark_token)
 * 3. Login bằng username/email + password (hiện tại mock, khi có backend sẽ gọi API)
 * 4. Đăng ký tài khoản mới (hiện tại mock)
 * 5. Đăng nhập bằng Google (hiện tại mock)
 * 6. Logout (xóa cả token + user khỏi localStorage)
 * 7. Toast notification (thông báo nổi)
 * 8. Khôi phục session từ localStorage khi reload (hydrate token + user)
 *
 * Cách dùng:
 * const { user, isAuthenticated, login, logout } = useAuth()
 *
 * Khi có backend API thật:
 * - Thay mock login bằng: const res = await api.post('/auth/login', { identifier, password })
 * - API trả về: { accessToken: string, user: User }
 * - Lưu token: localStorage.setItem('nexpark_token', res.accessToken)
 */

'use client';

import * as React from 'react';

/** Kiểu dữ liệu User */
export interface User {
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

/** Kiểu dữ liệu cho AuthContext */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  // Khôi phục session từ localStorage khi app mount
  // Nếu có token + user trong localStorage → tự động đăng nhập lại
  React.useEffect(() => {
    try {
      const storedToken = localStorage.getItem('nexpark_token');
      const storedUser = localStorage.getItem('nexpark_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      // Xóa dữ liệu lỗi để lần sau không bị nữa
      localStorage.removeItem('nexpark_token');
      localStorage.removeItem('nexpark_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = React.useCallback(async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // ─── MOCK: Khi có backend, thay đoạn này bằng API call ───
      // const res = await api.post<{ accessToken: string; user: User }>('/auth/login', { identifier, password });
      // localStorage.setItem('nexpark_token', res.accessToken);
      // localStorage.setItem('nexpark_user', JSON.stringify(res.user));
      // setToken(res.accessToken);
      // setUser(res.user);
      // return res.user;
      // ─── END MOCK ───

      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock: tạo token giả lập
      const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Mock user generation
      const mockUser: User = {
        fullName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        email: identifier.includes('@') ? identifier : `${identifier}@nexpark.com`,
        role: 'user',
      };

      // Lưu cả token + user vào localStorage
      localStorage.setItem('nexpark_token', mockToken);
      localStorage.setItem('nexpark_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      return mockUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = React.useCallback(async (fullName: string, email: string, phone: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store a mock registration record in localStorage for future validation
      const registeredUsers = JSON.parse(localStorage.getItem('nexpark_registered_users') || '[]');
      registeredUsers.push({ fullName, email, phone, password });
      localStorage.setItem('nexpark_registered_users', JSON.stringify(registeredUsers));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = React.useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      // Simulate account validation and loading state progression
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const mockToken = `mock_google_jwt_${Date.now()}`;
      const mockGoogleUser: User = {
        fullName: 'NexPark Driver',
        email: 'driver@nexpark.com',
        role: 'user',
      };

      localStorage.setItem('nexpark_token', mockToken);
      localStorage.setItem('nexpark_user', JSON.stringify(mockGoogleUser));
      setToken(mockToken);
      setUser(mockGoogleUser);
      return mockGoogleUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexpark_token');
    localStorage.removeItem('nexpark_user');
  }, []);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
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
    register,
    loginWithGoogle,
    logout,
    showToast,
  }), [user, token, isLoading, login, register, loginWithGoogle, logout, showToast]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Sleek Floating Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slide-in flex items-center gap-3 overflow-hidden relative ${
              toast.type === 'success'
                ? 'bg-black/90 border-emerald-500/30 text-white'
                : toast.type === 'error'
                ? 'bg-black/90 border-rose-500/30 text-white'
                : 'bg-black/90 border-blue-500/30 text-white'
            }`}
          >
            {/* Status Indicator Circle */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping absolute opacity-75 ${
                toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-blue-400'
              }`} />
              <span className={`w-2 h-2 rounded-full ${
                toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
              }`} />
            </div>
            
            <div className="flex-grow space-y-0.5 select-none">
              <p className={`text-[10px] font-mono uppercase tracking-widest ${
                toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-rose-400' : 'text-blue-400'
              }`}>
                {toast.type === 'success' ? 'System Success' : toast.type === 'error' ? 'System Alert' : 'System Notice'}
              </p>
              <p className="text-sm font-semibold text-gray-200 leading-relaxed font-heading">
                {toast.message}
              </p>
            </div>

            {/* Micro Timer Bar */}
            <div className={`absolute bottom-0 left-0 h-1 animate-toast-progress w-full ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
            }`} />
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
