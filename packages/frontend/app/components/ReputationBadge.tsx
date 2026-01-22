"use client";

import { useState } from "react";
import { Award, Info, TrendingUp, Users, Heart, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReputationBadgeProps {
  /** User's reputation score (0-100) */
  score: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom className */
  className?: string;
  /** Detailed breakdown for tooltip */
  breakdown?: {
    campaignsCreated?: number;
    totalDonations?: number;
    totalRaised?: number;
    followersCount?: number;
    engagementScore?: number;
  };
}

/**
 * Get reputation tier based on score
 */
function getReputationTier(score: number): {
  name: string;
  color: string;
  icon: string;
  description: string;
} {
  if (score >= 90) {
    return {
      name: "Legend",
      color: "from-yellow-400 to-orange-500",
      icon: "🏆",
      description: "Top contributor to the community",
    };
  } else if (score >= 75) {
    return {
      name: "Champion",
      color: "from-purple-400 to-pink-500",
      icon: "⭐",
      description: "Highly active and trusted member",
    };
  } else if (score >= 50) {
    return {
      name: "Contributor",
      color: "from-blue-400 to-cyan-500",
      icon: "💎",
      description: "Active community member",
    };
  } else if (score >= 25) {
    return {
      name: "Member",
      color: "from-green-400 to-emerald-500",
      icon: "✓",
      description: "Growing community member",
    };
  } else {
    return {
      name: "Newcomer",
      color: "from-gray-400 to-gray-500",
      icon: "👋",
      description: "New to the community",
    };
  }
}

/**
 * Reputation Badge Component
 *
 * Displays a user's reputation score with visual indicator and optional tooltip breakdown.
 * Reputation is calculated based on:
 * - Campaigns created and their success
 * - Donations made
 * - Community engagement (posts, comments, likes)
 * - Following/followers ratio
 * - Time on platform
 */
export function ReputationBadge({
  score,
  size = "md",
  showTooltip = true,
  className,
  breakdown,
}: ReputationBadgeProps) {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const tier = getReputationTier(score);

  const sizeClasses = {
    sm: {
      badge: "h-6 px-2 py-1 text-xs gap-1",
      icon: "text-xs",
      score: "text-xs",
    },
    md: {
      badge: "h-8 px-3 py-1.5 text-sm gap-1.5",
      icon: "text-sm",
      score: "text-sm",
    },
    lg: {
      badge: "h-10 px-4 py-2 text-base gap-2",
      icon: "text-base",
      score: "text-base",
    },
  };

  return (
    <div className="relative inline-block">
      {/* Badge */}
      <div
        className={cn(
          "inline-flex items-center rounded-full font-semibold shadow-sm transition-all",
          `bg-gradient-to-r ${tier.color}`,
          sizeClasses[size].badge,
          "text-white",
          showTooltip && "cursor-help",
          className
        )}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        aria-label={`Reputation: ${tier.name} (${score}/100)`}
      >
        <span className={sizeClasses[size].icon}>{tier.icon}</span>
        <span className={cn("font-bold", sizeClasses[size].score)}>{score}</span>
        <Award className={cn("w-3 h-3", size === "lg" && "w-4 h-4")} />
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div
          className={cn(
            "absolute z-50 w-72 p-4 mt-2 bg-surface-elevated border border-border-subtle rounded-xl shadow-xl",
            "left-1/2 -translate-x-1/2",
            "animate-in fade-in slide-in-from-top-1 duration-200"
          )}
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border-subtle">
            <div className={cn("flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r", tier.color)}>
              <span className="text-2xl">{tier.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-foreground">{tier.name}</h4>
                <span className="text-sm font-semibold text-text-secondary">({score}/100)</span>
              </div>
              <p className="text-xs text-text-tertiary">{tier.description}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
              <span>Reputation Progress</span>
              <span className="font-medium">{score}%</span>
            </div>
            <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gradient-to-r", tier.color, "transition-all duration-500")}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          {breakdown && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                <Info className="w-3 h-3" />
                <span className="font-medium">Score Breakdown</span>
              </div>

              {breakdown.campaignsCreated !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <TrendingUp className="w-3 h-3" />
                    <span>Campaigns Created</span>
                  </div>
                  <span className="font-medium text-foreground">{breakdown.campaignsCreated}</span>
                </div>
              )}

              {breakdown.totalDonations !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Heart className="w-3 h-3" />
                    <span>Donations Made</span>
                  </div>
                  <span className="font-medium text-foreground">{breakdown.totalDonations}</span>
                </div>
              )}

              {breakdown.totalRaised !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <DollarSign className="w-3 h-3" />
                    <span>Total Raised</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${breakdown.totalRaised.toLocaleString()}
                  </span>
                </div>
              )}

              {breakdown.followersCount !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Users className="w-3 h-3" />
                    <span>Followers</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {breakdown.followersCount.toLocaleString()}
                  </span>
                </div>
              )}

              {breakdown.engagementScore !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Award className="w-3 h-3" />
                    <span>Engagement Score</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {breakdown.engagementScore}/100
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-tertiary leading-relaxed">
              Reputation is earned through active participation: creating successful campaigns,
              donating to causes, engaging with the community, and maintaining a positive impact.
            </p>
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface-elevated border-l border-t border-border-subtle rotate-45" />
        </div>
      )}
    </div>
  );
}

export default ReputationBadge;
