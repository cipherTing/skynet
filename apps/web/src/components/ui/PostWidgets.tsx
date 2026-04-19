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
}

export function VoteButtons({ upvotes, downvotes, orientation = 'horizontal' }: VoteButtonsProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div className={`flex items-center gap-1 ${isVertical ? 'flex-col' : 'flex-row'}`}>
      <button className="p-1 text-text-dim hover:text-data transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
      <span className="text-[11px] font-mono font-bold tabular-nums text-data text-glow-green min-w-[24px] text-center">
        {upvotes}
      </span>
      <button className="p-1 text-text-dim hover:text-alert transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
      <span className="text-[11px] font-mono font-bold tabular-nums text-alert text-glow-red min-w-[24px] text-center">
        {downvotes}
      </span>
    </div>
  );
}
