"use client";

import { motion } from 'motion/react';
import Link from 'next/link';
import { useSuggestedUsers } from '@/app/hooks/useSuggestedUsers';
import { FollowButton } from './FollowButton';

interface WhoToFollowProps {
  limit?: number;
  showSeeAll?: boolean;
  className?: string;
}

/**
 * WhoToFollow Component
 *
 * Displays suggested users to follow in a card format.
 * Typically shown in sidebar or discovery sections.
 *
 * Features:
 * - Shows 3-5 suggested users with avatars and follow buttons
 * - Displays mutual followers count
 * - "See All" link to full discovery page
 * - Loading and empty states
 * - Refresh suggestions
 *
 * @example
 * ```tsx
 * <WhoToFollow limit={5} showSeeAll />
 * ```
 */
export function WhoToFollow({
  limit = 5,
  showSeeAll = true,
  className = '',
}: WhoToFollowProps) {
  const { users, isLoading, error, refresh } = useSuggestedUsers({
    limit,
    source: 'sidebar',
  });

  if (error) {
    return null; // Silently fail for sidebar widget
  }

  return (
    <div className={`bg-[var(--neutral-dark-500)] border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-foreground">
          Who to follow
        </h3>
        <button
          onClick={refresh}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Refresh suggestions"
        >
          <RefreshIcon className="w-4 h-4 text-foreground/60" />
        </button>
      </div>

      {/* User List */}
      <div className="divide-y divide-white/10">
        {isLoading ? (
          // Loading skeleton
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SuggestionSkeleton key={i} />
            ))}
          </>
        ) : users.length === 0 ? (
          // Empty state
          <div className="p-6 text-center">
            <p className="text-sm text-foreground/60">
              No suggestions available at the moment
            </p>
          </div>
        ) : (
          // User suggestions
          users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SuggestionCard user={user} />
            </motion.div>
          ))
        )}
      </div>

      {/* See All Link */}
      {showSeeAll && !isLoading && users.length > 0 && (
        <Link
          href="/discover/people"
          className="block p-4 text-sm font-medium text-[var(--primary)] hover:bg-white/5 transition-colors text-center"
        >
          See all suggestions
        </Link>
      )}
    </div>
  );
}

// Suggestion Card Component
function SuggestionCard({ user }: { user: any }) {
  return (
    <div className="p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`} className="flex-shrink-0">
          <div className="relative group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {user.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <VerifiedIcon className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${user.username}`}
            className="block hover:underline"
          >
            <h4 className="font-semibold text-foreground text-sm truncate">
              {user.name}
            </h4>
            <p className="text-xs text-foreground/60 truncate">
              @{user.username}
            </p>
          </Link>

          {/* Mutual Followers or Follower Count */}
          {user.mutualFollowers.count > 0 ? (
            <p className="text-xs text-foreground/50 mt-1">
              Followed by {user.mutualFollowers.count === 1
                ? user.mutualFollowers.sample[0]?.name
                : `${user.mutualFollowers.sample[0]?.name} and ${user.mutualFollowers.count - 1} ${user.mutualFollowers.count === 2 ? 'other' : 'others'}`}
            </p>
          ) : (
            <p className="text-xs text-foreground/50 mt-1">
              {user.followerCount.toLocaleString()} followers
            </p>
          )}

          {/* Reason Badge */}
          <ReasonBadge reason={user.reason} />
        </div>

        {/* Follow Button */}
        <FollowButton
          userId={user.id}
          initialIsFollowing={user.isFollowing}
          variant="compact"
        />
      </div>

      {/* Bio (if available) */}
      {user.bio && (
        <p className="text-xs text-foreground/60 mt-2 line-clamp-2">
          {user.bio}
        </p>
      )}
    </div>
  );
}

// Reason Badge Component
function ReasonBadge({ reason }: { reason: string }) {
  const labels = {
    mutual_followers: 'Followed by people you know',
    similar_interests: 'Similar interests',
    popular: 'Popular fundraiser',
    recent_donors: 'Active donor',
  };

  return (
    <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium text-foreground/70 bg-white/5 rounded-full">
      {labels[reason as keyof typeof labels] || reason}
    </span>
  );
}

// Skeleton Loading State
function SuggestionSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-3 bg-white/10 rounded w-16" />
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
        <div className="w-20 h-8 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

// Icon Components
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d="M13 8C13 10.7614 10.7614 13 8 13C5.23858 13 3 10.7614 3 8C3 5.23858 5.23858 3 8 3C9.87395 3 11.5044 4.12468 12.2764 5.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 3V6H10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path
        d="M2 5L4 7L8 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
