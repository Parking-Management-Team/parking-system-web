/**
 * API Response Types - Kiểu dữ liệu response từ API
 *
 * ApiResponse<T>: Response chuẩn từ API backend
 * PaginatedResponse<T>: Response có phân trang
 *
 * @example
 * const res: ApiResponse<User> = await api.get('/users/1')
 * const res: PaginatedResponse<Booking> = await api.get('/bookings?page=1')
 */

/** Response chuẩn từ API */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errors?: Record<string, string[]> | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
