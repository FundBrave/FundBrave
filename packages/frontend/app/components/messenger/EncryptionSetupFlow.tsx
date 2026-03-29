'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Loader2 } from '@/app/components/ui/icons';
import { Button } from '@/app/components/ui/button';
import { DURATION, EASE } from '@/lib/constants/animation';
import type { WalletType } from '@/app/types/web3-chat';

interface EncryptionSetupFlowProps {
  walletType: WalletType | null;
  isSettingUp: boolean;
  isComplete: boolean;
  onSignWithWallet: () => void;
  onUseTempWallet: () => void;
  error?: string | null;
}

/** Crossfade variants for step transitions (loading -> setup prompt) */
const stepVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.snappy },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.fast, ease: EASE.standard },
  },
};

/**
 * Encryption setup flow with crossfade transitions between states.
 *
 * Framer Motion owns: opacity, y (step transitions), scale (button hover).
 * Tailwind owns: layout, colors, gradient, spacing.
 */
export function EncryptionSetupFlow({
  walletType,
  isSettingUp,
  isComplete,
  onSignWithWallet,
  onUseTempWallet,
  error,
}: EncryptionSetupFlowProps) {
  // Already set up -- don't show anything
  if (isComplete) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Setting up -- show loading */}
      {isSettingUp && (
        <motion.div
          key="loading"
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col items-center justify-center gap-4 p-8"
        >
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-text-secondary">Setting up encrypted messaging...</p>
        </motion.div>
      )}

      {/* No wallet connected -- temp wallet setup (transparent) */}
      {!isSettingUp && !walletType && (
        <motion.div
          key="temp-wallet"
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Lock className="h-8 w-8 text-green-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              End-to-End Encrypted Messaging
            </h3>
            <p className="max-w-sm text-sm text-text-secondary">
              Your messages are automatically encrypted. Only you and the recipient can read them.
            </p>
          </div>
          {/* Button hover micro-interaction: Framer Motion owns scale */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
            <Button
              onClick={onUseTempWallet}
              className="bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)] text-white"
            >
              Start Messaging
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Real wallet connected -- ask for signature */}
      {!isSettingUp && walletType && (
        <motion.div
          key="wallet-sign"
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Set Up Encrypted Messaging
            </h3>
            <p className="max-w-sm text-sm text-text-secondary">
              Sign a message to set up encryption keys. This does NOT cost gas or make a transaction.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            {/* Button hover micro-interaction: Framer Motion owns scale */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Button
                onClick={onSignWithWallet}
                className="bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)] text-white"
              >
                Sign & Set Up
              </Button>
            </motion.div>
            <Button
              variant="ghost"
              onClick={onUseTempWallet}
              className="text-text-secondary"
            >
              Skip for now
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">
            Skipping will use a temporary key. You can upgrade later.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
