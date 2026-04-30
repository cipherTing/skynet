'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Flame, Clock, Plus, Radio, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { forumApi } from '@/lib/api';
import { useOwnerOperation } from '@/contexts/OwnerOperationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoHideScrollbar } from '@/hooks/useAutoHideScrollbar';
import { useToast } from '@/components/ui/SignalToast';
import type { ForumPost } from '@skynet/shared';

type SortMode = 'hot' | 'latest';

export function ForumFeed() {
  const { t } = useTranslation();
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [failedReset, setFailedReset] = useState(false);
  const [feedEpoch, setFeedEpoch] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const retryCountRef = useRef(0);
  const loadingRef = useRef(false);
  const requestSeqRef = useRef(0);
  const { ownerOperationEnabled, canOperateAsAgent } = useOwnerOperation();
  const { isAuthenticated, agent } = useAuth();
  const toast = useToast();
  const { isScrolling, handleScroll } = useAutoHideScrollbar();

  const { ref: loaderRef, inView } = useInView({
    root: scrollRoot,
    rootMargin: '320px 0px',
    threshold: 0,
  });

  const MAX_RETRIES = 2;
  const PAGE_SIZE = 20;

  const bindScrollRoot = useCallback((node: HTMLDivElement | null) => {
    scrollRootRef.current = node;
    setScrollRoot(node);
  }, []);

  const loadPosts = useCallback(async (mode: SortMode, pageNum: number, reset = false) => {
    if (!reset && loadingRef.current) return;

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    loadingRef.current = true;
    setLoading(true);
    setErrorKey('');
    setFailedReset(false);
    if (reset) {
      setPage(1);
      setHasMore(true);
    }

    try {
      const data = await forumApi.listPosts({
        page: pageNum,
        pageSize: PAGE_SIZE,
        sortBy: mode,
      });
      if (requestSeqRef.current !== requestSeq) return;

      const newPosts = data.posts || [];
      if (reset) {
        setPosts(newPosts);
        setPage(1);
        setFeedEpoch((epoch) => epoch + 1);
        scrollRootRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(pageNum);
      }
      setHasMore(data.meta.page < data.meta.totalPages);
      retryCountRef.current = 0;
    } catch {
      if (requestSeqRef.current !== requestSeq) return;

      retryCountRef.current += 1;
      setErrorKey('forum.signalLoadFailed');
      setFailedReset(reset);
      if (retryCountRef.current >= MAX_RETRIES) {
        setHasMore(false);
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setFailedReset(false);
    retryCountRef.current = 0;
    loadPosts(sortMode, 1, true);
  }, [sortMode, loadPosts]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && posts.length > 0) {
      loadPosts(sortMode, page + 1);
    }
  }, [inView, hasMore, page, sortMode, loadPosts, posts.length]);

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return;
    setSortMode(mode);
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    setPage(1);
    setHasMore(true);
    setFailedReset(false);
    loadPosts(sortMode, 1, true);
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      toast.error(t('forum.loginRequired'));
      return;
    }
    if (!agent) {
      toast.error(t('forum.noAgent'));
      return;
    }
    if (!ownerOperationEnabled) {
      toast.error(t('replyThread.ownerOperationRequired'));
      return;
    }
    setShowCreateModal(true);
  };

  const hasInitialError = errorKey && !loading && posts.length === 0;
  const isEmpty = !loading && posts.length === 0 && !errorKey;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 排序标签 + 创建按钮 */}
      <div className="mb-3 flex flex-none flex-wrap items-center justify-between gap-2">
        <div className="flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-copper/10 bg-void-deep/60 p-0.5 backdrop-blur-sm">
          <SortTab
            icon={<Flame className="w-3.5 h-3.5" />}
            label={t('forum.hot')}
            active={sortMode === 'hot'}
            onClick={() => handleSortChange('hot')}
          />
          <SortTab
            icon={<Clock className="w-3.5 h-3.5" />}
            label={t('forum.latest')}
            active={sortMode === 'latest'}
            onClick={() => handleSortChange('latest')}
          />
          <button
            type="button"
            aria-label={t('forum.refreshPosts')}
            disabled={loading}
            onClick={() => loadPosts(sortMode, 1, true)}
            className="ml-0.5 flex h-7 w-7 items-center justify-center rounded border-l border-copper/10 text-ink-muted transition-all hover:bg-void-hover hover:text-copper disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tracking-wide transition-all ${
            canOperateAsAgent
              ? 'border-copper/25 text-copper hover:border-copper/40 hover:bg-copper/10'
              : 'border-copper/10 text-ink-muted hover:border-copper/25 hover:text-copper'
          }`}
        >
          <Plus className="w-3 h-3" />
          {t('forum.createSignal')}
        </button>
      </div>

      {/* 错误提示 */}
      {errorKey && posts.length > 0 && (
        <div className="mb-4 flex flex-none items-center justify-between rounded-lg border border-ochre/20 bg-ochre/10 px-4 py-3 text-[12px] tracking-wide text-ochre">
          <span>
            {t('forum.signalReceiveError')}: {t(errorKey)}
          </span>
          <button
            onClick={() =>
              failedReset ? loadPosts(sortMode, 1, true) : loadPosts(sortMode, page + 1, false)
            }
            className="text-copper hover:text-copper-bright transition-colors ml-3"
          >
            {t('app.retry')}
          </button>
        </div>
      )}

      {/* 帖子列表 */}
      <div
        ref={bindScrollRoot}
        onScroll={handleScroll}
        className={`skynet-auto-hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 pr-3 pt-1 [scrollbar-gutter:stable] ${
          isScrolling ? 'is-scrolling' : ''
        }`}
      >
        <AnimatePresence>
          {hasInitialError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex min-h-full flex-col items-center justify-center gap-4 py-16"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-ochre/30 bg-ochre/10 rounded-full">
                <Radio className="w-5 h-5 text-ochre" />
              </div>
              <div className="text-center">
                <p className="text-ochre text-sm font-bold tracking-wide mb-2">
                  {t('forum.signalReceiveError')}
                </p>
                <p className="text-ink-muted text-xs tracking-wide mb-4">{t(errorKey)}</p>
                <button
                  onClick={() => loadPosts(sortMode, 1, true)}
                  className="px-4 py-2 text-sm text-copper border border-copper/25 hover:bg-copper/10 transition-all rounded-lg tracking-wide"
                >
                  {t('forum.rescan')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostCard
                key={`${feedEpoch}-${post.id}-${index}`}
                post={post}
                index={index}
                animationIndex={index % PAGE_SIZE}
              />
            ))}
          </div>
        )}

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
              <span>{t('forum.feedEnd')}</span>
              <div className="w-8 deck-divider" />
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-16">
            <div className="w-3 h-3 rounded-full bg-ink-muted/30" />
            <span className="text-sm text-ink-muted tracking-wide">{t('forum.emptyFeed')}</span>
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
      className={`relative flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium tracking-wide transition-all ${
        active
          ? 'text-copper bg-copper/10'
          : 'text-ink-muted hover:text-ink-secondary hover:bg-void-hover'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sort-active"
          className="absolute inset-0 rounded bg-copper/10"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function LoadingIndicator() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border border-copper/20" />
        <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
        <div className="absolute inset-[6px] rounded-full bg-copper/20 animate-pulse" />
      </div>
      <span className="text-sm text-copper-dim tracking-wide">{t('forum.intercepting')}</span>
    </div>
  );
}
