'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { ApiError, authApi, TOKEN_KEY } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionError: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setSessionError(false);
      setLoading(false);
      return;
    }
    try {
      const response = await authApi.getCurrentUser();
      if (localStorage.getItem(TOKEN_KEY) === token) {
        setUser(response.data);
        setSessionError(false);
      }
    } catch (error) {
      if (localStorage.getItem(TOKEN_KEY) !== token) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setSessionError(false);
      } else {
        setSessionError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    const token = (response.data as { token?: string })?.token;
    if (!token) throw new ApiError('Login response did not contain a session');
    localStorage.setItem(TOKEN_KEY, token);
    try {
      const profile = await authApi.getCurrentUser();
      setUser(profile.data);
      setSessionError(false);
    } catch (error) {
      if (localStorage.getItem(TOKEN_KEY) === token) localStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  };

  const logout = async () => {
    const request = authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSessionError(false);
    void request.catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionError, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
