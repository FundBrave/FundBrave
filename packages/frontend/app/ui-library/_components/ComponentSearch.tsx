"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Search, ArrowRight } from "lucide-react";
import { searchComponents, CATEGORIES } from "../registry";
import { StatusBadge } from "./StatusBadge";
import type { ComponentRegistryEntry, ComponentCategory } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ComponentSearchProps {
  /** Whether the search modal is open */
  isOpen: boolean;
  /** Callback to close the search modal */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCategoryLabel(id: ComponentCategory): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ComponentSearch({ isOpen, onClose }: ComponentSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Search results
  const results = useMemo(() => {
    if (!isOpen) return [];
    return searchComponents(query).slice(0, 20);
  }, [query, isOpen]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, ComponentRegistryEntry[]> = {};
    for (const entry of results) {
      const label = getCategoryLabel(entry.category);
      if (!groups[label]) groups[label] = [];
      groups[label].push(entry);
    }
    return groups;
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = results;

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Focus input after animation settles
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  // Navigate to component
  const navigateTo = useCallback(
    (slug: string) => {
      router.push(`/ui-library/components/${slug}`);
      onClose();
    },
    [router, onClose]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[activeIndex]) {
            navigateTo(flatResults[activeIndex].slug);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatResults, activeIndex, navigateTo, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-index="${activeIndex}"]`
    );
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[var(--z-modal)] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search components"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "fixed left-1/2 top-[15%] -translate-x-1/2 z-[var(--z-popover)]",
              "w-[calc(100%-2rem)] max-w-lg",
              "bg-background border border-white/10 rounded-xl shadow-xl",
              "overflow-hidden flex flex-col max-h-[70vh]"
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-white/10">
              <Search
                className="h-5 w-5 text-text-tertiary shrink-0"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components..."
                className={cn(
                  "flex-1 py-3.5 bg-transparent text-sm text-text-primary",
                  "placeholder:text-text-tertiary",
                  "outline-none border-none"
                )}
                aria-label="Search components"
                aria-activedescendant={
                  flatResults[activeIndex]
                    ? `search-result-${flatResults[activeIndex].slug}`
                    : undefined
                }
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-autocomplete="list"
              />
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded text-text-tertiary hover:text-text-primary",
                  "text-xs border border-white/10 px-1.5 py-0.5",
                  "transition-colors"
                )}
                aria-label="Close search"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              id="search-results"
              role="listbox"
              className="overflow-y-auto custom-scrollbar"
            >
              {flatResults.length === 0 && query.trim() !== "" ? (
                /* Empty state */
                <div className="px-4 py-10 text-center">
                  <Search
                    className="h-10 w-10 text-text-tertiary mx-auto mb-3 opacity-40"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-text-secondary font-medium">
                    No components found
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                /* Grouped results */
                Object.entries(groupedResults).map(([categoryLabel, items]) => (
                  <div key={categoryLabel}>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        {categoryLabel}
                      </span>
                    </div>
                    {items.map((entry) => {
                      const globalIdx = flatResults.indexOf(entry);
                      const isActive = globalIdx === activeIndex;

                      return (
                        <button
                          key={entry.slug}
                          id={`search-result-${entry.slug}`}
                          role="option"
                          aria-selected={isActive}
                          data-index={globalIdx}
                          onClick={() => navigateTo(entry.slug)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-left",
                            "transition-colors duration-[var(--duration-quick)]",
                            isActive
                              ? "bg-primary/10"
                              : "hover:bg-white/[0.03]"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  isActive
                                    ? "text-text-primary"
                                    : "text-text-secondary"
                                )}
                              >
                                {entry.name}
                              </span>
                              <StatusBadge status={entry.status} />
                            </div>
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                              {entry.description}
                            </p>
                          </div>
                          {isActive && (
                            <ArrowRight
                              className="h-4 w-4 text-primary shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Default state -- show all when no query */}
              {flatResults.length > 0 && query.trim() === "" && (
                <div className="px-4 py-2 border-t border-white/5">
                  <p className="text-xs text-text-tertiary text-center py-1">
                    {flatResults.length} components available
                  </p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/10 flex items-center gap-4 text-xs text-text-tertiary">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
                  &uarr;&darr;
                </kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
                  &crarr;
                </kbd>
                select
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">
                  esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ComponentSearch;
