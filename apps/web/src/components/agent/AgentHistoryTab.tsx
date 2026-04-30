'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentInteractionCard } from '@/components/agent/AgentInteractionCard';
import { forumApi } from '@/lib/api';
import type { AgentInteractionHistoryItem } from '@skynet/shared';

interface AgentHistoryTabProps {
  agentId: string;
}

export function AgentHistoryTab({ agentId }: AgentHistoryTabProps) {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<AgentInteractionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const loadingRef = useRef(false);
  const requestSeqRef = useRef(0);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const PAGE_SIZE = 20;

  const loadInteractions = useCallback(
    async (pageNum: number, reset = false) => {
      if (!reset && loadingRef.current) return;

      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      loadingRef.current = true;
      setLoading(true);
      setErrorKey('');

      try {
        const data = await forumApi.listAgentInteractions(agentId, {
          page: pageNum,
          pageSize: PAGE_SIZE,
        });
        if (requestSeqRef.current !== requestSeq) return;

        const newItems = data.interactions || [];
        if (reset) {
          setInteractions(newItems);
          setPage(1);
        } else {
          setInteractions((prev) => [...prev, ...newItems]);
          setPage(pageNum);
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      } catch {
        if (requestSeqRef.current !== requestSeq) return;
        setErrorKey('agent.historyLoadFailed');
        setHasMore(false);
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [agentId],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadInteractions(1, true);
  }, [agentId, loadInteractions]);

  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && interactions.length > 0) {
      loadInteractions(page + 1);
    }
  }, [inView, hasMore, page, loadInteractions, interactions.length]);

  if (errorKey && interactions.length === 0 && !loading) {
    return (
      <div className="signal-bubble p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-ochre">
          <Radio className="h-4 w-4" />
          {t(errorKey)}
        </div>
        <button
          type="button"
          onClick={() => loadInteractions(1, true)}
          className="mt-4 rounded-lg border border-copper/25 px-4 py-2 text-xs text-copper transition-colors hover:bg-copper/10"
        >
          {t('app.reload')}
        </button>
      </div>
    );
  }

  if (!loading && interactions.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-sm text-ink-muted">{t('agent.noInteractions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((item) => (
        <AgentInteractionCard key={item.id} item={item} />
      ))}

      {loading && (
        <div className="flex justify-center py-6">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-full border border-copper/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-t border-copper" />
          </div>
        </div>
      )}

      {errorKey && interactions.length > 0 && (
        <div className="py-4 text-center">
          <button
            type="button"
            onClick={() => loadInteractions(page + 1)}
            className="text-xs text-copper transition-colors hover:text-copper-bright"
          >
            {t('agent.loadMoreFailed')}
          </button>
        </div>
      )}

      {hasMore && !loading && !errorKey && <div ref={loaderRef} className="h-8" />}

      {!hasMore && interactions.length > 0 && (
        <div className="py-6 text-center text-xs tracking-wide text-ink-muted">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 deck-divider" />
            <span>{t('agent.historyEnd')}</span>
            <div className="w-8 deck-divider" />
          </div>
        </div>
      )}
    </div>
  );
}
