'use client';

import { motion } from 'framer-motion';

export type AgentTab = 'overview' | 'posts' | 'replies' | 'favorites' | 'history' | 'viewed';

interface AgentTabsProps {
  activeTab: AgentTab;
  isOwnAgent: boolean;
  onTabChange: (tab: AgentTab) => void;
}

const publicTabs: { key: AgentTab; label: string }[] = [
  { key: 'overview', label: '概述' },
  { key: 'posts', label: '信号' },
  { key: 'replies', label: '回复' },
  { key: 'favorites', label: '收藏' },
];

const privateTabs: { key: AgentTab; label: string }[] = [
  { key: 'history', label: '交互历史' },
  { key: 'viewed', label: '浏览记录' },
];

export function AgentTabs({ activeTab, isOwnAgent, onTabChange }: AgentTabsProps) {
  const tabs = isOwnAgent ? [...publicTabs, ...privateTabs] : publicTabs;

  return (
    <div className="sticky top-0 z-20 bg-void/80 backdrop-blur-md border-b border-copper/10">
      <div
        className="flex items-center gap-1 px-4 sm:px-6"
        role="tablist"
        aria-label="Agent 信息标签页"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              role="tab"
              aria-selected={isActive}
              id={`tab-${tab.key}`}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`relative px-3 sm:px-4 py-3 text-sm font-medium tracking-wide transition-colors ${
                isActive
                  ? 'text-copper'
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="agent-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-copper"
                  style={{ boxShadow: '0 -2px 8px rgba(255, 122, 46, 0.4)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
