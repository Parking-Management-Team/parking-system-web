/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: auth.service.ts - TẦNG DỊCH VỤ XÁC THỰC TÀI KHOẢN (AUTH SERVICE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 MỤC ĐÍCH FILE:
 * Chịu trách nhiệm khai báo tập trung toàn bộ các Endpoint API liên quan tới Xác thực tài khoản:
 * 1. 🔑 Đăng nhập thường (Email + Mật khẩu) & Đăng nhập Google (OAuth 2.0).
 * 2. 📧 Gửi & Xác thực mã OTP (Đăng ký tài khoản, OTP Google, OTP Đăng nhập).
 * 3. 📝 Đăng ký tài khoản người dùng mới (Register với Token xác minh).
 * 4. 🔐 Quy trình 3 bước Quên/Khôi phục mật khẩu (Request OTP -> Verify OTP -> Reset Password).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { api } from '@/lib/api/client';

// ── 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ──────────────────────────────────

/** Dữ liệu nhận về từ API Backend khi Đăng nhập thành công */
export interface LoginResponseDto {
  token: string;
  expiration: string;
  accountId: number;
  username: string;
  email: string;
  fullName: string;
  roleName: string;
}

/** Cấu trúc Phản hồi API chuẩn */
export interface BaseResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  code?: string;
  errorCode?: string;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Cấu trúc Phản hồi API OTP */
export interface OtpResponse<T = null> {
  success?: boolean;
  isSuccess?: boolean;
  code?: string;
  message?: string;
  data?: T;
}

// ── 2. AUTH SERVICE IMPLEMENTATION ──────────────────────────────────────────

export const authService = {
  /**
   * 🔑 1. Đăng nhập bằng Email/Username và Mật khẩu
   * @endpoint POST /auth/login
   */
  login: async (identifier: string, password: string): Promise<BaseResponse<LoginResponseDto>> => {
    return await api.post<BaseResponse<LoginResponseDto>>('/auth/login', {
      email: identifier,
      password: password,
    });
  },

  /**
   * 📧 2. Gửi mã OTP đăng ký / xác thực Email
   * @endpoint POST /auth/send-otp
   */
  sendOtp: async (email: string): Promise<OtpResponse> => {
    return await api.post<OtpResponse>('/auth/send-otp', { email });
  },

  /**
   * 🔐 3. Xác thực mã OTP đăng ký (Nhận về verificationToken)
   * @endpoint POST /auth/verify-otp
   */
  verifyOtp: async (email: string, otp: string): Promise<OtpResponse<string>> => {
    return await api.post<OtpResponse<string>>('/auth/verify-otp', { email, otp });
  },

  /**
   * 📝 4. Đăng ký tài khoản người dùng mới (đã có verificationToken)
   * @endpoint POST /auth/register-verified
   */
  registerVerified: async (
    fullName: string,
    email: string,
    phone: string,
    password: string,
    verificationToken: string
  ): Promise<OtpResponse> => {
    return await api.post<OtpResponse>('/auth/register-verified', {
      fullName,
      email,
      phone,
      password,
      verificationToken,
    });
  },

  /**
   * 🌐 5. Đăng nhập bằng Google (OAuth 2.0 idToken)
   * @endpoint POST /auth/google
   */
  loginWithGoogle: async (idToken: string): Promise<BaseResponse<LoginResponseDto>> => {
    return await api.post<BaseResponse<LoginResponseDto>>('/auth/google', {
      idToken,
    });
  },

  /**
   * 🌐 6. Xác thực OTP bổ sung cho tài khoản Google (nếu bị yêu cầu)
   * @endpoint POST /auth/google-verify-otp
   */
  verifyGoogleOtp: async (idToken: string, otp: string): Promise<BaseResponse<LoginResponseDto>> => {
    return await api.post<BaseResponse<LoginResponseDto>>('/auth/google-verify-otp', {
      idToken,
      otp,
    });
  },

  /**
   * 🔐 7. Xác thực OTP bổ sung cho đăng nhập thường
   * @endpoint POST /auth/login-verify-otp
   */
  verifyLoginOtp: async (email: string, password: string, otp: string): Promise<BaseResponse<LoginResponseDto>> => {
    return await api.post<BaseResponse<LoginResponseDto>>('/auth/login-verify-otp', {
      email,
      password,
      otp,
    });
  },

  /**
   * 🔑 8. Bước 1 Khôi phục Mật khẩu: Yêu cầu gửi mã OTP tới Email
   * @endpoint POST /auth/password-recovery/request
   */
  sendPasswordResetOtp: async (email: string): Promise<OtpResponse> => {
    return await api.post<OtpResponse>('/auth/password-recovery/request', { email });
  },

  /**
   * 🔑 9. Bước 2 Khôi phục Mật khẩu: Xác thực mã OTP khôi phục (Nhận về verificationToken)
   * @endpoint POST /auth/password-recovery/verify
   */
  verifyPasswordResetOtp: async (email: string, otp: string): Promise<OtpResponse<string>> => {
    return await api.post<OtpResponse<string>>('/auth/password-recovery/verify', { email, otp });
  },

  /**
   * 🔑 10. Bước 3 Khôi phục Mật khẩu: Đặt mật khẩu mới với verificationToken
   * @endpoint POST /auth/password-recovery/reset
   */
  resetPassword: async (
    email: string,
    newPassword: string,
    verificationToken: string
  ): Promise<OtpResponse> => {
    return await api.post<OtpResponse>('/auth/password-recovery/reset', {
      email,
      newPassword,
      verificationToken,
    });
  },
};
