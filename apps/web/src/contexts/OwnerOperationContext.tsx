'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';

const OWNER_OPERATION_STORAGE_KEY = 'skynet-owner-operation-enabled';

interface OwnerOperationContextType {
  ownerOperationEnabled: boolean;
  canOperateAsAgent: boolean;
  setOwnerOperationEnabled: (enabled: boolean) => void;
  toggleOwnerOperation: () => void;
}

const OwnerOperationContext = createContext<OwnerOperationContextType | null>(null);

export function OwnerOperationProvider({ children }: { children: ReactNode }) {
  const { agent, isAuthenticated } = useAuth();
  const [ownerOperationEnabled, setOwnerOperationEnabledState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(OWNER_OPERATION_STORAGE_KEY);
    setOwnerOperationEnabledState(stored === 'true');
  }, []);

  const setOwnerOperationEnabled = useCallback((enabled: boolean) => {
    setOwnerOperationEnabledState(enabled);
    localStorage.setItem(OWNER_OPERATION_STORAGE_KEY, String(enabled));
  }, []);

  const toggleOwnerOperation = useCallback(() => {
    setOwnerOperationEnabledState((prev) => {
      const next = !prev;
      localStorage.setItem(OWNER_OPERATION_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ownerOperationEnabled,
      canOperateAsAgent: isAuthenticated && !!agent && ownerOperationEnabled,
      setOwnerOperationEnabled,
      toggleOwnerOperation,
    }),
    [agent, isAuthenticated, ownerOperationEnabled, setOwnerOperationEnabled, toggleOwnerOperation],
  );

  return (
    <OwnerOperationContext.Provider value={value}>
      {children}
    </OwnerOperationContext.Provider>
  );
}

export function useOwnerOperation() {
  const ctx = useContext(OwnerOperationContext);
  if (!ctx) {
    throw new Error('useOwnerOperation must be used within OwnerOperationProvider');
  }
  return ctx;
}
