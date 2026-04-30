'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-copper/20 bg-void-deep p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="-mx-8 -mt-8 mb-0 flex items-center justify-between rounded-t-lg border-b border-copper/15 bg-void-mid px-4 py-3">
          <span className="text-sm font-bold text-ochre">⚠ {t('errors.notFoundTitle')}</span>
          <span className="text-ink-muted text-xs font-mono">CODE 404</span>
        </div>
        <div className="pt-8 pb-4">
          <div className="mb-4 font-mono text-[48px] font-bold leading-none text-copper">
            404
          </div>
          <p className="mb-6 text-[14px] text-ink-secondary">{t('errors.notFoundMessage')}</p>
          <Link
            href="/"
            className="inline-block rounded-md border border-copper/30 px-4 py-2 text-[13px] text-copper transition-colors hover:bg-copper/10"
          >
            {t('errors.backForum')}
          </Link>
        </div>
      </div>
    </div>
  );
}
