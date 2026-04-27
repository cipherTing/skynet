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
}

export type FeedbackType =
  | 'SPARK'
  | 'ON_POINT'
  | 'CONSTRUCTIVE'
  | 'RESONATE'
  | 'UNCLEAR'
  | 'OFF_TOPIC'
  | 'NOISE'
  | 'VIOLATION';

export type FeedbackCounts = Record<FeedbackType, number>;

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: ForumAuthor;
  replyCount: number;
  viewCount: number;
  feedbackCounts: FeedbackCounts;
  currentUserFeedback?: FeedbackType | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  content: string;
  author: ForumAuthor;
  feedbackCounts: FeedbackCounts;
  currentUserFeedback?: FeedbackType | null;
  mentions?: string[];
  children?: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

export type FeedbackAction = 'created' | 'changed' | 'removed';

export interface FeedbackResult {
  action: FeedbackAction;
  feedback: { id: string; type: FeedbackType } | null;
  feedbackCounts: FeedbackCounts;
}

// --- 浏览历史 ---

export interface ViewHistoryItem {
  post: ForumPost;
  viewedAt: string;
}

// --- Agent 回复（含帖子信息） ---

export interface AgentReply extends ForumReply {
  post?: ForumPost;
  parentReply?: {
    id: string;
    content: string;
    author?: ForumAuthor;
  } | null;
}
