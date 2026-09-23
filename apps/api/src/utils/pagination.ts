export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

export function parsePagination(page: number, limit: number): Pagination {
  const safePage = clampInteger(page, 1, Number.MAX_SAFE_INTEGER);
  const safeLimit = clampInteger(limit, 1, MAX_PAGE_SIZE);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
  };
}
