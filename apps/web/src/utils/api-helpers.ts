export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Builds query parameter objects, filtering out null/undefined values.
 */
export function buildQueryParams<T extends Record<string, any>>(
  filters: T,
  pagination?: PaginationParams,
): Record<string, string> {
  const params: Record<string, string> = {};

  // Map filters
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      if (val instanceof Date) {
        params[key] = val.toISOString();
      } else {
        params[key] = String(val);
      }
    }
  });

  // Map pagination
  if (pagination) {
    if (pagination.page) params.page = String(pagination.page);
    if (pagination.limit) params.limit = String(pagination.limit);
    if (pagination.sortBy) params.sortBy = pagination.sortBy;
    if (pagination.sortOrder) params.sortOrder = pagination.sortOrder;
  }

  return params;
}

/**
 * Standard pagination response factory for empty/fallback bounds.
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };
}
