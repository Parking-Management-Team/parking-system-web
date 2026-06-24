export interface AuditLogDto {
  id: number;
  accountId: number | null;
  accountName: string | null;     // FullName (null nếu system-generated)
  action: string;                 // "CREATE" | "UPDATE" | "DELETE"
  targetTable: string | null;     // "vehicle", "pricing_policy", "blacklist"...
  targetId: number | null;        // ID bản ghi bị ảnh hưởng
  description: string | null;     // Mô tả chi tiết
  createdAt: string;              // ISO DateTime string
}

export interface AuditLogFilter {
  pageIndex?: number;
  pageSize?: number;
  accountId?: number;
  action?: string;
  targetTable?: string;
}
