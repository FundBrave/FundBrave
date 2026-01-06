"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Trophy } from "@/app/components/ui/icons";
import type { PodiumCardProps } from "@/app/types/leaderboard";

// Gradient border colors and sizing for each position
// Mobile sizes optimized for horizontal podium layout (3 cards side-by-side)
const positionStyles = {
  1: {
    borderGradient: "from-yellow-400 via-yellow-500 to-amber-600",
    badgeBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    glowColor: "shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    // Responsive avatar sizes: mobile 64px, sm 80px, md 110px, lg 143px
    avatarContainer: "w-[70px] h-[70px] xs:w-[78px] xs:h-[78px] sm:w-[88px] sm:h-[88px] md:w-[118px] md:h-[118px] lg:w-[151px] lg:h-[151px]",
    avatar: "w-[64px] h-[64px] xs:w-[72px] xs:h-[72px] sm:w-[80px] sm:h-[80px] md:w-[110px] md:h-[110px] lg:w-[143px] lg:h-[143px]",
    showCrown: true,
    crownClass: "-top-[32px] xs:-top-[36px] sm:-top-[40px] md:-top-[48px] lg:-top-[54px]",
  },
  2: {
    borderGradient: "from-slate-300 via-slate-400 to-slate-500",
    badgeBg: "bg-gradient-to-br from-slate-300 to-slate-400",
    glowColor: "shadow-[0_0_20px_rgba(148,163,184,0.25)]",
    // Responsive avatar sizes: mobile 48px, sm 56px, md 76px, lg 96px
    avatarContainer: "w-[54px] h-[54px] xs:w-[58px] xs:h-[58px] sm:w-[64px] sm:h-[64px] md:w-[84px] md:h-[84px] lg:w-[104px] lg:h-[104px]",
    avatar: "w-[48px] h-[48px] xs:w-[52px] xs:h-[52px] sm:w-[56px] sm:h-[56px] md:w-[76px] md:h-[76px] lg:w-[96px] lg:h-[96px]",
    showCrown: false,
    crownClass: "",
  },
  3: {
    borderGradient: "from-amber-600 via-amber-700 to-orange-700",
    badgeBg: "bg-gradient-to-br from-amber-600 to-orange-700",
    glowColor: "shadow-[0_0_20px_rgba(180,83,9,0.25)]",
    // Responsive avatar sizes: mobile 48px, sm 56px, md 76px, lg 96px
    avatarContainer: "w-[54px] h-[54px] xs:w-[58px] xs:h-[58px] sm:w-[64px] sm:h-[64px] md:w-[84px] md:h-[84px] lg:w-[104px] lg:h-[104px]",
    avatar: "w-[48px] h-[48px] xs:w-[52px] xs:h-[52px] sm:w-[56px] sm:h-[56px] md:w-[76px] md:h-[76px] lg:w-[96px] lg:h-[96px]",
    showCrown: false,
    crownClass: "",
  },
};

/**
 * PodiumCard - Individual card for top 3 leaderboard positions
 * Shows avatar with gradient border, rank badge, name, username, member since, and points
 * Position 1 gets a crown and larger avatar
 * Fully responsive for mobile, tablet, and desktop
 */
export function PodiumCard({ user, position }: PodiumCardProps) {
  const styles = positionStyles[position];
  const profileUrl = `/profile/${user.username.replace("@", "")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: position === 1 ? 0.1 : position === 2 ? 0 : 0.2,
        ease: "easeOut",
      }}
      className="flex flex-col items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 w-[90px] xs:w-[100px] sm:w-[120px] md:w-[160px] lg:w-[193px]"
    >
      {/* Avatar with Crown and Gradient Border */}
      <Link href={profileUrl} className="relative">
        {/* Crown for #1 - Responsive sizing */}
        {styles.showCrown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
            className={cn("absolute left-1/2 -translate-x-1/2 z-10", styles.crownClass)}
          >
            {/* Responsive crown image */}
            <Image
              src="/crown.svg"
              alt="Crown"
              width={86}
              height={86}
              className="drop-shadow-lg w-[48px] h-[48px] xs:w-[52px] xs:h-[52px] sm:w-[60px] sm:h-[60px] md:w-[72px] md:h-[72px] lg:w-[86px] lg:h-[86px]"
            />
          </motion.div>
        )}

        {/* Avatar Container with Gradient Border */}
        <div className="relative group">
          {/* Gradient Border with Glow - Responsive */}
          <div
            className={cn(
              "rounded-full p-[2px] sm:p-[3px] bg-gradient-to-br transition-shadow duration-300",
              styles.borderGradient,
              styles.avatarContainer,
              styles.glowColor
            )}
          >
            <div
              className={cn(
                "rounded-full overflow-hidden bg-neutral-dark-500",
                styles.avatar
              )}
            >
              <Image
                src={user.avatar}
                alt={user.name}
                width={143}
                height={143}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Rank Badge - Responsive */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -bottom-1.5 sm:-bottom-2 flex items-center justify-center rounded-full text-neutral-dark-600 font-bold shadow-lg",
              "w-6 h-6 text-xs xs:w-7 xs:h-7 xs:text-sm sm:w-8 sm:h-8 sm:text-base md:w-9 md:h-9 md:text-lg lg:w-[37px] lg:h-[37px] lg:text-xl",
              styles.badgeBg
            )}
          >
            {position}
          </div>
        </div>
      </Link>

      {/* User Info */}
      <div className="flex flex-col items-center gap-0.5 w-full text-center mt-1">
        <Link
          href={profileUrl}
          className="font-semibold text-[11px] xs:text-xs sm:text-sm md:text-base text-white tracking-wide hover:text-white/80 transition-colors truncate max-w-full"
        >
          {user.name}
        </Link>
        {/* Username - hidden on very small screens */}
        <p className="hidden xs:block text-[10px] sm:text-xs md:text-sm text-white/50 tracking-wide truncate max-w-full">
          {user.username}
        </p>

        {/* Points with Trophy - Responsive */}
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
          <Trophy className="text-[#eb9f08] w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold text-[10px] xs:text-xs sm:text-sm text-[#eb9f08] tracking-wide">
            {user.points.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default PodiumCard;
