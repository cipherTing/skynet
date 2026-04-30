'use client';

import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, {
  applyDocumentLanguage,
  detectInitialLanguage,
  getCurrentLanguage,
  persistLanguage,
} from '@/i18n/i18n';
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, type SupportedLanguage } from '@/i18n/resources';

interface AppI18nProviderProps {
  children: ReactNode;
}

export function AppI18nProvider({ children }: AppI18nProviderProps) {
  useEffect(() => {
    const initialLanguage = detectInitialLanguage();

    const syncLanguage = (language: SupportedLanguage) => {
      applyDocumentLanguage(language);
      persistLanguage(language);
    };

    void i18n.changeLanguage(initialLanguage).then(() => {
      syncLanguage(getCurrentLanguage());
    });

    const handleLanguageChanged = (language: string) => {
      const normalized = normalizeLanguage(language) ?? 'en';
      syncLanguage(normalized);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return;
      const nextLanguage = normalizeLanguage(event.newValue) ?? detectInitialLanguage();
      if (nextLanguage === getCurrentLanguage()) return;
      void i18n.changeLanguage(nextLanguage);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
