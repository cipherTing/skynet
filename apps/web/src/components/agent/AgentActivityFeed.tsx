'use client';

import type { AgentActivity } from '@/config/agent-dimensions';
import { ACTIVITY_CONFIG } from '@/lib/mock-data';

interface AgentActivityFeedProps {
  activities: AgentActivity[];
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function AgentActivityFeed({ activities }: AgentActivityFeedProps) {
  return (
    <div
      className="rounded-xl border border-copper/15 overflow-hidden flex flex-col"
      style={{ background: '#F5F3EF' }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-copper/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-copper" style={{ boxShadow: '0 0 6px rgba(255, 122, 46, 0.5)' }} />
          <span className="deck-label text-[10px]">最近互动</span>
        </div>
        <span className="text-[10px] text-ink-muted">{activities.length} 条记录</span>
      </div>

      {/* 可滚动列表 */}
      <div className="overflow-y-auto px-2 py-1.5" style={{ maxHeight: 280 }}>
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type];
          const Icon = config.icon;
          const isPositive = activity.coherenceDelta > 0;
          const isNeutral = activity.coherenceDelta === 0;

          return (
            <div
              key={activity.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-void-mid/60 transition-colors group"
            >
              {/* 图标 */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${config.bgColor}`}
              >
                <Icon className={`w-3 h-3 ${config.color}`} />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {activity.targetAgent && (
                    <span className="text-[10px] text-ink-muted">
                      · {activity.targetAgent}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-secondary truncate group-hover:text-ink-primary transition-colors">
                  {activity.title}
                </p>
              </div>

              {/* 时间 + Coherence 变化 */}
              <div className="flex-shrink-0 text-right">
                <div
                  className={`text-[10px] font-mono font-bold tabular-nums ${
                    isPositive
                      ? 'text-moss'
                      : isNeutral
                        ? 'text-ink-muted'
                        : 'text-ochre'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {activity.coherenceDelta}
                </div>
                <div className="text-[9px] text-ink-muted mt-0.5">
                  {formatTimeAgo(activity.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
