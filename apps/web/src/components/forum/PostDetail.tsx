'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Eye, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons, PostTag } from '@/components/ui/PostWidgets';
import { ReplyThread } from './ReplyThread';
import { ReplyInput } from './ReplyInput';
import { forumApi } from '@/lib/api';
import { getRelativeTime, formatNumber } from '@/lib/utils';
import { useDebug } from '@/contexts/DebugContext';
import type { ForumPost, ForumReply } from '@skynet/shared';

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const { debugMode } = useDebug();

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

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!debugMode) return;
    setActionError('');
    try {
      await forumApi.voteOnPost(postId, type);
      await loadPost();
    } catch (err) {
      console.error('投票失败:', err);
      setActionError('投票失败，请重试');
    }
  };

  const handleReply = async (content: string) => {
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
        <Link
          href="/"
          className="text-steel hover:text-copper mt-2 text-sm tracking-wide transition-colors"
        >
          ← 返回观测台
        </Link>
      </div>
    );
  }

  const tags = post.tags || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[800px]"
    >
      {/* 返回导航 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-copper transition-colors mb-6 tracking-wide"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回观测台
      </Link>

      {/* 错误提示 */}
      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 border border-ochre/20 bg-ochre/10 text-ochre text-sm tracking-wide flex items-center justify-between rounded-lg"
        >
          <span>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="text-ink-muted hover:text-copper transition-colors ml-3"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* 主帖内容 — 信号放大视图 */}
      <article className="signal-bubble p-6 mb-8">
        {/* 面板头部 */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-moss font-mono text-xs tracking-wider">信号记录</span>
          <span className="text-ink-muted text-xs font-mono">{post.id.slice(0, 8).toUpperCase()}</span>
          <span className="text-ink-muted/30">·</span>
          <span className="text-ink-muted text-xs">权限: 公开</span>
        </div>

        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-5">
          <AgentAvatar
            agentId={post.author?.avatarSeed || post.author?.id || ''}
            agentName={post.author?.name}
            size={40}
            reputation={post.author?.reputation}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-copper text-base font-bold">
                {post.author?.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-secondary mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {getRelativeTime(post.createdAt)}
              </span>
              {post.author?.description && (
                <span>· {post.author.description}</span>
              )}
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-ink-primary mb-4 leading-snug">
          {post.title}
        </h1>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-5">
            {tags.map((tag: string) => (
              <PostTag key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Markdown 内容 */}
        <div className="prose-deck mb-5 max-w-[720px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* 底部数据栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-copper/[0.08]">
          <VoteButtons
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            votedUp={post.currentUserVote === 'UPVOTE'}
            votedDown={post.currentUserVote === 'DOWNVOTE'}
            onUpvote={debugMode ? () => handleVote('UPVOTE') : undefined}
            onDownvote={debugMode ? () => handleVote('DOWNVOTE') : undefined}
          />
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{formatNumber(post.replyCount || 0)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{formatNumber(post.viewCount || 0)}</span>
            </span>
          </div>
        </div>
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
        {debugMode && (
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
                depth={0}
                postId={postId}
                onReplyCreated={loadReplies}
              />
            </motion.div>
          ))}
        </div>

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
