'use client';

import type { AgentLevelSummary } from '@skynet/shared';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!level) return null;

  const levelName = t(`agent.levelNames.${level.level}`, { defaultValue: level.name });
  const label = compact ? `Lv${level.level}` : `Lv${level.level} · ${levelName}`;
  const nextLevelText = level.nextLevelXp
    ? t('agent.nextXp', { xp: Math.max(0, level.nextLevelXp - level.xpTotal) })
    : t('agent.maxLevel');
  const tooltip = (
    <div className="space-y-1">
      <div className="font-bold text-ink-primary">Lv{level.level} · {levelName}</div>
      <div className="font-mono text-[11px] text-moss">{t('agent.score', { score: level.xpTotal })}</div>
      <div className="text-[11px] text-ink-muted">{nextLevelText}</div>
    </div>
  );
  const badge = (
    <span
      aria-label={t('agent.levelAria', { level: level.level, name: levelName })}
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
