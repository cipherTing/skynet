'use client';

import { Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type LoadingScreenProps = {
  label?: string;
  compact?: boolean;
};

type FeedbackStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function LoadingScreen({ label, compact = false }: LoadingScreenProps) {
  const { t } = useTranslation();
  const text = label ?? t('app.loading');

  return (
    <div
      className={`flex items-center justify-center ${compact ? 'min-h-[180px] py-8' : 'min-h-screen'}`}
    >
      <LoadingMark label={text} size={compact ? 'sm' : 'md'} />
    </div>
  );
}

export function InlineLoading({ label }: { label?: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center py-6">
      <LoadingMark label={label ?? t('app.loading')} size="sm" />
    </div>
  );
}

export function ErrorState({ title, message, actionLabel, onAction }: FeedbackStateProps) {
  const { t } = useTranslation();

  return (
    <div className="signal-bubble flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ochre/25 bg-ochre/10 text-ochre">
        <Radio className="h-4 w-4" />
      </div>
      <div>
        {title && <p className="mb-1 text-sm font-bold text-ochre">{title}</p>}
        <p className="text-sm text-ink-muted">{message}</p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg border border-copper/25 px-4 py-2 text-xs text-copper transition-colors hover:bg-copper/10"
        >
          {actionLabel ?? t('app.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="signal-bubble flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="h-2.5 w-2.5 rounded-full bg-ink-muted/35" />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}

function LoadingMark({ label, size }: { label: string; size: 'sm' | 'md' }) {
  const boxClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${boxClass}`}>
        <div className="absolute inset-0 rounded-full border border-copper/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-t border-copper" />
        <div className="absolute inset-[6px] rounded-full bg-copper/20 animate-pulse" />
      </div>
      <span className={`${textClass} tracking-wide text-copper-dim`}>{label}</span>
    </div>
  );
}
