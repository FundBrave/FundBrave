"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Trophy, ChevronRight } from "@/app/components/ui/icons";
import type { LeaderboardRowProps } from "@/app/types/leaderboard";

/**
 * LeaderboardRow - Single row in the leaderboard list
 * Shows rank, avatar, name/username, member since, points with trophy, and chevron
 * Clickable - navigates to user profile
 */
export function LeaderboardRow({
  user,
  isCurrentUser = false,
  showSeparator = true,
}: LeaderboardRowProps) {
  const profileUrl = `/profile/${user.username.replace("@", "")}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={profileUrl}
        className={cn(
          "flex items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 px-2 xs:px-3 sm:px-4 py-3 sm:py-4 transition-all duration-200 cursor-pointer group rounded-lg mx-1 sm:mx-2",
          "hover:bg-white/[0.03]",
          isCurrentUser && "bg-primary-500/10 ring-1 ring-primary-500/20"
        )}
      >
        {/* Rank Number */}
        <span className="min-w-[20px] xs:min-w-[24px] sm:min-w-[32px] text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white/70 tracking-wide text-center">
          {user.rank}
        </span>

        {/* Avatar and User Info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Avatar with subtle ring */}
          <div className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10">
            <Image
              src={user.avatar}
              alt={user.name}
              width={44}
              height={44}
              className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
            />
          </div>

          {/* Name and Username/Member Since */}
          <div className="flex flex-col gap-0 min-w-0">
            <span className="font-medium text-xs xs:text-sm sm:text-base text-white tracking-wide truncate">
              {isCurrentUser ? `${user.name} (You)` : user.name}
            </span>
            <span className="text-[10px] xs:text-xs sm:text-sm text-white/40 tracking-wide truncate">
              <span className="hidden md:inline">{user.username} - Member since {user.memberSince}</span>
              <span className="hidden sm:inline md:hidden">{user.username}</span>
              <span className="sm:hidden">{user.username}</span>
            </span>
          </div>
        </div>

        {/* Points with Trophy and Chevron - Responsive */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Points display */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-[#eb9f08]/10 rounded-full px-1.5 xs:px-2 sm:px-3 py-0.5 sm:py-1">
            <Trophy className="text-[#eb9f08] w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-[10px] xs:text-xs sm:text-sm text-[#eb9f08] tracking-wide">
              {user.points.toLocaleString()}
            </span>
          </div>
          <ChevronRight
            size={14}
            className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-200 ml-0.5 sm:ml-1 hidden xs:block"
          />
        </div>
      </Link>

      {/* Separator Line */}
      {showSeparator && (
        <div className="mx-3 sm:mx-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}
    </motion.div>
  );
}

export default LeaderboardRow;
