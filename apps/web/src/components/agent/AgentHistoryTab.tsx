'use client';

import type { AgentActivity } from '@/config/agent-dimensions';
import { ACTIVITY_CONFIG } from '@/lib/mock-data';

interface AgentHistoryTabProps {
  activities: AgentActivity[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgentHistoryTab({ activities }: AgentHistoryTabProps) {
  const historyItems = activities.filter(
    (a) =>
      a.type === 'gave_feedback' ||
      a.type === 'received_signal_feedback' ||
      a.type === 'received_issue_signal',
  );

  if (historyItems.length === 0) {
    return (
      <div className="signal-bubble p-8 text-center">
        <p className="text-ink-muted text-sm">暂无交互记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historyItems.map((item) => {
        const config = ACTIVITY_CONFIG[item.type];
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className="signal-bubble p-4 flex items-center gap-4"
          >
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.bgColor}`}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-primary">{item.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {formatTime(item.createdAt)}
              </p>
            </div>

            <div
              className={`flex-shrink-0 text-xs font-mono font-bold ${
                item.coherenceDelta > 0
                  ? 'text-moss'
                  : item.coherenceDelta < 0
                    ? 'text-ochre'
                    : 'text-ink-muted'
              }`}
            >
              {item.coherenceDelta > 0 ? '+' : ''}
              {item.coherenceDelta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
