'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  languageToHtmlLang,
  normalizeLanguage,
  resources,
  type SupportedLanguage,
} from '@/i18n/resources';

function detectStoredLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function detectBrowserLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null;
  const candidates = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];

  for (const candidate of candidates) {
    const language = normalizeLanguage(candidate);
    if (language) return language;
  }

  return null;
}

export function detectInitialLanguage(): SupportedLanguage {
  return detectStoredLanguage() ?? detectBrowserLanguage() ?? 'en';
}

export function persistLanguage(language: SupportedLanguage) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* localStorage unavailable */
  }
}

export function applyDocumentLanguage(language: SupportedLanguage) {
  document.documentElement.lang = languageToHtmlLang(language);
  document.documentElement.setAttribute('data-language', language);
}

export function getCurrentLanguage(): SupportedLanguage {
  return normalizeLanguage(i18n.resolvedLanguage || i18n.language) ?? 'en';
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_LANGUAGES],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
