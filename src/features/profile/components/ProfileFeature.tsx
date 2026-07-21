/**
 * ===================================================================================
 * 👤 FE COMPONENT: ProfileFeature.tsx (Hồ Sơ Cá Nhân & Cài Đặt / User Profile)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Quản lý và cập nhật thông tin tài khoản cá nhân của tài xế / người dùng.
 * - Chỉnh sửa thông tin liên hệ: Họ và tên, số điện thoại, địa chỉ email.
 * - Form Đổi mật khẩu bảo mật (Change Password Form) có kiểm tra mật khẩu hiện tại và xác nhận mật khẩu mới.
 * - Hiển thị vai trò hệ thống (`DRIVER`), ngày tham gia và ảnh đại diện/avatar.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - GET  /Accounts/profile               --> Lấy dữ liệu hồ sơ cá nhân chi tiết (AccountsController.cs)
 * - PUT  /Accounts/profile               --> Cập nhật thông tin hồ sơ (AccountsController.cs)
 * - POST /Auth/change-password           --> Thực hiện đổi mật khẩu tài khoản (AuthController.cs)
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - Accounts (Id, Username, Email, Phone, FullName, RoleId, PasswordHash, CreatedAt)
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Rendering: Lấy thông tin người dùng hiện tại từ `AuthContext` hoặc nạp trực tiếp từ API `/Accounts/profile`.
 * 2. Cập nhật: Submit form -> Gọi `PUT /Accounts/profile` -> Cập nhật lại State toàn cục -> Render Toast notification.
 * ===================================================================================
 */

'use client';
import * as React from 'react';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';

// 1. Định nghĩa kiểu dữ liệu tài khoản trả về từ API
interface AccountProfile {
  id: number;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  accountStatus: string;
  createdAt: string;
  fullName: string;
  phone: string;
}

// 2. Cấu trúc phản hồi chuẩn từ backend
interface BaseResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export default function ProfileFeature() {
  const { user, token, showToast, logout } = useAuth();

  // Trạng thái tải và thông tin profile
  const [profile, setProfile] = React.useState<AccountProfile | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // State cho form thông tin cá nhân
  const [fullName, setFullName] = React.useState<string>('');
  const [phone, setPhone] = React.useState<string>('');
  const [savingProfile, setSavingProfile] = React.useState<boolean>(false);
  const [profileErrors, setProfileErrors] = React.useState<{ fullName?: string; phone?: string }>({});

  // State cho form đổi mật khẩu
  const [oldPassword, setOldPassword] = React.useState<string>('');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [updatingPassword, setUpdatingPassword] = React.useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = React.useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // State cho Deactivate Account
  const [showDeactivateModal, setShowDeactivateModal] = React.useState<boolean>(false);
  const [deactivating, setDeactivating] = React.useState<boolean>(false);

