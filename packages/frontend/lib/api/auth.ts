/**
 * Authentication API Client
 * Handles all auth-related requests to the backend
 *
 * Security updates:
 * - CWE-522: Tokens stored as HttpOnly cookies (not localStorage)
 * - All requests use credentials: 'include' to send cookies
 * - Only non-sensitive user data stored in localStorage
 */

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
  username: string;
}

interface LoginRequest {
  username: string;
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

class AuthApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch nonce for SIWE authentication
   */
  async getNonce(walletAddress: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/nonce?address=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies in request
    });

    if (!response.ok) {
      throw new Error(`Failed to get nonce: ${response.statusText}`);
    }

    const data: NonceResponse = await response.json();
    return data.nonce;
  }

  /**
   * Verify SIWE signature and login
   * Tokens are set as HttpOnly cookies by the backend
   */
  async verifySiwe(message: string, signature: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/siwe/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include HttpOnly cookies
      body: JSON.stringify({ message, signature } as SiweVerifyRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify signature');
    }

    const authData = await response.json();
    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Register with email and password (creates managed wallet)
   * Tokens are set as HttpOnly cookies by the backend
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include HttpOnly cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const authData = await response.json();
    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Login with username/email and password
   * Tokens are set as HttpOnly cookies by the backend
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include HttpOnly cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const authData = await response.json();
    // Store only non-sensitive user data
    this.storeAuthData(authData);
    return authData;
  }

  /**
   * Refresh access token using HttpOnly cookie
   * No need to pass refresh token - it's in the cookie
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Send refresh token cookie
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const authData = await response.json();
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
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookies to be cleared
      });
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
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email } as ForgotPasswordRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }

    return response.json();
  }

  /**
   * Verify password reset token validity
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/verify-reset-token?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid token');
    }

    return response.json();
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ token, newPassword } as ResetPasswordRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
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
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Send HttpOnly cookies
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      // Update stored user data
      this.storeAuthData({ user: data.user });
      return data.user;
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
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
};
