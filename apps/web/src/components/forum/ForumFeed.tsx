'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Flame, Clock } from 'lucide-react';
import { PostCard } from './PostCard';
import { mockPosts, type MockPost } from '@/lib/mock-data';

type SortMode = 'hot' | 'latest';

export function ForumFeed() {
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 5;

  const getSortedPosts = useCallback(
    (mode: SortMode) => {
      const sorted = [...mockPosts];
      if (mode === 'hot') {
        sorted.sort((a, b) => {
          const scoreA = a.upvotes - a.downvotes + a.replyCount * 2;
          const scoreB = b.upvotes - b.downvotes + b.replyCount * 2;
          return scoreB - scoreA;
        });
      } else {
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
      return sorted;
    },
    [],
  );

  const loadPosts = useCallback(
    (mode: SortMode, pageNum: number, reset = false) => {
      setLoading(true);
      setTimeout(() => {
        const all = getSortedPosts(mode);
        const start = (pageNum - 1) * PAGE_SIZE;
        const slice = all.slice(start, start + PAGE_SIZE);
        if (reset) {
          setPosts(slice);
        } else {
          setPosts((prev) => [...prev, ...slice]);
        }
        setHasMore(start + PAGE_SIZE < all.length);
        setLoading(false);
      }, 50);
    },
    [getSortedPosts],
  );

  useEffect(() => {
    loadPosts(sortMode, 1, true);
  }, [sortMode, loadPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(sortMode, nextPage);
        }
      },
      { threshold: 0.5 },
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, page, sortMode, loadPosts]);

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return;
    setSortMode(mode);
    setPage(1);
    setHasMore(true);
  };

  return (
    <div>
      {/* 排序标签 */}
      <div className="flex items-center gap-0 mb-4 border border-nerv/20">
        <SortTab
          icon={<Flame className="w-3.5 h-3.5" />}
          label="热门"
          active={sortMode === 'hot'}
          onClick={() => handleSortChange('hot')}
        />
        <div className="w-px h-6 bg-nerv/20" />
        <SortTab
          icon={<Clock className="w-3.5 h-3.5" />}
          label="最新"
          active={sortMode === 'latest'}
          onClick={() => handleSortChange('latest')}
        />
        <div className="flex-1 px-4 text-right">
          <span className="text-[11px] text-text-dim tracking-wide">
            共 {mockPosts.length} 条
          </span>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="space-y-2">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingIndicator />
          </div>
        )}

        {hasMore && !loading && <div ref={loaderRef} className="h-8" />}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-[11px] text-text-dim tracking-wide">
            ━━━ 数据流终端 ━━━
          </div>
        )}
      </div>
    </div>
  );
}

function SortTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium tracking-wide transition-colors ${
        active
          ? 'text-nerv bg-nerv/[0.08] border-b-2 border-nerv'
          : 'text-text-secondary hover:text-nerv'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="led led-orange animate-led-blink" />
      <span className="text-[12px] text-nerv tracking-wide">
        数据加载中...
      </span>
    </div>
  );
}
