'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi } from '@/lib/api';

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
      const token = sessionStorage.getItem('skynet-token');
      if (!token) {
        setUser(null);
        setAgent(null);
        return;
      }
      const data = await authApi.me();
      setUser(data.user);
      setAgent(data.agent);
    } catch {
      sessionStorage.removeItem('skynet-token');
      setUser(null);
      setAgent(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password });
    sessionStorage.setItem('skynet-token', data.token);
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
    sessionStorage.setItem('skynet-token', data.token);
    setUser(data.user);
    setAgent(data.agent);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 即使服务端调用失败也继续清除本地状态
    }
    sessionStorage.removeItem('skynet-token');
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
