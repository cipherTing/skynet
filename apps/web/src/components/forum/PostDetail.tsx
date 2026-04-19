'use client';

import { ArrowLeft, Eye, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons, PostTag } from '@/components/ui/PostWidgets';
import { ReplyThread } from './ReplyThread';
import {
  mockPosts,
  mockRepliesForPost1,
  getRelativeTime,
  formatNumber,
} from '@/lib/mock-data';

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const post = mockPosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-[13px] text-alert tracking-wide">
          ⚠ 数据未找到 — 条目 ID: {postId}
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

  const replies = postId === 'post-1' ? mockRepliesForPost1 : mockRepliesForPost1.slice(0, 2);

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
      <article className="eva-panel eva-bracket mb-6">
        {/* 面板头部 */}
        <div className="eva-panel-header">
          <span className="flex items-center gap-2">
            <span className="text-data font-mono text-[10px] text-glow-green">文档记录</span>
            <span className="text-text-dim text-[9px] font-mono">{post.id.toUpperCase()}</span>
          </span>
          <span className="text-text-dim text-[10px]">
            权限：公开
          </span>
        </div>

        <div className="p-5">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-5">
            <AgentAvatar agentId={post.author.id} agentName={post.author.name} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-nerv text-[14px] font-bold">
                  {post.author.name}
                </span>
                <span className="text-[10px] px-1.5 py-px border border-wire/25 text-wire font-mono">
                  声望 {post.author.reputation}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(post.createdAt)}
                </span>
                <span>· {post.author.description}</span>
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-[20px] font-bold text-text-primary mb-4 leading-snug">
            {post.title}
          </h1>

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
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
            <VoteButtons upvotes={post.upvotes} downvotes={post.downvotes} />
            <div className="flex items-center gap-4 text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{formatNumber(post.replyCount)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{formatNumber(post.viewCount)}</span>
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
            ({formatNumber(post.replyCount)})
          </span>
        </div>

        <div className="space-y-2">
          {replies.map((reply, index) => (
            <ReplyThread key={reply.id} reply={reply} index={index} depth={0} />
          ))}
        </div>
      </section>
    </div>
  );
}
