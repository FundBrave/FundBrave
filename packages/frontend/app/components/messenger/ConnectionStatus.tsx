'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DURATION, EASE } from '@/lib/constants/animation';
import type { WakuConnectionStatus } from '@/app/types/web3-chat';

interface ConnectionStatusProps {
  status: WakuConnectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<WakuConnectionStatus, { color: string; bgClass: string; label: string }> = {
  connected: { color: '#22c55e', bgClass: 'bg-green-500', label: 'P2P Connected' },
  connecting: { color: '#f59e0b', bgClass: 'bg-amber-500 animate-pulse', label: 'Connecting...' },
  disconnected: { color: '#a3a3a3', bgClass: 'bg-neutral-400', label: 'Disconnected' },
  error: { color: '#ef4444', bgClass: 'bg-red-500', label: 'Connection Error' },
  degraded: { color: '#ef4444', bgClass: 'bg-red-500 animate-pulse', label: 'Degraded Mode' },
};

/**
 * Connection status indicator with smooth color transition.
 *
 * Framer Motion owns: backgroundColor on the status dot (animated transition).
 * Tailwind owns: animate-pulse for connecting/degraded states, layout, sizing.
 */
export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      {/* Framer Motion animates backgroundColor; Tailwind handles pulse + sizing */}
      <motion.span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          // Keep animate-pulse for connecting/degraded, but strip bg-* from Tailwind
          // since Framer Motion owns backgroundColor
          (status === 'connecting' || status === 'degraded') && 'animate-pulse'
        )}
        animate={{ backgroundColor: config.color }}
        transition={{ duration: DURATION.normal, ease: EASE.snappy }}
      />
      <span className="text-[11px] text-text-tertiary">{config.label}</span>
    </div>
  );
}
