"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock trending topics
const TRENDING_TOPICS = [
  "Medical Emergency",
  "Education",
  "Community Building",
  "Environmental",
  "Animal Rescue",
];

export interface TrendingCampaignsProps {
  onTagClick: (tag: string) => void;
  className?: string;
}

export function TrendingCampaigns({ onTagClick, className }: TrendingCampaignsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-foreground">Trending</h3>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {TRENDING_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onTagClick(topic)}
            className={cn(
              "px-3 py-1.5 rounded-full",
              "bg-muted border border-border-default",
              "text-sm text-foreground",
              "hover:border-primary hover:bg-primary/10",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            #{topic.replace(/\s+/g, "")}
          </button>
        ))}
      </div>
    </div>
  );
}
