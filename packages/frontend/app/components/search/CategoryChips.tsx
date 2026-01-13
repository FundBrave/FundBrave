"use client";

import { cn } from "@/lib/utils";
import {
  Heart,
  GraduationCap,
  Leaf,
  AlertTriangle,
  Cat,
  Users,
  Lightbulb,
  Palette,
  Dumbbell,
  HelpCircle,
} from "lucide-react";
import { CampaignCategory } from "@/app/components/campaigns/CampaignCard";

// All categories from CAMPAIGN_CATEGORIES constant
export const CATEGORIES = [
  { id: "health-medical", label: "Health & Medical", icon: Heart },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "environment", label: "Environment", icon: Leaf },
  { id: "emergency", label: "Emergency", icon: AlertTriangle },
  { id: "animal", label: "Animals", icon: Cat },
  { id: "community", label: "Community", icon: Users },
  { id: "technology", label: "Technology", icon: Lightbulb },
  { id: "creative", label: "Creative", icon: Palette },
  { id: "sports", label: "Sports", icon: Dumbbell },
  { id: "other", label: "Other", icon: HelpCircle },
] as const;

export interface CategoryChipsProps {
  selectedCategories?: string[];
  onCategoryToggle: (categoryId: string) => void;
  className?: string;
}

export function CategoryChips({
  selectedCategories = [],
  onCategoryToggle,
  className,
}: CategoryChipsProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex gap-2 pb-2 min-w-min">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.id);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryToggle(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap",
                "border transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "min-h-[44px]", // Touch target size
                isSelected
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-background border-border-default text-foreground hover:border-primary hover:bg-primary/10"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
