"use client";

import React, { useState, useCallback } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE } from "@/lib/constants/animation";

/**
 * Suggested user/creator definition
 */
interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio: string;
  followerCount: number;
  campaignCount: number;
  isVerified: boolean;
  categories: string[];
}

/**
 * Mock data for suggested creators
 * In production, this would come from an API based on user interests
 */
const SUGGESTED_CREATORS: SuggestedUser[] = [
  {
    id: "1",
    displayName: "Save the Ocean Foundation",
    username: "saveocean",
    avatarUrl: undefined,
    bio: "Protecting marine ecosystems and promoting ocean conservation worldwide",
    followerCount: 24500,
    campaignCount: 12,
    isVerified: true,
    categories: ["environment"],
  },
  {
    id: "2",
    displayName: "Dr. Sarah Mitchell",
    username: "drsarahmitchell",
    avatarUrl: undefined,
    bio: "Pediatric surgeon raising funds for children's healthcare in developing countries",
    followerCount: 18200,
    campaignCount: 8,
    isVerified: true,
    categories: ["medical"],
  },
  {
    id: "3",
    displayName: "Code for Change",
    username: "codeforchange",
    avatarUrl: undefined,
    bio: "Teaching coding to underprivileged youth. Building the next generation of tech leaders",
    followerCount: 15800,
    campaignCount: 6,
    isVerified: true,
    categories: ["education", "community"],
  },
  {
    id: "4",
    displayName: "Paws & Hearts Rescue",
    username: "pawshearts",
    avatarUrl: undefined,
    bio: "Animal rescue organization saving abandoned pets and finding them loving homes",
    followerCount: 32100,
    campaignCount: 15,
    isVerified: true,
    categories: ["animals"],
  },
  {
    id: "5",
    displayName: "Maya Torres",
    username: "mayacreates",
    avatarUrl: undefined,
    bio: "Independent artist creating murals for community spaces. Art changes neighborhoods",
    followerCount: 8900,
    campaignCount: 4,
    isVerified: false,
    categories: ["creative"],
  },
  {
    id: "6",
    displayName: "Emergency Response Team",
    username: "emergencyteam",
    avatarUrl: undefined,
    bio: "First responders providing immediate aid during natural disasters and emergencies",
    followerCount: 45000,
    campaignCount: 22,
    isVerified: true,
    categories: ["emergency"],
  },
  {
    id: "7",
    displayName: "Green Future Initiative",
    username: "greenfuture",
    avatarUrl: undefined,
    bio: "Planting trees and creating urban gardens for sustainable cities",
    followerCount: 19300,
    campaignCount: 9,
    isVerified: true,
    categories: ["environment"],
  },
  {
    id: "8",
    displayName: "Youth Sports Alliance",
    username: "youthsports",
    avatarUrl: undefined,
    bio: "Providing sports equipment and coaching to youth in underserved communities",
    followerCount: 12700,
    campaignCount: 7,
    isVerified: false,
    categories: ["sports", "community"],
  },
  {
    id: "9",
    displayName: "Marcus Johnson",
    username: "marcusj",
    avatarUrl: undefined,
    bio: "Musician raising funds for music education programs in public schools",
    followerCount: 7600,
    campaignCount: 3,
    isVerified: false,
    categories: ["creative", "education"],
  },
  {
    id: "10",
    displayName: "Global Health Initiative",
    username: "globalhealth",
    avatarUrl: undefined,
    bio: "Bringing healthcare and medical supplies to remote villages worldwide",
    followerCount: 38900,
    campaignCount: 18,
    isVerified: true,
    categories: ["medical"],
  },
  {
    id: "11",
    displayName: "Community Kitchen Project",
    username: "communitykitchen",
    avatarUrl: undefined,
    bio: "Fighting hunger by providing hot meals to those in need every day",
    followerCount: 21400,
    campaignCount: 11,
    isVerified: true,
    categories: ["community"],
  },
  {
    id: "12",
    displayName: "Adventure for a Cause",
    username: "adventurecause",
    avatarUrl: undefined,
    bio: "Extreme athletes raising awareness and funds through adventure challenges",
    followerCount: 9800,
    campaignCount: 5,
    isVerified: false,
    categories: ["travel", "sports"],
  },
];

/**
 * Verified badge icon
 */
const VerifiedBadge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-purple-500"
  >
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

/**
 * Format follower count for display (e.g., 24500 -> 24.5K)
 */
const formatFollowerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * Generate initials from display name
 */
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Spring transition for follow button
const buttonSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};

// Card entrance animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

