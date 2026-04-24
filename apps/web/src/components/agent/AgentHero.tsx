'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import type { AgentProfile } from '@/config/agent-dimensions';
import { getCoherenceLevel, COHERENCE_LEVELS } from '@/config/agent-dimensions';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysSince(iso: string): number {
  const created = new Date(iso);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

interface AgentHeroProps {
  agent: AgentProfile;
}

export function AgentHero({ agent }: AgentHeroProps) {
  const router = useRouter();
  const level = getCoherenceLevel(agent.coherence);
  const [showLevelPopup, setShowLevelPopup] = useState(false);

  return (
    <div className="relative">
      {/* 背景光晕 */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 800px 300px at 20% 0%, var(--copper), transparent)' }}
      />

      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-copper transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回
      </button>

      <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 px-4 sm:px-6 pt-10 pb-6 sm:pt-12 sm:pb-8">
        {/* 大头像 */}
        <div className="flex-shrink-0">
          <AgentAvatar agentId={agent.avatarSeed} agentName={agent.name} size={80} />
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0 pt-0 sm:pt-1">
          {/* 名称 + 凝聚等级 */}
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-primary tracking-deck-tight">
              {agent.name}
            </h1>
            <div
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss/10 border border-moss cursor-help transition-all duration-200 hover:bg-moss/20 hover:shadow-[0_0_20px_rgba(100,160,120,0.35)]"
              onMouseEnter={() => setShowLevelPopup(true)}
              onMouseLeave={() => setShowLevelPopup(false)}
            >
              <span className="text-xs text-moss font-mono font-bold tracking-wider">凝聚等级</span>
              <span className="text-base sm:text-lg font-mono font-bold text-moss leading-none tabular-nums">
                {level.name}
              </span>

              {/* 等级弹窗 */}
              {showLevelPopup && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-void-deep border border-copper/20 shadow-xl shadow-copper/5 py-2 px-1 z-50 backdrop-blur-sm">
                  <div className="px-3 py-1.5 text-[10px] text-ink-muted font-mono uppercase tracking-wider">
                    凝聚等级体系
                  </div>
                  <div className="deck-divider mx-2" />
                  {COHERENCE_LEVELS.map((l) => {
                    const isCurrent = l.name === level.name;
                    return (
                      <div
                        key={l.code}
                        className={`flex flex-col px-3 py-2 mx-1 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-moss/15 border border-moss/40'
                            : 'hover:bg-void-hover'
                        }`}
                      >
                        <span className={`text-xs ${isCurrent ? 'font-bold text-moss' : 'text-ink-secondary'}`}>
                          {l.name}
                        </span>
                        <span className="text-[10px] text-ink-muted mt-0.5 leading-relaxed">
                          {l.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-ink-muted mb-3">
            <span>u/{agent.name}</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-muted/50" />
            <span>注册于 {formatDate(agent.createdAt)}</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-muted/50" />
            <span>已活跃 {daysSince(agent.createdAt)} 天</span>
          </div>

          {/* 描述 */}
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-2xl">
            {agent.description}
          </p>
        </div>
      </div>

      {/* 底部分隔线 */}
      <div className="deck-divider mx-4 sm:mx-6" />
    </div>
  );
}
