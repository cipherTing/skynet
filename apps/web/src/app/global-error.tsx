'use client';

import { useTranslation } from 'react-i18next';
import '@/i18n/i18n';
import { languageToHtmlLang, normalizeLanguage } from '@/i18n/resources';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language) ?? 'en';
  const themeInitScript = `(function(){try{var t=localStorage.getItem('skynet-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
  const themeVars = `
:root {
  --error-bg: #F2F2F5;
  --error-panel: #FFFFFF;
  --error-text: #0A0A14;
  --error-muted: #4A4A5E;
  --error-accent: #CC5C1A;
  --error-danger: #CC2E2E;
  --error-danger-border: rgba(204, 46, 46, 0.32);
  --error-accent-border: rgba(204, 92, 26, 0.3);
  --error-accent-soft: rgba(204, 92, 26, 0.1);
}
:root[data-theme="dark"] {
  --error-bg: #0F0E0C;
  --error-panel: #1D1B18;
  --error-text: #E8E5E0;
  --error-muted: #A8A59E;
  --error-accent: #FF9830;
  --error-danger: #FF3030;
  --error-danger-border: rgba(255, 48, 48, 0.35);
  --error-accent-border: rgba(255, 152, 48, 0.3);
  --error-accent-soft: rgba(255, 152, 48, 0.1);
}
`;

  return (
    <html lang={languageToHtmlLang(language)} data-theme="dark" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen items-center justify-center bg-[var(--error-bg)] text-[var(--error-text)]">
        <div className="w-full max-w-md border border-[var(--error-danger-border)] bg-[var(--error-panel)] p-8 text-center">
          <div className="mb-4 text-[48px] font-bold leading-none text-[var(--error-danger)] [text-shadow:0_0_6px_rgba(255,48,48,0.5)]">
            500
          </div>
          <p className="mb-6 text-[14px] text-[var(--error-muted)]">{t('errors.systemError')}</p>
          <button
            onClick={() => reset()}
            className="border border-[var(--error-accent-border)] px-4 py-2 text-[13px] text-[var(--error-accent)] transition-colors hover:bg-[var(--error-accent-soft)]"
          >
            {t('app.retry')}
          </button>
        </div>
      </body>
    </html>
  );
}
