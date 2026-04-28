'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Reply } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { AgentLevelBadge } from '@/components/ui/AgentLevelBadge';
import { FeedbackBar, hasVisibleFeedback } from './FeedbackBar';
import { ReplyInput } from './ReplyInput';
import { ApiError, forumApi } from '@/lib/api';
import { notifyProgressionUpdated } from '@/lib/progression-events';
import { getRelativeTime } from '@/lib/utils';
import { useOwnerOperation } from '@/contexts/OwnerOperationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedbackType, ForumReply } from '@skynet/shared';

interface ReplyThreadProps {
  reply: ForumReply;
  index: number;
  postId: string;
  onReplyCreated: () => void;
}

interface ChildReplyItemProps {
  child: ForumReply;
  childIndex: number;
  parentAuthorName?: string;
  onReplyUpdated: () => void;
}

function highlightMentions(content: string): string {
  return content.replace(/@([^\s]+)/g, '**@$1**');
}

function getAgentOperationUnavailableReason(
  isAuthenticated: boolean,
  hasAgent: boolean,
  ownerOperationEnabled: boolean,
) {
  if (!isAuthenticated) return '登录后才能模拟 Agent 进行操作';
  if (!hasAgent) return '当前用户未关联 Agent';
  if (!ownerOperationEnabled) return '在设置页开启“允许主人代 Agent 操作”后才能操作';
  return undefined;
}

function getFeedbackUnavailableReason(
  isOwnContent: boolean,
  isAuthenticated: boolean,
  hasAgent: boolean,
  ownerOperationEnabled: boolean,
) {
  if (isOwnContent) return '不能评价自己的回复';
  const operationReason = getAgentOperationUnavailableReason(
    isAuthenticated,
    hasAgent,
    ownerOperationEnabled,
  );
  if (operationReason) return operationReason.replace('操作', '评价');
  return undefined;
}

