'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { PortalTooltip } from '@/components/ui/FloatingPortal';
import { AgentLevelBadge } from '@/components/ui/AgentLevelBadge';
import type { AgentProfile } from '@/config/agent-dimensions';
import { AGENT_LEVELS } from '@skynet/shared';

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
  isOwnAgent: boolean;
}

export function AgentHero({ agent, isOwnAgent }: AgentHeroProps) {
  const router = useRouter();
  const level = agent.level;
  const nextLevelXp = level?.nextLevelXp ?? null;
  const xpToNext =
    level && nextLevelXp !== null
      ? Math.max(0, nextLevelXp - level.xpTotal)
      : null;
  let nextLevelHint = '下一级精确进度仅本人可见';
  if (isOwnAgent) {
    nextLevelHint =
      xpToNext === null ? '已达到当前版本最高等级' : `距离下一等级还差 ${xpToNext} XP`;
  }

  return (
    <div className="relative">
      {/* 背景光晕 */}
      <div className="agent-hero-glow absolute inset-0 opacity-[0.03] pointer-events-none" />

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
            {isOwnAgent && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-copper/25 bg-copper/10 px-2.5 py-1 text-[11px] font-bold text-copper">
                <BadgeCheck className="h-3.5 w-3.5" />
                我的 Agent
              </span>
            )}
            <PortalTooltip
              placement="bottom"
              align="start"
              contentClassName="w-80 rounded-xl py-2 px-1 shadow-xl shadow-copper/5 backdrop-blur-sm"
              content={
                <div className="space-y-2">
                  <div className="mx-1 rounded-lg border border-moss/25 bg-moss/10 px-3 py-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                      当前凝聚等级
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-mono font-bold text-moss">
                        {level ? `Lv${level.level} · ${level.name}` : '未激活'}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        凝聚分数 {level?.xpTotal ?? 0}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed text-ink-secondary">
                      {nextLevelHint}
                    </div>
                  </div>
                  <div className="deck-divider mx-2" />
                  <div className="max-h-64 overflow-y-auto px-1">
                    {AGENT_LEVELS.map((item) => {
                      const isCurrent = level?.level === item.level;
                      return (
                        <div
                          key={item.level}
                          className={`mx-1 rounded-lg border px-3 py-2 transition-colors ${
                            isCurrent
                              ? 'border-moss/40 bg-moss/15'
                              : 'border-transparent hover:bg-void-hover'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent ? 'text-moss' : 'text-ink-secondary'
                              }`}
                            >
                              Lv{item.level} · {item.name}
                            </span>
                            <span className="font-mono text-[10px] text-ink-muted">
                              {item.minXp} XP
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                            {item.unlocks.join(' / ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              }
            >
              <div
                tabIndex={0}
                className="flex cursor-help items-center gap-2 rounded-full border border-moss bg-moss/10 px-3 py-1.5 transition-all duration-200 hover:bg-moss/20 hover:shadow-[0_0_20px_rgba(100,160,120,0.35)]"
              >
                <AgentLevelBadge level={level} showTooltip={false} />
                <span className="text-xs font-mono font-bold tracking-wider text-moss">
                  凝聚分数 {level?.xpTotal ?? 0}
                </span>
              </div>
            </PortalTooltip>
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
