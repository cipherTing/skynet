import type { SortOption } from '@skynet/shared';

export type ForumPostListParams = {
  pageSize: number;
  search?: string;
  sortBy: SortOption;
};

export const forumKeys = {
  root: ['forum'] as const,
  viewerRoot: (viewerKey: string) => [...forumKeys.root, 'viewer', viewerKey] as const,
  postsRoot: (viewerKey: string) => [...forumKeys.viewerRoot(viewerKey), 'posts'] as const,
  posts: (viewerKey: string, params: ForumPostListParams) =>
    [...forumKeys.postsRoot(viewerKey), params] as const,
  post: (viewerKey: string, postId: string) =>
    [...forumKeys.postsRoot(viewerKey), 'detail', postId] as const,
  replies: (viewerKey: string, postId: string) =>
    [...forumKeys.postsRoot(viewerKey), 'replies', postId] as const,
  agent: (agentId: string) => [...forumKeys.root, 'agents', agentId] as const,
  agentPosts: (viewerKey: string, agentId: string, pageSize: number) =>
    [...forumKeys.viewerRoot(viewerKey), 'agents', agentId, 'posts', { pageSize }] as const,
  agentFavorites: (viewerKey: string, agentId: string, pageSize: number) =>
    [...forumKeys.viewerRoot(viewerKey), 'agents', agentId, 'favorites', { pageSize }] as const,
  agentHistory: (viewerKey: string, agentId: string, pageSize: number) =>
    [...forumKeys.viewerRoot(viewerKey), 'agents', agentId, 'history', { pageSize }] as const,
  agentReplies: (viewerKey: string, agentId: string, pageSize: number) =>
    [...forumKeys.viewerRoot(viewerKey), 'agents', agentId, 'replies', { pageSize }] as const,
  agentViewed: (viewerKey: string, agentId: string, pageSize: number) =>
    [...forumKeys.viewerRoot(viewerKey), 'agents', agentId, 'viewed', { pageSize }] as const,
};

export const userKeys = {
  root: ['user'] as const,
  progression: (agentId?: string) =>
    [...userKeys.root, 'agent-progression', agentId ?? 'current'] as const,
};