// Follow button animation variants
const followButtonVariants = {
  unfollowed: {
    backgroundColor: "rgba(69, 12, 240, 1)",
    scale: 1,
  },
  following: {
    backgroundColor: "rgba(69, 12, 240, 0.2)",
    scale: 1,
    transition: buttonSpring,
  },
  hover: {
    scale: 1.05,
    transition: buttonSpring,
  },
  tap: {
    scale: 0.95,
  },
};

// Checkmark animation for follow state
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * FollowSuggestions Step Component
 *
 * Motion (Framer Motion) controls:
 * - Card entrance stagger animation
 * - Follow button spring animation
 * - Checkmark animation on follow
 *
 * Features:
 * - Display 10-15 suggested creators (mock data)
 * - Creator cards with avatar, name, bio, campaign count
 * - Individual follow buttons with spring animation
 * - "Follow All" button at top
 * - Skip option
 * - 44px touch targets for accessibility
 *
 * Respects prefers-reduced-motion for accessibility
 */
const FollowSuggestions: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const toggleFollow = useCallback((userId: string) => {
    setFollowedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const handleFollowAll = useCallback(() => {
    setFollowedUsers(new Set(SUGGESTED_CREATORS.map((c) => c.id)));
  }, []);

  const handleUnfollowAll = useCallback(() => {
    setFollowedUsers(new Set());
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call to save follow selections
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    if (onNext) {
      onNext();
    }
  };

  const handleSkip = () => {
    if (onNext) {
      onNext();
    }
  };

  // Animation settings based on motion preference
  const staggerDelay = prefersReducedMotion ? 0 : 0.05;
  const allFollowed = followedUsers.size === SUGGESTED_CREATORS.length;

  return (
    <div className="flex flex-col w-full max-w-[600px] px-4 overflow-y-auto scrollbar-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-4"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          Discover creators
        </h2>
        <p className="text-text-secondary text-lg">
          Follow creators and causes you care about
        </p>
      </motion.div>

      {/* Follow All / Unfollow All Button */}
      <motion.div
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-text-secondary text-sm">
          {followedUsers.size} of {SUGGESTED_CREATORS.length} followed
        </span>
        <motion.button
          onClick={allFollowed ? handleUnfollowAll : handleFollowAll}
          className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors min-h-[44px] px-3"
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        >
          {allFollowed ? "Unfollow all" : "Follow all"}
        </motion.button>
      </motion.div>

      {/* Creator Cards Grid */}
      <div className="flex flex-col gap-3 mb-6 max-h-[400px] overflow-y-auto scrollbar-hidden pr-1">
        {SUGGESTED_CREATORS.map((creator, index) => {
          const isFollowed = followedUsers.has(creator.id);

          return (
            <motion.div
              key={creator.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border-default hover:border-purple-400/20 transition-colors"
              variants={prefersReducedMotion ? undefined : cardVariants}
              initial="hidden"
              animate="visible"
              transition={{
                delay: 0.3 + index * staggerDelay,
              }}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-400 text-white font-semibold text-sm">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(creator.displayName)
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground truncate">
                    {creator.displayName}
                  </span>
                  {creator.isVerified && <VerifiedBadge />}
                </div>
                <p className="text-text-tertiary text-sm truncate">
                  @{creator.username}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                  <span>{formatFollowerCount(creator.followerCount)} followers</span>
                  <span>{creator.campaignCount} campaigns</span>
                </div>
              </div>

              {/* Follow button */}
              <motion.button
                onClick={() => toggleFollow(creator.id)}
                className={`relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full min-h-[44px] min-w-[90px] font-medium text-sm transition-colors ${
                  isFollowed
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-purple-600 text-white"
                }`}
                variants={prefersReducedMotion ? undefined : followButtonVariants}
                animate={isFollowed ? "following" : "unfollowed"}
                whileHover={prefersReducedMotion ? {} : "hover"}
                whileTap={prefersReducedMotion ? {} : "tap"}
              >
                <AnimatePresence mode="wait">
                  {isFollowed ? (
                    <motion.span
                      key="following"
                      className="flex items-center gap-1"
                      variants={checkmarkVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Check className="w-4 h-4" />
                      <span>Following</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="follow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Follow
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <OnboardingNavButtons
        onBack={onBack}
        onNext={handleSubmit}
        isLoading={isLoading}
        nextLabel={followedUsers.size === 0 ? "Skip" : "Continue"}
      />

      {/* Skip link */}
      {followedUsers.size > 0 && (
        <motion.button
          onClick={handleSkip}
          className="mt-4 text-text-tertiary hover:text-text-secondary text-sm underline-offset-4 hover:underline transition-colors min-h-[44px] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Skip this step
        </motion.button>
      )}
    </div>
  );
};

export default FollowSuggestions;
