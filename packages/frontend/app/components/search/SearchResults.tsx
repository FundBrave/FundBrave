"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import CampaignCard, { CampaignCardProps } from "@/app/components/campaigns/CampaignCard";
import { SearchX } from "lucide-react";
import Link from "next/link";

export interface SearchResultsProps {
  campaigns: CampaignCardProps[];
  isLoading?: boolean;
  totalCount?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function SearchResults({
  campaigns,
  isLoading = false,
  totalCount,
  hasMore = false,
  onLoadMore,
  className,
}: SearchResultsProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (!onLoadMore || loadingMore) return;
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CampaignCard key={i} {...({} as any)} isLoading />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <div className={cn("w-full flex flex-col items-center justify-center py-16", className)}>
        <div className="max-w-md text-center space-y-6">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
              <SearchX className="w-16 h-16 text-text-secondary" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">No campaigns found</h3>
            <p className="text-sm text-text-secondary">
              We couldn&apos;t find any campaigns matching your search. Try:
            </p>
          </div>

          {/* Suggestions */}
          <ul className="text-sm text-text-secondary space-y-1">
            <li>Checking your spelling</li>
            <li>Using different keywords</li>
            <li>Removing some filters</li>
          </ul>

          {/* CTA */}
          <Link
            href="/campaigns"
            className={cn(
              "inline-flex items-center justify-center",
              "px-6 py-3 rounded-lg",
              "bg-primary text-white",
              "text-sm font-medium",
              "hover:bg-primary/90",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-200",
              "min-h-[44px]"
            )}
          >
            Browse All Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Results grid
  return (
    <div className={cn("w-full flex flex-col gap-6", className)}>
      {/* Results count */}
      {totalCount !== undefined && (
        <p className="text-sm text-text-secondary">
          Found {totalCount.toLocaleString()} {totalCount === 1 ? "campaign" : "campaigns"}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} {...campaign} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={cn(
              "px-8 py-3 rounded-lg",
              "bg-background border border-border-default",
              "text-sm font-medium text-foreground",
              "hover:border-primary hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "min-h-[44px]"
            )}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
