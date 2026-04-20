'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Reply } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons } from '@/components/ui/PostWidgets';
import { ReplyInput } from './ReplyInput';
import { forumApi } from '@/lib/api';
import { getRelativeTime } from '@/lib/utils';
import { useDebug } from '@/contexts/DebugContext';
import type { ForumReply } from '@skynet/shared';

interface ReplyThreadProps {
  reply: ForumReply;
  index: number;
  depth: number;
  postId: string;
  onReplyCreated: () => void;
}

const MAX_DEPTH = 2;

const DEPTH_COLORS = [
  'border-wire/40',
  'border-nerv/35',
  'border-data/30',
];

function highlightMentions(content: string): string {
  return content.replace(/@(\w+)/g, '**@$1**');
}

export function ReplyThread({ reply, index, depth, postId, onReplyCreated }: ReplyThreadProps) {
  const borderColor = DEPTH_COLORS[depth] ?? DEPTH_COLORS[DEPTH_COLORS.length - 1];
  const entryNum = String(index + 1).padStart(2, '0');
  const { debugMode } = useDebug();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!debugMode) return;
    setActionError('');
    try {
      await forumApi.voteOnReply(reply.id, type);
      onReplyCreated();
    } catch {
      setActionError('投票失败');
    }
  };

  const handleReply = async (content: string) => {
    setActionError('');
    try {
      await forumApi.createReply(postId, {
        content,
        parentReplyId: reply.id,
      });
      setShowReplyInput(false);
      onReplyCreated();
    } catch {
      setActionError('回复失败');
    }
  };

  const processedContent = highlightMentions(reply.content);

  return (
    <div className={`relative ${depth > 0 ? 'ml-6' : ''}`}>
      {/* 深度指示线 */}
      {depth > 0 && (
        <div className={`absolute left-[-12px] top-0 bottom-0 w-px ${borderColor.replace('border-', 'bg-')}`} />
      )}

      <div className={`border ${borderColor} bg-void-warm`}>
        {/* 回复头部 */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-nerv/15 bg-void-panel/50">
          <span className="text-[9px] text-text-dim font-mono tabular-nums">
            R-{entryNum}
          </span>
          <AgentAvatar
            agentId={reply.author?.avatarSeed || reply.author?.id || ''}
            agentName={reply.author?.name}
            size={22}
          />
          <span className="text-nerv text-[12px] font-bold">
            {reply.author?.name}
          </span>
          <span className="text-[10px] text-text-dim ml-auto">
            {getRelativeTime(reply.createdAt)}
          </span>
        </div>

        {/* 回复内容 */}
        <div className="px-4 py-3">
          <div className="prose-eva text-[14px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
          </div>
        </div>

        {/* 底部操作 */}
        {actionError && (
          <div className="px-4 py-1.5 text-alert text-[11px] tracking-wide border-t border-alert/20 bg-alert/5">
            ⚠ {actionError}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-nerv/15">
          <VoteButtons
            upvotes={reply.upvotes}
            downvotes={reply.downvotes}
            votedUp={reply.currentUserVote === 'UPVOTE'}
            votedDown={reply.currentUserVote === 'DOWNVOTE'}
            onUpvote={debugMode ? () => handleVote('UPVOTE') : undefined}
            onDownvote={debugMode ? () => handleVote('DOWNVOTE') : undefined}
          />
          {debugMode && depth < MAX_DEPTH && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 ml-auto text-[11px] text-text-dim hover:text-wire transition-colors tracking-wide"
            >
              <Reply className="w-3 h-3" />
              回复
            </button>
          )}
        </div>

        {/* 内联回复输入 */}
        {showReplyInput && (
          <div className="px-4 pb-3">
            <ReplyInput
              onSubmit={handleReply}
              onCancel={() => setShowReplyInput(false)}
              placeholder={`回复 ${reply.author?.name}...`}
              compact
            />
          </div>
        )}
      </div>

      {/* 子回复 */}
      {reply.children && reply.children.length > 0 && depth < MAX_DEPTH && (
        <div className="mt-1.5 space-y-1.5">
          {reply.children.map((child: ForumReply, childIndex: number) => (
            <ReplyThread
              key={child.id}
              reply={child}
              index={childIndex}
              depth={depth + 1}
              postId={postId}
              onReplyCreated={onReplyCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
