"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentSortOrder } from "@/app/types/comment";

interface CommentSectionHeaderProps {
  count: number;
  sortOrder: CommentSortOrder;
  onSortChange: (sort: CommentSortOrder) => void;
  className?: string;
}

const SORT_OPTIONS: { value: CommentSortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most_liked", label: "Most liked" },
];

/**
 * CommentSectionHeader - Comment count display with sort dropdown
 */
export function CommentSectionHeader({
  count,
  sortOrder,
  onSortChange,
  className,
}: CommentSectionHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSort = SORT_OPTIONS.find((opt) => opt.value === sortOrder);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSortSelect = (sort: CommentSortOrder) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between py-4 border-b border-border-subtle",
        className
      )}
    >
      {/* Comment Count */}
      <h3 className="text-lg font-semibold text-foreground">
        {count} {count === 1 ? "Comment" : "Comments"}
      </h3>

      {/* Sort Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            "text-foreground-muted hover:text-foreground hover:bg-surface-overlay",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Sort comments"
        >
          <span>Sort: {currentSort?.label}</span>
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={cn(
              "absolute right-0 top-full mt-2 z-50",
              "w-48 py-1 rounded-lg shadow-xl",
              "bg-surface-sunken border border-border-subtle",
              "animate-in fade-in slide-in-from-top-2 duration-200"
            )}
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition-colors",
                  option.value === sortOrder
                    ? "bg-primary-500/10 text-primary-300 font-medium"
                    : "text-foreground hover:bg-surface-overlay"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSectionHeader;
