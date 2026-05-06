'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppBootstrapLoading } from '@/components/ui/AppBootstrapLoading';

type AppTheme = 'dark' | 'light';

type AppThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const THEME_STORAGE_KEY = 'skynet-theme';
const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function normalizeTheme(value: string | null): AppTheme {
  return value === 'light' ? 'light' : 'dark';
}

function applyDocumentTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [theme, setThemeState] = useState<AppTheme>('dark');

  useEffect(() => {
    let nextTheme: AppTheme = 'dark';
    try {
      nextTheme = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      nextTheme = 'dark';
    }
    applyDocumentTheme(nextTheme);
    setThemeState(nextTheme);
    setBootstrapping(false);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        applyDocumentTheme(nextTheme);
        setThemeState(nextTheme);
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
          /* localStorage unavailable */
        }
      },
    }),
    [theme],
  );

  if (bootstrapping) {
    return <AppBootstrapLoading />;
  }

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
}
