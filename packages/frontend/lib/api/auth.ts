/**
 * Authentication API Client
 * Handles all auth-related requests to the backend
 *
 * Security updates:
 * - CWE-522: Tokens stored as HttpOnly cookies (not localStorage)
 * - All requests use credentials: 'include' to send cookies
 * - Only non-sensitive user data stored in localStorage
 * - Automatic token refresh on 401 via API client interceptor
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface NonceResponse {
  nonce: string;
}

interface SiweVerifyRequest {
  message: string;
  signature: string;
}

interface AuthResponse {
  // Tokens are now in HttpOnly cookies, not returned in response body
  user: {
    id: string;
    walletAddress: string;
    email?: string;
    username?: string;
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface VerifyResetTokenResponse {
  valid: boolean;
  message: string;
  expiresAt?: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  emailVerified?: boolean;
}

interface ResendOtpRequest {
  email: string;
}

interface ResendOtpResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}

class AuthApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch nonce for SIWE authentication
   */
  async getNonce(walletAddress: string): Promise<string> {
    const data = await apiClient.get<NonceResponse>(
      `/api/auth/nonce?address=${walletAddress}`,
      { skipRefresh: true } // Don't refresh on 401 for public endpoint
    );
    return data.nonce;
  }

  /**
   * Verify SIWE signature and login
   * Tokens are set as HttpOnly cookies by the backend
   */
  async verifySiwe(message: string, signature: string): Promise<AuthResponse> {
    const authData = await apiClient.post<AuthResponse>(
      `/api/auth/siwe/verify`,
      { message, signature } as SiweVerifyRequest,
      { skipRefresh: true } // Don't refresh on 401 for login endpoint
    );

    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Register with email and password (creates managed wallet)
   * Tokens are set as HttpOnly cookies by the backend
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const authData = await apiClient.post<AuthResponse>(
      `/api/auth/register`,
      data,
      { skipRefresh: true } // Don't refresh on 401 for registration endpoint
    );

    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Login with username/email and password
   * Tokens are set as HttpOnly cookies by the backend
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const authData = await apiClient.post<AuthResponse>(
      `/api/auth/login`,
      data,
      { skipRefresh: true } // Don't refresh on 401 for login endpoint
    );

    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Refresh access token using HttpOnly cookie
   * No need to pass refresh token - it's in the cookie
   */
  async refreshToken(): Promise<AuthResponse> {
    const authData = await apiClient.post<AuthResponse>(
      `/api/auth/refresh`,
      undefined,
      { skipRefresh: true } // Prevent infinite loop
    );

    // Update user data if changed
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Logout (invalidate HttpOnly cookie tokens)
   */
  async logout(): Promise<void> {
    try {
      // Call backend to clear HttpOnly cookies
      await apiClient.post(`/api/auth/logout`, undefined, { skipRefresh: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local user data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('onboarding_data');
      }
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>(
      `/api/auth/forgot-password`,
      { email } as ForgotPasswordRequest,
      { skipRefresh: true } // Public endpoint
    );
  }

  /**
   * Verify password reset token validity
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    return apiClient.get<VerifyResetTokenResponse>(
      `/api/auth/verify-reset-token?token=${token}`,
      { skipRefresh: true } // Public endpoint
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>(
      `/api/auth/reset-password`,
      { token, newPassword } as ResetPasswordRequest,
      { skipRefresh: true } // Public endpoint
    );
  }

  /**
   * Get current user from localStorage
   * Note: User data only, tokens are in HttpOnly cookies
   */
  getCurrentUser(): AuthResponse['user'] | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Store ONLY non-sensitive user data
   * Tokens are in HttpOnly cookies, NOT stored in localStorage
   */
  storeAuthData(data: AuthResponse): void {
    if (typeof window === 'undefined') return;

    // Only store non-sensitive user data
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Check if user is authenticated by calling backend
   * Returns user data if authenticated, null otherwise
   */
  async checkAuth(): Promise<AuthResponse['user'] | null> {
    try {
      const data = await apiClient.get<AuthResponse['user']>(
        `/api/auth/me`,
        { skipRefresh: true } // Don't refresh during initial auth check
      );

      // Update stored user data
      this.storeAuthData({ user: data });
      return data;
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>(
      `/api/auth/verify-otp`,
      { email, otp } as VerifyOtpRequest,
      { skipRefresh: true } // Don't refresh on 401 for OTP verification
    );
  }

  /**
   * Resend OTP code
   */
  async resendOtp(email: string): Promise<ResendOtpResponse> {
    return apiClient.post<ResendOtpResponse>(
      `/api/auth/resend-otp`,
      { email } as ResendOtpRequest,
      { skipRefresh: true } // Don't refresh on 401 for OTP resend
    );
  }
}

// Export singleton instance
export const authApi = new AuthApiClient();

// Export types
export type {
  NonceResponse,
  SiweVerifyRequest,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
};
