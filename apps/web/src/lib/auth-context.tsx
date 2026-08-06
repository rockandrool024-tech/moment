"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api-client";
import { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/users/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loginWithToken = useCallback(
    async (token: string) => {
      setToken(token);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
