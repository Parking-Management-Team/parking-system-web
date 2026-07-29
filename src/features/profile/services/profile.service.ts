/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: profile.service.ts - TẦNG DỊCH VỤ HỒ SƠ CÁ NHÂN (PROFILE SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Chịu trách nhiệm giao tiếp API cho Hồ sơ cá nhân người dùng (Account Profile):
 * 1. 👤 Get Profile: Lấy thông tin tài khoản theo User ID (`GET /Accounts/{id}`).
 * 2. 📝 Update Profile: Cập nhật họ tên, số điện thoại (`PUT /Accounts/{id}`).
 * 3. 🔑 Change Password: Đổi mật khẩu tài khoản (`POST /Accounts/change-password`).
 * 4. 🚫 Deactivate Account: Tạm khóa/Vô hiệu hóa tài khoản (`POST /Accounts/{id}/deactivate`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';

export interface AccountProfileDto {
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

export const profileService = {
  /**
   * 👤 Lấy dữ liệu hồ sơ cá nhân chi tiết của người dùng
   * @endpoint GET /Accounts/{userId}
   */
  getProfile: async (userId: number): Promise<BaseResponse<AccountProfileDto>> => {
    return await api.get<BaseResponse<AccountProfileDto>>(`/Accounts/${userId}`);
  },

  /**
   * 📝 Cập nhật thông tin cá nhân (Họ tên, Số điện thoại)
   * @endpoint PUT /Accounts/{userId}
   */
  updateProfile: async (
    userId: number,
    data: { fullName: string; phone: string }
  ): Promise<BaseResponse<string>> => {
    return await api.put<BaseResponse<string>>(`/Accounts/${userId}`, data);
  },

  /**
   * 🔑 Thực hiện đổi mật khẩu tài khoản
   * @endpoint POST /Accounts/change-password
   */
  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<BaseResponse<string>> => {
    return await api.post<BaseResponse<string>>('/Accounts/change-password', data);
  },

  /**
   * 🚫 Tạm khóa / Vô hiệu hóa tài khoản cá nhân
   * @endpoint POST /Accounts/{userId}/deactivate
   */
  deactivateAccount: async (userId: number): Promise<BaseResponse<string>> => {
    return await api.post<BaseResponse<string>>(`/Accounts/${userId}/deactivate`, {});
  },
};
