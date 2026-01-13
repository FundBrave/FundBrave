"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchFilters, SearchFiltersState } from "./SearchFilters";

export interface SearchFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
}

export function SearchFilterSheet({ isOpen, onClose, filters, onChange }: SearchFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleApply = () => {
    onChange(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    const clearedFilters: SearchFiltersState = {
      categories: [],
      status: "all",
      verifiedOnly: false,
      fundingRange: {},
    };
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background rounded-t-2xl",
          "max-h-[85vh] overflow-hidden",
          "animate-slide-up"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border-default px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="filter-sheet-title" className="text-lg font-semibold text-foreground">
              Filters
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "w-11 h-11 min-h-[44px] min-w-[44px] rounded-full",
                "flex items-center justify-center",
                "text-text-secondary hover:text-foreground hover:bg-muted",
                "transition-all duration-200 active:scale-[0.95]",
                "focus:outline-none focus:ring-2 focus:ring-primary/50"
              )}
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 max-h-[calc(85vh-140px)]">
          <SearchFilters filters={localFilters} onChange={setLocalFilters} />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t border-border-default px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClearAll}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "bg-background border border-border-default",
                "text-sm font-medium text-foreground",
                "hover:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200",
                "min-h-[44px]"
              )}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "bg-primary text-white",
                "text-sm font-medium",
                "hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200",
                "min-h-[44px]"
              )}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
