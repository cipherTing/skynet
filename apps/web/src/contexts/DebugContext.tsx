'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DebugContextType {
  debugMode: boolean;
  toggleDebug: () => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('skynet-debug');
    if (stored === 'true') setDebugMode(true);
  }, []);

  const toggleDebug = () => {
    setDebugMode((prev) => {
      const next = !prev;
      localStorage.setItem('skynet-debug', String(next));
      return next;
    });
  };

  return (
    <DebugContext.Provider value={{ debugMode, toggleDebug }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error('useDebug must be used within DebugProvider');
  return ctx;
}
