/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: useProfile.ts - CUSTOM HOOK QUẢN LÝ THÔNG TIN VÀ THAO TÁC PROFILE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Quản lý state và xử lý logic nghiệp vụ cho hồ sơ cá nhân:
 * 1. Fetch thông tin tài khoản qua `profileService.getProfile(userId)`.
 * 2. Cập nhật Họ tên và Số điện thoại qua `profileService.updateProfile`.
 * 3. Đổi mật khẩu qua `profileService.changePassword`.
 * 4. Tạm khóa tài khoản qua `profileService.deactivateAccount`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { profileService, AccountProfileDto as AccountProfile } from '../services/profile.service';
import { ApiError } from '@/lib/api/client';

export function useProfile() {
  const { user, showToast, logout } = useAuth();

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Form profile
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({});

  // Form password
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Modal Deactivate
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [deactivating, setDeactivating] = useState<boolean>(false);

  const userId = user?.id ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id) : null;
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'MANAGER';

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await profileService.getProfile(userId);
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

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
      const res = await profileService.updateProfile(userId, payload);

      if (res.success) {
        showToast(res.message || 'Profile updated successfully.', 'success');
        if (profile) {
          setProfile({ ...profile, fullName: fullName.trim(), phone: phone.trim() });
        }

        try {
          const storedUser = localStorage.getItem('nexpark_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.fullName = fullName.trim();
            localStorage.setItem('nexpark_user', JSON.stringify(parsed));
          }
        } catch (err) {
          console.error('Failed to sync updated user in localStorage:', err);
        }
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as any;
        showToast(errorData.message || 'Error updating profile.', 'error');
      } else {
        showToast('Connection error during profile update.', 'error');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const res = await profileService.changePassword({ oldPassword, newPassword, confirmPassword });

      if (res.success) {
        showToast(res.message || 'Password changed successfully.', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.data) {
        const errorData = err.data as any;
        showToast(errorData.message || 'Incorrect old password or system error.', 'error');
      } else {
        showToast('Connection error during password change.', 'error');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!userId || isAdmin) return;
    setDeactivating(true);
    try {
      const res = await profileService.deactivateAccount(userId);
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
      showToast('Connection error while deactivating account.', 'error');
    } finally {
      setDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  return {
    user,
    profile,
    loading,
    fullName,
    setFullName,
    phone,
    setPhone,
    savingProfile,
    profileErrors,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    updatingPassword,
    passwordErrors,
    showDeactivateModal,
    setShowDeactivateModal,
    deactivating,
    isAdmin,
    handleUpdateProfile,
    handleUpdatePassword,
    handleDeactivateAccount,
  };
}
