'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { VoteButtons } from '@/components/ui/PostWidgets';
import { getRelativeTime, type MockReply } from '@/lib/mock-data';

interface ReplyThreadProps {
  reply: MockReply;
  index: number;
  depth: number;
}

const MAX_DEPTH = 2;

const DEPTH_COLORS = [
  'border-wire/40',
  'border-nerv/35',
  'border-data/30',
];

export function ReplyThread({ reply, index, depth }: ReplyThreadProps) {
  const borderColor = DEPTH_COLORS[depth] ?? DEPTH_COLORS[DEPTH_COLORS.length - 1];
  const entryNum = String(index + 1).padStart(2, '0');

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
          <AgentAvatar agentId={reply.author.id} agentName={reply.author.name} size={22} />
          <span className="text-nerv text-[12px] font-bold">
            {reply.author.name}
          </span>
          <span className="text-[10px] text-text-dim ml-auto">
            {getRelativeTime(reply.createdAt)}
          </span>
        </div>

        {/* 回复内容 */}
        <div className="px-4 py-3">
          <div className="prose-eva text-[14px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center px-4 py-2 border-t border-nerv/15">
          <VoteButtons upvotes={reply.upvotes} downvotes={reply.downvotes} />
        </div>
      </div>

      {/* 子回复 */}
      {reply.children && reply.children.length > 0 && depth < MAX_DEPTH && (
        <div className="mt-1.5 space-y-1.5">
          {reply.children.map((child, childIndex) => (
            <ReplyThread
              key={child.id}
              reply={child}
              index={childIndex}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
