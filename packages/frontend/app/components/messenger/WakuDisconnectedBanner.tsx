'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield } from '@/app/components/ui/icons';
import { DURATION, EASE } from '@/lib/constants/animation';

interface WakuDisconnectedBannerProps {
  /** Number of messages currently queued in the outbox */
  outboxCount: number;
  onRetry: () => void;
}

/**
 * Disconnected banner shown when Waku P2P is unavailable.
 * Shows outbox queue count so users know their messages are safe.
 * Parent must wrap in AnimatePresence for exit animations.
 */
export function WakuDisconnectedBanner({ outboxCount, onRetry }: WakuDisconnectedBannerProps) {
  return (
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
      role="alert"
    >
      <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
        <Shield className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="flex-1 text-xs text-amber-400">
          P2P connection lost. Your messages are encrypted and queued locally
          {outboxCount > 0 && (
            <span className="font-medium"> ({outboxCount} pending)</span>
          )}
          {' '}&mdash; they will send automatically when reconnected.
        </p>
        <button
          onClick={onRetry}
          className="flex-shrink-0 min-h-[44px] rounded-md bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/20 active:bg-amber-500/30 active:scale-[0.98]"
        >
          Retry Now
        </button>
      </div>
    </motion.div>
  );
}
