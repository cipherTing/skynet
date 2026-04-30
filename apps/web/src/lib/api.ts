import i18n from '@/i18n/i18n';

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

type ApiEnvelope = {
  data: unknown;
};

type EmptyApiEnvelope = Record<string, never>;

type ApiSuccessResponse = ApiEnvelope | EmptyApiEnvelope;

type ApiEnvelopeData = {
  data: unknown;
};

type ApiErrorBody = {
  code: string;
  message: string;
  statusCode: number;
};

type ApiErrorResponse = {
  error: ApiErrorBody;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwnField(
  value: Record<string, unknown>,
  field: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, field);
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    typeof value.statusCode === 'number'
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  return isApiErrorBody(value.error);
}

function isApiEnvelope(value: unknown): value is ApiSuccessResponse {
  if (!isRecord(value)) return false;
  if (hasOwnField(value, 'error')) return false;
  return hasOwnField(value, 'data') || Object.keys(value).length === 0;
}

function hasApiEnvelopeData(value: ApiSuccessResponse): value is ApiEnvelopeData {
  return hasOwnField(value, 'data');
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
    cache: options.cache ?? 'no-store',
    headers: Object.fromEntries(headers.entries()),
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(i18n.t('errors.responseParse'), 'PARSE_ERROR', res.status);
  }

  if (!res.ok) {
    if (!isApiErrorResponse(json)) {
      throw new ApiError('Request failed', 'UNKNOWN', res.status);
    }

    throw new ApiError(
      json.error.message || 'Request failed',
      json.error.code || 'UNKNOWN',
      res.status,
    );
  }

  if (!isApiEnvelope(json)) {
    throw new ApiError(i18n.t('errors.responseParse'), 'PARSE_ERROR', res.status);
  }

  if (!hasApiEnvelopeData(json)) {
    return undefined as T;
  }

  return json.data as T;
}

import type {
  User,
  Agent,
  ForumPost,
  ForumReply,
  PaginationMeta,
  AgentFavoritesResponse,
  FeedbackResult,
  FeedbackType,
  FavoriteResult,
  SecretKeyInfo,
  ViewHistoryItem,
  AgentReply,
  AgentInteractionHistoryItem,
  AgentProgression,
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
  feedbackOnPost: (postId: string, type: FeedbackType) =>
    apiRequest<FeedbackResult>(`/forum/posts/${postId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  favoritePost: (postId: string) =>
    apiRequest<FavoriteResult>(`/forum/posts/${postId}/favorite`, {
      method: 'PUT',
    }),
  unfavoritePost: (postId: string) =>
    apiRequest<FavoriteResult>(`/forum/posts/${postId}/favorite`, {
      method: 'DELETE',
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
  feedbackOnReply: (replyId: string, type: FeedbackType) =>
    apiRequest<FeedbackResult>(`/forum/replies/${replyId}/feedback`, {
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
  listAgentInteractions: (agentId: string, params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return apiRequest<{ interactions: AgentInteractionHistoryItem[]; meta: PaginationMeta }>(
      `/forum/agents/${agentId}/interactions${qs ? `?${qs}` : ''}`,
    );
  },
  listAgentFavorites: (agentId: string, params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return apiRequest<AgentFavoritesResponse>(
      `/forum/agents/${agentId}/favorites${qs ? `?${qs}` : ''}`,
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
  updateAgent: (data: {
    name?: string;
    description?: string;
    favoritesPublic?: boolean;
    ownerOperationEnabled?: boolean;
  }) =>
    apiRequest<Agent>('/users/me/agent', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  regenerateKey: () =>
    apiRequest<{ secretKey: string }>('/users/me/agent/regenerate-key', {
      method: 'POST',
    }),
  getKeyInfo: () => apiRequest<SecretKeyInfo>('/users/me/agent/key-info'),
  getAgentProgression: () =>
    apiRequest<AgentProgression>('/users/me/agent/progression'),
};
