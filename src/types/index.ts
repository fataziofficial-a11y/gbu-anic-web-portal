// ==================== Общие типы ====================

export type ContentStatus = "draft" | "published" | "archived";
export type UserRole = "admin" | "editor" | "author";
export type ProjectStatus = "active" | "completed" | "planned";
export type CrosspostPlatform = "telegram" | "vk" | "dzen" | "ok" | "max";
export type CrosspostStatus = "queued" | "sent" | "failed";
export type FileFolder = "media" | "documents" | "knowledge";

// ==================== API Response ====================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ==================== Пагинация ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus;
  category?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
