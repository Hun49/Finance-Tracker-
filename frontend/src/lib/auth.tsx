"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearSession, getStoredTokens, jsonPost, storeTokens } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type UserProfile = {
  id: string;
  userId: string;
  mainCurrency: string;
  startingBalance: number | string;
  incomeFrequency: string;
  expectedIncomeAmount: number | string | null;
  salaryDay: number | null;
};

export type AuthState = {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  completeOnboarding: (data: OnboardingInput) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
};

export type OnboardingInput = {
  mainCurrency: string;
  startingBalance: number;
  incomeFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "IRREGULAR" | "CUSTOM";
  expectedIncomeAmount: number | null;
  salaryDay: number | null;
};

type MeResponse = { user: AuthUser; profile: UserProfile | null };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    const tokens = getStoredTokens();
    if (!tokens) {
      setLoading(false);
      return;
    }
    try {
      const data = await api<MeResponse>("/auth/me");
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  async function login(email: string, password: string) {
    const data = await api<{ user: AuthUser; accessToken: string; refreshToken: string }>(
      "/auth/login",
      jsonPost({ email, password }),
    );
    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    setProfile(null);
  }

  async function register(name: string, email: string, password: string) {
    await api<{ user: AuthUser; message: string }>("/auth/register", jsonPost({ name, email, password }));
  }

  async function verifyEmail(email: string, code: string) {
    const data = await api<{ user: AuthUser; accessToken: string; refreshToken: string }>(
      "/auth/verify-email",
      jsonPost({ email, code }),
    );
    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    setProfile(null);
  }

  async function completeOnboarding(data: OnboardingInput) {
    const result = await api<{ profile: UserProfile }>("/profile/onboarding", jsonPost(data));
    setProfile(result.profile);
  }

  async function logout() {
    const tokens = getStoredTokens();
    if (tokens) {
      try {
        await api("/auth/logout", jsonPost({ refreshToken: tokens.refreshToken })).catch(() => undefined);
      } catch {
        // ignore logout network errors
      }
    }
    clearSession();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, verifyEmail, completeOnboarding, logout, loadSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}