"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import type { LeaderboardEntry } from "@/app/types/earnings";

/**
 * Leaderboard - Reusable leaderboard/rankings component
 * Used in Dashboard (Your Rank) and Home page (Top Funders)
 *
 * Figma specs:
 * - Header with title and "View All" link
 * - List items: Rank # | Avatar | Name + @handle | Trophy icon + points
 * - Trophy icon with golden/orange color for points
 * - Scrollable list with max height
 */

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  title?: string;
  viewAllLink?: string;
  viewAllText?: string;
  maxHeight?: string;
  className?: string;
}

export function Leaderboard({
  entries,
  currentUserRank,
  title = "Your Rank",
  viewAllLink = "/leaderboard",
  viewAllText = "View All",
  maxHeight = "500px",
  className,
}: LeaderboardProps) {
  return (
    <div
      className={cn(
        "bg-transparent",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-default">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <Link
          href={viewAllLink}
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          {viewAllText}
        </Link>
      </div>

      {/* Leaderboard List */}
      <div
        className="overflow-y-auto scrollbar-auto-hide"
        style={{ maxHeight }}
      >
        {entries.map((entry, index) => (
          <LeaderboardItem
            key={entry.id}
            entry={entry}
            isCurrentUser={entry.rank === currentUserRank}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-10 h-10 text-foreground/20 mb-3" />
          <p className="text-text-tertiary text-sm">No rankings available</p>
        </div>
      )}
    </div>
  );
}

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  isLast?: boolean;
}

function LeaderboardItem({
  entry,
  isCurrentUser = false,
  isLast = false,
}: LeaderboardItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay/50 transition-colors",
        !isLast && "border-b border-border-subtle",
        isCurrentUser && "bg-primary-500/10"
      )}
    >
      {/* Rank Number */}
      <span className="w-8 text-sm font-medium text-text-secondary shrink-0">
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar
        src={entry.avatar}
        alt={entry.name}
        size="sm"
        fallback={entry.name.charAt(0)}
      />

      {/* Name and Username */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
        <p className="text-xs text-text-secondary truncate">{entry.username}</p>
      </div>

      {/* Points with Trophy */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-yellow-500">
          {entry.points.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default Leaderboard;
