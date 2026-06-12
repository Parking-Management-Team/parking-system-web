'use client';
import * as React from 'react';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Key, User as UserIcon, Lock, Save, Mail, Calendar } from 'lucide-react';
// 1. Define account data type returned from the API
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

// 2. Standard base response shape from the backend
interface BaseResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export default function ProfileFeature() {
  const { user, token, showToast } = useAuth();

  // Loading and profile state
  const [profile, setProfile] = React.useState<AccountProfile | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Profile Information form state
  const [fullName, setFullName] = React.useState<string>('');
  const [phone, setPhone] = React.useState<string>('');
  const [savingProfile, setSavingProfile] = React.useState<boolean>(false);
  const [profileErrors, setProfileErrors] = React.useState<{ fullName?: string; phone?: string }>({});

  // Change Password form state
  const [oldPassword, setOldPassword] = React.useState<string>('');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [updatingPassword, setUpdatingPassword] = React.useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = React.useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Helper function to decode JWT token on the frontend as a fallback
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

  // Safe user ID memoized resolver
  const userId = React.useMemo(() => {
    if (user?.id) return user.id;
    if (token) return decodeUserIdFromToken(token);
    return null;
  }, [user, token]);

  // Fetch account profile from GET /api/accounts/{id}
  const fetchProfile = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<BaseResponse<AccountProfile>>(`/api/accounts/${userId}`);
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

  // Trigger initial fetch when user ID becomes available
  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  // 1. Handle personal information updates (PUT /api/accounts/{id})
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Frontend validation
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
      const res = await api.put<BaseResponse<string>>(`/api/accounts/${userId}`, payload);

      if (res.success) {
        showToast(res.message || 'Profile updated successfully.', 'success');
        if (profile) {
          setProfile({ ...profile, fullName: fullName.trim(), phone: phone.trim() });
        }

        // Sync local storage so the global sidebar/header updates instantly
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

  // 2. Handle password changing (POST /api/accounts/change-password)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate credentials fields
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
      const res = await api.post<BaseResponse<string>>('/api/accounts/change-password', payload);

      if (res.success) {
        showToast(res.message || 'Password changed successfully.', 'success');
        // Clear out password fields on success
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

  // Helper function to extract user initials for the avatar profile badge
  const initials = React.useMemo(() => {
    const name = fullName || profile?.username || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName, profile]);

  // Formatter for account creation date
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

  // Render a loading spinner during initial data fetch
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

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8f9ff] min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Profile</h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Manage your contact details and account security settings.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Profile Card Header Banner (Excludes Role & Status display as requested) */}
        <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-500/10 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left shadow-sm">
          <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-3xl border-4 border-white shadow-md shrink-0 select-none">
            {initials}
          </div>
          <div className="flex flex-col justify-center h-full pt-1.5 space-y-1">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight animate-fade-in">
              {profile?.username || 'user'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              NexPark System Personal Account Profile
            </p>
          </div>
        </div>

        {/* Grid Layout containing Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Card 1: Personal Information (Editable and Read-Only details) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-100/40 rounded-lg text-emerald-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Personal Information</h3>
                <p className="text-xs text-slate-400">Manage identity details</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5 flex-1 flex flex-col">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={profileErrors.fullName}
                placeholder="Enter your full name"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={profileErrors.phone}
                placeholder="Enter your phone number"
                required
              />

              {/* READ-ONLY static labels */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                    <span className="text-sm font-medium text-slate-600 truncate block select-all" title={profile?.email}>
                      {profile?.email || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date Joined</span>
                    <span className="text-sm font-medium text-slate-600 block">
                      {formattedDate || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Profile Form Button */}
              <div className="pt-4 mt-auto">
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 hover:shadow-emerald-500/20"
                  disabled={savingProfile}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile'}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Card 2: Password Security Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-100/40 rounded-lg text-emerald-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Change Password</h3>
                <p className="text-xs text-slate-400">Enhance your account security</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5 flex-1 flex flex-col">
              <Input
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                error={passwordErrors.oldPassword}
                placeholder="Enter current password"
                required
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={passwordErrors.newPassword}
                placeholder="Enter new password (min. 6 chars)"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={passwordErrors.confirmPassword}
                placeholder="Retype new password to confirm"
                required
              />

              {/* Submit Password Form Button */}
              <div className="pt-4 mt-auto">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 hover:shadow-emerald-500/20"
                  disabled={updatingPassword}
                >
                  <Key className="w-4 h-4" />
                  <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
                </Button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

