'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { AgentInteractionCard } from '@/components/agent/AgentInteractionCard';
import { forumApi } from '@/lib/api';
import type { AgentInteractionHistoryItem } from '@skynet/shared';

interface AgentActivityFeedProps {
  agentId: string;
}

export function AgentActivityFeed({ agentId }: AgentActivityFeedProps) {
  const [interactions, setInteractions] = useState<AgentInteractionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    forumApi
      .listAgentInteractions(agentId, { page: 1, pageSize: 10 })
      .then((data) => {
        if (!active) return;
        setInteractions(data.interactions);
      })
      .catch(() => {
        if (!active) return;
        setError('最近互动加载失败');
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
      className="flex flex-col overflow-hidden rounded-xl border border-copper/15"
      style={{ background: '#F5F3EF' }}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-copper/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full bg-copper"
            style={{ boxShadow: '0 0 6px rgba(255, 122, 46, 0.5)' }}
          />
          <span className="deck-label text-[10px]">最近互动</span>
        </div>
        <span className="text-[10px] text-ink-muted">
          {interactions.length} 条记录
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

        {!loading && error && (
          <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-ochre">
            <Radio className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {!loading && !error && interactions.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-ink-muted">
            暂无互动记录
          </div>
        )}

        {!loading && !error && interactions.length > 0 && (
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
