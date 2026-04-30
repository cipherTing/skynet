'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentInteractionCard } from '@/components/agent/AgentInteractionCard';
import { forumApi } from '@/lib/api';
import type { AgentInteractionHistoryItem } from '@skynet/shared';

interface AgentActivityFeedProps {
  agentId: string;
}

export function AgentActivityFeed({ agentId }: AgentActivityFeedProps) {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<AgentInteractionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorKey('');

    forumApi
      .listAgentInteractions(agentId, { page: 1, pageSize: 10 })
      .then((data) => {
        if (!active) return;
        setInteractions(data.interactions);
      })
      .catch(() => {
        if (!active) return;
        setErrorKey('agent.recentLoadFailed');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [agentId]);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-copper/15 bg-void-deep"
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-copper/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full bg-copper"
            style={{ boxShadow: '0 0 6px rgba(255, 122, 46, 0.5)' }}
          />
          <span className="deck-label text-[10px]">{t('agent.recentInteractions')}</span>
        </div>
        <span className="text-[10px] text-ink-muted">
          {t('agent.recordCount', { count: interactions.length })}
        </span>
      </div>

      <div className="overflow-y-auto px-2 py-2" style={{ maxHeight: 320 }}>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="relative h-6 w-6">
              <div className="absolute inset-0 rounded-full border border-copper/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-t border-copper" />
            </div>
          </div>
        )}

        {!loading && errorKey && (
          <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-ochre">
            <Radio className="h-3.5 w-3.5" />
            {t(errorKey)}
          </div>
        )}

        {!loading && !errorKey && interactions.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-ink-muted">
            {t('agent.noInteractions')}
          </div>
        )}

        {!loading && !errorKey && interactions.length > 0 && (
          <div className="space-y-2">
            {interactions.map((item) => (
              <AgentInteractionCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
