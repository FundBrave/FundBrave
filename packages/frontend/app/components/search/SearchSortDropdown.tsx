"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "relevance" | "recent" | "popular" | "ending_soon" | "most_raised";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Most Relevant" },
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "most_raised", label: "Most Raised" },
];

export interface SearchSortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

export function SearchSortDropdown({ value, onChange, className }: SearchSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || "Sort by";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (option: SortOption) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, option: SortOption) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(option);
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg",
          "bg-background border border-border-default",
          "text-sm font-medium text-foreground",
          "hover:border-primary hover:bg-primary/5",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "transition-all duration-200",
          "min-h-[44px]" // Touch target
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>Sort: {selectedLabel}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-48 rounded-lg",
            "bg-background border border-border-default",
            "shadow-lg shadow-black/10",
            "overflow-hidden"
          )}
        >
          {SORT_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3",
                "text-sm text-left",
                "hover:bg-muted",
                "focus:outline-none focus:bg-muted",
                "transition-colors duration-150",
                "min-h-[44px]", // Touch target
                value === option.value ? "text-primary font-medium" : "text-foreground"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
