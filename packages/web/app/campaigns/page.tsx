"use client";

/**
 * /campaigns — public listing with search (debounced, URL-synced),
 * category filter (sidebar on desktop, chip rail on mobile), sort,
 * and pagination. No auth required.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  type CampaignSort,
} from "@/lib/campaigns";
import { useCampaignsList } from "@/hooks/useCampaigns";
import {
  CampaignCard,
  CampaignCardSkeleton,
  CATEGORY_ICONS,
} from "@/components/campaigns/CampaignCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Search,
} from "@/components/ui/icons";
import { Search as SearchLucide } from "lucide-react";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: CampaignSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most_raised", label: "Most raised" },
  { value: "ending_soon", label: "Ending soon" },
];

// ============================================================================
// URL param helpers
// ============================================================================

function parseSort(value: string | null): CampaignSort {
  return SORT_OPTIONS.some((o) => o.value === value)
    ? (value as CampaignSort)
    : "newest";
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current - 1, current, current + 1]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const unique = [...new Set(wanted)];
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of unique) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

// ============================================================================
// Category controls
// ============================================================================

function CategorySidebar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 md:block" aria-label="Categories">
      <h2 className="px-3 text-sm font-semibold tracking-wide text-text-tertiary uppercase">
        Categories
      </h2>
      <div className="mt-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            selected === ""
              ? "bg-primary/10 font-medium text-foreground"
              : "text-text-secondary hover:bg-surface-overlay hover:text-foreground"
          )}
        >
          <CheckSquare
            size={18}
            className={selected === "" ? "text-primary-300" : ""}
            aria-hidden="true"
          />
          All campaigns
        </button>
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Grid3X3;
          const isActive = selected === category.slug;
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelect(isActive ? "" : category.slug)}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                isActive
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-text-secondary hover:bg-surface-overlay hover:text-foreground"
              )}
            >
              <Icon
                size={18}
                className={isActive ? "text-primary-300" : ""}
                aria-hidden="true"
              />
              {category.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MobileCategoryFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      className="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden"
      role="group"
      aria-label="Filter by category"
    >
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "min-h-11 shrink-0 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
          selected === ""
            ? "border-primary bg-primary/15 font-medium text-foreground"
            : "border-white/10 bg-surface-elevated text-text-secondary"
        )}
      >
        All
      </button>
      {CATEGORIES.map((category) => {
        const isActive = selected === category.slug;
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => onSelect(isActive ? "" : category.slug)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-primary bg-primary/15 font-medium text-foreground"
                : "border-white/10 bg-surface-elevated text-text-secondary"
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Pagination
// ============================================================================

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-text-secondary transition-colors hover:bg-surface-overlay disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {pageWindow(page, pages).map((item, index) =>
        item === "…" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-sm text-text-tertiary"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "h-11 min-w-11 rounded-xl border px-3 text-sm transition-colors",
              item === page
                ? "border-primary bg-primary/15 font-semibold text-foreground"
                : "border-white/10 text-text-secondary hover:bg-surface-overlay"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-text-secondary transition-colors hover:bg-surface-overlay disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}

// ============================================================================
// Page content
// ============================================================================

function CampaignsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = parseSort(searchParams.get("sort"));
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
  );

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Debounced search input, synced both ways with ?search=
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setParams({ search: searchInput || null, page: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, setParams]);

  const listParams = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [search, category, sort, page]
  );

  const { data, isLoading, isError, isPlaceholderData, refetch } =
    useCampaignsList(listParams);

  const items = data?.items ?? [];
  const hasFilters = !!(search || category || sort !== "newest");

  const selectCategory = (slug: string) =>
    setParams({ category: slug || null, page: null });

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6"
    >
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          Explore campaigns
        </h1>
        <p className="mt-1 text-text-secondary">
          Discover causes and support them directly — funds go straight to
          each campaign&apos;s own vault.
        </p>
      </header>

      {/* Search + sort */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search campaigns..."
            aria-label="Search campaigns"
            className="h-12 w-full rounded-2xl border border-white/10 bg-surface-elevated pr-4 pl-11 text-sm text-foreground placeholder:text-text-tertiary focus:border-primary focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-text-secondary">
            Sort by
          </span>
          <select
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value, page: null })}
            aria-label="Sort campaigns"
            className="h-12 min-w-[150px] cursor-pointer rounded-2xl border border-white/10 bg-surface-elevated px-4 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Mobile category chips */}
      <div className="mt-4">
        <MobileCategoryFilter selected={category} onSelect={selectCategory} />
      </div>

      <div className="mt-6 flex gap-8">
        <CategorySidebar selected={category} onSelect={selectCategory} />

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={SearchLucide}
              title="Could not load campaigns"
              description="The API may be unavailable or still starting up. Please try again."
              action={{ label: "Try again", onClick: () => refetch() }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={SearchLucide}
              title={hasFilters ? "No campaigns found" : "No campaigns yet"}
              description={
                hasFilters
                  ? "Nothing matches your filters. Try different keywords or browse all campaigns."
                  : "Be the first to start a campaign and rally support for your cause."
              }
              action={
                hasFilters
                  ? {
                      label: "Clear filters",
                      onClick: () =>
                        router.replace(pathname, { scroll: false }),
                    }
                  : {
                      label: "Start a campaign",
                      onClick: () => router.push("/campaigns/create"),
                    }
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3",
                  isPlaceholderData && "pointer-events-none opacity-60"
                )}
              >
                {items.map((campaign, index) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    priority={index < 3 && page === 1}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-text-tertiary">
                <span>
                  {data ? `${data.total.toLocaleString()} campaigns` : ""}
                </span>
              </div>

              <Pagination
                page={page}
                pages={data?.pages ?? 1}
                onPage={(next) => {
                  setParams({ page: next > 1 ? String(next) : null });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
          aria-label="Loading campaigns"
        >
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  );
}
