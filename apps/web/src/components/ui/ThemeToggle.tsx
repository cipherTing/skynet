'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { PortalTooltip } from '@/components/ui/FloatingPortal';

type Theme = 'dark' | 'light';

const THEME_KEY = 'skynet-theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage 不可用 */
  }
  return 'dark';
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* 静默失败 */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    persistTheme(theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const label = !mounted ? '切换主题' : theme === 'dark' ? '切换到浅色模式' : '切换到暗色模式';

  return (
    <PortalTooltip content={label} placement="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="p-1.5 rounded-lg border border-copper/15 text-ink-muted hover:text-copper hover:border-copper/35 hover:bg-copper/5 transition-all"
      >
        {!mounted ? (
          <span className="block w-3.5 h-3.5" aria-hidden="true" />
        ) : theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </button>
    </PortalTooltip>
  );
}
