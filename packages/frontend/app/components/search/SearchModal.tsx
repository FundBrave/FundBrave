"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";
import { RecentSearches, addRecentSearch } from "./RecentSearches";
import { TrendingCampaigns } from "./TrendingCampaigns";
import { CategoryChips } from "./CategoryChips";
import Link from "next/link";
import { searchApi, SearchResults } from "@/lib/api/search";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    campaigns: [],
    users: [],
    posts: [],
    total: 0,
    totalCampaigns: 0,
    totalUsers: 0,
    totalPosts: 0,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results from API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({
        campaigns: [],
        users: [],
        posts: [],
        total: 0,
        totalCampaigns: 0,
        totalUsers: 0,
        totalPosts: 0,
      });
      setSearchError(null);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError(null);
        const results = await searchApi.search(searchQuery, 'all', 10);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Unable to search at the moment. Please try again later.'
        );
        setSearchResults({
          campaigns: [],
          users: [],
          posts: [],
          total: 0,
          totalCampaigns: 0,
          totalUsers: 0,
          totalPosts: 0,
        });
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const totalResults = searchResults.campaigns.length + searchResults.users.length + searchResults.posts.length;

  // Focus trap and escape handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      setSearchQuery("");
      setSelectedCategories([]);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    addRecentSearch(searchQuery);

    const params = new URLSearchParams();
    params.set("q", searchQuery);
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    router.push(`/search?${params.toString()}`);
    onClose();
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => {
      if (query.trim()) {
        addRecentSearch(query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
        onClose();
      }
    }, 100);
  };

  const handleTrendingClick = (tag: string) => {
    setSearchQuery(tag);
    setTimeout(() => {
      addRecentSearch(tag);
      router.push(`/search?q=${encodeURIComponent(tag)}`);
      onClose();
    }, 100);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const handleCampaignClick = (campaignId: string) => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
    }
    router.push(`/campaigns/${campaignId}`);
    onClose();
  };

  const handleUserClick = (username: string) => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
    }
    router.push(`/profile/${username}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed top-[10vh] left-1/2 -translate-x-1/2 z-50",
          "w-[90vw] max-w-2xl max-h-[75vh]",
          "bg-background rounded-2xl border border-border-default",
          "shadow-2xl shadow-black/20",
          "flex flex-col overflow-hidden",
          "animate-slide-down"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 id="search-modal-title" className="text-lg font-semibold text-foreground">
              Search
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "w-11 h-11 min-h-[44px] min-w-[44px] rounded-full",
                "flex items-center justify-center",
                "text-text-secondary hover:text-foreground hover:bg-muted",
                "transition-all duration-200 active:scale-[0.95] active:bg-muted/80",
                "focus:outline-none focus:ring-2 focus:ring-primary/50"
              )}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <SearchInput
            ref={inputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onKeyDown={handleKeyDown}
            placeholder="Search campaigns, creators..."
            autoFocus
          />
        </div>

        {/* Category Chips */}
        {searchQuery && (
          <div className="flex-shrink-0 px-6 pb-4">
            <CategoryChips
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {searchQuery.trim() ? (
            // Search Results
            <div className="space-y-6">
              {/* Loading State */}
              {isSearching && (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-text-secondary">Searching...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {searchError && !isSearching && (
                <div className="py-8 px-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{searchError}</p>
                </div>
              )}

              {/* Results */}
              {!isSearching && !searchError && (
                <>
                  {searchResults.campaigns.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          Campaigns
                          {searchResults.totalCampaigns !== undefined &&
                            searchResults.totalCampaigns > searchResults.campaigns.length && (
                              <span className="ml-2 text-text-secondary font-normal">
                                ({searchResults.totalCampaigns} total)
                              </span>
                            )}
                        </h3>
                        <Link
                          href={`/search?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            addRecentSearch(searchQuery);
                            onClose();
                          }}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          See all
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {searchResults.campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        type="button"
                        onClick={() => handleCampaignClick(campaign.id)}
                        className={cn(
                          "w-full flex items-start gap-4 p-3 rounded-lg",
                          "text-left hover:bg-muted transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50",
                          "group"
                        )}
                      >
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-foreground line-clamp-2">
                              {campaign.title}
                            </h4>
                            {campaign.status?.includes("verified") && (
                              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            ${parseFloat(campaign.amountRaised).toLocaleString()} raised of $
                            {campaign.targetAmount.toLocaleString()}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.users.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Users
                    {searchResults.totalUsers !== undefined &&
                      searchResults.totalUsers > searchResults.users.length && (
                        <span className="ml-2 text-text-secondary font-normal">
                          ({searchResults.totalUsers} total)
                        </span>
                      )}
                  </h3>
                  <div className="space-y-2">
                    {searchResults.users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserClick(user.username.replace("@", ""))}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg",
                          "text-left hover:bg-muted transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50",
                          "group"
                        )}
                      >
                        <img
                          src={user.avatar || user.avatarUrl || '/images/placeholder-avatar.jpg'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {user.name}
                            </h4>
                            {user.isVerified && (
                              <Shield className="w-3 h-3 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{user.username}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.posts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Posts
                    {searchResults.totalPosts !== undefined &&
                      searchResults.totalPosts > searchResults.posts.length && (
                        <span className="ml-2 text-text-secondary font-normal">
                          ({searchResults.totalPosts} total)
                        </span>
                      )}
                  </h3>
                  <div className="space-y-2">
                    {searchResults.posts.map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          "w-full p-3 rounded-lg",
                          "bg-muted/50 border border-border-default"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={post.author.avatarUrl || '/images/placeholder-avatar.jpg'}
                            alt={post.author.displayName || post.author.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <p className="text-xs font-medium text-foreground">
                            {post.author.displayName || post.author.username}
                          </p>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
                        {(post.likesCount !== undefined || post.commentsCount !== undefined) && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                            {post.likesCount !== undefined && <span>{post.likesCount} likes</span>}
                            {post.commentsCount !== undefined && <span>{post.commentsCount} comments</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalResults === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-text-secondary">No results found</p>
                </div>
              )}
                </>
              )}
            </div>
          ) : (
            // Default State
            <div className="space-y-6">
              <RecentSearches onSearchClick={handleRecentSearchClick} />
              <TrendingCampaigns onTagClick={handleTrendingClick} />
            </div>
          )}
        </div>

        {/* Footer */}
        {searchQuery.trim() && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-border-default">
            <button
              type="button"
              onClick={handleSearch}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-primary text-white",
                "text-sm font-medium",
                "hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200"
              )}
            >
              View all results for &quot;{searchQuery}&quot;
            </button>
          </div>
        )}
      </div>
    </>
  );
}
