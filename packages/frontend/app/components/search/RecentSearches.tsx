"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fundbrave_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearchesProps {
  onSearchClick: (query: string) => void;
  className?: string;
}

export function RecentSearches({ onSearchClick, className }: RecentSearchesProps) {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSearches(parsed);
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
  };

  const handleRemoveItem = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searches.filter((s) => s !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSearches(updated);
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Searches</h3>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-text-secondary hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Search List */}
      <div className="flex flex-col gap-1">
        {searches.map((query, index) => (
          <button
            key={`${query}-${index}`}
            type="button"
            onClick={() => onSearchClick(query)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-left text-sm text-foreground",
              "hover:bg-muted transition-colors",
              "group"
            )}
          >
            <Clock className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <span className="flex-1 truncate">{query}</span>
            <button
              type="button"
              onClick={(e) => handleRemoveItem(query, e)}
              className={cn(
                "w-5 h-5 rounded-full",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100",
                "text-text-secondary hover:text-foreground hover:bg-background",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50"
              )}
              aria-label={`Remove ${query}`}
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

// Utility function to add a search to recent searches
export function addRecentSearch(query: string) {
  if (!query || query.trim().length === 0) return;

  const stored = localStorage.getItem(STORAGE_KEY);
  let searches: string[] = [];

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        searches = parsed;
      }
    } catch {
      // Invalid data, start fresh
    }
  }

  // Remove duplicates and add to front
  searches = searches.filter((s) => s !== query);
  searches.unshift(query);

  // Limit to MAX_RECENT_SEARCHES
  if (searches.length > MAX_RECENT_SEARCHES) {
    searches = searches.slice(0, MAX_RECENT_SEARCHES);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}
