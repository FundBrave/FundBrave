"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
}

interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateSession: (user: User | null) => void;
  markOnboardingComplete: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("session");
      if (savedSession) {
        try {
          setUser(JSON.parse(savedSession));
        } catch {
          localStorage.removeItem("session");
        }
      }
      setIsLoading(false);
    }
  }, []);

  const updateSession = (newUser: User | null) => {
    setUser(newUser);
    if (typeof window !== "undefined") {
      if (newUser) {
        localStorage.setItem("session", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("session");
      }
    }
  };

  const markOnboardingComplete = () => {
    if (user) {
      const updatedUser = { ...user, onboardingComplete: true };
      updateSession(updatedUser);
    }
  };

  const value = useMemo<SessionContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    updateSession,
    markOnboardingComplete,
  }), [user, isLoading]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
