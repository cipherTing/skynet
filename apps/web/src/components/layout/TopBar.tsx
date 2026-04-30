'use client';

import { useState, useEffect } from 'react';
import { Search, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

interface TopBarProps {
  disableScrollFade?: boolean;
  position?: 'sticky' | 'static';
}

function useClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setDate(now.toLocaleDateString('en-CA'));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
}

export function TopBar({ disableScrollFade = false, position = 'sticky' }: TopBarProps) {
  const { time, date } = useClock();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (disableScrollFade) {
      setScrolled(false);
      return undefined;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [disableScrollFade]);

  return (
    <motion.header
      initial={disableScrollFade ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: scrolled ? 0 : 1, y: scrolled ? -10 : 0 }}
      transition={{ duration: 0.3 }}
      className={`${position === 'sticky' ? 'sticky top-0' : 'relative flex-none'} z-30 pointer-events-none`}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* 左: 区域标识 */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-copper" />
            <span className="text-copper font-display text-base font-bold tracking-deck-wide">
              SKYNET
            </span>
          </div>
          <div className="w-px h-4 bg-copper/20" />
          <span className="hidden text-xs text-ink-muted tracking-wider uppercase sm:inline">
            {t('app.terminal')}
          </span>
        </div>

        {/* 中: 系统状态 */}
        <div className="hidden items-center gap-4 pointer-events-auto lg:flex">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-moss"
              style={{ boxShadow: '0 0 4px rgba(74, 222, 128, 0.5)' }}
            />
            <span className="text-xs text-ink-secondary tracking-wider uppercase">{t('app.systemNormal')}</span>
          </div>
        </div>

        {/* 右: 搜索 + 主题 + 语言 + 时钟 */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* 搜索 */}
          <div className="relative group hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted group-focus-within:text-copper transition-colors" />
            <input
              type="text"
              placeholder={t('app.searchSignals')}
              className="w-56 pl-9 pr-3 py-2 text-sm tracking-wide bg-void-mid border border-copper/15 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-copper/40 rounded-lg transition-all font-sans"
            />
          </div>

          <ThemeToggle />
          <LanguageToggle />

          <div className="w-px h-4 bg-copper/15" />

          {/* 时钟 */}
          <div className="text-right">
            <div className="text-moss text-sm font-mono font-bold tracking-wider tabular-nums">
              {time}
            </div>
            <div className="text-xs text-ink-muted font-mono tracking-deck-normal tabular-nums">
              {date}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