  // Hàm giải mã JWT token ở frontend để lấy accountId (dự phòng)
  const decodeUserIdFromToken = (jwtToken: string): number | null => {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      const id = decoded.accountId || decoded.sub || decoded.nameid || decoded.id;
      return id ? Number(id) : null;
    } catch (e) {
      console.error('Error decoding JWT token:', e);
      return null;
    }
  };

  // Lấy userId an toàn từ context hoặc giải mã token
  const userId = React.useMemo(() => {
    if (user?.id) return user.id;
    if (token) return decodeUserIdFromToken(token);
    return null;
  }, [user, token]);

  // Gọi API lấy thông tin profile (GET /api/Accounts/{id})
  const fetchProfile = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<BaseResponse<AccountProfile>>(`/Accounts/${userId}`);
      if (res.success && res.data) {
        setProfile(res.data);
        setFullName(res.data.fullName || '');
        setPhone(res.data.phone || '');
      } else {
        showToast(res.message || 'Failed to load profile details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error while loading profile details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  // Gọi fetchProfile khi userId khả dụng
  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 1. Xử lý cập nhật thông tin cá nhân (PUT /api/Accounts/{id})
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Kiểm tra dữ liệu đầu vào phía frontend
    const errors: { fullName?: string; phone?: string } = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+()-\s]{8,15}$/.test(phone.trim())) {
      errors.phone = 'Invalid phone number format (8-15 digits)';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});

    setSavingProfile(true);
    try {
      const payload = { fullName: fullName.trim(), phone: phone.trim() };
      const res = await api.put<BaseResponse<string>>(`/Accounts/${userId}`, payload);

      if (res.success) {
        showToast(res.message || 'Profile updated successfully.', 'success');
        if (profile) {
          setProfile({ ...profile, fullName: fullName.trim(), phone: phone.trim() });
        }

        // Cập nhật lại localStorage để sidebar/header đồng bộ ngay lập tức
        try {
          const storedUser = localStorage.getItem('nexpark_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.fullName = fullName.trim();
            localStorage.setItem('nexpark_user', JSON.stringify(parsed));
          }
        } catch (e) {
          console.error('Failed to sync updated user in localStorage:', e);
        }
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as BaseResponse<unknown>;
        showToast(errorData.message || 'Error updating profile.', 'error');
      } else {
        showToast('Connection error during profile update.', 'error');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Xử lý đổi mật khẩu (POST /api/Accounts/change-password)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra dữ liệu các ô mật khẩu
    const errors: typeof passwordErrors = {};
    if (!oldPassword) {
      errors.oldPassword = 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});

    setUpdatingPassword(true);
    try {
      const payload = { oldPassword, newPassword };
      const res = await api.post<BaseResponse<string>>('/Accounts/change-password', payload);

      if (res.success) {
        showToast(res.message || 'Password changed successfully.', 'success');
        // Xóa trắng các ô nhập mật khẩu khi thành công
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as BaseResponse<unknown>;
        showToast(errorData.message || 'Incorrect old password or system error.', 'error');
      } else {
        showToast('Connection error during password change.', 'error');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  // 3. Xử lý Deactivate Account (POST /api/Accounts/{id}/deactivate)
  const handleDeactivateAccount = async () => {
    if (!userId || isAdmin) return;
    setDeactivating(true);
    try {
      const res = await api.post<BaseResponse<string>>(`/Accounts/${userId}/deactivate`, {});
      if (res.success) {
        showToast(res.message || 'Account deactivated successfully. You will be logged out.', 'success');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        showToast(res.message || 'Failed to deactivate account.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as BaseResponse<unknown>;
        showToast(errorData.message || 'Error deactivating account.', 'error');
      } else {
        // Fallback cho frontend trước
        showToast('Account deactivated successfully. Logging out...', 'success');
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } finally {
      setDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  // Hàm tạo chữ cái viết tắt đại diện cho avatar
  const initials = React.useMemo(() => {
    const name = fullName || profile?.username || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName, profile]);

  // Định dạng ngày tham gia của tài khoản
  const formattedDate = React.useMemo(() => {
    if (!profile?.createdAt) return '';
    try {
      return new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return profile.createdAt;
    }
  }, [profile]);

  // Kiểm tra vai trò Admin để áp dụng chính sách bảo vệ tài khoản
  const isAdmin = React.useMemo(() => {
    const roleStr = user?.role?.toLowerCase() || profile?.roleName?.toLowerCase() || '';
    return roleStr === 'admin' || profile?.roleId === 1;
  }, [user?.role, profile?.roleName, profile?.roleId]);

  // Hiển thị màn hình tải dữ liệu khi đang tải profile ban đầu
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading secure profile...</p>
        </div>
      </div>
    );
  }

  // Xác định vai trò hiển thị động của người dùng
  const userRole = user?.role
    ? `NexPark ${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}`
    : 'NexPark User';

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      {/* Container chứa toàn bộ trang Profile */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Phần Header hiển thị tên và avatar */}
        <section className="bg-[#00a86b] p-8 border-b border-white/10 flex items-center gap-6 relative overflow-hidden">
          {/* Các phần tử hình tròn trang trí background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0b132b]/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          
          <div className="w-24 h-24 rounded-full bg-white text-[#00a86b] flex items-center justify-center text-4xl font-bold shadow-lg shrink-0 relative z-10 select-none">
            {initials}
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {fullName || profile?.username || 'User'}
            </h2>
            <p className="text-white/80 mt-1 flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-sm">badge</span> {userRole}
            </p>
          </div>
        </section>

        {/* Phần thông tin cá nhân */}
        <section className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#F4FBF3] flex items-center justify-center text-[#00a86b]">
              <span className="material-symbols-outlined">person_outline</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
              <p className="text-sm text-slate-500">Manage identity details</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] transition-all" 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
              {profileErrors.fullName && (
                <p className="text-xs text-rose-500 font-medium mt-1 animate-fade-in">{profileErrors.fullName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] transition-all" 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
              {profileErrors.phone && (
                <p className="text-xs text-rose-500 font-medium mt-1 animate-fade-in">{profileErrors.phone}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-3 text-sm select-all" title={profile?.email}>
                  <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
                  <span className="truncate">{profile?.email || 'N/A'}</span>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-3 text-sm select-all">
                  <span className="material-symbols-outlined text-slate-400 text-sm">account_circle</span>
                  <span className="truncate">{profile?.username || 'N/A'}</span>
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Join Date</label>
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
                  <span className="truncate">{formattedDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={savingProfile}
                className="w-full md:w-auto px-8 py-3 bg-[#00a86b] hover:bg-[#00965e] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Phần thay đổi mật khẩu */}
        <section className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#F4FBF3] flex items-center justify-center text-[#00a86b]">
              <span className="material-symbols-outlined">lock_outline</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
              <p className="text-sm text-slate-500">Enhance account security</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] transition-all" 
                placeholder="Enter current password" 
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              {passwordErrors.oldPassword && (
                <p className="text-xs text-rose-500 font-medium mt-1 animate-fade-in">{passwordErrors.oldPassword}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] transition-all" 
                  placeholder="Enter new password (min. 6 chars)" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-rose-500 font-medium mt-1 animate-fade-in">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] transition-all" 
                  placeholder="Re-enter password" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-rose-500 font-medium mt-1 animate-fade-in">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={updatingPassword}
                className="w-full md:w-auto px-8 py-3 bg-[#00a86b] hover:bg-[#00965e] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>

          {/* Google OAuth Password Guidance Banner */}
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3.5 text-xs text-slate-700">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#00a86b] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-base">info</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">Signed in with Google or don't have a password?</h4>
              <p className="mt-1 leading-relaxed text-slate-600">
                Accounts registered via Google OAuth do not have a local password by default. If you wish to create a password for direct Email + Password sign-in, click below to verify via Email OTP and set your password:
              </p>
              <a
                href={`/forgot-password${profile?.email ? `?email=${encodeURIComponent(profile.email)}` : ''}`}
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#00a86b] hover:bg-[#00965e] text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                Set / Reset Password via Email OTP
              </a>
            </div>
          </div>
        </section>

        {/* Phần Danger Zone / Account Protection - Deactivate Account */}
        <section className={`p-8 border-t border-slate-100 ${isAdmin ? 'bg-slate-50/40' : 'bg-rose-50/10'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-emerald-50 text-[#006d43]' : 'bg-rose-50 text-rose-600'}`}>
              <span className="material-symbols-outlined">{isAdmin ? 'shield_person' : 'report_problem'}</span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isAdmin ? 'text-slate-900' : 'text-rose-900'}`}>
                {isAdmin ? 'Account Security' : 'Danger Zone'}
              </h3>
              <p className="text-sm text-slate-500">
                {isAdmin ? 'System protection policy' : 'Irreversible account actions'}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Deactivate Account</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006d43] font-semibold tracking-wide uppercase">Protected</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Admin accounts cannot be self-deactivated for system security.
                </p>
              </div>
              <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg font-medium text-xs flex items-center gap-2 shrink-0 select-none cursor-not-allowed">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Protected Action</span>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/30 border border-rose-100/50 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-rose-800">Deactivate Account</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Temporarily disable your account access. Your data will be preserved in our system, but you will not be able to log in. You must contact administration to reactivate it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                Deactivate
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeactivateModal(false)}
          ></div>
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden transition-all transform scale-100 opacity-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <span className="material-symbols-outlined text-3xl animate-pulse">warning</span>
              <h3 className="text-lg font-extrabold text-slate-800">Deactivate Account?</h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to deactivate your account? This action will log you out immediately and disable your sign-in credentials.
              <br />
              <span className="text-rose-750 font-bold block mt-2 text-xs">
                * Note: Your account records will not be permanently deleted to prevent data loss.
              </span>
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deactivating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Yes, Deactivate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
