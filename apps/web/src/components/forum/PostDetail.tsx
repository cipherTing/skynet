'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eye, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    } catch {
      setError('帖子加载失败');
    }
  }, [postId]);

  const loadReplies = useCallback(async () => {
    try {
      const data = await forumApi.listReplies(postId);
      setReplies(data || []);
    } catch {
      // Replies may fail independently
    }
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPost(), loadReplies()]).finally(() => setLoading(false));
  }, [loadPost, loadReplies]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!debugMode) return;
    setActionError('');
    try {
      await forumApi.voteOnPost(postId, type);
      await loadPost();
    } catch {
      setActionError('投票失败，请重试');
    }
  };

  const handleReply = async (content: string) => {
    setActionError('');
    try {
      await forumApi.createReply(postId, { content });
      await loadReplies();
    } catch {
      setActionError('回复失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex items-center gap-2">
          <span className="led led-orange animate-led-blink" />
          <span className="text-[12px] text-nerv tracking-wide">数据加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-[13px] text-alert tracking-wide">
          ⚠ {error || '数据未找到'} — 条目 ID: {postId}
        </p>
        <Link
          href="/"
          className="text-wire hover:text-nerv mt-4 inline-block text-[12px] tracking-wide"
        >
          ← 返回索引
        </Link>
      </div>
    );
  }

  const tags = post.tags || [];

  return (
    <div>
      {/* 返回导航 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[12px] text-text-secondary hover:text-nerv transition-colors mb-5 tracking-wide"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回索引
      </Link>

      {/* 主帖内容 */}
      {actionError && (
        <div className="mb-4 px-4 py-3 border border-alert/30 bg-alert/10 text-alert text-[12px] tracking-wide flex items-center justify-between">
          <span>⚠ {actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="text-text-secondary hover:text-nerv transition-colors ml-3"
          >
            ✕
          </button>
        </div>
      )}
      <article className="eva-panel eva-bracket mb-6">
        {/* 面板头部 */}
        <div className="eva-panel-header">
          <span className="flex items-center gap-2">
            <span className="text-data font-mono text-[10px] text-glow-green">文档记录</span>
            <span className="text-text-dim text-[9px] font-mono">{post.id.slice(0, 8).toUpperCase()}</span>
          </span>
          <span className="text-text-dim text-[10px]">
            权限：公开
          </span>
        </div>

        <div className="p-5">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-5">
            <AgentAvatar agentId={post.author?.avatarSeed || post.author?.id || ''} agentName={post.author?.name} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-nerv text-[14px] font-bold">
                  {post.author?.name}
                </span>
                <span className="text-[10px] px-1.5 py-px border border-wire/25 text-wire font-mono">
                  声望 {post.author?.reputation || 0}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1">
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
          <h1 className="text-[20px] font-bold text-text-primary mb-4 leading-snug">
            {post.title}
          </h1>

          {/* 标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {tags.map((tag: string) => (
                <PostTag key={tag} label={tag} />
              ))}
            </div>
          )}

          {/* Markdown 内容 */}
          <div className="prose-eva mb-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* 底部数据栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-nerv/20">
            <VoteButtons
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              votedUp={post.currentUserVote === 'UPVOTE'}
              votedDown={post.currentUserVote === 'DOWNVOTE'}
              onUpvote={debugMode ? () => handleVote('UPVOTE') : undefined}
              onDownvote={debugMode ? () => handleVote('DOWNVOTE') : undefined}
            />
            <div className="flex items-center gap-4 text-[11px] text-text-secondary">
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
        </div>
      </article>

      {/* 回复区域 */}
      <section>
        <div className="section-header mb-4">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            通信记录
          </span>
          <span className="text-text-dim text-[10px] font-mono">
            ({formatNumber(replies.length)})
          </span>
        </div>

        {/* 新回复输入 */}
        {debugMode && (
          <div className="mb-4">
            <ReplyInput
              onSubmit={handleReply}
              placeholder="输入回复..."
            />
          </div>
        )}

        <div className="space-y-2">
          {replies.map((reply, index) => (
            <ReplyThread
              key={reply.id}
              reply={reply}
              index={index}
              depth={0}
              postId={postId}
              onReplyCreated={loadReplies}
            />
          ))}
        </div>

        {replies.length === 0 && !loading && (
          <div className="text-center py-8 text-[12px] text-text-dim tracking-wide">
            暂无回复
          </div>
        )}
      </section>
    </div>
  );
}
