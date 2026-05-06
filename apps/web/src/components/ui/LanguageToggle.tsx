'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  FLOATING_Z_INDEX,
  FloatingPortal,
  PortalTooltip,
  isEventInsideRefs,
} from '@/components/ui/FloatingPortal';
import { getCurrentLanguage, setAppLanguage } from '@/i18n/i18n';
import { type SupportedLanguage } from '@/i18n/resources';

const LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; shortLabelKey: string; labelKey: string }> = [
  { value: 'zh', shortLabelKey: 'language.shortZh', labelKey: 'language.zh' },
  { value: 'en', shortLabelKey: 'language.shortEn', labelKey: 'language.en' },
];

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() =>
    getCurrentLanguage(),
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(getCurrentLanguage());
      closeMenu();
    };

    i18n.on('languageChanged', handleLanguageChanged);
    handleLanguageChanged();
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [closeMenu, i18n]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!isEventInsideRefs(event, [triggerRef, menuRef])) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, open]);

  const currentOption = LANGUAGE_OPTIONS.find((option) => option.value === currentLanguage) ?? LANGUAGE_OPTIONS[1];

  return (
    <>
      <PortalTooltip content={t('language.label')} placement="bottom">
        <button
          ref={triggerRef}
          type="button"
          aria-label={t('language.label')}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((nextOpen) => !nextOpen)}
          className="inline-flex h-8 min-w-12 items-center justify-center gap-1 rounded-lg border border-copper/15 px-2 text-[11px] font-bold text-ink-muted transition-all hover:border-copper/35 hover:bg-copper/5 hover:text-copper"
        >
          <Languages className="h-3.5 w-3.5" />
          <span>{t(currentOption.shortLabelKey)}</span>
        </button>
      </PortalTooltip>

      <FloatingPortal
        open={open}
        anchorRef={triggerRef}
        placement="bottom"
        align="end"
        offset={8}
        zIndex={FLOATING_Z_INDEX.menu}
        role="menu"
        className="w-36 rounded-lg border border-copper/20 bg-void-deep p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.42)]"
      >
        <div ref={menuRef} className="grid gap-1">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = currentLanguage === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  void setAppLanguage(option.value).catch((error: unknown) => {
                    console.error('Failed to change language:', error);
                  });
                }}
                className={`flex items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-all ${
                  selected
                    ? 'bg-copper/[0.12] text-copper'
                    : 'text-ink-secondary hover:bg-copper/[0.06] hover:text-ink-primary'
                }`}
              >
                <span>{t(option.labelKey)}</span>
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </FloatingPortal>
    </>
  );
}
