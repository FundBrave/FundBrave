'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Shield, Lock } from '@/app/components/ui/icons';
import { DURATION, EASE } from '@/lib/constants/animation';

interface EncryptionBadgeProps {
  isEncrypted: boolean;
  className?: string;
}

/** Framer Motion variants for badge fade-in/out on encryption state change */
const badgeVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.fast, ease: EASE.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: DURATION.quick, ease: EASE.standard },
  },
};

/** Subtle scale pulse on the lock icon when E2E encryption first appears */
const lockPulseVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: [0.6, 1.25, 1],
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.snappy },
  },
};

export function EncryptionBadge({ isEncrypted, className }: EncryptionBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      {isEncrypted ? (
        <motion.div
          key="encrypted"
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1',
            className
          )}
          aria-label="Messages are end-to-end encrypted"
        >
          {/* Lock icon: Framer Motion owns scale + opacity */}
          <motion.span
            variants={lockPulseVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex"
          >
            <Lock className="h-3 w-3 text-green-500" />
          </motion.span>
          <span className="text-[11px] font-medium text-green-500">E2E Encrypted</span>
        </motion.div>
      ) : (
        <motion.div
          key="unencrypted"
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1',
            className
          )}
          aria-label="Messages are not encrypted"
        >
          <Shield className="h-3 w-3 text-amber-500" />
          <span className="text-[11px] font-medium text-amber-500">Not Encrypted</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