export function ReplyThread({
  reply,
  index,
  postId,
  onReplyCreated,
}: ReplyThreadProps) {
  const router = useRouter();
  const entryNum = String(index + 1).padStart(2, '0');
  const { ownerOperationEnabled, canOperateAsAgent } = useOwnerOperation();
  const { agent, isAuthenticated } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!canOperateAsAgent) setShowReplyInput(false);
  }, [canOperateAsAgent]);

  const hasAgent = !!agent;
  const isOwnReply = agent?.id === reply.author?.id;
  const feedbackReason = getFeedbackUnavailableReason(
    isOwnReply,
    isAuthenticated,
    hasAgent,
    ownerOperationEnabled,
  );
  const canFeedback = canOperateAsAgent && !feedbackReason;
  const showFeedback = hasVisibleFeedback(reply.feedbackCounts);

  const handleFeedback = async (type: FeedbackType) => {
    if (!canFeedback) {
      if (feedbackReason) setActionError(feedbackReason);
      return;
    }
    setActionError('');
    try {
      const result = await forumApi.feedbackOnReply(reply.id, type);
      if (result.progressDelta) notifyProgressionUpdated();
      onReplyCreated();
    } catch (err) {
      console.error('回复反馈失败:', err);
      setActionError(err instanceof ApiError ? err.message : '反馈失败');
    }
  };

  const handleReply = async (content: string) => {
    const unavailableReason = getAgentOperationUnavailableReason(
      isAuthenticated,
      hasAgent,
      ownerOperationEnabled,
    );
    if (!canOperateAsAgent || unavailableReason) {
      if (unavailableReason) setActionError(unavailableReason);
      return;
    }
    setActionError('');
    try {
      const created = await forumApi.createReply(postId, {
        content,
        parentReplyId: reply.id,
      });
      if (created.progressDelta) notifyProgressionUpdated();
      setShowReplyInput(false);
      onReplyCreated();
    } catch (err) {
      console.error('创建回复失败:', err);
      setActionError(err instanceof ApiError ? err.message : '回复失败');
    }
  };

  const processedContent = highlightMentions(reply.content);

  return (
    <div
      id={`reply-${reply.id}`}
      data-testid={`reply-${reply.id}`}
      className="relative scroll-mt-28"
    >
      <div
        className="rounded-lg border border-copper/10 bg-void-deep/70 px-3.5 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            R-{entryNum}
          </span>
          <button
            type="button"
            className="group/author flex min-w-0 items-center gap-2 text-left"
            onClick={() => router.push(`/agent/${reply.author?.id}`)}
          >
            <AgentAvatar
              agentId={reply.author?.avatarSeed || reply.author?.id || ''}
              agentName={reply.author?.name}
              size={24}
            />
            <span className="truncate text-sm font-bold text-copper group-hover/author:underline">
              {reply.author?.name}
            </span>
            <AgentLevelBadge level={reply.author?.level} compact />
          </button>
          <span className="ml-auto text-[11px] text-ink-muted">
            {getRelativeTime(reply.createdAt)}
          </span>
        </div>

        <div className="prose-deck mb-2.5 text-[13px] leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {processedContent}
          </ReactMarkdown>
        </div>

        {actionError && (
          <div className="mb-2 rounded-md border border-ochre/15 bg-ochre/5 px-3 py-1.5 text-[11px] tracking-wide text-ochre">
            {actionError}
          </div>
        )}

        {(showFeedback || canOperateAsAgent || feedbackReason) && (
          <div className="flex flex-col gap-2 border-t border-copper/[0.08] pt-2 sm:flex-row sm:items-center">
            {(showFeedback || canFeedback || feedbackReason) && (
              <FeedbackBar
                counts={reply.feedbackCounts}
                currentFeedback={reply.currentUserFeedback}
                canInteract={canFeedback}
                unavailableReason={feedbackReason}
                density="compact"
                onSelect={handleFeedback}
                onUnavailable={() => {
                  if (feedbackReason) setActionError(feedbackReason);
                }}
              />
            )}
            {canOperateAsAgent && (
              <button
                type="button"
                aria-expanded={showReplyInput}
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="inline-flex items-center gap-1 text-[11px] text-ink-muted transition-colors hover:text-steel sm:ml-auto"
              >
                <Reply className="w-3 h-3" />
                回复
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {canOperateAsAgent && showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
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

      {reply.children && reply.children.length > 0 && (
        <div className="ml-3 mt-2 space-y-2 border-l border-copper/15 pl-3 sm:ml-6 sm:pl-4">
          {reply.children.map((child: ForumReply, childIndex: number) => (
            <ChildReplyItem
              key={child.id}
              child={child}
              childIndex={childIndex}
              parentAuthorName={reply.author?.name}
              onReplyUpdated={onReplyCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildReplyItem({
  child,
  childIndex,
  parentAuthorName,
  onReplyUpdated,
}: ChildReplyItemProps) {
  const router = useRouter();
  const { ownerOperationEnabled, canOperateAsAgent } = useOwnerOperation();
  const { agent, isAuthenticated } = useAuth();
  const [actionError, setActionError] = useState('');
  const childNum = String(childIndex + 1).padStart(2, '0');
  const processedContent = highlightMentions(child.content);
  const hasAgent = !!agent;
  const isOwnReply = agent?.id === child.author?.id;
  const feedbackReason = getFeedbackUnavailableReason(
    isOwnReply,
    isAuthenticated,
    hasAgent,
    ownerOperationEnabled,
  );
  const canFeedback = canOperateAsAgent && !feedbackReason;
  const showFeedback = hasVisibleFeedback(child.feedbackCounts);

  const handleFeedback = async (type: FeedbackType) => {
    if (!canFeedback) {
      if (feedbackReason) setActionError(feedbackReason);
      return;
    }
    setActionError('');
    try {
      const result = await forumApi.feedbackOnReply(child.id, type);
      if (result.progressDelta) notifyProgressionUpdated();
      onReplyUpdated();
    } catch (err) {
      console.error('二级回复反馈失败:', err);
      setActionError(err instanceof ApiError ? err.message : '反馈失败');
    }
  };

  return (
    <div
      id={`reply-${child.id}`}
      data-testid={`reply-${child.id}`}
      className="relative scroll-mt-28 rounded-md border border-steel/10 bg-steel/[0.04] px-3 py-2.5"
    >
      <div className="absolute -left-[17px] top-4 hidden h-px w-4 bg-copper/20 sm:block" />
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span className="font-mono tabular-nums text-steel/80">支线-{childNum}</span>
        {parentAuthorName && (
          <span className="text-ink-muted">
            回复 <span className="text-steel">@{parentAuthorName}</span>
          </span>
        )}
        <button
          type="button"
          className="group/author flex min-w-0 items-center gap-1.5 text-left"
          onClick={() => router.push(`/agent/${child.author?.id}`)}
        >
          <AgentAvatar
            agentId={child.author?.avatarSeed || child.author?.id || ''}
            agentName={child.author?.name}
            size={20}
          />
          <span className="truncate font-bold text-copper group-hover/author:underline">
            {child.author?.name}
          </span>
          <AgentLevelBadge level={child.author?.level} compact />
        </button>
        <span className="ml-auto text-ink-muted">{getRelativeTime(child.createdAt)}</span>
      </div>

      <div className="prose-deck mb-2 text-[12px] leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {processedContent}
        </ReactMarkdown>
      </div>

      {actionError && (
        <div className="mb-2 rounded-md border border-ochre/15 bg-ochre/5 px-3 py-1.5 text-[11px] tracking-wide text-ochre">
          {actionError}
        </div>
      )}

      {(showFeedback || canFeedback || feedbackReason) && (
        <FeedbackBar
          counts={child.feedbackCounts}
          currentFeedback={child.currentUserFeedback}
          canInteract={canFeedback}
          unavailableReason={feedbackReason}
          density="compact"
          onSelect={handleFeedback}
          onUnavailable={() => {
            if (feedbackReason) setActionError(feedbackReason);
          }}
        />
      )}
    </div>
  );
}
