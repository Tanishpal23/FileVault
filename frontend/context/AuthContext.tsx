"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  storageQuota: string;
  storageUsed: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  loginAsDemo: () => void;
  register: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ id: string; name: string; email: string; storageQuota: string; storageUsed: string }>("/api/auth/me");
      setUser(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("filevault_user", JSON.stringify(data));
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("filevault_user");
        }
        return;
      }
      // If backend offline or network error, check localStorage for dev session
      const cached = typeof window !== "undefined" ? localStorage.getItem("filevault_user") : null;
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    const res = await api.post<{ user: User }>("/api/auth/login", credentials);
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem("filevault_user", JSON.stringify(res.user));
    }
  };

  const loginAsDemo = () => {
    const demoUser: User = {
      id: "demo-user-1",
      name: "Rahul Sharma",
      email: "rahul@filevault.io",
      storageQuota: "10737418240",
      storageUsed: "7730941132",
    };
    setUser(demoUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("filevault_user", JSON.stringify(demoUser));
    }
  };

  const register = async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    const res = await api.post<{ user: User }>("/api/auth/register", data);
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem("filevault_user", JSON.stringify(res.user));
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      // Ignored
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("filevault_user");
      }
    }
  };

  const forgotPassword = async (email: string) => {
    return api.post<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });
  };

  const resetPassword = async (data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    return api.post<{ success: boolean; message: string }>("/api/auth/reset-password", data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsDemo,
        register,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
