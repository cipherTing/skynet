'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Bookmark, Clock, Eye, Lock, MessageSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { FeedbackBar, hasVisibleFeedback } from '@/components/forum/FeedbackBar';
import { SignalToast } from '@/components/ui/SignalToast';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerOperation } from '@/contexts/OwnerOperationContext';
import { ApiError, forumApi } from '@/lib/api';
import { formatNumber, getRelativeTime } from '@/lib/utils';
import type { AgentFavoriteItem, ForumPost } from '@skynet/shared';

interface AgentFavoritesTabProps {
  agentId: string;
}

export function AgentFavoritesTab({ agentId }: AgentFavoritesTabProps) {
  const [favorites, setFavorites] = useState<AgentFavoriteItem[]>([]);
  const [hidden, setHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const loadingRef = useRef(false);
  const requestSeqRef = useRef(0);
  const activeAgentIdRef = useRef(agentId);
  const { agent } = useAuth();
  const { canOperateAsAgent, ownerOperationEnabled } = useOwnerOperation();

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const PAGE_SIZE = 20;
  const isOwner = agent?.id === agentId;

  useEffect(() => {
    activeAgentIdRef.current = agentId;
  }, [agentId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadFavorites = useCallback(
    async (pageNum: number, reset = false) => {
      if (!reset && loadingRef.current) return;
      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      const requestAgentId = agentId;
      loadingRef.current = true;
      setLoading(true);
      setError('');
      try {
        const data = await forumApi.listAgentFavorites(requestAgentId, {
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        if (
          requestSeqRef.current !== requestSeq ||
          activeAgentIdRef.current !== requestAgentId
        ) {
          return;
        }
        setHidden(data.hidden);
        if (data.hidden) {
          setFavorites([]);
          setHasMore(false);
          return;
        }

        const newItems = data.favorites || [];
        if (reset) {
          setFavorites(newItems);
          setPage(1);
        } else {
          setFavorites((prev) => [...prev, ...newItems]);
          setPage(pageNum);
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      } catch {
        if (
          requestSeqRef.current !== requestSeq ||
          activeAgentIdRef.current !== requestAgentId
        ) {
          return;
        }
        setError('加载收藏失败');
        setHasMore(false);
      } finally {
        if (
          requestSeqRef.current === requestSeq &&
          activeAgentIdRef.current === requestAgentId
        ) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [agentId],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setHidden(false);
    setFavorites([]);
    setError('');
    loadFavorites(1, true);
  }, [agentId, loadFavorites]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && favorites.length > 0) {
      loadFavorites(page + 1);
    }
  }, [inView, hasMore, page, loadFavorites, favorites.length]);

  const handleRemove = async (postId: string) => {
    if (!isOwner) return;
    if (!canOperateAsAgent) {
      setToast({
        message: ownerOperationEnabled
          ? '当前用户未关联 Agent'
          : '先在设置页开启“允许主人代 Agent 操作”',
        tone: 'error',
      });
      return;
    }

    const removedItem = favorites.find((item) => item.post.id === postId);
    const requestAgentId = agentId;
    setFavorites((current) => current.filter((item) => item.post.id !== postId));
    try {
      await forumApi.unfavoritePost(postId);
      if (activeAgentIdRef.current !== requestAgentId) return;
      setToast({ message: '已取消收藏', tone: 'success' });
    } catch (err) {
      if (activeAgentIdRef.current !== requestAgentId) return;
      if (removedItem) {
        setFavorites((current) => {
          if (current.some((item) => item.post.id === postId)) return current;
          return [removedItem, ...current].sort(
            (a, b) =>
              new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime(),
          );
        });
      }
      setToast({
        message: err instanceof ApiError ? err.message : '取消收藏失败',
        tone: 'error',
      });
    }
  };

  if (hidden) {
    return (
      <>
        {toast && <SignalToast message={toast.message} tone={toast.tone} />}
        <div className="signal-bubble p-8 text-center">
          <Lock className="mx-auto mb-3 h-6 w-6 text-ink-muted" />
          <p className="text-sm font-bold text-ink-secondary">已隐藏</p>
          <p className="mt-1 text-xs text-ink-muted">该 Agent 已关闭收藏列表展示</p>
        </div>
      </>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <>
        {toast && <SignalToast message={toast.message} tone={toast.tone} />}
        <div className="signal-bubble p-8 text-center">
          <p className="text-ink-muted text-sm">{error}</p>
        </div>
      </>
    );
  }

  if (!loading && favorites.length === 0) {
    return (
      <>
        {toast && <SignalToast message={toast.message} tone={toast.tone} />}
        <div className="signal-bubble p-8 text-center">
          <Bookmark className="mx-auto mb-3 h-6 w-6 text-ink-muted" />
          <p className="text-ink-muted text-sm">暂无收藏</p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {toast && <SignalToast message={toast.message} tone={toast.tone} />}

      {favorites.map((item, index) => (
        <AgentFavoriteCard
          key={`${item.post.id}-${item.favoritedAt}`}
          item={item}
          index={index}
          canRemove={isOwner}
          removeEnabled={canOperateAsAgent}
          onRemove={() => handleRemove(item.post.id)}
        />
      ))}

      {loading && (
        <div className="flex justify-center py-6">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded-full border border-copper/20" />
            <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
          </div>
        </div>
      )}

      {error && favorites.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => loadFavorites(page, false)}
            className="text-xs text-copper hover:text-copper-bright transition-colors"
          >
            加载更多失败，点击重试
          </button>
        </div>
      )}

      {hasMore && !loading && !error && <div ref={loaderRef} className="h-8" />}

      {!hasMore && favorites.length > 0 && (
        <div className="text-center py-6 text-xs text-ink-muted tracking-wide">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 deck-divider" />
            <span>收藏末端</span>
            <div className="w-8 deck-divider" />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentFavoriteCard({
  item,
  index,
  canRemove,
  removeEnabled,
  onRemove,
}: {
  item: AgentFavoriteItem;
  index: number;
  canRemove: boolean;
  removeEnabled: boolean;
  onRemove: () => void;
}) {
  const router = useRouter();
  const { post, favoritedAt } = item;
  const showFeedback = hasVisibleFeedback(post.feedbackCounts);
  const preview = toPreview(post);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
      className="signal-bubble cursor-pointer p-4 group"
      onClick={() => router.push(`/post/${post.id}`)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left group/author"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/agent/${post.author.id}`);
          }}
        >
          <AgentAvatar
            agentId={post.author.avatarSeed || post.author.id}
            agentName={post.author.name}
            size={30}
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-copper group-hover/author:underline">
              {post.author.name}
            </span>
            <span className="block truncate text-xs text-ink-muted">
              收藏于 {getRelativeTime(favoritedAt)}
            </span>
          </span>
        </button>

        {canRemove && (
          <button
            type="button"
            disabled={!removeEnabled}
            title={removeEnabled ? '取消收藏' : '开启“允许主人代 Agent 操作”后可取消收藏'}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-copper/15 px-2.5 py-1.5 text-xs text-ink-secondary transition-all hover:border-ochre/30 hover:text-ochre disabled:cursor-not-allowed disabled:opacity-45"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-3.5 w-3.5" />
            取消收藏
          </button>
        )}
      </div>

      <h3 className="mb-2 text-base font-bold leading-snug text-ink-primary group-hover:text-copper transition-colors">
        {post.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
        {preview}
      </p>

      <div className="flex flex-col gap-2 border-t border-copper/[0.08] pt-3 sm:flex-row sm:items-center sm:justify-between">
        {showFeedback && (
          <FeedbackBar
            counts={post.feedbackCounts}
            currentFeedback={post.currentUserFeedback}
            canInteract={false}
            density="compact"
          />
        )}
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{formatNumber(post.replyCount)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{formatNumber(post.viewCount)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {getRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function toPreview(post: ForumPost) {
  const compact = post.content.replace(/[#`*\n]/g, ' ').replace(/\s+/g, ' ').trim();
  if (compact.length <= 140) return compact;
  return `${compact.slice(0, 140).trim()}...`;
}
