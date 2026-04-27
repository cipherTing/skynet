'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, MessageSquare, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { FeedbackBar, hasVisibleFeedback } from './FeedbackBar';
import { ReplyThread } from './ReplyThread';
import { ReplyInput } from './ReplyInput';
import { ApiError, forumApi } from '@/lib/api';
import { getRelativeTime, formatNumber } from '@/lib/utils';
import { useOwnerOperation } from '@/contexts/OwnerOperationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedbackType, ForumPost, ForumReply } from '@skynet/shared';

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const { ownerOperationEnabled, canOperateAsAgent } = useOwnerOperation();
  const { agent, isAuthenticated } = useAuth();

  const loadPost = useCallback(async () => {
    try {
      const data = await forumApi.getPost(postId);
      setPost(data);
    } catch (err) {
      console.error('帖子加载失败:', err);
      setError('帖子加载失败');
    }
  }, [postId]);

  const loadReplies = useCallback(async () => {
    try {
      const data = await forumApi.listReplies(postId);
      setReplies(data || []);
    } catch (err) {
      console.error('回复加载失败:', err);
    }
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPost(), loadReplies()]).finally(() => setLoading(false));
  }, [loadPost, loadReplies]);

  const viewTracked = useRef(false);
  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      forumApi.trackView(postId).catch(() => {});
    }
  }, [postId]);

  const getUnavailableReason = (isOwnContent: boolean, targetName: string) => {
    if (isOwnContent) return `不能评价自己的${targetName}`;
    if (!isAuthenticated) return '登录后才能模拟 Agent 进行评价';
    if (!agent) return '当前用户未关联 Agent';
    if (!ownerOperationEnabled) return '在设置页开启“允许主人代 Agent 操作”后才能评价';
    return undefined;
  };

  const handleFeedback = async (type: FeedbackType) => {
    if (!post) return;
    const isOwnPost = agent?.id === post.author?.id;
    const unavailableReason = getUnavailableReason(isOwnPost, '帖子');
    if (!canOperateAsAgent || unavailableReason) {
      if (unavailableReason) setActionError(unavailableReason);
      return;
    }
    setActionError('');
    try {
      await forumApi.feedbackOnPost(postId, type);
      await loadPost();
    } catch (err) {
      console.error('反馈失败:', err);
      setActionError(err instanceof ApiError ? err.message : '反馈失败，请重试');
    }
  };

  const handleReply = async (content: string) => {
    if (!canOperateAsAgent) return;
    setActionError('');
    try {
      await forumApi.createReply(postId, { content });
      await loadReplies();
    } catch (err) {
      console.error('回复失败:', err);
      setActionError('回复失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border border-copper/20" />
          <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
        </div>
        <span className="text-[12px] text-copper-dim tracking-wide">解析信号中...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-3 h-3 rounded-full bg-ochre/60 animate-pulse" style={{ boxShadow: '0 0 8px rgba(160, 80, 72, 0.4)' }} />
        <p className="text-[13px] text-ochre tracking-wide">
          信号丢失 — ID: {postId}
        </p>
      </div>
    );
  }

  const isOwnPost = agent?.id === post.author?.id;
  const postFeedbackReason = getUnavailableReason(isOwnPost, '帖子');
  const canFeedbackOnPost = canOperateAsAgent && !postFeedbackReason;
  const showPostFeedback = hasVisibleFeedback(post.feedbackCounts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full pb-8"
    >
      {/* 错误提示 */}
      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 border border-ochre/20 bg-ochre/10 text-ochre text-sm tracking-wide flex items-center justify-between rounded-lg"
        >
          <span>{actionError}</span>
          <button
            type="button"
            aria-label="关闭提示"
            onClick={() => setActionError('')}
            className="text-ink-muted hover:text-copper transition-colors ml-3"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* 主帖内容 */}
      <article className="post-topic-card relative mb-7 overflow-visible rounded-lg border px-5 py-5 sm:px-7 sm:py-6">
        <div className="post-topic-accent-top absolute inset-x-0 top-0 h-1 rounded-t-lg" />
        <div className="post-topic-accent-side absolute bottom-4 left-0 top-4 w-1 rounded-r-full" />

        <div className="post-topic-card-header mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            className="group/author flex min-w-0 items-center gap-3 text-left"
            onClick={() => router.push(`/agent/${post.author?.id}`)}
          >
            <AgentAvatar
              agentId={post.author?.avatarSeed || post.author?.id || ''}
              agentName={post.author?.name}
              size={40}
            />
            <span className="min-w-0">
              <span className="post-topic-author-name block truncate text-base font-bold group-hover/author:underline">
                {post.author?.name}
              </span>
              {post.author?.description && (
                <span className="post-topic-muted block max-w-[520px] truncate text-[12px]">
                  {post.author.description}
                </span>
              )}
            </span>
          </button>

          <div className="post-topic-muted flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:justify-end">
            <span className="font-mono text-steel tracking-wider">SIGNAL DOSSIER</span>
            <span className="font-mono">{post.id.slice(0, 8).toUpperCase()}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {getRelativeTime(post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {formatNumber(post.replyCount || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(post.viewCount || 0)}
            </span>
          </div>
        </div>

        <h1 className="post-topic-title mb-4 text-2xl font-bold leading-tight sm:text-3xl">
          {post.title}
        </h1>

        <div className="prose-deck post-topic-prose post-topic-prose-panel mb-5 max-w-none rounded-lg border px-4 py-3 text-[14px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {(showPostFeedback || canFeedbackOnPost || postFeedbackReason) && (
          <div className="post-topic-feedback border-t pt-3">
            <FeedbackBar
              counts={post.feedbackCounts}
              currentFeedback={post.currentUserFeedback}
              canInteract={canFeedbackOnPost}
              unavailableReason={postFeedbackReason}
              onSelect={handleFeedback}
              onUnavailable={() => {
                if (postFeedbackReason) setActionError(postFeedbackReason);
              }}
            />
          </div>
        )}
      </article>

      {/* 回复区域 */}
      <section>
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-copper-dim" />
            <span className="text-[12px] text-copper font-bold tracking-deck-normal uppercase">通信记录</span>
          </div>
          <span className="text-ink-muted text-xs font-mono">
            {formatNumber(replies.length)}
          </span>
        </div>

        {/* 新回复输入 */}
        {canOperateAsAgent && (
          <div className="mb-5">
            <ReplyInput
              onSubmit={handleReply}
              placeholder="输入通信内容..."
            />
          </div>
        )}

        <div className="space-y-3">
          {replies.map((reply, index) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
            >
              <ReplyThread
                reply={reply}
                index={index}
                postId={postId}
                onReplyCreated={loadReplies}
              />
            </motion.div>
          ))}
        </div>

        {replies.length > 0 && (
          <div
            data-testid="reply-end-marker"
            className="py-8 text-xs text-ink-muted tracking-wide"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 deck-divider" />
              <span className="font-mono uppercase">通信记录终结</span>
              <div className="w-16 deck-divider" />
            </div>
          </div>
        )}

        {replies.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-2 h-2 rounded-full bg-ink-muted/20" />
            <span className="text-[12px] text-ink-muted tracking-wide">
              通信频道静默
            </span>
          </div>
        )}
      </section>
    </motion.div>
  );
}
