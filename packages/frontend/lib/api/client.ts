/**
 * API Client with automatic error handling and token refresh
 * Handles 401 responses by automatically refreshing tokens
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Subscribe to token refresh
   */
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify subscribers when token is refreshed
   */
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HttpOnly refresh token cookie
      });

      if (!response.ok) {
        return false;
      }

      // Token refreshed successfully (new token is in HttpOnly cookie)
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Enhanced fetch with automatic token refresh on 401
   */
  async fetch<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

    // Ensure credentials are always included unless explicitly disabled
    const requestOptions: RequestInit = {
      ...fetchOptions,
      credentials: skipAuth ? 'omit' : 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    };

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 Unauthorized
      if (response.status === 401 && !skipRefresh) {
        // If already refreshing, wait for the refresh to complete
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh(async () => {
              try {
                // Retry original request after token refresh
                const retryResponse = await fetch(url, requestOptions);
                if (!retryResponse.ok) {
                  reject(new Error('Request failed after token refresh'));
                  return;
                }
                const data = await retryResponse.json();
                resolve(data);
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        // Try to refresh token
        this.isRefreshing = true;

        try {
          const refreshed = await this.refreshAccessToken();

          if (refreshed) {
            // Notify subscribers
            this.onTokenRefreshed('refreshed');

            // Retry original request
            const retryResponse = await fetch(url, requestOptions);

            if (!retryResponse.ok) {
              if (retryResponse.status === 401) {
                // Still unauthorized after refresh - logout required
                this.handleUnauthorized();
                throw new Error('Session expired. Please login again.');
              }
              throw new Error(`Request failed: ${retryResponse.statusText}`);
            }

            return retryResponse.json();
          } else {
            // Refresh failed - logout required
            this.handleUnauthorized();
            throw new Error('Session expired. Please login again.');
          }
        } finally {
          this.isRefreshing = false;
        }
      }

      // Handle other error responses
      if (!response.ok) {
        let errorMessage = `Request failed: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Could not parse error response
        }

        throw new Error(errorMessage);
      }

      // Parse and return response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return response.text() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * Handle unauthorized access (logout user)
   */
  private handleUnauthorized(): void {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('onboarding_data');

      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export type
export type { FetchOptions };
