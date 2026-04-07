import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api, setToken, getToken } from "@/lib/api";
import type { AuthResponse } from "@shared/types";

interface AuthContextValue {
  isAuthenticated: boolean;
  admin: { id: number; username: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<{ id: number; username: string } | null>(() => {
    const stored = sessionStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.post<AuthResponse>("/auth/login", { username, password });
    setToken(data.accessToken);
    setAdmin(data.admin);
    sessionStorage.setItem("admin", JSON.stringify(data.admin));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setToken(null);
    setAdmin(null);
    sessionStorage.removeItem("admin");
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!admin, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
