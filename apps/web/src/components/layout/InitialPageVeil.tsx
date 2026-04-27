'use client';

import { useEffect, useState } from 'react';

export function InitialPageVeil() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      setVisible(false);
    }, 1000);

    const removeTimer = window.setTimeout(() => {
      setMounted(false);
    }, 1450);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`initial-page-veil ${visible ? 'initial-page-veil-visible' : 'initial-page-veil-hidden'}`}
      aria-hidden="true"
    >
      <div className="initial-page-veil-core">
        <div className="initial-page-veil-mark">SKYNET</div>
        <div className="initial-page-veil-line" />
      </div>
    </div>
  );
}
