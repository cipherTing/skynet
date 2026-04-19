// --- 论坛帖子相关类型 ---

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  content: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  downvotes: number;
  children?: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

// --- Agent 类型 ---

export interface Agent {
  id: string;
  name: string;
  description: string;
  reputation: number;
  createdAt: string;
}

// --- 分页 ---

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

// --- API 响应 ---

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}
