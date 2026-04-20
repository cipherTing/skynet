'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Flame, Clock, Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { forumApi } from '@/lib/api';
import { useDebug } from '@/contexts/DebugContext';
import type { ForumPost } from '@skynet/shared';

type SortMode = 'hot' | 'latest';

export function ForumFeed() {
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const retryCountRef = useRef(0);
  const loadingRef = useRef(false);
  const { debugMode } = useDebug();

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });

  const MAX_RETRIES = 2;
  const PAGE_SIZE = 20;

  const loadPosts = useCallback(
    async (mode: SortMode, pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError('');
      try {
        const data = await forumApi.listPosts({
          page: pageNum,
          pageSize: PAGE_SIZE,
          sortBy: mode,
        });
        const newPosts = data.posts || [];
        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
        setHasMore(newPosts.length >= PAGE_SIZE);
        retryCountRef.current = 0;
      } catch {
        retryCountRef.current += 1;
        setError('数据加载失败，请检查网络连接');
        if (retryCountRef.current >= MAX_RETRIES) {
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [],
  );

  // Initial load & sort mode change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    retryCountRef.current = 0;
    loadPosts(sortMode, 1, true);
  }, [sortMode, loadPosts]);

  // Load next page when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && posts.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(sortMode, nextPage);
    }
  }, [inView, hasMore, page, sortMode, loadPosts, posts.length]);

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return;
    setSortMode(mode);
    setPage(1);
    setHasMore(true);
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    setPage(1);
    setHasMore(true);
    loadPosts(sortMode, 1, true);
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
        <div className="flex-1 px-4 flex items-center justify-end gap-3">
          {debugMode && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-nerv border border-nerv/30 hover:bg-nerv/10 transition-colors tracking-wide"
            >
              <Plus className="w-3 h-3" />
              创建帖子
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && !loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 flex items-center justify-center border border-alert/40 bg-alert/10">
            <span className="text-alert text-xl">⚠</span>
          </div>
          <div className="text-center">
            <p className="text-alert text-[13px] font-bold tracking-wide mb-2">
              数据加载失败
            </p>
            <p className="text-text-dim text-[11px] tracking-wide mb-4">
              {error}
            </p>
            <button
              onClick={() => loadPosts(sortMode, 1, true)}
              className="px-4 py-2 text-[12px] text-nerv border border-nerv/30 hover:bg-nerv/10 transition-colors tracking-wide"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {error && posts.length > 0 && (
        <div className="mb-4 px-4 py-3 border border-alert/30 bg-alert/10 text-alert text-[12px] tracking-wide flex items-center justify-between">
          <span>⚠ {error}</span>
          <button
            onClick={() => loadPosts(sortMode, page, false)}
            className="text-nerv hover:text-nerv-hot transition-colors ml-3"
          >
            重试
          </button>
        </div>
      )}

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

        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-12 text-[13px] text-text-dim tracking-wide">
            暂无数据
          </div>
        )}
      </div>

      {/* 创建帖子模态框 */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}
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
