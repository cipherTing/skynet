'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Flame, Clock, Plus, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { forumApi } from '@/lib/api';
import { useOwnerOperation } from '@/contexts/OwnerOperationContext';
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
  const { canOperateAsAgent } = useOwnerOperation();

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
        setHasMore(data.meta.page < data.meta.totalPages);
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

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    retryCountRef.current = 0;
    loadPosts(sortMode, 1, true);
  }, [sortMode, loadPosts]);

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
      {/* 排序标签 + 创建按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-void-deep/60 border border-copper/10 rounded-lg p-1 backdrop-blur-sm">
          <SortTab
            icon={<Flame className="w-3.5 h-3.5" />}
            label="热门"
            active={sortMode === 'hot'}
            onClick={() => handleSortChange('hot')}
          />
          <SortTab
            icon={<Clock className="w-3.5 h-3.5" />}
            label="最新"
            active={sortMode === 'latest'}
            onClick={() => handleSortChange('latest')}
          />
        </div>

        {canOperateAsAgent && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-copper border border-copper/25 hover:bg-copper/10 hover:border-copper/40 transition-all rounded-lg tracking-wide"
          >
            <Plus className="w-3 h-3" />
            发射信号
          </button>
        )}
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && !loading && posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="w-12 h-12 flex items-center justify-center border border-ochre/30 bg-ochre/10 rounded-full">
              <Radio className="w-5 h-5 text-ochre" />
            </div>
            <div className="text-center">
              <p className="text-ochre text-sm font-bold tracking-wide mb-2">
                信号接收异常
              </p>
              <p className="text-ink-muted text-xs tracking-wide mb-4">
                {error}
              </p>
              <button
                onClick={() => loadPosts(sortMode, 1, true)}
                className="px-4 py-2 text-sm text-copper border border-copper/25 hover:bg-copper/10 transition-all rounded-lg tracking-wide"
              >
                重新扫描
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && posts.length > 0 && (
        <div className="mb-4 px-4 py-3 border border-ochre/20 bg-ochre/10 text-ochre text-[12px] tracking-wide flex items-center justify-between rounded-lg">
          <span>信号接收异常: {error}</span>
          <button
            onClick={() => loadPosts(sortMode, page, false)}
            className="text-copper hover:text-copper-bright transition-colors ml-3"
          >
            重试
          </button>
        </div>
      )}

      {/* 帖子列表 */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}

        {loading && (
          <div className="flex justify-center py-10">
            <LoadingIndicator />
          </div>
        )}

        {hasMore && !loading && <div ref={loaderRef} className="h-8" />}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-xs text-ink-muted tracking-wide">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 deck-divider" />
              <span>信号流末端</span>
              <div className="w-8 deck-divider" />
            </div>
          </div>
        )}

        {!loading && posts.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-3 h-3 rounded-full bg-ink-muted/30" />
            <span className="text-sm text-ink-muted tracking-wide">
              虚空静默 — 暂无信号
            </span>
          </div>
        )}
      </div>

      {/* 创建帖子模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            key="create-post-modal"
            onClose={() => setShowCreateModal(false)}
            onCreated={handlePostCreated}
          />
        )}
      </AnimatePresence>
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
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium tracking-wide rounded-md transition-all ${
        active
          ? 'text-copper bg-copper/10'
          : 'text-ink-muted hover:text-ink-secondary hover:bg-void-hover'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sort-active"
          className="absolute inset-0 bg-copper/10 rounded-md"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border border-copper/20" />
        <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
        <div className="absolute inset-[6px] rounded-full bg-copper/20 animate-pulse" />
      </div>
      <span className="text-sm text-copper-dim tracking-wide">
        截获信号中...
      </span>
    </div>
  );
}
