"use client";

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useFollow } from '@/app/hooks/useFollow';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  showMutualBadge?: boolean;
  variant?: 'default' | 'compact';
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

/**
 * FollowButton Component
 *
 * Interactive follow/unfollow button with animations and optimistic updates.
 * Shows different states: Follow, Following (hover -> Unfollow), Loading.
 * Includes GSAP animations for smooth transitions.
 *
 * Visual States:
 * - Default: "Follow" with outline style
 * - Following: "Following" with filled style and checkmark
 * - Hover on Following: "Unfollow" with destructive hint
 * - Loading: Spinner with disabled state
 *
 * @example
 * ```tsx
 * <FollowButton
 *   userId="user-123"
 *   initialIsFollowing={false}
 *   initialFollowerCount={120}
 * />
 * ```
 */
export function FollowButton({
  userId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  showMutualBadge = false,
  variant = 'default',
  onFollowChange,
  className = '',
}: FollowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isFollowing, isLoading, toggleFollow } = useFollow({
    userId,
    initialIsFollowing,
    initialFollowerCount,
    onSuccess: onFollowChange,
  });

  // GSAP animation on follow/unfollow
  useEffect(() => {
    if (!buttonRef.current || isLoading) return;

    if (isFollowing) {
      // Scale up with bounce on follow
      gsap.timeline()
        .to(buttonRef.current, {
          scale: 1.1,
          duration: 0.15,
          ease: 'back.out(2)',
        })
        .to(buttonRef.current, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
        });
    } else {
      // Subtle shake on unfollow
      gsap.timeline()
        .to(buttonRef.current, { x: -2, duration: 0.05 })
        .to(buttonRef.current, { x: 2, duration: 0.05 })
        .to(buttonRef.current, { x: 0, duration: 0.05 });
    }
  }, [isFollowing, isLoading]);

  const handleClick = async () => {
    if (!isLoading) {
      await toggleFollow();
    }
  };

  const isCompact = variant === 'compact';
  const buttonHeight = isCompact ? 'min-h-[36px]' : 'min-h-[44px]';
  const buttonPadding = isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5';
  const textSize = isCompact ? 'text-sm' : 'text-base';

  // Dynamic styles based on state
  const getButtonStyles = () => {
    if (isLoading) {
      return 'bg-transparent border border-white/20 text-foreground/50';
    }
    if (isFollowing) {
      return 'bg-[var(--neutral-dark-400)] text-foreground border border-white/10 hover:border-red-500/50';
    }
    return 'bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10';
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${buttonHeight} ${buttonPadding} ${textSize}
        ${getButtonStyles()}
        rounded-lg font-medium
        transition-all duration-200
        flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
        disabled:cursor-not-allowed
        group
        ${className}
      `}
      style={{
        minWidth: isCompact ? '90px' : '120px',
      }}
      aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
      aria-pressed={isFollowing}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span className="text-foreground/50">...</span>
        </>
      ) : isFollowing ? (
        <>
          {/* Following State - Changes to Unfollow on hover */}
          <CheckIcon className="w-4 h-4 group-hover:hidden" />
          <XIcon className="w-4 h-4 hidden group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:block text-red-400">Unfollow</span>
          {showMutualBadge && (
            <MutualBadge className="ml-1" />
          )}
        </>
      ) : (
        <>
          {/* Follow State */}
          <PlusIcon className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
}

// Icon Components (inline SVG as per requirements)

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3V13M3 8H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8L6.5 11.5L13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <motion.svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="30 10"
        opacity="0.5"
      />
    </motion.svg>
  );
}

function MutualBadge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mutual follow"
    >
      <title>Mutual follow</title>
      <path
        d="M4 8L6 10M12 8L10 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
