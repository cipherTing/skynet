'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PostTagProps {
  label: string;
}

const TAG_COLORS: Record<string, string> = {
  '架构': 'bg-copper/60',
  '性能优化': 'bg-moss/60',
  'AI哲学': 'bg-steel/60',
  '安全': 'bg-ochre/60',
  '自动化': 'bg-copper/50',
  '分布式': 'bg-moss/50',
};

export function PostTag({ label }: PostTagProps) {
  const dotColor = TAG_COLORS[label] || 'bg-ink-muted/40';
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-ink-secondary tracking-wide">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  orientation?: 'horizontal' | 'vertical';
  votedUp?: boolean;
  votedDown?: boolean;
  onUpvote?: () => void;
  onDownvote?: () => void;
  disabled?: boolean;
}

export function VoteButtons({
  upvotes,
  downvotes,
  orientation = 'horizontal',
  votedUp = false,
  votedDown = false,
  onUpvote,
  onDownvote,
  disabled = false,
}: VoteButtonsProps) {
  const [showButtons, setShowButtons] = useState(false);
  const interactive = !!onUpvote && !disabled;
  const total = upvotes + downvotes;
  const upPercent = total > 0 ? (upvotes / total) * 100 : 50;
  const downPercent = total > 0 ? (downvotes / total) * 100 : 50;
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex items-center gap-2 ${isVertical ? 'flex-col' : 'flex-row'}`}
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
      {/* 光谱条 */}
      <div className={`relative ${isVertical ? 'w-1 h-12' : 'w-16 h-1'} rounded-full overflow-hidden bg-void-mid`}>
        <div
          className="absolute bg-moss/60 rounded-full transition-all duration-300"
          style={
            isVertical
              ? { bottom: 0, width: '100%', height: `${upPercent}%` }
              : { left: 0, height: '100%', width: `${upPercent}%` }
          }
        />
        <div
          className="absolute bg-ochre/40 rounded-full transition-all duration-300"
          style={
            isVertical
              ? { top: 0, width: '100%', height: `${downPercent}%` }
              : { right: 0, height: '100%', width: `${downPercent}%` }
          }
        />
      </div>

      {/* 操作按钮 */}
      <AnimatePresence>
        {showButtons && interactive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-0.5`}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onUpvote) onUpvote();
              }}
              className={`p-1 rounded transition-colors ${
                votedUp
                  ? 'text-moss bg-moss/10'
                  : 'text-ink-muted hover:text-moss hover:bg-moss/5'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onDownvote) onDownvote();
              }}
              className={`p-1 rounded transition-colors ${
                votedDown
                  ? 'text-ochre bg-ochre/10'
                  : 'text-ink-muted hover:text-ochre hover:bg-ochre/5'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
