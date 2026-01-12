"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./CategoryChips";
import { Shield, TrendingUp, Clock, CheckCircle } from "lucide-react";

export interface SearchFiltersState {
  categories: string[];
  status: "all" | "active" | "ending_soon" | "completed";
  verifiedOnly: boolean;
  fundingRange: {
    min?: number;
    max?: number;
  };
}

export interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  className?: string;
}

export function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onChange({ ...filters, categories: newCategories });
  };

  const handleStatusChange = (status: SearchFiltersState["status"]) => {
    onChange({ ...filters, status });
  };

  const handleVerifiedToggle = () => {
    onChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const handleFundingRangeChange = (type: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onChange({
      ...filters,
      fundingRange: {
        ...filters.fundingRange,
        [type]: numValue,
      },
    });
  };

  const handleClearAll = () => {
    onChange({
      categories: [],
      status: "all",
      verifiedOnly: false,
      fundingRange: {},
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.status !== "all" ||
    filters.verifiedOnly ||
    filters.fundingRange.min !== undefined ||
    filters.fundingRange.max !== undefined;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Categories</h4>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = filters.categories.includes(category.id);

            return (
              <label
                key={category.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                  "hover:bg-muted transition-colors",
                  "min-h-[44px]" // Touch target
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/50"
                />
                <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">{category.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Status</h4>
        <div className="flex flex-col gap-2">
          {[
            { value: "all" as const, label: "All Campaigns", icon: TrendingUp },
            { value: "active" as const, label: "Active", icon: TrendingUp },
            { value: "ending_soon" as const, label: "Ending Soon", icon: Clock },
            { value: "completed" as const, label: "Completed", icon: CheckCircle },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                  "hover:bg-muted transition-colors",
                  "min-h-[44px]" // Touch target
                )}
              >
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === option.value}
                  onChange={() => handleStatusChange(option.value)}
                  className="w-4 h-4 border-border-default text-primary focus:ring-2 focus:ring-primary/50"
                />
                <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Verified Only */}
      <div className="flex flex-col gap-3">
        <label
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
            "hover:bg-muted transition-colors",
            "min-h-[44px]" // Touch target
          )}
        >
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={handleVerifiedToggle}
            className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/50"
          />
          <Shield className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <span className="text-sm text-foreground">Verified Campaigns Only</span>
        </label>
      </div>

      {/* Funding Range */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Funding Range</h4>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="min-funding" className="text-xs text-text-secondary">
              Minimum (USD)
            </label>
            <input
              id="min-funding"
              type="number"
              min="0"
              placeholder="0"
              value={filters.fundingRange.min ?? ""}
              onChange={(e) => handleFundingRangeChange("min", e.target.value)}
              className={cn(
                "w-full px-3 py-2 min-h-[44px] rounded-lg",
                "bg-background border border-border-default",
                "text-sm text-foreground placeholder:text-text-secondary",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="max-funding" className="text-xs text-text-secondary">
              Maximum (USD)
            </label>
            <input
              id="max-funding"
              type="number"
              min="0"
              placeholder="10,000,000"
              value={filters.fundingRange.max ?? ""}
              onChange={(e) => handleFundingRangeChange("max", e.target.value)}
              className={cn(
                "w-full px-3 py-2 min-h-[44px] rounded-lg",
                "bg-background border border-border-default",
                "text-sm text-foreground placeholder:text-text-secondary",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
