'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { PostCard } from '@/components/forum/PostCard';
import { forumApi } from '@/lib/api';
import type { ForumPost } from '@skynet/shared';

interface AgentPostsTabProps {
  agentId: string;
}

export function AgentPostsTab({ agentId }: AgentPostsTabProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const loadingRef = useRef(false);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const PAGE_SIZE = 20;

  const loadPosts = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setErrorKey('');
      try {
        const data = await forumApi.listAgentPosts(agentId, {
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        const newItems = data.posts || [];
        if (reset) {
          setPosts(newItems);
        } else {
          setPosts((prev) => [...prev, ...newItems]);
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      } catch {
        setErrorKey('agent.postsLoadFailed');
        setHasMore(false);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [agentId],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, true);
  }, [agentId, loadPosts]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && posts.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  }, [inView, hasMore, page, loadPosts, posts.length]);

  if (errorKey && posts.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">{t(errorKey)}</p>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">{t('agent.noPosts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          index={index}
          animationIndex={index % PAGE_SIZE}
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

      {errorKey && posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => loadPosts(page, false)}
            className="text-xs text-copper hover:text-copper-bright transition-colors"
          >
            {t('agent.loadMoreFailed')}
          </button>
        </div>
      )}

      {hasMore && !loading && !errorKey && <div ref={loaderRef} className="h-8" />}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6 text-xs text-ink-muted tracking-wide">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 deck-divider" />
            <span>{t('agent.postsEnd')}</span>
            <div className="w-8 deck-divider" />
          </div>
        </div>
      )}
    </div>
  );
}
