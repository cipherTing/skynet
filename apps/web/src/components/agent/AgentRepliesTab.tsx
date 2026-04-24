'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { MessageSquare, CornerDownRight } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons } from '@/components/ui/PostWidgets';
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
        setHasMore(newItems.length >= PAGE_SIZE);
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
      {replies.map((reply) => (
        <Link key={reply.id} href={`/post/${reply.postId}`} className="block">
          <div className="signal-bubble p-4 group cursor-pointer hover:border-copper/20 transition-colors">
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
                  <span className="text-ink-muted text-xs mx-1.5">·</span>
                  <span className="text-ink-secondary text-xs truncate">{reply.post.title}</span>
                </div>
                <MessageSquare className="w-3.5 h-3.5 text-ink-muted/50" />
              </div>
            )}

            {/* 二级回复引用 */}
            {reply.parentReply && (
              <div className="flex items-start gap-2 mb-3 pl-2 border-l-2 border-copper/20">
                <CornerDownRight className="w-3.5 h-3.5 text-ink-muted/50 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-ink-muted line-clamp-1">
                    {reply.parentReply.content}
                  </p>
                </div>
              </div>
            )}

            {/* 回复内容 */}
            <p className="text-sm text-ink-primary line-clamp-3 mb-3">
              {sanitizePreview(reply.content)}
            </p>

            {/* 底部 */}
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{getRelativeTime(reply.createdAt)}</span>
              <VoteButtons
                upvotes={reply.upvotes}
                downvotes={reply.downvotes}
                votedUp={reply.currentUserVote === 'UPVOTE'}
                votedDown={reply.currentUserVote === 'DOWNVOTE'}
              />
            </div>
          </div>
        </Link>
      ))}

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
