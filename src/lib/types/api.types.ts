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
