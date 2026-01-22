"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { sanitizeOAuthData } from "@/lib/sanitize";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "@/app/provider/AuthProvider";

/**
 * OAuth Callback Page
 * Handles OAuth redirect with one-time code exchange
 * Security fixes:
 * - CWE-598: Uses POST code exchange instead of tokens in URL
 * - CWE-522: Tokens stored as HttpOnly cookies, not localStorage
 * - CWE-79: Sanitizes all OAuth data to prevent XSS
 *
 * Enhanced with:
 * - Retry logic for failed exchanges
 * - Better error messages for specific failure cases
 * - Loading states during authentication
 */
export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Backend now redirects with one-time CODE, not tokens (CWE-598 fix)
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        // Check for error from backend
        if (errorParam) {
          const decodedError = decodeURIComponent(errorParam);
          setError(getErrorMessage('oauth_error', decodedError));
          setIsProcessing(false);
          setTimeout(() => router.push('/auth'), 3000);
          return;
        }

        // Validate code
        if (!code) {
          setError(getErrorMessage('missing_code'));
          setIsProcessing(false);
          setTimeout(() => router.push('/auth'), 3000);
          return;
        }

        // Exchange code with retry logic
        await exchangeCodeWithRetry(code);

      } catch (err) {
        console.error('OAuth callback error:', err);

        // Determine if we should retry
        if (retryCount < MAX_RETRIES && isRetriableError(err)) {
          console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            const code = searchParams.get('code');
            if (code) {
              exchangeCodeWithRetry(code);
            }
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          setError(getErrorMessage('exchange_failed', err instanceof Error ? err.message : undefined));
          setIsProcessing(false);
          setTimeout(() => router.push('/auth'), 3000);
        }
      }
    };

    /**
     * Exchange code with retry logic
     */
    const exchangeCodeWithRetry = async (code: string) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Exchange code for tokens via POST (CWE-598 & CWE-522 fix)
      // Tokens are set as HttpOnly cookies by the backend
      const response = await fetch(`${API_URL}/api/auth/oauth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: Include HttpOnly cookies
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Provide specific error messages
        if (response.status === 401) {
          throw new Error('invalid_code');
        } else if (response.status === 429) {
          throw new Error('rate_limit');
        } else if (response.status >= 500) {
          throw new Error('server_error');
        }

        throw new Error(errorData.message || 'exchange_failed');
      }

      const authData = await response.json();

      // Sanitize user data to prevent XSS (CWE-79 fix)
      const sanitizedUser = sanitizeOAuthData({
        email: authData.user?.email,
        username: authData.user?.username,
        displayName: authData.user?.displayName,
      });

      // Update auth context
      login(authData);

      // Prepare onboarding data with sanitized values
      if (typeof window !== 'undefined') {
        const onboardingData = {
          email: sanitizedUser.email || '',
          profile: {
            fullName: sanitizedUser.username || sanitizedUser.displayName || '',
            email: sanitizedUser.email || '',
            birthdate: '',
            bio: '',
            avatar: '',
          },
          social: { twitter: '', instagram: '', linkedin: '', github: '' },
          goals: [],
          isComplete: false,
        };
        localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
      }

      // Success - redirect to onboarding
      setIsProcessing(false);
      setTimeout(() => {
        router.push('/onboarding');
      }, 1000);
    };

    /**
     * Determine if error is retriable
     */
    const isRetriableError = (err: unknown): boolean => {
      if (!(err instanceof Error)) return false;

      const retriableErrors = ['server_error', 'rate_limit', 'network_error'];
      return retriableErrors.some(e => err.message.includes(e));
    };

    /**
     * Get user-friendly error message
     * SECURITY: Sanitizes error details to prevent XSS (CWE-79)
     */
    const getErrorMessage = (errorType: string, details?: string): string => {
      // Sanitize details by removing any HTML/script content
      const sanitizedDetails = details
        ? details.replace(/<[^>]*>/g, '').slice(0, 100) // Remove HTML tags and limit length
        : 'Unknown error';

      const errorMessages: Record<string, string> = {
        missing_code: 'Missing authorization code. Please try signing in again.',
        invalid_code: 'Invalid or expired authorization code. Please try signing in again.',
        rate_limit: 'Too many requests. Please wait a moment and try again.',
        server_error: 'Server is temporarily unavailable. Please try again in a moment.',
        exchange_failed: 'Failed to complete authentication. Please try again.',
        oauth_error: `Authentication failed: ${sanitizedDetails}`,
      };

      return errorMessages[errorType] || errorMessages.exchange_failed;
    };

    processOAuthCallback();
  }, [searchParams, router, login, retryCount]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-default/50 p-8 text-center backdrop-blur-md"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.5,
        }}
      >
        {error ? (
          // Error State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
            >
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Authentication Failed
            </h2>
            <p className="mb-4 text-text-secondary">{error}</p>
            <p className="text-sm text-text-secondary">
              Redirecting you back to login...
            </p>
          </motion.div>
        ) : (
          // Loading State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Spinner size="lg" color="primary" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              {retryCount > 0 ? 'Retrying...' : isProcessing ? 'Completing sign in...' : 'Success!'}
            </h2>
            <p className="text-text-secondary">
              {retryCount > 0
                ? `Attempting to reconnect (${retryCount}/${MAX_RETRIES})...`
                : isProcessing
                ? 'Please wait while we set up your account'
                : 'Redirecting you to your dashboard'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
