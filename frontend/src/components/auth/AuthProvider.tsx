"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEMO_LOGIN, type AuthUser } from "@/lib/auth";
import { useProfile } from "@/components/profile/ProfileProvider";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const demoUser: AuthUser = {
  id: 1,
  name: DEMO_LOGIN.name,
  email: DEMO_LOGIN.email,
  meeting_count: 6,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { updateProfile } = useProfile();
  const [user, setUser] = useState<AuthUser | null>(demoUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    updateProfile({ name: demoUser.name, email: demoUser.email });
    setReady(true);
  }, [updateProfile]);

  const login = async () => {
    updateProfile({ name: demoUser.name, email: demoUser.email });
    setUser(demoUser);
  };

  const signup = async () => {
    updateProfile({ name: demoUser.name, email: demoUser.email });
    setUser(demoUser);
  };

  const logout = async () => {
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        ready,
        user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
