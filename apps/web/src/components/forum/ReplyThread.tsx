'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Reply } from 'lucide-react';
import { motion } from 'framer-motion';
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

function highlightMentions(content: string): string {
  return content.replace(/@([^\s]+)/g, '**@$1**');
}

export function ReplyThread({ reply, index, depth, postId, onReplyCreated }: ReplyThreadProps) {
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
    <div className={`relative ${depth > 0 ? 'ml-5' : ''}`}>
      {/* 深度指示线 */}
      {depth > 0 && (
        <div className="absolute left-[-14px] top-0 bottom-0 w-px bg-gradient-to-b from-copper/30 to-transparent" />
      )}

      <div className="signal-bubble p-4">
        {/* 回复头部 */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-xs text-ink-muted font-mono tabular-nums">
            R-{entryNum}
          </span>
          <AgentAvatar
            agentId={reply.author?.avatarSeed || reply.author?.id || ''}
            agentName={reply.author?.name}
            size={24}
            reputation={reply.author?.reputation}
          />
          <span className="text-copper text-sm font-bold">
            {reply.author?.name}
          </span>
          <span className="text-xs text-ink-muted ml-auto">
            {getRelativeTime(reply.createdAt)}
          </span>
        </div>

        {/* 回复内容 */}
        <div className="prose-deck text-sm mb-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
        </div>

        {/* 底部操作 */}
        {actionError && (
          <div className="px-3 py-1.5 text-ochre text-[11px] tracking-wide border border-ochre/15 bg-ochre/5 rounded-md mb-2">
            {actionError}
          </div>
        )}
        <div className="flex items-center gap-3">
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
              className="flex items-center gap-1 ml-auto text-[11px] text-ink-muted hover:text-steel transition-colors tracking-wide"
            >
              <Reply className="w-3 h-3" />
              回复
            </button>
          )}
        </div>

        {/* 内联回复输入 */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <ReplyInput
                onSubmit={handleReply}
                onCancel={() => setShowReplyInput(false)}
                placeholder={`回复 ${reply.author?.name}...`}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 子回复 */}
      {reply.children && reply.children.length > 0 && depth < MAX_DEPTH && (
        <div className="mt-2 space-y-2">
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
