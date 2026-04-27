'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltipController,
  ResponsiveContainer,
} from 'recharts';
import type { CoherencePoint } from '@/config/agent-dimensions';
import { FloatingPortal, FLOATING_Z_INDEX, type FloatingAnchorRect } from '@/components/ui/FloatingPortal';

interface AgentCoherenceChartProps {
  history: CoherencePoint[];
}

interface PortalChartTooltip {
  data: CoherencePoint;
  rect: FloatingAnchorRect;
}

interface TooltipBridgeProps {
  active?: boolean;
  payload?: Array<{
    payload?: CoherencePoint;
  }>;
  coordinate?: {
    x?: number;
    y?: number;
  };
}

interface TooltipBridgeComponentProps extends TooltipBridgeProps {
  chartRef: RefObject<HTMLDivElement | null>;
  setTooltip: Dispatch<SetStateAction<PortalChartTooltip | null>>;
}

function isSameTooltip(
  current: PortalChartTooltip | null,
  next: PortalChartTooltip,
) {
  return (
    current?.data.date === next.data.date &&
    current.data.value === next.data.value &&
    current.rect.left === next.rect.left &&
    current.rect.top === next.rect.top
  );
}

function TooltipBridge({
  active,
  payload,
  coordinate,
  chartRef,
  setTooltip,
}: TooltipBridgeComponentProps) {
  const point = payload?.[0]?.payload as CoherencePoint | undefined;
  const x = coordinate?.x;
  const y = coordinate?.y;

  useEffect(() => {
    const chartBox = chartRef.current?.getBoundingClientRect();

    if (!active || !chartBox || !point || typeof x !== 'number' || typeof y !== 'number') {
      setTooltip((current) => (current === null ? current : null));
      return;
    }

    const nextTooltip: PortalChartTooltip = {
      data: point,
      rect: {
        left: chartBox.left + x,
        top: chartBox.top + y,
        width: 1,
        height: 1,
      },
    };

    setTooltip((current) => (isSameTooltip(current, nextTooltip) ? current : nextTooltip));
  }, [active, chartRef, point, setTooltip, x, y]);

  return null;
}

export function AgentCoherenceChart({ history }: AgentCoherenceChartProps) {
  const gradientId = useId();
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<PortalChartTooltip | null>(null);
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
      <div
        ref={chartRef}
        className="w-full flex-1 min-h-[190px] select-none"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
            onMouseLeave={() => setTooltip(null)}
          >
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
            <RechartsTooltipController
              content={<TooltipBridge chartRef={chartRef} setTooltip={setTooltip} />}
              cursor={false}
              isAnimationActive={false}
              wrapperStyle={{ display: 'none' }}
            />
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

      <FloatingPortal
        open={!!tooltip}
        anchorRect={tooltip?.rect ?? null}
        placement="top"
        align="center"
        offset={10}
        zIndex={FLOATING_Z_INDEX.tooltip}
        className="pointer-events-none rounded-lg border border-moss/30 bg-void-deep px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        role="tooltip"
      >
        {tooltip && (
          <>
            <div className="text-ink-muted mb-0.5">{tooltip.data.date}</div>
            <div className="font-mono text-moss font-bold">{tooltip.data.value}</div>
          </>
        )}
      </FloatingPortal>

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
