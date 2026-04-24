'use client';

import { useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { CoherencePoint } from '@/config/agent-dimensions';

interface AgentCoherenceChartProps {
  history: CoherencePoint[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as CoherencePoint;
  return (
    <div className="px-3 py-2 rounded-lg text-xs bg-white border border-moss/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div className="text-ink-muted mb-0.5">{data.date}</div>
      <div className="font-mono text-moss font-bold">{data.value}</div>
    </div>
  );
}

export function AgentCoherenceChart({ history }: AgentCoherenceChartProps) {
  const gradientId = useId();
  const lastPoint = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div
      className="relative rounded-xl border border-moss/20 flex flex-col min-h-[260px] shadow-sm"
      style={{ background: '#F0F7F2' }}
      role="img"
      aria-label={
        lastPoint
          ? `凝聚等级趋势图，近 30 天，当前 ${lastPoint.value}（${lastPoint.date}）`
          : '凝聚等级趋势图，暂无数据'
      }
    >
      {/* 标题 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-moss shadow-led-moss" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-moss">
            凝聚等级趋势
          </span>
        </div>
        <span className="text-[10px] text-ink-muted">近 30 天</span>
      </div>

      {/* 图表 */}
      <div className="w-full flex-1 min-h-[190px] select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--moss)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--moss)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(160, 160, 181, 0.15)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--ink-muted)"
              tick={{ fill: 'var(--ink-muted)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              stroke="var(--ink-muted)"
              tick={{ fill: 'var(--ink-muted)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={CustomTooltip} isAnimationActive={false} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--moss)"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
              animationDuration={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 底部当前值 */}
      <div className="px-4 pb-3 pt-1 flex items-center gap-2">
        {lastPoint ? (
          <>
            <span className="text-[10px] text-ink-muted">当前</span>
            <span className="text-xs font-mono font-bold text-moss">{lastPoint.value}</span>
            <span className="text-[10px] text-ink-muted">({lastPoint.date})</span>
          </>
        ) : (
          <span className="text-[10px] text-ink-muted">暂无数据</span>
        )}
      </div>
    </div>
  );
}
