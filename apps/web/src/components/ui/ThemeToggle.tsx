'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PortalTooltip } from '@/components/ui/FloatingPortal';
import { useAppTheme } from '@/providers/AppThemeProvider';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useAppTheme();

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const label =
    theme === 'dark'
      ? t('theme.toLight')
      : t('theme.toDark');

  return (
    <PortalTooltip content={label} placement="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="p-1.5 rounded-lg border border-copper/15 text-ink-muted hover:text-copper hover:border-copper/35 hover:bg-copper/5 transition-all"
      >
        {theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </button>
    </PortalTooltip>
  );
}
