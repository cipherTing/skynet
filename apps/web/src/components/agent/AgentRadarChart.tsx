'use client';

import { memo, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { AgentDimensions } from '@/config/agent-dimensions';
import { DIMENSION_CONFIG, getDimensionGrade } from '@/config/agent-dimensions';
import { PortalTooltip } from '@/components/ui/FloatingPortal';

interface AgentRadarChartProps {
  dimensions: AgentDimensions;
}

interface RadarDataItem {
  dimension: string;
  description: string;
  value: number;
  grade: string;
  key: keyof AgentDimensions;
}

/**
 * 6 个维度均匀分布在正六边形顶点。
 * outerRadius = 105px，标签半径取 116px 留出安全间距。
 * 角度从 12 点方向（-90°）开始，每 60° 一个维度。
 */
const R_LABEL = 116;
const LABEL_POSITIONS = (() => {
  const angles = [270, 330, 30, 90, 150, 210].map((d) => (d * Math.PI) / 180);
  return angles.map((a) => ({
    x: Math.round(Math.cos(a) * R_LABEL * 10) / 10,
    y: Math.round(Math.sin(a) * R_LABEL * 10) / 10,
  }));
})();

const DimensionLabel = memo(function DimensionLabel({
  item,
  index,
}: {
  item: RadarDataItem;
  index: number;
}) {
  const config = DIMENSION_CONFIG[item.key];
  const pos = LABEL_POSITIONS[index];

  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-auto group"
      style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
    >
      <PortalTooltip
        placement={pos.y > 0 ? 'top' : 'bottom'}
        content={
          <>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold" style={{ color: config.color }}>{item.dimension}</span>
              <span className="text-[10px] font-mono text-ink-muted">{item.grade}</span>
            </div>
            <p>{item.description}</p>
          </>
        }
        contentClassName="min-w-[180px]"
      >
        <div tabIndex={0} className="text-center leading-tight cursor-help">
          <div className="text-[11px] font-semibold" style={{ color: config.color }}>
            {item.dimension}
          </div>
          <div className="text-[10px] font-mono font-bold mt-0.5" style={{ color: config.color, opacity: 0.75 }}>
            {item.grade}
          </div>
        </div>
      </PortalTooltip>
    </div>
  );
});

export function AgentRadarChart({ dimensions }: AgentRadarChartProps) {
  const { t } = useTranslation();
  const data: RadarDataItem[] = useMemo(
    () =>
      (Object.keys(dimensions) as Array<keyof AgentDimensions>).map((key) => ({
        dimension: t(`agent.dimensions.${key}.label`),
        description: t(`agent.dimensions.${key}.description`),
        value: dimensions[key],
        grade: getDimensionGrade(dimensions[key]),
        key,
      })),
    [dimensions, t],
  );

  const ariaLabel = useMemo(
    () => t('agent.radarAria', { items: data.map((d) => `${d.dimension} ${d.grade}`).join('，') }),
    [data, t],
  );

  return (
    <div
      className="relative rounded-xl border border-copper/20 bg-void-deep flex flex-col min-h-[340px] shadow-sm outline-none focus:outline-none"
      role="img"
      aria-label={ariaLabel}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-copper shadow-led-copper" />
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-copper">
          {t('agent.radarTitle')}
        </span>
      </div>

      {/* 雷达图 */}
      <div className="relative flex-1 flex items-center justify-center min-h-[260px] px-4 select-none">
        <div className="relative aspect-square max-h-[280px] w-full pointer-events-none select-none">
          {/* 维度标签 overlay — 从中心精确偏移到顶点 */}
          <div className="absolute inset-0 z-10 select-none">
            {data.map((item, i) => (
              <DimensionLabel key={item.key} item={item} index={i} />
            ))}
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
              <defs>
                <radialGradient id="radar-copper-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--copper)" stopOpacity={0.3} />
                  <stop offset="70%" stopColor="var(--copper)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--copper)" stopOpacity={0.04} />
                </radialGradient>
                <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <PolarGrid stroke="rgba(140,140,160,0.38)" strokeWidth={1} />
              <PolarAngleAxis dataKey="dimension" tick={false} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name=""
                dataKey="value"
                stroke="var(--copper)"
                strokeWidth={2.5}
                fill="url(#radar-copper-gradient)"
                filter="url(#radar-glow)"
                isAnimationActive={false}
                dot={false}
                activeDot={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
