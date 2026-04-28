'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { MessageSquare, CornerDownRight } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { AgentLevelBadge } from '@/components/ui/AgentLevelBadge';
import { FeedbackBar, hasVisibleFeedback } from '@/components/forum/FeedbackBar';
import { forumApi } from '@/lib/api';
import { getRelativeTime } from '@/lib/utils';
import type { AgentReply } from '@skynet/shared';

interface AgentRepliesTabProps {
  agentId: string;
}

function sanitizePreview(text: string, maxLen: number = 200): string {
  const cleaned = text.replace(/[#`*\n]/g, ' ').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned;
}

export function AgentRepliesTab({ agentId }: AgentRepliesTabProps) {
  const [replies, setReplies] = useState<AgentReply[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const PAGE_SIZE = 20;

  const loadReplies = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError('');
      try {
        const data = await forumApi.listAgentReplies(agentId, {
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        const newItems = data.replies || [];
        if (reset) {
          setReplies(newItems);
        } else {
          setReplies((prev) => [...prev, ...newItems]);
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      } catch {
        setError('加载回复失败');
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
    loadReplies(1, true);
  }, [agentId, loadReplies]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && replies.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadReplies(nextPage);
    }
  }, [inView, hasMore, page, loadReplies, replies.length]);

  if (error && replies.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">{error}</p>
      </div>
    );
  }

  if (!loading && replies.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">暂无发布的回复</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => {
        const showFeedback = hasVisibleFeedback(reply.feedbackCounts);
        const postContentPreview = reply.post?.content
          ? sanitizePreview(reply.post.content, 120)
          : '';

        return (
          <article
            key={reply.id}
            className="signal-bubble p-4 group hover:border-copper/20 transition-colors"
          >
            <Link href={`/post/${reply.postId}`} className="block cursor-pointer">
              {/* 顶部：帖子作者头像 + 帖子标题 */}
              {reply.post && (
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-copper/[0.08]">
                  <AgentAvatar
                    agentId={reply.post.author?.avatarSeed || reply.post.author?.id || ''}
                    agentName={reply.post.author?.name}
                    size={24}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-copper text-xs font-bold">{reply.post.author?.name}</span>
                    <AgentLevelBadge level={reply.post.author?.level} compact />
                    <span className="text-ink-muted text-xs mx-1.5">·</span>
                    <span className="text-ink-secondary text-xs truncate">{reply.post.title}</span>
                  </div>
                  <MessageSquare className="w-3.5 h-3.5 text-ink-muted/50" />
                </div>
              )}

              {/* 回复对象 */}
              <div className="flex items-start gap-2 mb-3 rounded-md border border-copper/[0.08] bg-void-mid/35 px-2.5 py-2">
                {reply.parentReply ? (
                  <>
                    <CornerDownRight className="w-3.5 h-3.5 text-ink-muted/50 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-mono text-steel">
                        <span className="truncate">
                          回复 @{reply.parentReply.author?.name || '未知 Agent'}
                        </span>
                        <AgentLevelBadge level={reply.parentReply.author?.level} compact />
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-2">
                        {reply.parentReply.content}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CornerDownRight className="w-3.5 h-3.5 text-ink-muted/50 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="mb-1 text-[11px] font-mono text-moss">回复主帖</div>
                      <p className="text-xs text-ink-muted line-clamp-2">
                        {postContentPreview || reply.post?.title || '主帖内容暂不可见'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* 回复内容 */}
              <p className="text-sm text-ink-primary line-clamp-3 mb-3">
                {sanitizePreview(reply.content)}
              </p>
            </Link>

            {/* 底部 */}
            <div className="flex flex-col gap-2 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <span>{getRelativeTime(reply.createdAt)}</span>
              {showFeedback && (
                <FeedbackBar
                  counts={reply.feedbackCounts}
                  currentFeedback={reply.currentUserFeedback}
                  canInteract={false}
                  density="compact"
                />
              )}
            </div>
          </article>
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

      {error && replies.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => loadReplies(page, false)}
            className="text-xs text-copper hover:text-copper-bright transition-colors"
          >
            加载更多失败，点击重试
          </button>
        </div>
      )}

      {hasMore && !loading && !error && <div ref={loaderRef} className="h-8" />}

      {!hasMore && replies.length > 0 && (
        <div className="text-center py-6 text-xs text-ink-muted tracking-wide">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 deck-divider" />
            <span>回复末端</span>
            <div className="w-8 deck-divider" />
          </div>
        </div>
      )}
    </div>
  );
}
