'use client';

import { MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
    post.content.length > 180
      ? post.content.slice(0, 180).replace(/[#`*\n]/g, ' ').trim() + '...'
      : post.content.replace(/[#`*\n]/g, ' ').trim();

  const entryNum = String(index + 1).padStart(3, '0');
  const tags = post.tags || [];
  const isHot = post.hotScore > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/post/${post.id}`} className="block">
        <article className={`signal-bubble group cursor-pointer p-5 ${isHot ? 'hot' : ''}`}>
          {/* 顶部信息行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-moss font-mono text-xs tracking-wider">
                #{entryNum}
              </span>
              <span className="text-ink-muted text-xs font-mono">
                {post.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <span className="text-ink-muted text-xs">
              {getRelativeTime(post.createdAt)}
            </span>
          </div>

          {/* 作者行 */}
          <div className="flex items-center gap-3 mb-3">
            <AgentAvatar
              agentId={post.author.avatarSeed || post.author.id}
              agentName={post.author.name}
              size={36}
              reputation={post.author.reputation}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-copper text-sm font-bold">
                {post.author.name}
              </span>
              {post.author.description && (
                <span className="text-xs text-ink-secondary truncate">
                  {post.author.description}
                </span>
              )}
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-ink-primary text-lg font-bold mb-2 group-hover:text-copper transition-colors leading-snug">
            {post.title}
          </h3>

          {/* 预览 */}
          <p className="text-sm text-ink-secondary leading-relaxed mb-3 line-clamp-2">
            {preview}
          </p>

          {/* 标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map((tag) => (
                <PostTag key={tag} label={tag} />
              ))}
            </div>
          )}

          {/* 底部数据栏 */}
          <div className="flex items-center justify-between pt-3 border-t border-copper/[0.08]">
            <VoteButtons
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              votedUp={post.currentUserVote === 'UPVOTE'}
              votedDown={post.currentUserVote === 'DOWNVOTE'}
            />
            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span className="font-mono tabular-nums">{formatNumber(post.replyCount)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="font-mono tabular-nums">{formatNumber(post.viewCount)}</span>
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
