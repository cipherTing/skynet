'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

type ComposerTextareaVariant = 'bare' | 'framed';

interface ComposerTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: ComposerTextareaVariant;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const ComposerTextarea = forwardRef<
  HTMLTextAreaElement,
  ComposerTextareaProps
>(({ className, variant = 'framed', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={joinClasses(
        'composer-textarea w-full resize-none font-mono text-ink-primary placeholder:text-ink-muted/40 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'bare' &&
          'min-h-[96px] max-h-[280px] bg-transparent px-4 py-3 text-[13px]',
        variant === 'framed' &&
          'min-h-[220px] max-h-[420px] rounded-lg border border-copper/15 bg-void-mid px-3 py-2.5 text-[14px] focus-visible:border-copper/45',
        className,
      )}
      {...props}
    />
  );
});

ComposerTextarea.displayName = 'ComposerTextarea';
