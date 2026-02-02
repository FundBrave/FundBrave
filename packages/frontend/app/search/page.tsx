"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, Sparkles, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/app/components/search/SearchInput";
import { SearchFilters, SearchFiltersState } from "@/app/components/search/SearchFilters";
import { SearchFilterSheet } from "@/app/components/search/SearchFilterSheet";
import { SearchSortDropdown, SortOption } from "@/app/components/search/SearchSortDropdown";
import { SearchResults } from "@/app/components/search/SearchResults";
import { addRecentSearch } from "@/app/components/search/RecentSearches";
import { RAGSearchPanel } from "@/app/components/ai/RAGSearchPanel";
import { searchApi, SearchCampaign } from "@/lib/api/search";
import { searchCampaignToCampaignCard } from "@/lib/utils/search";
import Link from "next/link";

type SearchMode = "campaigns" | "ai";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params
  const queryParam = searchParams.get("q") || "";
  const modeParam = (searchParams.get("mode") as SearchMode) || "campaigns";
  const categoriesParam = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const statusParam = (searchParams.get("status") as SearchFiltersState["status"]) || "all";
  const sortParam = (searchParams.get("sort") as SortOption) || "relevance";

  // Ref to track if URL update is from user action (prevent circular updates)
  const isUpdatingURL = useRef(false);

  // State
  const [searchMode, setSearchMode] = useState<SearchMode>(modeParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [filters, setFilters] = useState<SearchFiltersState>({
    categories: categoriesParam,
    status: statusParam,
    verifiedOnly: false,
    fundingRange: {},
  });
  const [sort, setSort] = useState<SortOption>(sortParam);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchResults, setSearchResults] = useState<SearchCampaign[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Fetch search results from API
  useEffect(() => {
    if (!searchQuery.trim() || searchMode !== 'campaigns') {
      setSearchResults([]);
      setTotalResults(0);
      setSearchError(null);
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setSearchError(null);

        const limit = 12;
        const offset = (page - 1) * limit;

        const results = await searchApi.searchCampaigns(searchQuery, limit, offset);
        setSearchResults(results);
        setTotalResults(results.length);
        setHasMore(results.length === limit);

        if (searchQuery) {
          addRecentSearch(searchQuery);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Unable to search at the moment. Please try again later.'
        );
        setSearchResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, page, searchMode]);

  // Sync with URL params (only when URL changes externally, not from our own updates)
  useEffect(() => {
    if (!isUpdatingURL.current) {
      setSearchQuery(queryParam);
      setFilters((prev) => ({
        ...prev,
        categories: categoriesParam,
        status: statusParam,
      }));
      setSort(sortParam);
      setPage(1); // Reset page when URL changes
    }
    isUpdatingURL.current = false;
  }, [queryParam, categoriesParam.join(','), statusParam, sortParam]);

  // Update URL when filters change
  const updateURL = (newQuery: string, newFilters: SearchFiltersState, newSort: SortOption) => {
    isUpdatingURL.current = true; // Mark that we're updating URL programmatically

    const params = new URLSearchParams();

    if (newQuery) params.set("q", newQuery);
    if (newFilters.categories.length > 0) {
      params.set("categories", newFilters.categories.join(","));
    }
    if (newFilters.status !== "all") params.set("status", newFilters.status);
    if (newSort !== "relevance") params.set("sort", newSort);

    router.push(`/search?${params.toString()}`);
  };

  // Filter and sort campaigns locally (client-side filtering on API results)
  const filteredCampaigns = useMemo(() => {
    let results = searchResults;

    // Filter by categories
    if (filters.categories.length > 0) {
      results = results.filter(
        (campaign) => campaign.category && filters.categories.includes(campaign.category)
      );
    }

    // Filter by status
    if (filters.status !== "all") {
      results = results.filter((campaign) => {
        if (filters.status === "active") return campaign.status?.includes("trending");
        if (filters.status === "ending_soon") return campaign.status?.includes("endingSoon");
        if (filters.status === "completed") return false;
        return true;
      });
    }

    // Filter by verified
    if (filters.verifiedOnly) {
      results = results.filter((campaign) => campaign.status?.includes("verified"));
    }

    // Filter by funding range
    if (filters.fundingRange.min !== undefined) {
      results = results.filter((campaign) => parseFloat(campaign.amountRaised) >= filters.fundingRange.min!);
    }
    if (filters.fundingRange.max !== undefined) {
      results = results.filter((campaign) => parseFloat(campaign.amountRaised) <= filters.fundingRange.max!);
    }

    // Sort
    results = [...results].sort((a, b) => {
      switch (sort) {
        case "recent":
          return 0; // Would sort by date in real implementation
        case "popular":
          return 0; // Popularity not available in search results
        case "ending_soon":
          return 0; // Would sort by end date in real implementation
        case "most_raised":
          return parseFloat(b.amountRaised) - parseFloat(a.amountRaised);
        default:
          return 0; // Relevance - backend already sorted by relevance
      }
    });

    return results.map(searchCampaignToCampaignCard);
  }, [searchResults, filters, sort]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    updateURL(searchQuery, filters, sort);
  };

  const handleFiltersChange = (newFilters: SearchFiltersState) => {
    setFilters(newFilters);
    updateURL(searchQuery, newFilters, sort);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    updateURL(searchQuery, filters, newSort);
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return;
    setPage((prev) => prev + 1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.status !== "all") count += 1;
    if (filters.verifiedOnly) count += 1;
    if (filters.fundingRange.min !== undefined || filters.fundingRange.max !== undefined) count += 1;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Back Button */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 text-text-secondary hover:text-foreground",
                "transition-colors w-fit"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground">Search</h1>

            {/* Search Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-surface-sunken rounded-lg w-fit">
              <button
                onClick={() => setSearchMode("campaigns")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  searchMode === "campaigns"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                <Search className="w-4 h-4" />
                Campaigns
              </button>
              <button
                onClick={() => setSearchMode("ai")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  searchMode === "ai"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                <Sparkles className="w-4 h-4" />
                AI Knowledge
              </button>
            </div>

            {/* Campaign Search Bar - Only show for campaigns mode */}
            {searchMode === "campaigns" && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <SearchInput
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearchSubmit();
                      }}
                      placeholder="Search campaigns..."
                    />
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(true)}
                    className={cn(
                      "lg:hidden flex items-center gap-2 px-4 py-3 rounded-lg",
                      "bg-background border border-border-default",
                      "text-sm font-medium text-foreground",
                      "hover:border-primary hover:bg-primary/5",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "transition-all duration-200",
                      "min-h-[44px]"
                    )}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Sort */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    {isLoading ? (
                      "Searching..."
                    ) : (
                      <>
                        {filteredCampaigns.length} {filteredCampaigns.length === 1 ? "result" : "results"}
                        {totalResults > filteredCampaigns.length && ` (showing ${filteredCampaigns.length})`}
                      </>
                    )}
                  </p>
                  <SearchSortDropdown value={sort} onChange={handleSortChange} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchMode === "ai" ? (
          /* AI Knowledge Search */
          <div className="max-w-3xl mx-auto">
            <RAGSearchPanel
              placeholder="Ask anything about FundBrave, donations, campaigns..."
              showHistory={true}
            />
          </div>
        ) : (
          /* Campaign Search */
          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-32">
                <SearchFilters filters={filters} onChange={handleFiltersChange} />
              </div>
            </aside>

            {/* Results */}
            <main className="flex-1 min-w-0">
              {/* Error State */}
              {searchError && !isLoading && (
                <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive mb-1">Search Error</h3>
                      <p className="text-sm text-destructive/80">{searchError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              <SearchResults
                campaigns={filteredCampaigns}
                isLoading={isLoading}
                totalCount={totalResults}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            </main>
          </div>
        )}
      </div>

      {/* Mobile Filter Sheet - Only for campaigns mode */}
      {searchMode === "campaigns" && (
        <SearchFilterSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          filters={filters}
          onChange={handleFiltersChange}
        />
      )}
    </div>
  );
}
