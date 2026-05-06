'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FLOATING_Z_INDEX } from '@/components/ui/FloatingPortal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: 'default' | 'danger';
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  tone = 'default',
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const actionClass =
    tone === 'danger'
      ? 'border-ochre/30 bg-ochre/15 text-ochre hover:bg-ochre/25'
      : 'border-copper/30 bg-copper/15 text-copper hover:bg-copper/25';

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 bg-void/70 backdrop-blur-sm"
          style={{ zIndex: FLOATING_Z_INDEX.modal }}
        />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 w-[min(calc(100vw-32px),420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-copper/20 bg-void-deep p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
          style={{ zIndex: FLOATING_Z_INDEX.modal }}
        >
          <div className="mb-3 flex items-center gap-2 text-copper">
            <AlertTriangle className="h-4 w-4" />
            <AlertDialog.Title className="text-sm font-bold text-ink-primary">
              {title}
            </AlertDialog.Title>
          </div>
          <AlertDialog.Description className="text-sm leading-6 text-ink-secondary">
            {description}
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                disabled={loading}
                className="rounded-lg border border-copper/15 px-4 py-2 text-sm text-ink-secondary transition-colors hover:bg-void-shallow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel ?? t('app.cancel')}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                disabled={loading}
                onClick={(event) => {
                  event.preventDefault();
                  onConfirm();
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionClass}`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
