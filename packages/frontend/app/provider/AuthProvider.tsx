'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi, type AuthResponse } from '@/lib/api/auth';

interface User {
  id: string;
  walletAddress: string;
  email?: string;
  username?: string;
}

interface AuthError {
  message: string;
  code?: string;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
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
 * - Enhanced error handling with retry logic
 * - Prevents multiple simultaneous refresh attempts
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Verify authentication with backend on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check authentication via backend (validates HttpOnly cookies)
        const authenticatedUser = await authApi.checkAuth();

        if (authenticatedUser) {
          setUser(authenticatedUser);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to verify authentication:', err);
        // User is not authenticated or session expired
        setUser(null);
        setError({
          message: 'Session verification failed',
          code: 'AUTH_CHECK_FAILED',
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Schedule automatic token refresh
   * Refreshes 2 minutes before token expiry
   * Backend uses 15-minute access tokens, so we refresh at 13 minutes
   */
  const scheduleTokenRefresh = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Access token expires in 15 minutes, refresh at 13 minutes (2 minutes before expiry)
    const refreshTime = 13 * 60 * 1000; // 13 minutes in milliseconds

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        // If refresh fails, log out the user
        await logout();
      }
    }, refreshTime);
  }, []);

  /**
   * Login user and store auth data
   */
  const login = useCallback((data: AuthResponse) => {
    authApi.storeAuthData(data);
    setUser(data.user);
    setError(null);

    // Schedule token refresh
    scheduleTokenRefresh();
  }, [scheduleTokenRefresh]);

  /**
   * Logout user and clear auth data
   */
  const logout = useCallback(async () => {
    try {
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      await authApi.logout();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError({
        message: 'Logout failed',
        code: 'LOGOUT_FAILED',
        timestamp: Date.now(),
      });
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh access token using HttpOnly cookie
   * Prevents multiple simultaneous refresh attempts
   */
  const refreshAuth = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress, skipping...');
      return;
    }

    isRefreshingRef.current = true;

    try {
      const response = await authApi.refreshToken();
      setUser(response.user);
      setError(null);

      // Schedule next refresh
      scheduleTokenRefresh();
    } catch (err) {
      console.error('Token refresh failed:', err);
      setError({
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED',
        timestamp: Date.now(),
      });
      throw err;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [scheduleTokenRefresh]);

  // Setup auto-refresh when user logs in
  useEffect(() => {
    if (!user) {
      // Clear refresh timeout when user logs out
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    // Schedule token refresh
    scheduleTokenRefresh();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
    clearError,
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
