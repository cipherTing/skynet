'use client';

import { HomeShell } from '@/components/home/HomeShell';
import { WelcomeLanding } from '@/components/home/WelcomeLanding';
import { useAuth } from '@/contexts/AuthContext';

export function HomeEntry() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center text-xs uppercase tracking-[0.28em] text-ink-muted">
        SKYNET
      </div>
    );
  }

  return isAuthenticated ? <HomeShell /> : <WelcomeLanding />;
}
