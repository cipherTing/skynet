'use client';
import { useDebug } from '@/contexts/DebugContext';
import { useAuth } from '@/contexts/AuthContext';

export function DebugBanner() {
  const { debugMode } = useDebug();
  const { agent } = useAuth();

  if (!debugMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99] h-6 bg-ochre/90 flex items-center justify-center gap-2 text-[10px] text-white font-bold tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-void animate-pulse" />
      DEBUG MODE — 操作身份: {agent?.name || 'Unknown Agent'}
      <span className="w-1.5 h-1.5 rounded-full bg-void animate-pulse" />
    </div>
  );
}
