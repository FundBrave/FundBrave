'use client';

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/app/provider/AuthProvider';

interface UseWalletAuthReturn {
  authenticate: () => Promise<void>;
  isAuthenticating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for Sign-In with Ethereum (SIWE) authentication
 * Handles the complete SIWE flow: nonce fetch, message signing, and verification
 */
export function useWalletAuth(): UseWalletAuthReturn {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { login } = useAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Authenticate user with SIWE
   */
  const authenticate = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // 1. Fetch nonce from backend
      const nonce = await authApi.getNonce(address);

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to FundBrave with Ethereum',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1,
        nonce,
      });

      const messageString = message.prepareMessage();

      // 3. Request user signature
      const signature = await signMessageAsync({
        message: messageString,
      });

      // 4. Verify signature with backend
      const authResponse = await authApi.verifySiwe(messageString, signature);

      // 5. Store auth data and update context
      login(authResponse);

      // 6. Setup onboarding data if new user
      if (typeof window !== 'undefined') {
        const existingData = localStorage.getItem('onboarding_data');

        if (!existingData) {
          const onboardingData = {
            walletAddress: address,
            profile: {
              fullName: authResponse.user.username || '',
              email: authResponse.user.email || '',
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
      }
    } catch (err) {
      console.error('Authentication error:', err);

      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          setError('Signature request rejected. Please try again.');
        } else if (err.message.includes('nonce')) {
          setError('Failed to get authentication nonce. Please try again.');
        } else if (err.message.includes('verify')) {
          setError('Signature verification failed. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }

      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, signMessageAsync, login]);

  return {
    authenticate,
    isAuthenticating,
    error,
    clearError,
  };
}
