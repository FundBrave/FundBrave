// hooks/useAuth.ts
"use client";

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  totalPoints: number;
  referralCode: string;
  authProvider: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Stubbed auth hook: returns unauthenticated state without any network/auth logic.
export const useAuth = (): AuthState => {
  const logout = async () => {};
  const refreshUser = async () => {};

  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    logout,
    refreshUser,
  };
};
