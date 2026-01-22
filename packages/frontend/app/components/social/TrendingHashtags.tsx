"use client";

import { useTrendingHashtags } from "@/app/hooks/usePosts";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface TrendingHashtagsProps {
  className?: string;
  maxItems?: number;
}

/**
 * TrendingHashtags Component
 * Displays trending hashtags from the platform
 */
export function TrendingHashtags({ className, maxItems = 10 }: TrendingHashtagsProps) {
  const router = useRouter();
  const { hashtags, isLoading, error } = useTrendingHashtags(maxItems);

  if (isLoading) {
    return (
      <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
        <h3 className="text-lg font-semibold mb-4">Trending Hashtags</h3>
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (error || !hashtags || hashtags.length === 0) {
    return null;
  }

  const handleHashtagClick = (tag: string) => {
    // Navigate to search with hashtag filter
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Trending</h3>
        <span className="text-xs text-text-tertiary">Last 24h</span>
      </div>

      <div className="space-y-3">
        {hashtags.map((hashtag, index) => (
          <button
            key={hashtag.id}
            onClick={() => handleHashtagClick(hashtag.tag)}
            className="w-full text-left p-3 rounded-lg bg-surface-sunken hover:bg-surface-overlay transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-text-tertiary w-6">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-semibold text-primary group-hover:text-primary-hover transition-colors">
                    #{hashtag.tag}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {hashtag.postsCount.toLocaleString()} {hashtag.postsCount === 1 ? "post" : "posts"}
                  </div>
                </div>
              </div>

              {/* Trending indicator */}
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span className="text-xs font-medium text-success">
                  {Math.round(hashtag.score)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push("/search")}
        className="w-full mt-4 text-center text-sm text-primary hover:text-primary-hover font-medium transition-colors"
      >
        Show more
      </button>
    </div>
  );
}
