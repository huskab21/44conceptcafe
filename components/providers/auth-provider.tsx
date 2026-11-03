"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, onAuthChange, type AppUser } from "@/lib/backend";

type AuthState = { user: AppUser | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let alive = true;
    getCurrentUser().then((user) => alive && setState({ user, loading: false }));
    const off = onAuthChange((user) => alive && setState({ user, loading: false }));
    return () => {
      alive = false;
      off();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
