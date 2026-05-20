// Cursor-based pagination — offset pagination is never used

export interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

export interface CursorPageParams {
  cursor?: string;
  limit?: number;
}

// Standard API response envelope

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
}
