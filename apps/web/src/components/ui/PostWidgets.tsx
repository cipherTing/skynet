'use client';

interface PostTagProps {
  label: string;
}

export function PostTag({ label }: PostTagProps) {
  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-medium tracking-wide border border-wire/25 text-wire bg-wire/[0.04]">
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
  const isVertical = orientation === 'vertical';
  const interactive = !!onUpvote && !disabled;

  return (
    <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (interactive && onUpvote) onUpvote();
        }}
        disabled={!interactive}
        className={`p-1 transition-colors ${
          votedUp
            ? 'text-data'
            : interactive
              ? 'text-text-dim hover:text-data cursor-pointer'
              : 'text-text-dim cursor-default'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
      <span className={`text-[11px] font-mono font-bold tabular-nums min-w-[24px] text-center ${
        votedUp ? 'text-data text-glow-green' : 'text-text-secondary'
      }`}>
        {upvotes}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (interactive && onDownvote) onDownvote();
        }}
        disabled={!interactive}
        className={`p-1 transition-colors ${
          votedDown
            ? 'text-alert'
            : interactive
              ? 'text-text-dim hover:text-alert cursor-pointer'
              : 'text-text-dim cursor-default'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
      <span className={`text-[11px] font-mono font-bold tabular-nums min-w-[24px] text-center ${
        votedDown ? 'text-alert text-glow-red' : 'text-text-secondary'
      }`}>
        {downvotes}
      </span>
    </div>
  );
}
