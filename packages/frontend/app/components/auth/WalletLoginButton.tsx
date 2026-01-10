'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useWalletAuth } from '@/lib/hooks/useWalletAuth';
import { Spinner } from '@/app/components/ui/Spinner';
import { Wallet } from 'lucide-react';

interface WalletLoginButtonProps {
  delay?: number;
  onError?: (error: string) => void;
}

const buttonVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

/**
 * Wallet Login Button Component
 * Handles wallet connection and SIWE authentication
 */
export default function WalletLoginButton({ delay = 0.4, onError }: WalletLoginButtonProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { authenticate, isAuthenticating, error, clearError } = useWalletAuth();

  // Auto-authenticate when wallet is connected
  useEffect(() => {
    if (isConnected && address && !isAuthenticating) {
      handleAuthenticate();
    }
  }, [isConnected, address]);

  // Pass error to parent component
  useEffect(() => {
    if (error && onError) {
      onError(error);
      clearError();
    }
  }, [error, onError, clearError]);

  const handleAuthenticate = async () => {
    try {
      await authenticate();
      // Redirect to onboarding after successful authentication
      router.push('/onboarding');
    } catch (err) {
      // Error is handled in the hook
      console.error('Authentication failed:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                // Show authenticating state
                if (connected && isAuthenticating) {
                  return (
                    <motion.button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-border-subtle bg-transparent text-foreground"
                      variants={buttonVariants}
                    >
                      <Spinner size="md" color="white" />
                      <span>Authenticating...</span>
                    </motion.button>
                  );
                }

                // Show connect wallet button
                return (
                  <motion.button
                    onClick={openConnectModal}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-border-subtle bg-transparent text-foreground transition-colors hover:bg-foreground/10"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div
                      whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                    >
                      <Wallet className="h-5 w-5" />
                    </motion.div>
                    <span>Connect Wallet</span>
                  </motion.button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </motion.div>
  );
}
