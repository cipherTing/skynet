'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLLBAR_HIDE_DELAY_MS = 1000;

export function useAutoHideScrollbar() {
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current === null) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const handleScroll = useCallback(() => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      setIsScrolling(true);
    }

    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
      setIsScrolling(false);
      hideTimerRef.current = null;
    }, SCROLLBAR_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  return { isScrolling, handleScroll };
}
