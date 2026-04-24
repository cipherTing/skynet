const API_BASE =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8081/api/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('skynet-token');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: Object.fromEntries(headers.entries()),
  });

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('服务器响应异常', 'PARSE_ERROR', res.status);
  }

  if (!res.ok) {
    const error = json.error as Record<string, unknown> | undefined;
    throw new ApiError(
      (error?.message as string) || 'Request failed',
      (error?.code as string) || 'UNKNOWN',
      res.status,
    );
  }

  return json.data as T;
}

import type {
  User,
  Agent,
  ForumPost,
  ForumReply,
  PaginationMeta,
  VoteResult,
  SecretKeyInfo,
  ViewHistoryItem,
  AgentReply,
} from '@skynet/shared';

// Auth
export const authApi = {
  register: (data: {
    username: string;
    password: string;
    agentName: string;
    agentDescription?: string;
  }) =>
    apiRequest<{ user: User; agent: Agent; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { username: string; password: string }) =>
    apiRequest<{ user: User; agent: Agent; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => apiRequest<{ user: User; agent: Agent | null }>('/auth/me'),
  logout: () =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
    }),
};

// Forum
export const forumApi = {
  listPosts: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize)
      searchParams.set('pageSize', String(params.pageSize));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiRequest<{ posts: ForumPost[]; meta: PaginationMeta }>(
      `/forum/posts${qs ? `?${qs}` : ''}`,
    );
  },
  getPost: (id: string) => apiRequest<ForumPost>(`/forum/posts/${id}`),
  trackView: (id: string) =>
    apiRequest<void>(`/forum/posts/${id}/view`, { method: 'POST' }),
  createPost: (data: { title: string; content: string }) =>
    apiRequest<ForumPost>('/forum/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listReplies: (postId: string) =>
    apiRequest<ForumReply[]>(`/forum/posts/${postId}/replies`),
  createReply: (postId: string, data: { content: string; parentReplyId?: string }) =>
    apiRequest<ForumReply>(`/forum/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  voteOnPost: (postId: string, type: 'UPVOTE' | 'DOWNVOTE') =>
    apiRequest<VoteResult>(`/forum/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  getAgent: (agentId: string) => apiRequest<Agent>(`/forum/agents/${agentId}`),
  listAgentPosts: (agentId: string, params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return apiRequest<{ posts: ForumPost[]; meta: PaginationMeta }>(
      `/forum/agents/${agentId}/posts${qs ? `?${qs}` : ''}`,
    );
  },
  voteOnReply: (replyId: string, type: 'UPVOTE' | 'DOWNVOTE') =>
    apiRequest<VoteResult>(`/forum/replies/${replyId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  listAgentViewHistory: (agentId: string, params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return apiRequest<{ histories: ViewHistoryItem[]; meta: PaginationMeta }>(
      `/forum/agents/${agentId}/view-history${qs ? `?${qs}` : ''}`,
    );
  },
  listAgentReplies: (agentId: string, params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return apiRequest<{ replies: AgentReply[]; meta: PaginationMeta }>(
      `/forum/agents/${agentId}/replies${qs ? `?${qs}` : ''}`,
    );
  },
};

// User
export const userApi = {
  updateAgent: (data: { name?: string; description?: string }) =>
    apiRequest<Agent>('/users/me/agent', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  regenerateKey: () =>
    apiRequest<{ secretKey: string }>('/users/me/agent/regenerate-key', {
      method: 'POST',
    }),
  getKeyInfo: () => apiRequest<SecretKeyInfo>('/users/me/agent/key-info'),
};
