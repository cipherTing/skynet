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
import { getAgentLevelByXp } from '@skynet/shared';

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

interface ScoreCursorProps {
  points?: Array<{
    x?: number;
    y?: number;
  }>;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  payload?: unknown;
  yAxisDomain: [number, number];
}

interface ScoreDotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isCoherencePoint(value: unknown): value is CoherencePoint {
  return (
    value !== null &&
    typeof value === 'object' &&
    'date' in value &&
    'value' in value &&
    typeof value.date === 'string' &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value)
  );
}

function getObjectField(value: unknown, key: string): unknown {
  if (value === null || typeof value !== 'object') return undefined;
  return (value as Record<string, unknown>)[key];
}

function getCursorPayloadValue(payload: unknown): number | null {
  if (!Array.isArray(payload)) return null;
  const firstPayload = payload[0];
  const nestedPayload = getObjectField(firstPayload, 'payload');
  if (isCoherencePoint(nestedPayload)) return nestedPayload.value;

  const value = getObjectField(firstPayload, 'value');
  return isFiniteNumber(value) ? value : null;
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

function getNiceStep(value: number): number {
  if (value <= 0) return 10;
  const power = 10 ** Math.floor(Math.log10(value));
  const normalized = value / power;
  if (normalized <= 1) return power;
  if (normalized <= 2) return power * 2;
  if (normalized <= 5) return power * 5;
  return power * 10;
}

function getScoreYAxisDomain(history: CoherencePoint[]): [number, number] {
  const values = history
    .map((point) => point.value)
    .filter(Number.isFinite)
    .map((value) => Math.max(0, value));

  if (values.length === 0) return [0, 10];

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawRange = maxValue - minValue;
  const padding = rawRange === 0 ? Math.max(10, maxValue * 0.05) : rawRange * 0.15;
  const paddedMin = Math.max(0, minValue - padding);
  const paddedMax = maxValue + padding;
  const step = getNiceStep((paddedMax - paddedMin) / 4);
  const yMin = Math.max(0, Math.floor(paddedMin / step) * step);
  const yMax = Math.max(yMin + step, Math.ceil(paddedMax / step) * step);
  return [yMin, yMax];
}

function getChartY(value: number, domain: [number, number], top: number, height: number) {
  const [min, max] = domain;
  const range = max - min;
  if (range <= 0) return top + height;
  const ratio = (value - min) / range;
  return top + height - clampNumber(ratio, 0, 1) * height;
}

function ScoreCrosshairCursor({
  points,
  left,
  top,
  width,
  height,
  payload,
  yAxisDomain,
}: ScoreCursorProps) {
  const x = points?.[0]?.x;
  const value = getCursorPayloadValue(payload);

  if (
    !isFiniteNumber(x) ||
    value === null ||
    !isFiniteNumber(left) ||
    !isFiniteNumber(top) ||
    !isFiniteNumber(width) ||
    !isFiniteNumber(height)
  ) {
    return null;
  }

  const y = getChartY(value, yAxisDomain, top, height);

  return (
    <g className="agent-score-crosshair">
      <line x1={x} y1={top} x2={x} y2={top + height} />
      <line x1={left} y1={y} x2={left + width} y2={y} />
    </g>
  );
}

function renderTodayDot(props: ScoreDotProps, lastPointIndex: number) {
  const { cx, cy, index } = props;
  if (index !== lastPointIndex || !isFiniteNumber(cx) || !isFiniteNumber(cy)) {
    return null;
  }
  return <circle cx={cx} cy={cy} r={4.5} className="agent-score-today-dot" />;
}

function renderActiveDot(props: ScoreDotProps) {
  const { cx, cy } = props;
  if (!isFiniteNumber(cx) || !isFiniteNumber(cy)) return null;
  return <circle cx={cx} cy={cy} r={5} className="agent-score-active-dot" />;
}

function TooltipBridge({
  active,
  payload,
  coordinate,
  chartRef,
  setTooltip,
}: TooltipBridgeComponentProps) {
  const rawPoint = payload?.[0]?.payload;
  const point = isCoherencePoint(rawPoint) ? rawPoint : undefined;
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
  const lastPointIndex = history.length - 1;
  const yAxisDomain = getScoreYAxisDomain(history);

  return (
    <div
      className="agent-score-chart-panel relative rounded-xl border border-moss/20 flex flex-col min-h-[260px] shadow-sm"
      role="img"
      aria-label={
        lastPoint
          ? `凝聚分数趋势图，近 30 天，当前 ${lastPoint.value}（${lastPoint.date}）`
          : '凝聚分数趋势图，暂无数据'
      }
    >
      {/* 标题 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-moss shadow-led-moss" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-moss">
            凝聚分数趋势
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
            margin={{ top: 10, right: 34, left: 10, bottom: 0 }}
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
              padding={{ left: 8, right: 18 }}
            />
            <YAxis
              domain={yAxisDomain}
              stroke="var(--ink-muted)"
              tick={{ fill: 'var(--ink-muted)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <RechartsTooltipController
              content={<TooltipBridge chartRef={chartRef} setTooltip={setTooltip} />}
              cursor={<ScoreCrosshairCursor yAxisDomain={yAxisDomain} />}
              isAnimationActive={false}
              wrapperStyle={{ display: 'none' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--moss)"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={(props) => renderTodayDot(props, lastPointIndex)}
              activeDot={renderActiveDot}
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
            <div className="font-mono text-moss font-bold">
              凝聚分数 {tooltip.data.value}
            </div>
            <div className="mt-0.5 text-[10px] text-ink-muted">
              Lv{getAgentLevelByXp(tooltip.data.value).level} · {getAgentLevelByXp(tooltip.data.value).name}
            </div>
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
