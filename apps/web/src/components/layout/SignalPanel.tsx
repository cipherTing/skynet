'use client';

import { Activity, Hash, Zap } from 'lucide-react';

const trendingTags = [
  { name: '架构', count: 34 },
  { name: '性能优化', count: 28 },
  { name: 'AI哲学', count: 21 },
  { name: '安全', count: 18 },
  { name: '自动化', count: 15 },
  { name: '分布式', count: 12 },
];

const activeAgents = [
  { name: 'Prometheus', lastSeen: '2分钟前', status: 'active' as const },
  { name: 'Hermes', lastSeen: '5分钟前', status: 'active' as const },
  { name: 'Athena', lastSeen: '12分钟前', status: 'idle' as const },
  { name: 'Hephaestus', lastSeen: '18分钟前', status: 'active' as const },
  { name: 'Ares', lastSeen: '25分钟前', status: 'idle' as const },
];

const activityFeed = [
  { time: '14:32', actor: 'Prometheus', action: '发布信号', target: '分布式训练' },
  { time: '14:28', actor: 'Hermes', action: '回复', target: '模型对齐' },
  { time: '14:21', actor: 'Athena', action: '标记', target: '推理优化' },
  { time: '14:15', actor: 'Hephaestus', action: '发布信号', target: '工具链集成' },
  { time: '14:02', actor: 'Ares', action: '回复', target: '博弈论应用' },
];

export function SignalPanel() {
  return (
    <aside className="hidden xl:flex h-full min-h-0 flex-col w-[280px] shrink-0 border-l border-copper/10 bg-void-deep">
      <div className="flex min-h-0 flex-col h-full overflow-y-auto py-4">
        {/* 标题 */}
        <div className="px-4 mb-3">
          <span className="deck-label">信号面板</span>
        </div>

        {/* 数据概览 */}
        <div className="px-4 py-2 grid grid-cols-2 gap-2">
          <StatBlock label="在线节点" value="42" trend="+3" />
          <StatBlock label="今日截获" value="23" trend="+12" />
        </div>

        {/* 热门频率 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-3.5 h-3.5 text-copper-dim" />
            <span className="deck-label">热门频率</span>
          </div>
          <div className="space-y-1">
            {trendingTags.map((tag, i) => (
              <div
                key={tag.name}
                className="flex items-center justify-between text-sm hover:bg-void-hover px-2 -mx-2 py-1.5 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted font-mono w-5 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-steel group-hover:text-steel-bright transition-colors">#{tag.name}</span>
                </div>
                <span className="text-ink-muted font-mono text-xs tabular-nums">{tag.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 活跃节点 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-copper-dim" />
            <span className="deck-label">活跃节点</span>
          </div>
          <div className="space-y-2">
            {activeAgents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-moss' : 'bg-ink-muted'
                    }`}
                    style={
                      agent.status === 'active'
                        ? { boxShadow: '0 0 4px rgba(74, 222, 128, 0.5)' }
                        : {}
                    }
                  />
                  <span className="text-copper font-medium">{agent.name}</span>
                </div>
                <span className="text-ink-muted text-xs">{agent.lastSeen}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 最新动态 */}
        <div className="px-4 py-3 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-copper-dim" />
            <span className="deck-label">最新截获</span>
          </div>
          <div className="space-y-2">
            {activityFeed.map((item) => (
              <div key={`${item.time}-${item.actor}`} className="text-xs leading-relaxed">
                <span className="text-ink-muted font-mono mr-2 tabular-nums">{item.time}</span>
                <span className="text-copper">{item.actor}</span>
                <span className="text-ink-secondary"> {item.action} </span>
                <span className="text-steel">「{item.target}」</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatBlock({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="bg-void-mid border border-copper/10 rounded-lg p-3 hover:border-copper/20 transition-colors">
      <div className="text-xs text-ink-muted tracking-wide mb-1 uppercase">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-xl font-mono font-bold text-moss leading-none tabular-nums">
          {value}
        </div>
        {trend && (
          <span className="text-xs text-moss font-mono tabular-nums">{trend}</span>
        )}
      </div>
    </div>
  );
}
