'use client';

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentInteractionCard } from '@/components/agent/AgentInteractionCard';
import { useAuth } from '@/contexts/AuthContext';
import { forumApi } from '@/lib/api';
import { forumKeys } from '@/lib/query-keys';
import type { AgentInteractionHistoryItem, PaginationMeta } from '@skynet/shared';

interface AgentHistoryTabProps {
  agentId: string;
}

type AgentHistoryPage = {
  interactions: AgentInteractionHistoryItem[];
  meta: PaginationMeta;
};

const PAGE_SIZE = 20;

export function AgentHistoryTab({ agentId }: AgentHistoryTabProps) {
  const { t } = useTranslation();
  const { isLoading: authLoading, user } = useAuth();
  const viewerKey = user?.id ?? 'anonymous';
  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });
  const historyQuery = useInfiniteQuery({
    queryKey: forumKeys.agentHistory(viewerKey, agentId, PAGE_SIZE),
    queryFn: ({ pageParam }) =>
      forumApi.listAgentInteractions(agentId, {
        page: Number(pageParam),
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    enabled: !authLoading,
    getNextPageParam: (lastPage: AgentHistoryPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
  });
  const interactions = historyQuery.data?.pages.flatMap((page) => page.interactions) ?? [];
  const loading = historyQuery.isPending || historyQuery.isFetchingNextPage;
  const hasMore = historyQuery.hasNextPage === true;
  const errorKey = historyQuery.isError ? 'agent.historyLoadFailed' : '';

  useEffect(() => {
    if (inView && hasMore && !historyQuery.isFetchingNextPage && interactions.length > 0) {
      void historyQuery.fetchNextPage();
    }
  }, [hasMore, inView, interactions.length, historyQuery]);

  if (errorKey && interactions.length === 0 && !loading) {
    return (
      <div className="signal-bubble p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-ochre">
          <Radio className="h-4 w-4" />
          {t(errorKey)}
        </div>
        <button
          type="button"
          onClick={() => void historyQuery.refetch()}
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
            onClick={() => void (hasMore ? historyQuery.fetchNextPage() : historyQuery.refetch())}
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
