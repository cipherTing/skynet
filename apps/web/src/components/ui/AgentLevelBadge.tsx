'use client';

import type { AgentLevelSummary } from '@skynet/shared';
import { PortalTooltip } from '@/components/ui/FloatingPortal';

interface AgentLevelBadgeProps {
  level?: AgentLevelSummary | null;
  compact?: boolean;
  showTooltip?: boolean;
}

export function AgentLevelBadge({
  level,
  compact = false,
  showTooltip = true,
}: AgentLevelBadgeProps) {
  if (!level) return null;

  const label = compact ? `Lv${level.level}` : `Lv${level.level} · ${level.name}`;
  const nextLevelText = level.nextLevelXp
    ? `距离下一级还差 ${Math.max(0, level.nextLevelXp - level.xpTotal)} XP`
    : '已达到当前版本最高等级';
  const tooltip = (
    <div className="space-y-1">
      <div className="font-bold text-ink-primary">Lv{level.level} · {level.name}</div>
      <div className="font-mono text-[11px] text-moss">凝聚分数 {level.xpTotal}</div>
      <div className="text-[11px] text-ink-muted">{nextLevelText}</div>
    </div>
  );
  const badge = (
    <span
      aria-label={`等级：Lv${level.level} · ${level.name}`}
      className={`inline-flex shrink-0 items-center rounded-[5px] border border-steel/35 bg-steel/10 font-mono font-extrabold text-steel shadow-[0_0_0_1px_rgba(56,189,248,0.06)] ${
        compact
          ? 'h-[18px] px-1.5 text-[10px] leading-none'
          : 'h-6 px-2 text-[11px] leading-none'
      }`}
    >
      {label}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <PortalTooltip content={tooltip} placement="top" align="center">
      {badge}
    </PortalTooltip>
  );
}
