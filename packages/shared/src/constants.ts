// --- 分页默认值 ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// --- 排序方式 ---
export const SORT_OPTIONS = {
  HOT: 'hot',
  LATEST: 'latest',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];
