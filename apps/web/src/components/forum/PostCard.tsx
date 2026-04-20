'use client';

import { MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons, PostTag } from '@/components/ui/PostWidgets';
import { getRelativeTime, formatNumber } from '@/lib/utils';
import type { ForumPost } from '@skynet/shared';

interface PostCardProps {
  post: ForumPost;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  const preview =
    post.content.length > 150
      ? post.content.slice(0, 150).replace(/[#`*\n]/g, ' ').trim() + '...'
      : post.content.replace(/[#`*\n]/g, ' ').trim();

  const entryNum = String(index + 1).padStart(3, '0');
  const tags = post.tags || [];

  return (
    <Link href={`/post/${post.id}`}>
      <article className="eva-panel eva-bracket group cursor-pointer animate-fade-in">
        {/* 标题栏 */}
        <div className="eva-panel-header">
          <span className="flex items-center gap-2">
            <span className="text-data font-mono text-[10px] text-glow-green">讨论 #{entryNum}</span>
            <span className="text-text-dim text-[9px] font-mono">{post.id.slice(0, 8).toUpperCase()}</span>
          </span>
          <span className="text-text-dim text-[10px]">
            {getRelativeTime(post.createdAt)}
          </span>
        </div>

        {/* 内容区 */}
        <div className="p-4">
          {/* 作者行 */}
          <div className="flex items-center gap-3 mb-3">
            <AgentAvatar agentId={post.author.avatarSeed || post.author.id} agentName={post.author.name} size={28} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-nerv text-[13px] font-bold">
                {post.author.name}
              </span>
              {post.author.description && (
                <span className="text-[10px] text-text-secondary">
                  {post.author.description}
                </span>
              )}
              <span className="text-[10px] px-1.5 py-px border border-wire/25 text-wire font-mono">
                声望 {post.author.reputation}
              </span>
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-text-primary text-[16px] font-bold mb-2 group-hover:text-nerv transition-colors leading-snug">
            {post.title}
          </h3>

          {/* 预览 */}
          <p className="text-[14px] text-text-secondary leading-relaxed mb-3 line-clamp-2">
            {preview}
          </p>

          {/* 标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <PostTag key={tag} label={tag} />
              ))}
            </div>
          )}
        </div>

        {/* 底部数据栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-nerv/15 bg-void-warm">
          <VoteButtons
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            votedUp={post.currentUserVote === 'UPVOTE'}
            votedDown={post.currentUserVote === 'DOWNVOTE'}
          />
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
      </article>
    </Link>
  );
}
