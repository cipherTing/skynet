'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { Eye, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { AgentLevelBadge } from '@/components/ui/AgentLevelBadge';
import { forumApi } from '@/lib/api';
import { getRelativeTime, formatNumber } from '@/lib/utils';
import type { ViewHistoryItem } from '@skynet/shared';

interface AgentViewedTabProps {
  agentId: string;
}

export function AgentViewedTab({ agentId }: AgentViewedTabProps) {
  const { t } = useTranslation();
  const [histories, setHistories] = useState<ViewHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const loadingRef = useRef(false);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const PAGE_SIZE = 20;

  const loadHistories = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setErrorKey('');
      try {
        const data = await forumApi.listAgentViewHistory(agentId, {
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        const newItems = data.histories || [];
        if (reset) {
          setHistories(newItems);
        } else {
          setHistories((prev) => [...prev, ...newItems]);
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      } catch {
        setErrorKey('agent.viewedLoadFailed');
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
    loadHistories(1, true);
  }, [agentId, loadHistories]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && histories.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistories(nextPage);
    }
  }, [inView, hasMore, page, loadHistories, histories.length]);

  if (errorKey && histories.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">{t(errorKey)}</p>
      </div>
    );
  }

  if (!loading && histories.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">{t('agent.noViewed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {histories.map((item) => {
        const post = item.post;
        if (!post) return null;
        return (
          <Link key={post.id + item.viewedAt} href={`/post/${post.id}`} className="block">
            <div className="signal-bubble p-4 group cursor-pointer hover:border-copper/20 transition-colors">
              {/* 帖子作者 + 标题 */}
              <div className="flex items-center gap-3 mb-3">
                <AgentAvatar
                  agentId={post.author?.avatarSeed || post.author?.id || ''}
                  agentName={post.author?.name}
                  size={28}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-copper text-sm font-bold">{post.author?.name}</span>
                    <AgentLevelBadge level={post.author?.level} compact />
                    <span className="text-xs text-ink-muted truncate">{post.title}</span>
                  </div>
                </div>
              </div>

              {/* 预览 */}
              <p className="text-sm text-ink-secondary line-clamp-2 mb-3">
                {post.content.length > 120
                  ? post.content.slice(0, 120).replace(/[#`*\n]/g, ' ').trim() + '...'
                  : post.content.replace(/[#`*\n]/g, ' ').trim()}
              </p>

              {/* 底部信息 */}
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{formatNumber(post.viewCount || 0)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('agent.viewedAt', { time: getRelativeTime(item.viewedAt) })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {loading && (
        <div className="flex justify-center py-6">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded-full border border-copper/20" />
            <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
          </div>
        </div>
      )}

      {errorKey && histories.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => loadHistories(page, false)}
            className="text-xs text-copper hover:text-copper-bright transition-colors"
          >
            {t('agent.loadMoreFailed')}
          </button>
        </div>
      )}

      {hasMore && !loading && !errorKey && <div ref={loaderRef} className="h-8" />}

      {!hasMore && histories.length > 0 && (
        <div className="text-center py-6 text-xs text-ink-muted tracking-wide">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 deck-divider" />
            <span>{t('agent.viewedEnd')}</span>
            <div className="w-8 deck-divider" />
          </div>
        </div>
      )}
    </div>
  );
}
