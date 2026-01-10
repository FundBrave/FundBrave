'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type AuthResponse } from '@/lib/api/auth';

interface User {
  id: string;
  walletAddress: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider
 * Manages user authentication state and provides auth methods
 *
 * Security updates:
 * - Validates authentication via backend API (HttpOnly cookies)
 * - No longer checks localStorage for tokens
 * - Auto-refreshes using cookie-based refresh tokens
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify authentication with backend on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check authentication via backend (validates HttpOnly cookies)
        const authenticatedUser = await authApi.checkAuth();

        if (authenticatedUser) {
          setUser(authenticatedUser);
        }
      } catch (error) {
        console.error('Failed to verify authentication:', error);
        // User is not authenticated or session expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login user and store auth data
   */
  const login = useCallback((data: AuthResponse) => {
    authApi.storeAuthData(data);
    setUser(data.user);
  }, []);

  /**
   * Logout user and clear auth data
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Refresh access token using HttpOnly cookie
   * No need to pass refresh token - backend reads it from cookie
   */
  const refreshAuth = useCallback(async () => {
    try {
      const response = await authApi.refreshToken();
      setUser(response.user);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, []);

  // Auto-refresh token before expiry (using HttpOnly cookie)
  useEffect(() => {
    if (!user) return;

    // Refresh token every 50 minutes (assuming 1 hour expiry)
    // Backend handles refresh token from HttpOnly cookie
    const refreshInterval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If refresh fails, log out the user
        await logout();
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, refreshAuth, logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
