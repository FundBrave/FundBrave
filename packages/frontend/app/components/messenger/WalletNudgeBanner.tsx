'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, X } from '@/app/components/ui/icons';
import { DURATION, EASE } from '@/lib/constants/animation';

interface WalletNudgeBannerProps {
  onConnect: () => void;
}

/**
 * Wallet nudge banner with slide-down entrance and fade-out/slide-up dismiss.
 *
 * Framer Motion owns: opacity, height, y (mount/unmount lifecycle).
 * Tailwind owns: layout, colors, spacing.
 */
export function WalletNudgeBanner({ onConnect }: WalletNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{
            opacity: 1,
            height: 'auto',
            y: 0,
            transition: { duration: DURATION.normal, ease: EASE.snappy },
          }}
          exit={{
            opacity: 0,
            height: 0,
            y: -8,
            transition: { duration: DURATION.fast, ease: EASE.standard },
          }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-purple-500/20 bg-purple-500/5 px-4 py-2.5">
            <Wallet className="h-4 w-4 flex-shrink-0 text-purple-400" />
            <p className="flex-1 text-xs text-text-secondary">
              Connect a wallet for permanent encryption keys that work across devices.
            </p>
            <button
              onClick={onConnect}
              className="flex-shrink-0 min-h-[44px] rounded-md bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 active:bg-purple-500/30 active:scale-[0.98]"
            >
              Connect
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-tertiary hover:text-text-secondary active:text-foreground active:scale-[0.98]"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
