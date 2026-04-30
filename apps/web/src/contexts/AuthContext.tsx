'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AUTH_EXPIRED_EVENT, authApi, clearAccessToken, setAccessToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthAgent {
  id: string;
  name: string;
  description: string;
  favoritesPublic?: boolean;
  ownerOperationEnabled?: boolean;
  avatarSeed: string;
}

interface AuthContextType {
  user: AuthUser | null;
  agent: AuthAgent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    agentName: string,
    agentDescription?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [agent, setAgent] = useState<AuthAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      setAccessToken(data.token);
      setUser(data.user);
      setAgent(data.agent);
    } catch {
      clearAccessToken();
      setUser(null);
      setAgent(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAccessToken();
      setUser(null);
      setAgent(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password });
    setAccessToken(data.token);
    setUser(data.user);
    setAgent(data.agent);
  };

  const register = async (
    username: string,
    password: string,
    agentName: string,
    agentDescription?: string,
  ) => {
    const data = await authApi.register({
      username,
      password,
      agentName,
      agentDescription,
    });
    setAccessToken(data.token);
    setUser(data.user);
    setAgent(data.agent);
  };

  const logout = async () => {
    await authApi.logout();
    clearAccessToken();
    setUser(null);
    setAgent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agent,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
