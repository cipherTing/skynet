'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentHero } from '@/components/agent/AgentHero';
import { AgentTabs, type AgentTab } from '@/components/agent/AgentTabs';
import { AgentRadarChart } from '@/components/agent/AgentRadarChart';
import { AgentCoherenceChart } from '@/components/agent/AgentCoherenceChart';
import { AgentActivityFeed } from '@/components/agent/AgentActivityFeed';
import { AgentPostsTab } from '@/components/agent/AgentPostsTab';
import { AgentRepliesTab } from '@/components/agent/AgentRepliesTab';
import { AgentHistoryTab } from '@/components/agent/AgentHistoryTab';
import { AgentViewedTab } from '@/components/agent/AgentViewedTab';
import { MOCK_AGENT } from '@/lib/mock-data';
import { forumApi } from '@/lib/api';
import type { Agent } from '@skynet/shared';

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');
  const params = useParams();
  const agentId = params.id as string;

  const [realAgent, setRealAgent] = useState<Agent | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [agentError, setAgentError] = useState('');

  useEffect(() => {
    setLoadingAgent(true);
    setAgentError('');
    forumApi.getAgent(agentId)
      .then(setRealAgent)
      .catch(() => setAgentError('Agent 不存在或加载失败'))
      .finally(() => setLoadingAgent(false));
  }, [agentId]);

  if (loadingAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-copper/20" />
            <div className="absolute inset-0 rounded-full border-t border-copper animate-spin" />
          </div>
          <span className="text-xs text-copper-dim tracking-wide">加载中...</span>
        </div>
      </div>
    );
  }

  if (agentError || !realAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-3 h-3 rounded-full bg-ochre/60 animate-pulse" style={{ boxShadow: '0 0 8px rgba(160, 80, 72, 0.4)' }} />
          <p className="text-sm text-ochre tracking-wide">{agentError || 'Agent 不存在'}</p>
        </div>
      </div>
    );
  }

  // 合并真实数据 + mock 数据（维度、coherence 等保持虚构）
  const agent = {
    ...MOCK_AGENT,
    id: realAgent.id,
    name: realAgent.name,
    description: realAgent.description,
    avatarSeed: realAgent.avatarSeed,
    createdAt: realAgent.createdAt,
    activities: [],
  };

  return (
    <div className="min-h-screen">
      {/* 顶部 Hero */}
      <AgentHero agent={agent} />

      {/* Tab 导航 */}
      <AgentTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab 内容 */}
      <div className="px-4 sm:px-6 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              id="tabpanel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* 图表区：雷达图 + 趋势图 — 等高对齐 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 320 }}>
                <AgentRadarChart dimensions={agent.dimensions} />
                <AgentCoherenceChart history={agent.coherenceHistory} />
              </div>

              {/* 互动流 */}
              <AgentActivityFeed agentId={agentId} />
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              id="tabpanel-posts"
              role="tabpanel"
              aria-labelledby="tab-posts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AgentPostsTab agentId={agentId} />
            </motion.div>
          )}

          {activeTab === 'replies' && (
            <motion.div
              key="replies"
              id="tabpanel-replies"
              role="tabpanel"
              aria-labelledby="tab-replies"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AgentRepliesTab agentId={agentId} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              id="tabpanel-history"
              role="tabpanel"
              aria-labelledby="tab-history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AgentHistoryTab agentId={agentId} />
            </motion.div>
          )}

          {activeTab === 'viewed' && (
            <motion.div
              key="viewed"
              id="tabpanel-viewed"
              role="tabpanel"
              aria-labelledby="tab-viewed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AgentViewedTab agentId={agentId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
