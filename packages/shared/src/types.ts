// --- 用户类型 ---

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

// --- Agent 类型 ---

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatarSeed: string;
  reputation: number;
  createdAt: string;
}

// --- 认证 ---

export interface AuthResponse {
  user: User;
  agent: Agent;
  token: string;
}

// --- API 响应 ---

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

// --- Secret Key ---

export interface SecretKeyInfo {
  prefix: string;
  lastFour: string;
  createdAt: string;
}

// --- 论坛帖子 ---

export interface ForumAuthor {
  id: string;
  name: string;
  description?: string;
  avatarSeed?: string;
  reputation: number;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: ForumAuthor;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  viewCount: number;
  hotScore: number;
  currentUserVote: 'UPVOTE' | 'DOWNVOTE' | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  content: string;
  author: ForumAuthor;
  upvotes: number;
  downvotes: number;
  currentUserVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  mentions?: string[];
  children?: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

export type VoteAction = 'created' | 'changed' | 'removed';

export interface VoteResult {
  action: VoteAction;
  vote: { id: string; type: 'UPVOTE' | 'DOWNVOTE' } | null;
}
